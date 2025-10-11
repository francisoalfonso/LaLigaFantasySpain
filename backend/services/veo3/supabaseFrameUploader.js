const { supabaseAdmin } = require('../../config/supabase');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Subir frames extraídos a Supabase Storage para usar como referencia en VEO3
 *
 * Usa el bucket 'ana-images' existente para almacenar frames temporales
 * que sirven como continuidad visual entre segmentos de video.
 */
class SupabaseFrameUploader {
    constructor() {
        this.bucketName = 'ana-images'; // Bucket existente
        this.framePrefix = 'video-frames/'; // Subdirectorio para frames
    }

    /**
     * Subir frame a Supabase Storage y obtener URL pública
     * @param {string} localFramePath - Ruta local del frame extraído
     * @param {string} segmentName - Nombre descriptivo (ej: 'seg1-end', 'seg2-end')
     * @param {object} options - Opciones de upload
     * @returns {Promise<string>} - URL pública o signed URL del frame en Supabase
     */
    async uploadFrame(localFramePath, segmentName = 'frame', options = {}) {
        try {
            logger.info(`[SupabaseFrameUploader] Subiendo frame: ${localFramePath}`);

            // Leer archivo local
            const fileBuffer = fs.readFileSync(localFramePath);
            const fileExt = path.extname(localFramePath);

            // Nombre único con timestamp
            const fileName = `${this.framePrefix}${segmentName}-${Date.now()}${fileExt}`;

            // Subir a Supabase Storage
            const { error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .upload(fileName, fileBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600', // 1 hora cache
                    upsert: false
                });

            if (error) {
                throw new Error(`Error subiendo frame: ${error.message}`);
            }

            // ✅ FIX (10 Oct 2025): Generar Signed URL para VEO3
            // VEO3/KIE.ai no puede acceder a URLs públicas de Supabase
            // Usar signed URLs con expiración larga (24h)
            const useSignedUrl = options.useSignedUrl !== false; // Default: true

            if (useSignedUrl) {
                const { data: signedData, error: signedError } = await supabaseAdmin.storage
                    .from(this.bucketName)
                    .createSignedUrl(fileName, 86400); // 24 horas (86400 segundos)

                if (signedError) {
                    logger.warn(`[SupabaseFrameUploader] ⚠️ Error generando signed URL: ${signedError.message}`);
                    logger.warn(`[SupabaseFrameUploader] Fallback a URL pública`);

                    // Fallback: URL pública
                    const { data: publicUrlData } = supabaseAdmin.storage
                        .from(this.bucketName)
                        .getPublicUrl(fileName);

                    return publicUrlData.publicUrl;
                }

                logger.info(`[SupabaseFrameUploader] ✅ Frame subido con signed URL (24h): ${signedData.signedUrl.substring(0, 80)}...`);
                return signedData.signedUrl;
            }

            // URL pública (original)
            const { data: publicUrlData } = supabaseAdmin.storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;

            logger.info(`[SupabaseFrameUploader] ✅ Frame subido con URL pública: ${publicUrl}`);

            return publicUrl;

        } catch (error) {
            logger.error(`[SupabaseFrameUploader] ❌ Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Limpiar frames antiguos (opcional, para mantenimiento)
     * Elimina frames con más de 24 horas
     */
    async cleanupOldFrames() {
        try {
            logger.info('[SupabaseFrameUploader] Limpiando frames antiguos...');

            // Listar todos los frames
            const { data: files, error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .list(this.framePrefix);

            if (error) {
                throw new Error(`Error listando frames: ${error.message}`);
            }

            // Filtrar frames con más de 24 horas
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const oldFrames = files.filter(file => {
                const createdAt = new Date(file.created_at).getTime();
                return createdAt < oneDayAgo;
            });

            if (oldFrames.length === 0) {
                logger.info('[SupabaseFrameUploader] No hay frames antiguos para limpiar');
                return;
            }

            // Eliminar frames antiguos
            const filePaths = oldFrames.map(file => `${this.framePrefix}${file.name}`);
            const { error: deleteError } = await supabaseAdmin.storage
                .from(this.bucketName)
                .remove(filePaths);

            if (deleteError) {
                throw new Error(`Error eliminando frames: ${deleteError.message}`);
            }

            logger.info(`[SupabaseFrameUploader] ✅ ${oldFrames.length} frames antiguos eliminados`);

        } catch (error) {
            logger.error(`[SupabaseFrameUploader] ❌ Error en cleanup: ${error.message}`);
            // No lanzar error, es mantenimiento opcional
        }
    }
}

module.exports = new SupabaseFrameUploader(); // Singleton export
