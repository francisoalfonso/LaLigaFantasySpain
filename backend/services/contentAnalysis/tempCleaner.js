/**
 * Temp Cleaner Service
 *
 * Limpia archivos temporales de videos para prevenir acumulación de espacio
 *
 * RESPONSABILIDADES:
 * - Limpiar temp/auto-processor al iniciar servidor
 * - Limpiar periódicamente (cada 1 hora)
 * - Limpiar archivos antiguos (>2 horas)
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class TempCleaner {
    constructor() {
        this.tempDir = path.join(__dirname, '../../../temp/auto-processor');
        this.cleanupInterval = null;
        this.isRunning = false;
    }

    /**
     * Iniciar limpieza automática
     */
    async start() {
        logger.info('[TempCleaner] 🧹 Iniciando servicio de limpieza automática');

        // Limpieza inicial inmediata
        await this.cleanAll();

        // Limpieza periódica cada 1 hora
        this.cleanupInterval = setInterval(
            async () => {
                await this.cleanOld(2); // Archivos >2 horas
            },
            60 * 60 * 1000
        ); // 1 hora

        this.isRunning = true;

        logger.info('[TempCleaner] ✅ Servicio iniciado - Limpieza cada 1 hora');
    }

    /**
     * Detener limpieza automática
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.isRunning = false;
        logger.info('[TempCleaner] 🛑 Servicio detenido');
    }

    /**
     * Limpiar TODOS los archivos temporales
     */
    async cleanAll() {
        try {
            // Verificar que el directorio existe
            await fs.mkdir(this.tempDir, { recursive: true });

            const files = await fs.readdir(this.tempDir);

            if (files.length === 0) {
                logger.info('[TempCleaner] ✅ Directorio temp ya está limpio');
                return { deleted: 0, size: 0 };
            }

            let deletedCount = 0;
            let totalSize = 0;

            for (const file of files) {
                if (file.endsWith('.mp4') || file.endsWith('.mp3')) {
                    const filePath = path.join(this.tempDir, file);

                    try {
                        const stats = await fs.stat(filePath);
                        totalSize += stats.size;

                        await fs.unlink(filePath);
                        deletedCount++;
                    } catch (error) {
                        logger.warn('[TempCleaner] Error eliminando archivo', {
                            file,
                            error: error.message
                        });
                    }
                }
            }

            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

            logger.info('[TempCleaner] ✅ Limpieza completada', {
                deleted: deletedCount,
                sizeMB: `${sizeMB} MB`
            });

            return { deleted: deletedCount, size: totalSize };
        } catch (error) {
            logger.error('[TempCleaner] Error en limpieza total', {
                error: error.message
            });
            return { deleted: 0, size: 0 };
        }
    }

    /**
     * Limpiar archivos antiguos (>N horas)
     */
    async cleanOld(hoursOld = 2) {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });

            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            const maxAge = hoursOld * 60 * 60 * 1000;

            let deletedCount = 0;
            let totalSize = 0;

            for (const file of files) {
                if (file.endsWith('.mp4') || file.endsWith('.mp3')) {
                    const filePath = path.join(this.tempDir, file);

                    try {
                        const stats = await fs.stat(filePath);
                        const age = now - stats.mtimeMs;

                        if (age > maxAge) {
                            totalSize += stats.size;
                            await fs.unlink(filePath);
                            deletedCount++;

                            logger.info('[TempCleaner] 🗑️  Archivo antiguo eliminado', {
                                file,
                                ageHours: (age / (60 * 60 * 1000)).toFixed(1),
                                sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
                            });
                        }
                    } catch (error) {
                        logger.warn('[TempCleaner] Error verificando archivo', {
                            file,
                            error: error.message
                        });
                    }
                }
            }

            if (deletedCount > 0) {
                const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                logger.info('[TempCleaner] ✅ Limpieza de antiguos completada', {
                    deleted: deletedCount,
                    sizeMB: `${sizeMB} MB`,
                    olderThan: `${hoursOld}h`
                });
            }

            return { deleted: deletedCount, size: totalSize };
        } catch (error) {
            logger.error('[TempCleaner] Error en limpieza de antiguos', {
                error: error.message
            });
            return { deleted: 0, size: 0 };
        }
    }

    /**
     * Obtener estado del servicio
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            tempDir: this.tempDir
        };
    }
}

module.exports = new TempCleaner();
