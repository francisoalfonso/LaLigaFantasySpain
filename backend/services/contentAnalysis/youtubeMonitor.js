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
     * @param {string} channelUrl - URL del canal (@username o /channel/UCxxx)
     * @param {number} maxResults - Número máximo de videos a obtener
     * @returns {Promise<Array>} Lista de videos
     */
    async getLatestVideos(channelUrl, maxResults = 10) {
        try {
            logger.info('[YouTubeMonitor] Obteniendo videos del canal', {
                channelUrl,
                maxResults,
                method: this.useRSS ? 'RSS' : 'API'
            });

            // Extraer channel ID o username
            const channelId = this._extractChannelId(channelUrl);

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
                channelUrl
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

        logger.info('[YouTubeMonitor] ✅ Videos obtenidos vía API', {
            count: videos.length
        });

        return videos;
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
     * @returns {string} Channel ID
     */
    _extractChannelId(channelUrl) {
        // Casos:
        // https://www.youtube.com/@JoseCarrasco_98
        // https://www.youtube.com/channel/UCxxxxxxxxxxx
        // https://www.youtube.com/c/CustomName

        if (channelUrl.includes('/channel/')) {
            return channelUrl.split('/channel/')[1].split('/')[0];
        }

        if (channelUrl.includes('/@')) {
            // Para @username, necesitamos hacer un request extra
            // Por ahora, retornar el username
            return channelUrl.split('/@')[1].split('/')[0];
        }

        // Si ya es un channel ID directo
        if (channelUrl.startsWith('UC')) {
            return channelUrl;
        }

        throw new Error('No se pudo extraer channel ID de la URL');
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

            // Descargar video
            const command = `yt-dlp -f 'bestvideo[height<=1080]+bestaudio/best' -o "${outputPath}" "${videoUrl}"`;

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

            // Usar FFmpeg para extraer audio
            const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${audioPath}"`;

            await execAsync(command, {
                timeout: 60000 // 1 minuto max
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
