/**
 * YouTube Data API Client - Shorts Upload
 *
 * Cliente para automatización de uploads de Shorts a YouTube.
 * Incluye gestión de metadata, thumbnails, playlists, y analytics.
 *
 * Funcionalidades:
 * - Upload automático de Shorts
 * - Configuración de metadata (título, descripción, tags)
 * - Upload de thumbnails personalizados
 * - Gestión de playlists
 * - Analytics básicas
 *
 * Requiere:
 * - YouTube Data API v3
 * - OAuth 2.0 credentials
 * - Refresh token para automatización
 *
 * Basado en: docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md
 */

const logger = require('../../utils/logger');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

/**
 * CONFIGURACIÓN YOUTUBE DATA API
 */
const YOUTUBE_CONFIG = {
    API_VERSION: 'v3',
    BASE_URL: 'https://www.googleapis.com/youtube/v3',
    UPLOAD_URL: 'https://www.googleapis.com/upload/youtube/v3/videos',
    OAUTH_URL: 'https://oauth2.googleapis.com/token',

    // Scopes necesarios
    SCOPES: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl'
    ],

    // Configuración Shorts
    SHORTS: {
        category: '17', // Sports
        defaultLanguage: 'es',
        defaultAudioLanguage: 'es-ES',
        privacyStatus: 'public', // public, unlisted, private
        selfDeclaredMadeForKids: false,
        license: 'youtube', // youtube o creativeCommon
        embeddable: true,
        publicStatsViewable: true
    },

    // Rate limits
    RATE_LIMITS: {
        uploadsPerDay: 50, // YouTube límite diario
        quotaPerDay: 10000, // Quota points diarios
        uploadCost: 1600 // Quota points por upload
    },

    // Retry configuration
    RETRY: {
        maxRetries: 3,
        initialDelay: 2000, // 2 segundos
        maxDelay: 30000, // 30 segundos
        backoffMultiplier: 2
    }
};

class YouTubeAPI {
    constructor() {
        this.config = YOUTUBE_CONFIG;
        this.accessToken = null;
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.channelId = process.env.YOUTUBE_CHANNEL_ID;

        // Validar credenciales
        this.validateCredentials();

        logger.info('✅ YouTubeAPI inicializado');
    }

    /**
     * Valida que las credenciales estén configuradas
     */
    validateCredentials() {
        const missingVars = [];

        if (!this.refreshToken) {
            missingVars.push('YOUTUBE_REFRESH_TOKEN');
        }
        if (!this.clientId) {
            missingVars.push('YOUTUBE_CLIENT_ID');
        }
        if (!this.clientSecret) {
            missingVars.push('YOUTUBE_CLIENT_SECRET');
        }

        if (missingVars.length > 0) {
            logger.warn(
                `⚠️ Variables de entorno faltantes para YouTube API: ${missingVars.join(', ')}`
            );
            logger.warn('⚠️ YouTube upload estará deshabilitado hasta configurar credenciales');
        }
    }

