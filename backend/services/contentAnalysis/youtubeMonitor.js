/**
 * YouTube Monitor Service - YouTube Data API v3 Integration
 *
 * Monitoriza canales de competencia para detectar nuevos Shorts
 * Provider: Google YouTube Data API v3
 * Cost: Gratis (dentro de quota 10k/día)
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class YouTubeMonitor {
    constructor() {
        // YouTube Data API v3 requiere API key de Google Cloud
        // Por ahora usamos YouTube RSS (alternativa sin API key)
        this.useRSS = !process.env.YOUTUBE_API_KEY;
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    /**
     * Obtener últimos videos de un canal
     *
     * @param {string} channelUrlOrId - URL del canal, @username, o channel ID directo (UCxxx)
     * @param {number} maxResults - Número máximo de videos a obtener
     * @returns {Promise<Array>} Lista de videos
     */
    async getLatestVideos(channelUrlOrId, maxResults = 10) {
        try {
            logger.info('[YouTubeMonitor] Obteniendo videos del canal', {
                input: channelUrlOrId,
                maxResults,
                method: this.useRSS ? 'RSS' : 'API'
            });

            // Si ya es un channel ID válido, usarlo directamente
            let channelId;
            if (channelUrlOrId.startsWith('UC') && !channelUrlOrId.includes('/')) {
                channelId = channelUrlOrId;
                logger.info('[YouTubeMonitor] Usando channel ID directo', { channelId });
            } else {
                // Extraer channel ID de URL o username
                channelId = await this._extractChannelId(channelUrlOrId);
            }

            if (this.useRSS) {
                // Método RSS (sin API key necesaria)
                return await this._getVideosViaRSS(channelId, maxResults);
            } else {
                // Método YouTube Data API v3 (mejor pero requiere API key)
                return await this._getVideosViaAPI(channelId, maxResults);
            }
        } catch (error) {
            logger.error('[YouTubeMonitor] Error obteniendo videos', {
                error: error.message,
                channelUrlOrId
            });

            throw new Error(`Failed to get videos: ${error.message}`);
        }
    }

    /**
     * Obtener videos vía YouTube RSS Feed (sin API key)
     *
     * @private
     * @param {string} channelId - ID del canal
     * @param {number} maxResults - Máximo resultados
     * @returns {Promise<Array>} Videos
     */
    async _getVideosViaRSS(channelId, maxResults) {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        const response = await axios.get(rssUrl, {
            timeout: 10000
        });

        // Parsear XML a JSON (simple parsing)
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        const entries = result.feed?.entry || [];
        const videos = entries.slice(0, maxResults).map(entry => ({
            videoId: entry['yt:videoId'][0],
            title: entry.title[0],
            publishedAt: entry.published[0],
            url: `https://www.youtube.com/watch?v=${entry['yt:videoId'][0]}`,
            thumbnail: entry['media:group'][0]['media:thumbnail'][0].$.url,
            channelId: entry['yt:channelId'][0],
            channelName: entry.author[0].name[0]
        }));

        logger.info('[YouTubeMonitor] ✅ Videos obtenidos vía RSS', {
            count: videos.length
        });

        return videos;
    }

    /**
     * Obtener videos vía YouTube Data API v3 (con API key)
     *
     * @private
     * @param {string} channelId - ID del canal
     * @param {number} maxResults - Máximo resultados
     * @returns {Promise<Array>} Videos
     */
    async _getVideosViaAPI(channelId, maxResults) {
        // Primero obtener el playlist ID de uploads
        const channelResponse = await axios.get(`${this.baseUrl}/channels`, {
            params: {
                key: this.apiKey,
                id: channelId,
                part: 'contentDetails'
            }
        });

        const uploadsPlaylistId =
            channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

        // Luego obtener videos del playlist
        const playlistResponse = await axios.get(`${this.baseUrl}/playlistItems`, {
            params: {
                key: this.apiKey,
                playlistId: uploadsPlaylistId,
                part: 'snippet',
                maxResults
            }
        });

        const videos = playlistResponse.data.items.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelId: item.snippet.channelId,
            channelName: item.snippet.channelTitle
        }));

        // Obtener estadísticas (views, likes, comments) de cada video
        const videoIds = videos.map(v => v.videoId).join(',');

        const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
            params: {
                key: this.apiKey,
                id: videoIds,
                part: 'statistics,contentDetails'
            }
        });

        // Combinar videos con sus estadísticas
        const videosWithStats = videos.map(video => {
            const stats = statsResponse.data.items.find(item => item.id === video.videoId);

            return {
                ...video,
                views: parseInt(stats?.statistics?.viewCount || 0),
                likes: parseInt(stats?.statistics?.likeCount || 0),
                comments: parseInt(stats?.statistics?.commentCount || 0),
                duration: stats?.contentDetails?.duration
                    ? this._parseDuration(stats.contentDetails.duration)
                    : 0
            };
        });

        logger.info('[YouTubeMonitor] ✅ Videos obtenidos vía API con estadísticas', {
            count: videosWithStats.length,
            sampleStats: videosWithStats[0]
                ? {
                      title: videosWithStats[0].title,
                      views: videosWithStats[0].views,
                      likes: videosWithStats[0].likes
                  }
                : null
        });

        return videosWithStats;
    }

    /**
     * Filtrar solo Shorts (videos <60s)
     *
     * @param {Array} videos - Lista de videos
     * @returns {Promise<Array>} Solo Shorts
     */
    async filterShorts(videos) {
        try {
            // Si no tenemos API key, asumir que todos son Shorts si URL contiene /shorts/
            if (this.useRSS) {
                return videos.filter(v => v.url.includes('/shorts/'));
            }

            // Con API, obtener duración de cada video
            const videoIds = videos.map(v => v.videoId).join(',');

            const response = await axios.get(`${this.baseUrl}/videos`, {
                params: {
                    key: this.apiKey,
                    id: videoIds,
                    part: 'contentDetails'
                }
            });

            const shorts = response.data.items
                .filter(item => {
                    const duration = item.contentDetails.duration;
                    // Parsear ISO 8601 duration (ej: PT45S = 45 segundos)
                    const seconds = this._parseDuration(duration);
                    return seconds <= 60;
                })
                .map(item => {
                    const video = videos.find(v => v.videoId === item.id);
                    return {
                        ...video,
                        duration: this._parseDuration(item.contentDetails.duration)
                    };
                });

            logger.info('[YouTubeMonitor] Shorts filtrados', {
                total: videos.length,
                shorts: shorts.length
            });

            return shorts;
        } catch (error) {
            logger.error('[YouTubeMonitor] Error filtrando Shorts', {
                error: error.message
            });

            // Fallback: retornar todos los videos
            return videos;
        }
    }

    /**
     * Extraer channel ID de una URL
     *
     * @private
     * @param {string} channelUrl - URL del canal
     * @returns {Promise<string>} Channel ID
     */
    async _extractChannelId(channelUrl) {
        // Casos:
        // https://www.youtube.com/channel/UCxxxxxxxxxxx
        if (channelUrl.includes('/channel/')) {
            return channelUrl.split('/channel/')[1].split('/')[0];
        }

        // Si ya es un channel ID directo
        if (channelUrl.startsWith('UC')) {
            return channelUrl;
        }

        // Para @username, necesitamos resolverlo a channel ID real
        if (channelUrl.includes('/@')) {
            const username = channelUrl.split('/@')[1].split('/')[0];
            return this._resolveUsernameToChannelId(username, channelUrl);
        }

        throw new Error('No se pudo extraer channel ID de la URL');
    }

    /**
     * Resolver @username a channel ID real usando yt-dlp
     *
     * @private
     * @param {string} username - Username del canal
     * @param {string} fullUrl - URL completa del canal
     * @returns {Promise<string>} Channel ID real
     */
    async _resolveUsernameToChannelId(username, fullUrl) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            logger.info('[YouTubeMonitor] Resolviendo @username a channel ID', { username });

            // Usar yt-dlp para obtener el channel ID de un video del canal
            const command = `yt-dlp --playlist-items 1 --print "%(channel_id)s" "${fullUrl}" 2>/dev/null`;

            const { stdout } = await execAsync(command, { timeout: 15000 });
            const channelId = stdout.trim();

            if (channelId && channelId.startsWith('UC')) {
                logger.info('[YouTubeMonitor] ✅ Channel ID resuelto', { username, channelId });
                return channelId;
            }

            throw new Error('No se pudo resolver channel ID');
        } catch (error) {
            logger.error('[YouTubeMonitor] Error resolviendo username', {
                error: error.message,
                username
            });

            // Fallback: intentar con el username directamente (puede fallar)
            logger.warn('[YouTubeMonitor] ⚠️ Usando username como fallback (puede fallar)');
            return username;
        }
    }

    /**
     * Parsear duración ISO 8601 a segundos
     *
     * @private
     * @param {string} duration - Formato PT1M30S
     * @returns {number} Segundos
     */
    _parseDuration(duration) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    /**
     * Descargar video de YouTube (requiere yt-dlp instalado)
     *
     * @param {string} videoUrl - URL del video
     * @param {string} outputPath - Path donde guardar
     * @returns {Promise<string>} Path del archivo descargado
     */
    async downloadVideo(videoUrl, outputPath) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            logger.info('[YouTubeMonitor] Descargando video', {
                videoUrl,
                outputPath
            });

            // Verificar que yt-dlp está instalado
            try {
                await execAsync('which yt-dlp');
            } catch {
                throw new Error('yt-dlp no está instalado. Instalar con: brew install yt-dlp');
            }

            // Descargar video (usar Android player client para Shorts)
            const command = `yt-dlp --extractor-args "youtube:player_client=android,web" -o "${outputPath}" "${videoUrl}"`;

            await execAsync(command, {
                timeout: 120000 // 2 minutos max
            });

            logger.info('[YouTubeMonitor] ✅ Video descargado', {
                path: outputPath
            });

            return outputPath;
        } catch (error) {
            logger.error('[YouTubeMonitor] Error descargando video', {
                error: error.message,
                videoUrl
            });

            throw new Error(`Video download failed: ${error.message}`);
        }
    }

    /**
     * Extraer audio de video (para transcripción)
     *
     * @param {string} videoPath - Path del video
     * @param {string} audioPath - Path donde guardar audio
     * @returns {Promise<string>} Path del audio
     */
    async extractAudio(videoPath, audioPath) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            logger.info('[YouTubeMonitor] Extrayendo audio', {
                videoPath,
                audioPath
            });

            // Usar FFmpeg para extraer audio (32kbps para videos largos, mantener <25MB para Whisper)
            const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 32k -ar 22050 "${audioPath}"`;

            await execAsync(command, {
                timeout: 300000 // 5 minutos max (para videos largos)
            });

            logger.info('[YouTubeMonitor] ✅ Audio extraído', {
                path: audioPath
            });

            return audioPath;
        } catch (error) {
            logger.error('[YouTubeMonitor] Error extrayendo audio', {
                error: error.message,
                videoPath
            });

            throw new Error(`Audio extraction failed: ${error.message}`);
        }
    }
}

module.exports = new YouTubeMonitor();
