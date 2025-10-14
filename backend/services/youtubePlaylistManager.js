/**
 * YouTube Playlist Manager
 *
 * Gestiona playlists de YouTube automáticamente:
 * - Crear playlists por categoría (Chollos, Defensas, Medios, Delanteros)
 * - Asignar videos a playlists automáticamente
 * - Organizar contenido para mejorar watch time y discoverability
 *
 * VENTAJAS:
 * - Mejora discoverability (videos relacionados aparecen en sidebar)
 * - Incrementa watch time (usuarios ven múltiples videos seguidos)
 * - Organización profesional del canal
 *
 * API:
 * - playlists.insert: Crear nueva playlist
 * - playlists.list: Listar playlists existentes
 * - playlistItems.insert: Agregar video a playlist
 */

const logger = require('../utils/logger');

class YouTubePlaylistManager {
    constructor() {
        this.youtube = null;

        // Playlists predefinidas por categoría
        this.playlistConfig = {
            chollos: {
                title: 'Chollos Fantasy La Liga 2025-26',
                description: 'Los mejores chollos y jugadores infravalorados de Fantasy La Liga. Optimiza tu plantilla con análisis experto de Ana.',
                privacyStatus: 'public'
            },
            defensas: {
                title: 'Defensas Fantasy La Liga',
                description: 'Análisis de los mejores defensas de Fantasy La Liga 2025-26.',
                privacyStatus: 'public'
            },
            medios: {
                title: 'Centrocampistas Fantasy La Liga',
                description: 'Los mejores medios y centrocampistas para tu equipo de Fantasy La Liga.',
                privacyStatus: 'public'
            },
            delanteros: {
                title: 'Delanteros Fantasy La Liga',
                description: 'Análisis de los mejores delanteros goleadores de La Liga 2025-26.',
                privacyStatus: 'public'
            },
            porteros: {
                title: 'Porteros Fantasy La Liga',
                description: 'Los porteros más rentables para Fantasy La Liga.',
                privacyStatus: 'public'
            }
        };

        // Cache de playlist IDs (se actualiza al inicializar)
        this.playlistCache = {};
    }

    /**
     * Inicializar el manager con cliente de YouTube
     *
     * @param {Object} youtubeClient - Cliente de YouTube Data API
     */
    initialize(youtubeClient) {
        this.youtube = youtubeClient;
        logger.info('✅ [YouTubePlaylistManager] Inicializado correctamente');
    }

    /**
     * Verificar si está inicializado
     */
    isInitialized() {
        return !!this.youtube;
    }

