/**
 * Instagram Graph API Publisher
 *
 * Servicio para publicar contenido automáticamente en Instagram Business Account
 * usando la Instagram Graph API de Meta.
 *
 * REQUISITOS:
 * - Instagram Business Account o Creator Account
 * - Facebook Page conectada a la cuenta de Instagram
 * - Facebook App con permisos apropiados
 * - Access Token con permisos: instagram_basic, instagram_content_publish, pages_read_engagement
 *
 * DOCUMENTACIÓN:
 * - Instagram Graph API: https://developers.facebook.com/docs/instagram-api
 * - Content Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 * - Reels Publishing: https://developers.facebook.com/docs/instagram-api/guides/reels-publishing
 *
 * FLUJO DE PUBLICACIÓN (Reels):
 * 1. Upload video to hosting (debe ser accesible públicamente)
 * 2. Crear media container con POST /{ig-user-id}/media
 * 3. Esperar procesamiento (status check)
 * 4. Publicar con POST /{ig-user-id}/media_publish
 *
 * LÍMITES:
 * - 25 posts por día (Instagram Business Account)
 * - Videos: 4-15 segundos (Reels cortos), hasta 90 segundos (Reels largos)
 * - Formato: MP4, H.264, AAC audio
 * - Aspect ratio: 9:16 (vertical)
 * - Max file size: 100MB
 */

