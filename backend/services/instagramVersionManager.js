// Sistema de gestión de versiones de videos virales de Instagram
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class InstagramVersionManager {
    constructor() {
        this.versionsDir = path.join(__dirname, '../../data/instagram-versions');
        this.ensureDirectoryExists();
    }

    async ensureDirectoryExists() {
        try {
            await fs.mkdir(this.versionsDir, { recursive: true });
            logger.info('📁 InstagramVersionManager: Directorio de versiones listo', {
                path: this.versionsDir
            });
        } catch (error) {
            logger.error('❌ Error creando directorio de versiones:', error);
        }
    }

    /**
     * Guardar una nueva versión de video viral
     * @param {Object} versionData - Datos completos de la versión
     * @returns {Object} Versión guardada con ID
     */
    async saveVersion(versionData) {
        try {
            const timestamp = Date.now();
            const playerSlug = versionData.playerData.playerName
                .toLowerCase()
                .replace(/\s+/g, '-')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            // Crear ID único para esta versión
            const versionId = `${playerSlug}-v${timestamp}`;

            const version = {
                id: versionId,
                version: versionData.version || 1,
                timestamp: new Date().toISOString(),
                playerData: versionData.playerData,
                previewData: versionData.previewData,
                segments: versionData.segments,
                videoUrl: versionData.videoUrl,
                caption: versionData.caption,
                notes: versionData.notes || '',
                viralScore: versionData.viralScore || 0,
                isRealVideo: versionData.isRealVideo || false,
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    userId: versionData.userId || 'system',
                    status: versionData.status || 'draft'
                }
            };

            // Guardar archivo individual de versión
            const filePath = path.join(this.versionsDir, `${versionId}.json`);
            await fs.writeFile(filePath, JSON.stringify(version, null, 2), 'utf-8');

            logger.info('✅ Versión guardada:', {
                id: versionId,
                player: versionData.playerData.playerName,
                version: version.version
            });

            // Actualizar índice de versiones por jugador
            await this.updatePlayerIndex(playerSlug, version);

            return version;
        } catch (error) {
            logger.error('❌ Error guardando versión:', error);
            throw error;
        }
    }

    /**
     * Actualizar índice de versiones por jugador
     */
    async updatePlayerIndex(playerSlug, version) {
        try {
            const indexPath = path.join(this.versionsDir, `_index_${playerSlug}.json`);
            let index = { player: playerSlug, versions: [] };

            // Leer índice existente
            try {
                const existingData = await fs.readFile(indexPath, 'utf-8');
                index = JSON.parse(existingData);
            } catch (error) {
                // Índice no existe, usar el nuevo
            }

            // Agregar versión al índice (solo metadata básica)
            index.versions.push({
                id: version.id,
                version: version.version,
                timestamp: version.timestamp,
                viralScore: version.viralScore,
                isRealVideo: version.isRealVideo,
                status: version.metadata.status
            });

            // Ordenar por timestamp descendente
            index.versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

            logger.info('✅ Índice de jugador actualizado:', {
                player: playerSlug,
                totalVersions: index.versions.length
            });
        } catch (error) {
            logger.error('❌ Error actualizando índice:', error);
        }
    }

    /**
     * Obtener todas las versiones de un jugador
     * @param {string} playerName - Nombre del jugador
     * @returns {Array} Lista de versiones
     */
    async getVersionsByPlayer(playerName) {
        try {
            const playerSlug = playerName
                .toLowerCase()
                .replace(/\s+/g, '-')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const indexPath = path.join(this.versionsDir, `_index_${playerSlug}.json`);

            try {
                const indexData = await fs.readFile(indexPath, 'utf-8');
                const index = JSON.parse(indexData);

                // Cargar versiones completas
                const versions = await Promise.all(
                    index.versions.map(async (v) => {
                        return await this.getVersionById(v.id);
                    })
                );

                return versions.filter(v => v !== null);
            } catch (error) {
                // No hay versiones para este jugador
                return [];
            }
        } catch (error) {
            logger.error('❌ Error obteniendo versiones del jugador:', error);
            return [];
        }
    }

    /**
     * Obtener versión específica por ID
     * @param {string} versionId - ID de la versión
     * @returns {Object|null} Datos de la versión
     */
    async getVersionById(versionId) {
        try {
            const filePath = path.join(this.versionsDir, `${versionId}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.warn('⚠️ Versión no encontrada:', versionId);
            return null;
        }
    }

    /**
     * Obtener todas las versiones (todas los jugadores)
     * @returns {Array} Lista de todas las versiones
     */
    async getAllVersions() {
        try {
            const files = await fs.readdir(this.versionsDir);

            // Filtrar solo archivos de versiones (no índices)
            const versionFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_index_'));

            const versions = await Promise.all(
                versionFiles.map(async (file) => {
                    const filePath = path.join(this.versionsDir, file);
                    const data = await fs.readFile(filePath, 'utf-8');
                    return JSON.parse(data);
                })
            );

            // Ordenar por timestamp descendente
            return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            logger.error('❌ Error obteniendo todas las versiones:', error);
            return [];
        }
    }

    /**
     * Actualizar notas de una versión
     * @param {string} versionId - ID de la versión
     * @param {string} notes - Nuevas notas
     */
    async updateNotes(versionId, notes) {
        try {
            const version = await this.getVersionById(versionId);
            if (!version) {
                throw new Error('Versión no encontrada');
            }

            version.notes = notes;
            version.metadata.updatedAt = new Date().toISOString();

            const filePath = path.join(this.versionsDir, `${versionId}.json`);
            await fs.writeFile(filePath, JSON.stringify(version, null, 2), 'utf-8');

            logger.info('✅ Notas actualizadas:', { versionId });

            return version;
        } catch (error) {
            logger.error('❌ Error actualizando notas:', error);
            throw error;
        }
    }

    /**
     * Eliminar una versión
     * @param {string} versionId - ID de la versión a eliminar
     */
    async deleteVersion(versionId) {
        try {
            const filePath = path.join(this.versionsDir, `${versionId}.json`);
            await fs.unlink(filePath);

            logger.info('🗑️ Versión eliminada:', { versionId });

            return { success: true, message: 'Versión eliminada' };
        } catch (error) {
            logger.error('❌ Error eliminando versión:', error);
            throw error;
        }
    }

    /**
     * Comparar dos versiones
     * @param {string} versionId1 - ID primera versión
     * @param {string} versionId2 - ID segunda versión
     * @returns {Object} Comparación detallada
     */
    async compareVersions(versionId1, versionId2) {
        try {
            const v1 = await this.getVersionById(versionId1);
            const v2 = await this.getVersionById(versionId2);

            if (!v1 || !v2) {
                throw new Error('Una o ambas versiones no encontradas');
            }

            return {
                version1: {
                    id: v1.id,
                    timestamp: v1.timestamp,
                    viralScore: v1.viralScore,
                    isRealVideo: v1.isRealVideo,
                    segments: v1.segments,
                    caption: v1.caption
                },
                version2: {
                    id: v2.id,
                    timestamp: v2.timestamp,
                    viralScore: v2.viralScore,
                    isRealVideo: v2.isRealVideo,
                    segments: v2.segments,
                    caption: v2.caption
                },
                differences: {
                    viralScoreDiff: v2.viralScore - v1.viralScore,
                    hookChanged: v1.segments[0].dialogue !== v2.segments[0].dialogue,
                    developmentChanged: v1.segments[1].dialogue !== v2.segments[1].dialogue,
                    ctaChanged: v1.segments[2].dialogue !== v2.segments[2].dialogue,
                    captionChanged: v1.caption !== v2.caption
                }
            };
        } catch (error) {
            logger.error('❌ Error comparando versiones:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas generales
     * @returns {Object} Estadísticas del sistema de versiones
     */
    async getStats() {
        try {
            const allVersions = await this.getAllVersions();

            const stats = {
                totalVersions: allVersions.length,
                totalPlayers: new Set(allVersions.map(v => v.playerData.playerName)).size,
                realVideos: allVersions.filter(v => v.isRealVideo).length,
                mockVideos: allVersions.filter(v => !v.isRealVideo).length,
                averageViralScore: allVersions.reduce((sum, v) => sum + (v.viralScore || 0), 0) / allVersions.length || 0,
                lastCreated: allVersions[0]?.timestamp || null,
                byStatus: {
                    draft: allVersions.filter(v => v.metadata.status === 'draft').length,
                    published: allVersions.filter(v => v.metadata.status === 'published').length,
                    scheduled: allVersions.filter(v => v.metadata.status === 'scheduled').length
                }
            };

            return stats;
        } catch (error) {
            logger.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

module.exports = new InstagramVersionManager();