    /**
     * Obtener o crear playlist por categoría
     *
     * @param {string} category - Categoría (chollos, defensas, medios, delanteros, porteros)
     * @returns {string} Playlist ID
     */
    async getOrCreatePlaylist(category) {
        try {
            if (!this.isInitialized()) {
                throw new Error('YouTubePlaylistManager no está inicializado');
            }

            // Verificar cache
            if (this.playlistCache[category]) {
                logger.debug('[YouTubePlaylistManager] Usando playlist desde cache', {
                    category,
                    playlistId: this.playlistCache[category]
                });
                return this.playlistCache[category];
            }

            // Buscar playlist existente
            const existingPlaylist = await this._findPlaylistByTitle(
                this.playlistConfig[category].title
            );

            if (existingPlaylist) {
                this.playlistCache[category] = existingPlaylist.id;
                logger.info('[YouTubePlaylistManager] Playlist encontrada', {
                    category,
                    playlistId: existingPlaylist.id,
                    title: existingPlaylist.title
                });
                return existingPlaylist.id;
            }

            // Crear nueva playlist
            const newPlaylist = await this._createPlaylist(category);
            this.playlistCache[category] = newPlaylist.id;

            logger.info('✅ [YouTubePlaylistManager] Nueva playlist creada', {
                category,
                playlistId: newPlaylist.id,
                title: newPlaylist.title
            });

            return newPlaylist.id;
        } catch (error) {
            logger.error('❌ [YouTubePlaylistManager] Error obteniendo/creando playlist', {
                category,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Asignar video a playlist automáticamente
     *
     * @param {Object} options - Opciones de asignación
     * @param {string} options.videoId - ID del video en YouTube
     * @param {Object} options.playerData - Datos del jugador
     * @param {string} options.playerData.position - Posición (DEF, MID, FWD, GK)
     * @param {number} options.playerData.ratio - Ratio valor
     *
     * @returns {boolean} true si se asignó correctamente
     */
    async assignVideoToPlaylists(options) {
        try {
            if (!this.isInitialized()) {
                throw new Error('YouTubePlaylistManager no está inicializado');
            }

            const { videoId, playerData } = options;

            logger.info('📋 [YouTubePlaylistManager] Asignando video a playlists', {
                videoId,
                position: playerData.position,
                ratio: playerData.ratio
            });

            const assignedPlaylists = [];

            // 1. Siempre agregar a playlist de "Chollos" si ratio > 1.2
            if (playerData.ratio > 1.2) {
                const chollosPlaylistId = await this.getOrCreatePlaylist('chollos');
                await this._addVideoToPlaylist(videoId, chollosPlaylistId);
                assignedPlaylists.push('chollos');
            }

            // 2. Agregar a playlist de posición
            const positionCategory = this._getPositionCategory(playerData.position);
            if (positionCategory) {
                const positionPlaylistId = await this.getOrCreatePlaylist(positionCategory);
                await this._addVideoToPlaylist(videoId, positionPlaylistId);
                assignedPlaylists.push(positionCategory);
            }

            logger.info('✅ [YouTubePlaylistManager] Video asignado a playlists', {
                videoId,
                playlists: assignedPlaylists
            });

            return true;
        } catch (error) {
            logger.error('❌ [YouTubePlaylistManager] Error asignando video', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Buscar playlist por título
     * @private
     */
    async _findPlaylistByTitle(title) {
        try {
            const response = await this.youtube.playlists.list({
                part: ['snippet', 'contentDetails'],
                mine: true,
                maxResults: 50
            });

            if (!response.data || !response.data.items) {
                return null;
            }

            const playlist = response.data.items.find(
                item => item.snippet.title === title
            );

            return playlist ? {
                id: playlist.id,
                title: playlist.snippet.title
            } : null;
        } catch (error) {
            logger.error('[YouTubePlaylistManager] Error buscando playlist', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Crear nueva playlist
     * @private
     */
    async _createPlaylist(category) {
        try {
            const config = this.playlistConfig[category];

            if (!config) {
                throw new Error(`Categoría no válida: ${category}`);
            }

            const response = await this.youtube.playlists.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: config.title,
                        description: config.description,
                        defaultLanguage: 'es'
                    },
                    status: {
                        privacyStatus: config.privacyStatus
                    }
                }
            });

            return {
                id: response.data.id,
                title: response.data.snippet.title
            };
        } catch (error) {
            logger.error('[YouTubePlaylistManager] Error creando playlist', {
                category,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Agregar video a playlist
     * @private
     */
    async _addVideoToPlaylist(videoId, playlistId) {
        try {
            await this.youtube.playlistItems.insert({
                part: ['snippet'],
                requestBody: {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId
                        }
                    }
                }
            });

            logger.debug('[YouTubePlaylistManager] Video agregado a playlist', {
                videoId,
                playlistId
            });

            return true;
        } catch (error) {
            // Si el video ya está en la playlist, no es un error crítico
            if (error.message && error.message.includes('videoAlreadyInPlaylist')) {
                logger.warn('[YouTubePlaylistManager] Video ya está en playlist', {
                    videoId,
                    playlistId
                });
                return false;
            }

            logger.error('[YouTubePlaylistManager] Error agregando video a playlist', {
                videoId,
                playlistId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Mapear posición de jugador a categoría de playlist
     * @private
     */
    _getPositionCategory(position) {
        const positionMap = {
            'DEF': 'defensas',
            'MID': 'medios',
            'FWD': 'delanteros',
            'GK': 'porteros'
        };

        return positionMap[position] || null;
    }

    /**
     * Listar todas las playlists del canal
     *
     * @returns {Array} Lista de playlists
     */
    async listAllPlaylists() {
        try {
            if (!this.isInitialized()) {
                throw new Error('YouTubePlaylistManager no está inicializado');
            }

            const response = await this.youtube.playlists.list({
                part: ['snippet', 'contentDetails', 'status'],
                mine: true,
                maxResults: 50
            });

            if (!response.data || !response.data.items) {
                return [];
            }

            return response.data.items.map(item => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                videoCount: item.contentDetails.itemCount,
                privacyStatus: item.status.privacyStatus
            }));
        } catch (error) {
            logger.error('❌ [YouTubePlaylistManager] Error listando playlists', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Inicializar cache de playlists
     * (Buscar todas las playlists existentes y cachear sus IDs)
     */
    async initializeCache() {
        try {
            logger.info('[YouTubePlaylistManager] Inicializando cache de playlists...');

            const playlists = await this.listAllPlaylists();

            for (const playlist of playlists) {
                // Buscar categoría correspondiente
                for (const [category, config] of Object.entries(this.playlistConfig)) {
                    if (playlist.title === config.title) {
                        this.playlistCache[category] = playlist.id;
                        logger.debug('[YouTubePlaylistManager] Playlist cacheada', {
                            category,
                            playlistId: playlist.id,
                            title: playlist.title
                        });
                    }
                }
            }

            logger.info('✅ [YouTubePlaylistManager] Cache inicializado', {
                cachedPlaylists: Object.keys(this.playlistCache).length
            });

            return this.playlistCache;
        } catch (error) {
            logger.error('❌ [YouTubePlaylistManager] Error inicializando cache', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new YouTubePlaylistManager();
