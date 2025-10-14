/**
 * YouTube Shorts Publisher
 *
 * Servicio para publicar videos automáticamente en YouTube como Shorts
 * usando YouTube Data API v3.
 *
 * REQUISITOS:
 * - Cuenta de YouTube (canal activo)
 * - Google Cloud Project con YouTube Data API v3 habilitada
 * - OAuth 2.0 credentials (Client ID + Client Secret)
 * - Refresh Token con scope youtube.upload
 *
 * DOCUMENTACIÓN:
 * - YouTube Data API: https://developers.google.com/youtube/v3
 * - Videos.insert: https://developers.google.com/youtube/v3/docs/videos/insert
 * - OAuth2: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
 *
 * FLUJO DE PUBLICACIÓN (Shorts):
 * 1. Upload video con resumable upload (para archivos grandes)
 * 2. Set metadata: título, descripción, tags
 * 3. Set como Short: título incluye #Shorts, aspect ratio 9:16, <60s
 *
 * LÍMITES:
 * - 6 uploads por día (cuenta no verificada)
 * - 50-100 uploads por día (cuenta verificada)
 * - Max file size: 256GB (pero Shorts <60s ~10MB)
 * - Max video duration: 12 horas (pero Shorts <60s)
 */

const { google } = require('googleapis');
const fs = require('fs');
const logger = require('../utils/logger');
const youtubeTags = require('../config/youtube-tags');
const thumbnailGenerator = require('./thumbnailGenerator');
const youtubePlaylistManager = require('./youtubePlaylistManager');

class YouTubePublisher {
    constructor() {
        // OAuth2 credentials
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback';
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

        // YouTube Data API v3
        this.youtube = null;
        this.oauth2Client = null;

        // Configuration
        this.config = {
            maxTitleLength: 100,
            maxDescriptionLength: 5000,
            maxTags: 500,
            defaultCategory: '17', // Sports (mejor para nuestro nicho que Entertainment)
            defaultPrivacyStatus: 'public', // public, unlisted, private
            shortsHashtag: '#Shorts'
        };

        // Initialize OAuth2
        this._initializeOAuth();
    }

