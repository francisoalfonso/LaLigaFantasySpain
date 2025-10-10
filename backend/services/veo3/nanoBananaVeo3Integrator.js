/**
 * Nano Banana + VEO3 Integrator
 *
 * Servicio que conecta la generación de imágenes con Nano Banana
 * con la generación de videos con VEO3, usando las imágenes como frames iniciales.
 *
 * Flujo:
 * 1. Generar 3 imágenes Ana con Nano Banana (Wide, Medium, Close-up)
 * 2. Descargar imágenes temporalmente
 * 3. Subirlas a Supabase Storage
 * 4. Usar URLs de Supabase como referencia en VEO3
 * 5. Generar 3 segmentos de video
 * 6. Concatenar videos
 */

const NanoBananaClient = require('../nanoBanana/nanoBananaClient');
const supabaseFrameUploader = require('./supabaseFrameUploader');
const logger = require('../../utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NanoBananaVeo3Integrator {
    constructor() {
        this.nanoBananaClient = new NanoBananaClient();
        this.tempDir = path.join(process.cwd(), 'temp', 'nano-banana');

        // Crear directorio temporal si no existe
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        logger.info('[NanoBananaVeo3Integrator] ✅ Integrador inicializado');
    }

    /**
     * Descargar imagen desde URL temporal de Nano Banana
     * @param {string} imageUrl - URL de la imagen generada
     * @param {string} fileName - Nombre del archivo local
     * @returns {Promise<string>} - Ruta local del archivo descargado
     */
    async downloadImage(imageUrl, fileName) {
        try {
            logger.info(`[NanoBananaVeo3Integrator] 📥 Descargando imagen: ${fileName}`);

            const localPath = path.join(this.tempDir, fileName);

            // Descargar imagen
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            // Guardar localmente
            fs.writeFileSync(localPath, response.data);

            logger.info(`[NanoBananaVeo3Integrator] ✅ Imagen descargada: ${localPath}`);

            return localPath;

        } catch (error) {
            logger.error(`[NanoBananaVeo3Integrator] ❌ Error descargando imagen: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar 3 imágenes con Nano Banana y prepararlas para VEO3
     * @param {object} options - Opciones de generación
     * @returns {Promise<Array>} - Array de 3 objetos con URLs de Supabase
     */
    async generateImagesForVeo3(options = {}) {
        try {
            logger.info('[NanoBananaVeo3Integrator] 🎨 Generando 3 imágenes Ana para VEO3...');

            const startTime = Date.now();

            // 1. Generar 3 imágenes con Nano Banana
            const nanoBananaImages = await this.nanoBananaClient.generateAnaProgression(options);

            logger.info(`[NanoBananaVeo3Integrator] ✅ 3 imágenes Nano Banana generadas`);

            // 2. Procesar cada imagen: Descargar → Subir a Supabase
            const processedImages = [];

            for (let i = 0; i < nanoBananaImages.length; i++) {
                const nanoImage = nanoBananaImages[i];

                logger.info(`[NanoBananaVeo3Integrator] 🔄 Procesando imagen ${i + 1}/3 (${nanoImage.shot})...`);

                try {
                    // Descargar imagen desde URL temporal de Nano Banana
                    const fileName = `ana-${nanoImage.shot}-${Date.now()}.png`;
                    const localPath = await this.downloadImage(nanoImage.url, fileName);

                    // Subir a Supabase Storage para uso persistente
                    const segmentName = `seg${i + 1}-${nanoImage.shot}`;
                    const supabaseUrl = await supabaseFrameUploader.uploadFrame(localPath, segmentName);

                    // Limpiar archivo local
                    fs.unlinkSync(localPath);

                    processedImages.push({
                        index: nanoImage.index,
                        shot: nanoImage.shot,
                        segmentRole: nanoImage.segmentRole,
                        originalUrl: nanoImage.url, // URL temporal de Nano Banana
                        supabaseUrl: supabaseUrl,   // URL persistente de Supabase (para VEO3)
                        seed: nanoImage.seed,
                        generatedAt: nanoImage.generatedAt
                    });

                    logger.info(`[NanoBananaVeo3Integrator] ✅ Imagen ${i + 1} procesada: ${supabaseUrl.substring(0, 80)}...`);

                } catch (error) {
                    logger.error(`[NanoBananaVeo3Integrator] ❌ Error procesando imagen ${i + 1}:`, error);
                    throw error;
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalCost = nanoBananaImages.length * 0.02; // Nano Banana costo

            logger.info(`[NanoBananaVeo3Integrator] ✅ Procesamiento completado en ${duration}s`);
            logger.info(`[NanoBananaVeo3Integrator] 💰 Costo Nano Banana: $${totalCost.toFixed(3)}`);
            logger.info(`[NanoBananaVeo3Integrator] 📊 ${processedImages.length} imágenes listas para VEO3`);

            return {
                images: processedImages,
                metadata: {
                    duration_seconds: parseFloat(duration),
                    cost_usd: totalCost,
                    nanoBananaModel: 'google/nano-banana-edit',
                    processedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('[NanoBananaVeo3Integrator] ❌ Error en generación:', error);
            throw error;
        }
    }

    /**
     * Limpiar directorio temporal de imágenes
     */
    cleanupTempFiles() {
        try {
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                const filePath = path.join(this.tempDir, file);
                fs.unlinkSync(filePath);
            });
            logger.info(`[NanoBananaVeo3Integrator] 🧹 ${files.length} archivos temporales eliminados`);
        } catch (error) {
            logger.error(`[NanoBananaVeo3Integrator] ⚠️  Error limpiando archivos: ${error.message}`);
        }
    }
}

module.exports = new NanoBananaVeo3Integrator(); // Singleton export