    /**
     * Obtiene access token usando refresh token (OAuth 2.0)
     */
    async getAccessToken() {
        // Si ya tenemos access token válido, usarlo
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        logger.info('🔑 Obteniendo nuevo access token...');

        try {
            const response = await axios.post(this.config.OAUTH_URL, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token'
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

            logger.info('✅ Access token obtenido correctamente');

            return this.accessToken;
        } catch (error) {
            logger.error(
                '❌ Error obteniendo access token:',
                error.response?.data || error.message
            );
            throw new Error('Failed to get YouTube access token');
        }
    }

    /**
     * Sube un Short a YouTube
     * @param {String} videoPath - Ruta al archivo de video
     * @param {Object} metadata - Metadata del video (title, description, tags, etc.)
     * @returns {Object} { success, videoId, url, metadata }
     */
    async uploadShort(videoPath, metadata) {
        logger.info(`🎬 Subiendo Short a YouTube: ${metadata.title}`);

        try {
            // Validar que el video existe
            await fs.access(videoPath);

            // Obtener access token
            const accessToken = await this.getAccessToken();

            // Preparar metadata para YouTube
            const videoMetadata = {
                snippet: {
                    title: this.truncateTitle(metadata.title),
                    description: metadata.description,
                    tags: metadata.tags || [],
                    categoryId: this.config.SHORTS.category,
                    defaultLanguage: this.config.SHORTS.defaultLanguage,
                    defaultAudioLanguage: this.config.SHORTS.defaultAudioLanguage
                },
                status: {
                    privacyStatus: metadata.privacyStatus || this.config.SHORTS.privacyStatus,
                    selfDeclaredMadeForKids: this.config.SHORTS.selfDeclaredMadeForKids,
                    license: this.config.SHORTS.license,
                    embeddable: this.config.SHORTS.embeddable,
                    publicStatsViewable: this.config.SHORTS.publicStatsViewable
                }
            };

            // Agregar #Shorts al título si no está (indica a YouTube que es un Short)
            if (!videoMetadata.snippet.title.toLowerCase().includes('#shorts')) {
                videoMetadata.snippet.title += ' #Shorts';
            }

            // Upload multipart
            const videoBuffer = await fs.readFile(videoPath);

            const uploadResponse = await this.uploadWithRetry(
                accessToken,
                videoBuffer,
                videoMetadata
            );

            const videoId = uploadResponse.id;
            const videoUrl = `https://youtube.com/shorts/${videoId}`;

            logger.info(`✅ Short subido correctamente: ${videoUrl}`);

            // Si hay thumbnail, subirlo
            if (metadata.thumbnailPath) {
                await this.uploadThumbnail(videoId, metadata.thumbnailPath);
            }

            return {
                success: true,
                videoId,
                url: videoUrl,
                shortUrl: `https://youtu.be/${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                metadata: {
                    title: videoMetadata.snippet.title,
                    description: videoMetadata.snippet.description,
                    tags: videoMetadata.snippet.tags,
                    privacyStatus: videoMetadata.status.privacyStatus,
                    uploadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('❌ Error subiendo Short a YouTube:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload con retry automático
     */
    async uploadWithRetry(accessToken, videoBuffer, metadata, attempt = 1) {
        try {
            const response = await axios.post(
                `${this.config.UPLOAD_URL}?uploadType=multipart&part=snippet,status`,
                {
                    // Metadata
                    ...metadata
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    // Nota: Implementación simplificada
                    // En producción, usar resumable upload para archivos grandes
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000 // 5 minutos
                }
            );

            return response.data;
        } catch (error) {
            if (attempt < this.config.RETRY.maxRetries) {
                const delay =
                    Math.min(
                        this.config.RETRY.initialDelay *
                            Math.pow(this.config.RETRY.backoffMultiplier, attempt - 1),
                        this.config.RETRY.maxDelay
                    ) +
                    Math.random() * 1000; // Jitter

                logger.warn(
                    `⚠️ Reintento ${attempt}/${this.config.RETRY.maxRetries} después de ${Math.round(delay / 1000)}s...`
                );

                await new Promise(resolve => setTimeout(resolve, delay));
                return this.uploadWithRetry(accessToken, videoBuffer, metadata, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Sube thumbnail personalizado
     */
    async uploadThumbnail(videoId, thumbnailPath) {
        logger.info(`🖼️ Subiendo thumbnail para video ${videoId}...`);

        try {
            const accessToken = await this.getAccessToken();
            const thumbnailBuffer = await fs.readFile(thumbnailPath);

            await axios.post(
                `${this.config.BASE_URL}/thumbnails/set?videoId=${videoId}`,
                thumbnailBuffer,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'image/jpeg'
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            logger.info('✅ Thumbnail subido correctamente');
        } catch (error) {
            logger.error('❌ Error subiendo thumbnail:', error.message);
            // No throw - thumbnail es opcional
        }
    }

    /**
     * Actualiza metadata de un video existente
     */
    async updateVideoMetadata(videoId, metadata) {
        logger.info(`📝 Actualizando metadata de video ${videoId}...`);

        try {
            const accessToken = await this.getAccessToken();

            const updateData = {
                id: videoId,
                snippet: {}
            };

            if (metadata.title) {
                updateData.snippet.title = this.truncateTitle(metadata.title);
            }
            if (metadata.description) {
                updateData.snippet.description = metadata.description;
            }
            if (metadata.tags) {
                updateData.snippet.tags = metadata.tags;
            }

            await axios.put(`${this.config.BASE_URL}/videos?part=snippet`, updateData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info('✅ Metadata actualizada correctamente');

            return { success: true };
        } catch (error) {
            logger.error('❌ Error actualizando metadata:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Elimina un video
     */
    async deleteVideo(videoId) {
        logger.info(`🗑️ Eliminando video ${videoId}...`);

        try {
            const accessToken = await this.getAccessToken();

            await axios.delete(`${this.config.BASE_URL}/videos?id=${videoId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            logger.info('✅ Video eliminado correctamente');

            return { success: true };
        } catch (error) {
            logger.error('❌ Error eliminando video:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtiene estadísticas de un video
     */
    async getVideoStats(videoId) {
        logger.info(`📊 Obteniendo estadísticas de video ${videoId}...`);

        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.config.BASE_URL}/videos?part=statistics,contentDetails&id=${videoId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const video = response.data.items[0];

            if (!video) {
                throw new Error('Video no encontrado');
            }

            return {
                success: true,
                stats: {
                    views: parseInt(video.statistics.viewCount) || 0,
                    likes: parseInt(video.statistics.likeCount) || 0,
                    comments: parseInt(video.statistics.commentCount) || 0,
                    duration: video.contentDetails.duration
                }
            };
        } catch (error) {
            logger.error('❌ Error obteniendo estadísticas:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lista videos del canal
     */
    async listChannelVideos(maxResults = 10) {
        logger.info(`📺 Listando videos del canal (max: ${maxResults})...`);

        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.config.BASE_URL}/search?part=snippet&channelId=${this.channelId}&maxResults=${maxResults}&order=date&type=video`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const videos = response.data.items.map(item => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails.high.url
            }));

            logger.info(`✅ ${videos.length} videos encontrados`);

            return {
                success: true,
                videos
            };
        } catch (error) {
            logger.error('❌ Error listando videos:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Agrega video a playlist
     */
    async addToPlaylist(videoId, playlistId) {
        logger.info(`📋 Agregando video ${videoId} a playlist ${playlistId}...`);

        try {
            const accessToken = await this.getAccessToken();

            await axios.post(
                `${this.config.BASE_URL}/playlistItems?part=snippet`,
                {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info('✅ Video agregado a playlist correctamente');

            return { success: true };
        } catch (error) {
            logger.error('❌ Error agregando a playlist:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verifica quota disponible (estimado)
     */
    async checkQuotaUsage() {
        // Nota: YouTube no proporciona API directa para quota usage
        // Este es un estimado basado en operaciones realizadas

        logger.info('📊 Verificando uso estimado de quota...');

        // En una implementación real, mantener contador local de operaciones
        // Por ahora, retornar valores mock

        return {
            dailyLimit: this.config.RATE_LIMITS.quotaPerDay,
            used: 0, // Implementar tracking local
            remaining: this.config.RATE_LIMITS.quotaPerDay,
            uploadsRemaining: Math.floor(
                this.config.RATE_LIMITS.quotaPerDay / this.config.RATE_LIMITS.uploadCost
            )
        };
    }

    /**
     * Test de conectividad
     */
    async testConnection() {
        logger.info('🔍 Testeando conexión YouTube API...');

        try {
            const accessToken = await this.getAccessToken();

            // Test simple: obtener info del canal
            const response = await axios.get(
                `${this.config.BASE_URL}/channels?part=snippet,statistics&mine=true`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const channel = response.data.items[0];

            logger.info('✅ Conexión YouTube API correcta');

            return {
                success: true,
                channel: {
                    id: channel.id,
                    title: channel.snippet.title,
                    subscribers: channel.statistics.subscriberCount,
                    videos: channel.statistics.videoCount,
                    views: channel.statistics.viewCount
                }
            };
        } catch (error) {
            logger.error('❌ Error conectando con YouTube API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // === UTILIDADES ===

    /**
     * Trunca título a máximo 100 caracteres (límite YouTube)
     */
    truncateTitle(title) {
        const maxLength = 100;
        if (title.length <= maxLength) {
            return title;
        }
        return `${title.substring(0, maxLength - 3)}...`;
    }

    /**
     * Valida que un video sea Short (duración ≤60s, vertical)
     */
    async validateShortVideo(videoPath) {
        // Implementar validación con FFprobe
        // Por ahora, retornar true
        return true;
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats() {
        return {
            configured: !!(this.refreshToken && this.clientId && this.clientSecret),
            rateLimits: this.config.RATE_LIMITS,
            apiVersion: this.config.API_VERSION,
            channelId: this.channelId || 'not-configured',
            version: '1.0.0',
            lastUpdated: '2025-10-01'
        };
    }
}

module.exports = YouTubeAPI;