    /**
     * Inicializar OAuth2 client
     * @private
     */
    _initializeOAuth() {
        if (!this.clientId || !this.clientSecret) {
            logger.warn('⚠️ [YouTubePublisher] OAuth2 credentials no configuradas');
            return;
        }

        try {
            this.oauth2Client = new google.auth.OAuth2(
                this.clientId,
                this.clientSecret,
                this.redirectUri
            );

            if (this.refreshToken) {
                this.oauth2Client.setCredentials({
                    refresh_token: this.refreshToken
                });

                this.youtube = google.youtube({
                    version: 'v3',
                    auth: this.oauth2Client
                });

                // Inicializar playlist manager
                youtubePlaylistManager.initialize(this.youtube);

                logger.info('✅ [YouTubePublisher] OAuth2 inicializado correctamente');
            } else {
                logger.warn('⚠️ [YouTubePublisher] YOUTUBE_REFRESH_TOKEN no configurado');
            }
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Error inicializando OAuth2', {
                error: error.message
            });
        }
    }

    /**
     * Verificar si el servicio está configurado correctamente
     * @returns {boolean}
     */
    isConfigured() {
        return !!(this.youtube && this.refreshToken);
    }

    /**
     * Publicar video como YouTube Short
     *
     * @param {Object} options - Opciones de publicación
     * @param {string} options.videoPath - Path local del video
     * @param {string} options.title - Título del video (max 100 caracteres)
     * @param {string} options.description - Descripción (max 5000 caracteres)
     * @param {string[]} [options.tags] - Tags/hashtags (max 500 caracteres total)
     * @param {Object} [options.playerData] - Datos del jugador para generar tags optimizados
     * @param {string} [options.category='17'] - ID de categoría de YouTube (Sports por defecto)
     * @param {string} [options.privacyStatus='public'] - public, unlisted, private
     * @param {string} [options.scheduledPublishTime] - ISO timestamp para programar (ej: 2027-01-01T20:00:00Z)
     * @param {boolean} [options.autoGenerateThumbnail=true] - Generar y subir thumbnail automáticamente
     * @param {string} [options.teamLogoPath] - Path al logo del equipo para thumbnail
     * @param {boolean} [options.autoAssignPlaylists=true] - Asignar a playlists automáticamente
     *
     * @returns {Object} Resultado de la publicación
     */
    async publishShort(options) {
        try {
            if (!this.isConfigured()) {
                throw new Error('YouTubePublisher no está configurado. Verifica las credenciales en .env');
            }

            const {
                videoPath,
                title,
                description,
                tags = [],
                playerData,
                category,
                privacyStatus,
                scheduledPublishTime,
                autoGenerateThumbnail = true,
                teamLogoPath,
                autoAssignPlaylists = true
            } = options;

            // Generar tags optimizados si tenemos playerData
            let optimizedTags = tags;
            if (playerData && playerData.name && playerData.team && playerData.position) {
                logger.info('[YouTubePublisher] Generando tags optimizados con playerData');
                optimizedTags = youtubeTags.generateCholloTags(playerData);
            } else if (tags.length < 15) {
                // Si no hay playerData pero hay pocos tags, agregar tags base
                logger.info('[YouTubePublisher] Ampliando tags con tags base');
                optimizedTags = [...tags, ...youtubeTags.BASE_TAGS, ...youtubeTags.SEASON_TAGS];
            }

            // Validar inputs
            this._validateShortInputs({ videoPath, title, description });

            logger.info('📤 [YouTubePublisher] Iniciando upload de Short', {
                videoPath,
                title: title.substring(0, 50) + '...',
                scheduled: !!scheduledPublishTime
            });

            // Preparar metadata COMPLETA con todos los campos soportados
            const metadata = {
                snippet: {
                    title: this._ensureShortsHashtag(title),
                    description: this._sanitizeDescription(description),
                    tags: this._sanitizeTags(optimizedTags),
                    categoryId: category || this.config.defaultCategory,
                    // Idiomas (mejora SEO)
                    defaultLanguage: 'es',              // Idioma del título/descripción
                    defaultAudioLanguage: 'es-ES'       // Idioma del audio
                },
                status: {
                    privacyStatus: scheduledPublishTime ? 'private' : (privacyStatus || this.config.defaultPrivacyStatus),
                    selfDeclaredMadeForKids: false,
                    // Configuraciones adicionales para maximizar alcance
                    license: 'youtube',                 // Licencia estándar de YouTube
                    embeddable: true,                   // Permitir embeds en otros sitios
                    publicStatsViewable: true           // Mostrar contador de visualizaciones
                }
            };

            // Si está programado, agregar publishAt
            if (scheduledPublishTime) {
                metadata.status.publishAt = scheduledPublishTime;
                logger.info('[YouTubePublisher] Video programado para:', { publishAt: scheduledPublishTime });
            }

            // Upload video
            const videoId = await this._uploadVideo(videoPath, metadata);

            const result = {
                success: true,
                videoId,
                url: `https://youtube.com/shorts/${videoId}`,
                permalink: `https://www.youtube.com/watch?v=${videoId}`,
                status: scheduledPublishTime ? 'scheduled' : 'published',
                publishedAt: scheduledPublishTime || new Date().toISOString()
            };

            // Generar y subir thumbnail automáticamente si está habilitado
            if (autoGenerateThumbnail && playerData) {
                try {
                    logger.info('🎨 [YouTubePublisher] Generando thumbnail personalizado...');

                    const thumbnailResult = await thumbnailGenerator.generateAndUpload({
                        videoPath,
                        playerData,
                        teamLogoPath,
                        videoId,
                        youtube: this.youtube
                    });

                    if (thumbnailResult.success) {
                        result.thumbnail = {
                            generated: true,
                            path: thumbnailResult.thumbnailPath,
                            uploaded: true
                        };
                        logger.info('✅ [YouTubePublisher] Thumbnail generado y subido exitosamente');
                    } else {
                        result.thumbnail = {
                            generated: false,
                            error: thumbnailResult.error
                        };
                        logger.warn('⚠️ [YouTubePublisher] No se pudo generar thumbnail', {
                            error: thumbnailResult.error
                        });
                    }
                } catch (error) {
                    // No fallar toda la publicación si falla el thumbnail
                    result.thumbnail = {
                        generated: false,
                        error: error.message
                    };
                    logger.warn('⚠️ [YouTubePublisher] Error generando thumbnail (video publicado correctamente)', {
                        error: error.message
                    });
                }
            }

            // Asignar video a playlists automáticamente si está habilitado
            if (autoAssignPlaylists && playerData) {
                try {
                    logger.info('📋 [YouTubePublisher] Asignando video a playlists...');

                    await youtubePlaylistManager.assignVideoToPlaylists({
                        videoId,
                        playerData
                    });

                    result.playlists = {
                        assigned: true
                    };
                    logger.info('✅ [YouTubePublisher] Video asignado a playlists exitosamente');
                } catch (error) {
                    // No fallar toda la publicación si falla la asignación de playlists
                    result.playlists = {
                        assigned: false,
                        error: error.message
                    };
                    logger.warn('⚠️ [YouTubePublisher] Error asignando a playlists (video publicado correctamente)', {
                        error: error.message
                    });
                }
            }

            if (scheduledPublishTime) {
                logger.info('🎉 [YouTubePublisher] ¡Short programado exitosamente!', {
                    videoId,
                    scheduledFor: scheduledPublishTime
                });
            } else {
                logger.info('🎉 [YouTubePublisher] ¡Short publicado exitosamente!', {
                    videoId,
                    url: result.url
                });
            }

            return result;
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Error publicando Short', {
                error: error.message,
                details: error.errors || error.response?.data
            });

            return {
                success: false,
                error: error.message,
                details: error.errors || error.response?.data
            };
        }
    }

    /**
     * Upload video a YouTube
     * @private
     */
    async _uploadVideo(videoPath, metadata) {
        try {
            // Verificar que el archivo existe
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video no encontrado: ${videoPath}`);
            }

            const fileSize = fs.statSync(videoPath).size;
            logger.info('[YouTubePublisher] Uploading video...', {
                path: videoPath,
                size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`
            });

            const response = await this.youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: metadata,
                media: {
                    body: fs.createReadStream(videoPath)
                }
            });

            if (!response.data || !response.data.id) {
                throw new Error('No se recibió ID del video');
            }

            return response.data.id;
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Error en upload', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Asegurar que el título incluye #Shorts
     * @private
     */
    _ensureShortsHashtag(title) {
        if (!title.includes('#Shorts') && !title.includes('#shorts')) {
            // Agregar #Shorts al final si no está
            title = `${title} #Shorts`;
        }

        // Limitar longitud
        if (title.length > this.config.maxTitleLength) {
            title = title.substring(0, this.config.maxTitleLength - 3) + '...';
        }

        return title;
    }

    /**
     * Sanitizar descripción
     * @private
     */
    _sanitizeDescription(description) {
        let sanitized = description.trim();

        // Limitar longitud
        if (sanitized.length > this.config.maxDescriptionLength) {
            sanitized = sanitized.substring(0, this.config.maxDescriptionLength - 3) + '...';
            logger.warn('⚠️ [YouTubePublisher] Descripción truncada por exceder límite');
        }

        return sanitized;
    }

    /**
     * Sanitizar tags
     * @private
     */
    _sanitizeTags(tags) {
        // YouTube acepta max 500 caracteres total en tags
        let sanitized = tags.filter(tag => tag && tag.trim().length > 0);

        // Calcular longitud total
        let totalLength = sanitized.join(',').length;

        // Si excede límite, remover tags del final
        while (totalLength > this.config.maxTags && sanitized.length > 0) {
            sanitized.pop();
            totalLength = sanitized.join(',').length;
        }

        return sanitized;
    }

    /**
     * Validar inputs para Short
     * @private
     */
    _validateShortInputs({ videoPath, title, description }) {
        if (!videoPath) {
            throw new Error('videoPath es requerido');
        }

        if (!title || title.trim().length === 0) {
            throw new Error('title es requerido');
        }

        if (!description || description.trim().length === 0) {
            throw new Error('description es requerida');
        }

        if (title.length > this.config.maxTitleLength) {
            logger.warn(`⚠️ [YouTubePublisher] Título excede límite (${title.length}/${this.config.maxTitleLength})`);
        }
    }

    /**
     * Obtener información del canal de YouTube
     *
     * @returns {Object} Información del canal
     */
    async getChannelInfo() {
        try {
            if (!this.isConfigured()) {
                throw new Error('YouTubePublisher no está configurado');
            }

            const response = await this.youtube.channels.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                mine: true
            });

            if (!response.data || !response.data.items || response.data.items.length === 0) {
                throw new Error('No se encontró canal de YouTube');
            }

            const channel = response.data.items[0];

            return {
                id: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description,
                customUrl: channel.snippet.customUrl,
                subscriberCount: channel.statistics.subscriberCount,
                videoCount: channel.statistics.videoCount,
                viewCount: channel.statistics.viewCount
            };
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Error obteniendo info de canal', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Generar URL de autorización OAuth2
     *
     * @returns {string} URL para autorizar la app
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client no inicializado');
        }

        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.readonly'
        ];

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent' // Fuerza refresh token
        });

        return authUrl;
    }

    /**
     * Intercambiar código de autorización por tokens
     *
     * @param {string} code - Código de autorización de OAuth2
     * @returns {Object} Tokens (access_token, refresh_token)
     */
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            logger.info('✅ [YouTubePublisher] Tokens obtenidos exitosamente');

            return tokens;
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Error obteniendo tokens', {
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
                    message: 'Credenciales de YouTube no configuradas',
                    configured: false
                };
            }

            // Intentar obtener info del canal
            const channelInfo = await this.getChannelInfo();

            return {
                status: 'healthy',
                message: 'Integración de YouTube funcionando correctamente',
                configured: true,
                channel: {
                    id: channelInfo.id,
                    title: channelInfo.title,
                    subscribers: channelInfo.subscriberCount,
                    videos: channelInfo.videoCount
                }
            };
        } catch (error) {
            logger.error('❌ [YouTubePublisher] Health check falló', {
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
}

module.exports = new YouTubePublisher();