const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class InstagramPublisher {
    constructor() {
        // Instagram Business Account credentials
        this.accessToken = process.env.META_ACCESS_TOKEN;
        this.pageId = process.env.INSTAGRAM_PAGE_ID; // Facebook Page ID
        this.accountId = process.env.INSTAGRAM_ACCOUNT_ID; // Instagram Business Account ID

        // Graph API base URL
        this.apiVersion = 'v21.0'; // Meta Graph API version (Dec 2024)
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

        // Configuration
        this.config = {
            defaultHashtags: '#FantasyLaLiga #LaLiga #FantasyFootball',
            maxCaptionLength: 2200, // Instagram limit
            maxHashtags: 30, // Instagram limit
            videoUploadTimeout: 300000, // 5 minutes
            statusCheckInterval: 5000, // 5 seconds
            maxStatusChecks: 60 // Max 5 minutes checking status
        };

        // Validate configuration
        this._validateConfig();
    }

    /**
     * Validar configuración de credenciales
     * @private
     */
    _validateConfig() {
        if (!this.accessToken) {
            logger.warn('⚠️ [InstagramPublisher] META_ACCESS_TOKEN no configurado');
        }
        if (!this.accountId) {
            logger.warn('⚠️ [InstagramPublisher] INSTAGRAM_ACCOUNT_ID no configurado');
        }
        if (!this.pageId) {
            logger.warn('⚠️ [InstagramPublisher] INSTAGRAM_PAGE_ID no configurado');
        }

        if (!this.accessToken || !this.accountId) {
            logger.error('❌ [InstagramPublisher] Credenciales incompletas. Publicación deshabilitada.');
        }
    }

    /**
     * Verificar si el servicio está configurado correctamente
     * @returns {boolean}
     */
    isConfigured() {
        return !!(this.accessToken && this.accountId);
    }

    /**
     * Publicar Reel en Instagram
     *
     * @param {Object} options - Opciones de publicación
     * @param {string} options.videoUrl - URL pública del video (debe ser accesible por Instagram)
     * @param {string} options.caption - Caption del post (incluyendo hashtags)
     * @param {string} [options.coverUrl] - URL de imagen de portada (opcional)
     * @param {string} [options.locationId] - ID de ubicación de Instagram (opcional)
     * @param {boolean} [options.shareToFeed=true] - Compartir también en el feed (default: true)
     * @param {string} [options.schedule] - ISO timestamp para programar (opcional, requiere permisos adicionales)
     *
     * @returns {Object} Resultado de la publicación
     */
    async publishReel(options) {
        try {
            if (!this.isConfigured()) {
                throw new Error('InstagramPublisher no está configurado. Verifica las credenciales en .env');
            }

            const { videoUrl, caption, coverUrl, locationId, shareToFeed = true, schedule } = options;

            // Validar inputs
            this._validateReelInputs({ videoUrl, caption });

            logger.info('📤 [InstagramPublisher] Iniciando publicación de Reel', {
                videoUrl,
                captionLength: caption.length,
                scheduled: !!schedule
            });

            // PASO 1: Crear media container
            const containerId = await this._createReelContainer({
                videoUrl,
                caption,
                coverUrl,
                locationId,
                shareToFeed
            });

            logger.info('✅ [InstagramPublisher] Media container creado', { containerId });

            // PASO 2: Verificar estado de procesamiento
            const containerStatus = await this._waitForContainerReady(containerId);

            if (containerStatus !== 'FINISHED') {
                throw new Error(`Container no listo para publicar. Status: ${containerStatus}`);
            }

            logger.info('✅ [InstagramPublisher] Container procesado y listo');

            // PASO 3: Publicar
            const publishResult = await this._publishContainer(containerId);

            logger.info('🎉 [InstagramPublisher] ¡Reel publicado exitosamente!', {
                postId: publishResult.id,
                permalink: `https://www.instagram.com/p/${publishResult.id}/`
            });

            return {
                success: true,
                postId: publishResult.id,
                permalink: `https://www.instagram.com/p/${publishResult.id}/`,
                containerId,
                publishedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error publicando Reel', {
                error: error.message,
                response: error.response?.data
            });

            return {
                success: false,
                error: error.message,
                details: error.response?.data
            };
        }
    }

    /**
     * Crear media container para Reel
     * @private
     */
    async _createReelContainer({ videoUrl, caption, coverUrl, locationId, shareToFeed }) {
        try {
            const params = {
                media_type: 'REELS',
                video_url: videoUrl,
                caption: this._sanitizeCaption(caption),
                share_to_feed: shareToFeed,
                access_token: this.accessToken
            };

            // Agregar parámetros opcionales
            if (coverUrl) {
                params.thumb_offset = 0; // Frame del video a usar como thumbnail (en ms)
                // O usar cover_url si tienes una imagen personalizada
            }

            if (locationId) {
                params.location_id = locationId;
            }

            const response = await axios.post(
                `${this.baseUrl}/${this.accountId}/media`,
                null,
                {
                    params,
                    timeout: this.config.videoUploadTimeout
                }
            );

            if (!response.data || !response.data.id) {
                throw new Error('No se recibió ID del container');
            }

            return response.data.id;
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error creando container', {
                error: error.message,
                response: error.response?.data
            });
            throw error;
        }
    }

    /**
     * Esperar a que el container esté listo para publicar
     * @private
     */
    async _waitForContainerReady(containerId) {
        try {
            let checks = 0;
            const maxChecks = this.config.maxStatusChecks;

            while (checks < maxChecks) {
                const status = await this._checkContainerStatus(containerId);

                logger.debug(`[InstagramPublisher] Container status: ${status} (check ${checks + 1}/${maxChecks})`);

                if (status === 'FINISHED') {
                    return status;
                }

                if (status === 'ERROR') {
                    throw new Error('Error procesando video en Instagram');
                }

                // Esperar antes del siguiente check
                await this._sleep(this.config.statusCheckInterval);
                checks++;
            }

            throw new Error(`Timeout esperando container ready (${maxChecks * this.config.statusCheckInterval / 1000}s)`);
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error verificando status', {
                containerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verificar estado del container
     * @private
     */
    async _checkContainerStatus(containerId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${containerId}`,
                {
                    params: {
                        fields: 'status_code',
                        access_token: this.accessToken
                    }
                }
            );

            return response.data.status_code;
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error obteniendo status', {
                containerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Publicar container (hacer el post visible)
     * @private
     */
    async _publishContainer(containerId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.accountId}/media_publish`,
                null,
                {
                    params: {
                        creation_id: containerId,
                        access_token: this.accessToken
                    }
                }
            );

            if (!response.data || !response.data.id) {
                throw new Error('No se recibió ID del post publicado');
            }

            return response.data;
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error publicando container', {
                containerId,
                error: error.message,
                response: error.response?.data
            });
            throw error;
        }
    }

    /**
     * Validar inputs para Reel
     * @private
     */
    _validateReelInputs({ videoUrl, caption }) {
        if (!videoUrl || !videoUrl.startsWith('http')) {
            throw new Error('videoUrl debe ser una URL pública válida (http/https)');
        }

        if (!caption || caption.trim().length === 0) {
            throw new Error('caption es requerido');
        }

        if (caption.length > this.config.maxCaptionLength) {
            throw new Error(`caption excede el límite de ${this.config.maxCaptionLength} caracteres`);
        }

        // Validar hashtags
        const hashtagCount = (caption.match(/#/g) || []).length;
        if (hashtagCount > this.config.maxHashtags) {
            logger.warn(`⚠️ [InstagramPublisher] Caption tiene ${hashtagCount} hashtags (límite: ${this.config.maxHashtags})`);
        }
    }

    /**
     * Sanitizar caption (remover caracteres problemáticos, limitar longitud)
     * @private
     */
    _sanitizeCaption(caption) {
        let sanitized = caption.trim();

        // Limitar longitud
        if (sanitized.length > this.config.maxCaptionLength) {
            sanitized = sanitized.substring(0, this.config.maxCaptionLength - 3) + '...';
            logger.warn('⚠️ [InstagramPublisher] Caption truncado por exceder límite');
        }

        return sanitized;
    }

    /**
     * Obtener información de la cuenta de Instagram
     *
     * @returns {Object} Información de la cuenta
     */
    async getAccountInfo() {
        try {
            if (!this.isConfigured()) {
                throw new Error('InstagramPublisher no está configurado');
            }

            const response = await axios.get(
                `${this.baseUrl}/${this.accountId}`,
                {
                    params: {
                        fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error obteniendo info de cuenta', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtener insights de un post específico
     *
     * @param {string} postId - ID del post de Instagram
     * @returns {Object} Insights del post
     */
    async getPostInsights(postId) {
        try {
            if (!this.isConfigured()) {
                throw new Error('InstagramPublisher no está configurado');
            }

            const response = await axios.get(
                `${this.baseUrl}/${postId}/insights`,
                {
                    params: {
                        metric: 'impressions,reach,likes,comments,saves,shares,plays,total_interactions',
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Error obteniendo insights', {
                postId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verificar estado de salud de la integración
     *
     * @returns {Object} Estado de la integración
     */
    async healthCheck() {
        try {
            if (!this.isConfigured()) {
                return {
                    status: 'not_configured',
                    message: 'Credenciales de Instagram no configuradas',
                    configured: false
                };
            }

            // Intentar obtener info básica de la cuenta
            const accountInfo = await this.getAccountInfo();

            return {
                status: 'healthy',
                message: 'Integración de Instagram funcionando correctamente',
                configured: true,
                account: {
                    id: accountInfo.id,
                    username: accountInfo.username,
                    name: accountInfo.name,
                    followers: accountInfo.followers_count,
                    media_count: accountInfo.media_count
                }
            };
        } catch (error) {
            logger.error('❌ [InstagramPublisher] Health check falló', {
                error: error.message
            });

            return {
                status: 'error',
                message: error.message,
                configured: true,
                error: true
            };
        }
    }

    /**
     * Helper: sleep
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new InstagramPublisher();
