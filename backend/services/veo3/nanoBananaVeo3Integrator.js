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

// Cargar config FLP para referencias de estudio
const FLP_CONFIG = require('../../../data/flp-nano-banana-config.json');

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
            logger.error(
                `[NanoBananaVeo3Integrator] ❌ Error descargando imagen: ${error.message}`
            );
            throw error;
        }
    }

    /**
     * ⚠️ MÉTODO LEGACY - No usa guión contextualizado
     * Generar 3 imágenes genéricas con Nano Banana y prepararlas para VEO3
     * @deprecated Usar generateImagesFromScript() en su lugar
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

                logger.info(
                    `[NanoBananaVeo3Integrator] 🔄 Procesando imagen ${i + 1}/3 (${nanoImage.shot})...`
                );

                try {
                    // Descargar imagen desde URL temporal de Nano Banana
                    const fileName = `ana-${nanoImage.shot}-${Date.now()}.png`;
                    const localPath = await this.downloadImage(nanoImage.url, fileName);

                    // Subir a Supabase Storage con signed URL para VEO3
                    const segmentName = `seg${i + 1}-${nanoImage.shot}`;
                    const presenter = options.presenter || 'ana';
                    const supabaseUrl = await supabaseFrameUploader.uploadFrame(
                        localPath,
                        segmentName,
                        {
                            useSignedUrl: true, // ✅ Usar signed URL para VEO3
                            presenter: presenter // ✅ Para subdirectorio correcto (ana/carlos)
                        }
                    );

                    // Limpiar archivo local
                    fs.unlinkSync(localPath);

                    processedImages.push({
                        index: nanoImage.index,
                        shot: nanoImage.shot,
                        segmentRole: nanoImage.segmentRole,
                        originalUrl: nanoImage.url, // URL temporal de Nano Banana
                        supabaseUrl: supabaseUrl, // Signed URL de Supabase (para VEO3)
                        seed: nanoImage.seed,
                        generatedAt: nanoImage.generatedAt
                    });

                    logger.info(
                        `[NanoBananaVeo3Integrator] ✅ Imagen ${i + 1} procesada: ${supabaseUrl.substring(0, 80)}...`
                    );
                } catch (error) {
                    logger.error(
                        `[NanoBananaVeo3Integrator] ❌ Error procesando imagen ${i + 1}:`,
                        error
                    );
                    throw error;
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalCost = nanoBananaImages.length * 0.02; // Nano Banana costo

            logger.info(`[NanoBananaVeo3Integrator] ✅ Procesamiento completado en ${duration}s`);
            logger.info(
                `[NanoBananaVeo3Integrator] 💰 Costo Nano Banana: $${totalCost.toFixed(3)}`
            );
            logger.info(
                `[NanoBananaVeo3Integrator] 📊 ${processedImages.length} imágenes listas para VEO3`
            );

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
     * ✅ NUEVO (10 Oct 2025): Generar imágenes contextualizadas basadas en guión profesional
     * Este método conecta UnifiedScriptGenerator → Nano Banana → VEO3
     *
     * @param {Array} scriptSegments - Array de 3 segmentos del UnifiedScriptGenerator
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Object con {images, metadata}
     */
    async generateImagesFromScript(scriptSegments, options = {}) {
        try {
            logger.info(
                '[NanoBananaVeo3Integrator] 🎨 Generando 3 imágenes contextualizadas del guión...'
            );

            if (!scriptSegments || scriptSegments.length !== 3) {
                throw new Error('Se requieren exactamente 3 segmentos del script');
            }

            const startTime = Date.now();
            const processedImages = [];

            // ✅ CRÍTICO (16 Oct 2025): Selección aleatoria de 1 estudio FUERA del loop
            // IMPORTANTE: El MISMO estudio se usa para los 3 segmentos (continuidad visual)
            // Solo cambian los ángulos de cámara (wide → medium → close-up), NO el escenario
            // Esto evita "saltos" del presentador entre diferentes fondos
            const randomEstudio =
                FLP_CONFIG.estudio_references[
                    Math.floor(Math.random() * FLP_CONFIG.estudio_references.length)
                ];
            logger.info(
                `[NanoBananaVeo3Integrator] 🎲 Estudio seleccionado para todo el video: ${randomEstudio.description}`
            );

            // Preparar imageUrls ANTES del loop (mismo estudio para todos los segmentos)
            const baseImageUrls = options.imageUrl
                ? [
                      ...FLP_CONFIG.carlos_references.map(ref => ref.url), // 5 imágenes Carlos
                      randomEstudio.url // 1 estudio aleatorio (FIJO para 3 segmentos)
                  ]
                : [
                      ...FLP_CONFIG.ana_references.map(ref => ref.url), // 3 imágenes Ana
                      randomEstudio.url // 1 estudio aleatorio (FIJO para 3 segmentos)
                  ];

            logger.info(
                `[NanoBananaVeo3Integrator] 📦 Referencias: ${baseImageUrls.length} imágenes (${options.imageUrl ? '5 Carlos' : '3 Ana'} + 1 estudio)`
            );

            for (let i = 0; i < scriptSegments.length; i++) {
                // scriptSegments es un array de 3 segmentos [hook, development, cta]
                const segment = scriptSegments[i];

                logger.info(
                    `[NanoBananaVeo3Integrator] 🖼️  Generando imagen ${i + 1}/3 (${segment.role})...`
                );

                // Construir prompt contextualizado para Nano Banana con characterBible
                const imagePrompt = this.buildContextualImagePrompt(
                    segment,
                    options.characterBible
                );

                logger.info(
                    `[NanoBananaVeo3Integrator] 📝 Prompt: "${imagePrompt.substring(0, 100)}..."`
                );

                // ✅ FIX (10 Oct 2025 21:05): cinematography.name (no cinematography.shot)
                const shotType = segment.cinematography?.name || 'medium';

                // Generar imagen con Nano Banana usando el contexto del segmento
                const nanoImage = await this.nanoBananaClient.generateContextualImage(
                    imagePrompt,
                    shotType, // wide, medium, close-up
                    { ...options, imageUrls: baseImageUrls }
                );

                // Descargar y subir a Supabase
                const presenter = options.presenter || 'ana';
                const fileName = `${presenter}-${segment.role}-${Date.now()}.png`;
                const localPath = await this.downloadImage(nanoImage.url, fileName);

                const segmentName = `seg${i + 1}-${segment.role}`;
                const supabaseUrl = await supabaseFrameUploader.uploadFrame(
                    localPath,
                    segmentName,
                    {
                        useSignedUrl: true, // ✅ Signed URL para VEO3
                        presenter: presenter // ✅ Para subdirectorio correcto (ana/carlos)
                    }
                );

                fs.unlinkSync(localPath); // Limpiar archivo local

                processedImages.push({
                    index: i + 1,
                    role: segment.role,
                    shot: shotType,
                    emotion: segment.emotion,
                    dialogue: segment.dialogue,
                    visualContext: segment.cinematography?.description || '',
                    supabaseUrl: supabaseUrl,
                    generatedAt: new Date().toISOString()
                });

                logger.info(
                    `[NanoBananaVeo3Integrator] ✅ Imagen ${i + 1} procesada: ${supabaseUrl.substring(0, 80)}...`
                );
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalCost = processedImages.length * 0.02; // Nano Banana costo

            logger.info(
                `[NanoBananaVeo3Integrator] ✅ ${processedImages.length} imágenes contextualizadas generadas en ${duration}s`
            );
            logger.info(`[NanoBananaVeo3Integrator] 💰 Costo: $${totalCost.toFixed(3)}`);

            return {
                images: processedImages,
                metadata: {
                    cost_usd: totalCost,
                    duration_seconds: parseFloat(duration),
                    processedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('[NanoBananaVeo3Integrator] ❌ Error generando imágenes:', error);
            throw error;
        }
    }

    /**
     * ✅ MEJORADO (12 Oct 2025): Construir prompt contextualizado para Nano Banana con soporte multi-presentador
     *
     * Cada shot type tiene descripciones específicas para crear diferencias visuales marcadas:
     * - wide: Full body, environment visible, distant perspective
     * - medium: Upper body, balanced framing, professional anchor look
     * - close-up: Face and shoulders, emotional detail, intimate connection
     *
     * @param {object} segment - Segmento del UnifiedScriptGenerator
     * @param {string} characterBible - Descripción del presentador (Ana o Carlos)
     * @returns {string} - Prompt para Nano Banana
     */
    buildContextualImagePrompt(segment, characterBible) {
        // Si no se proporciona characterBible, usar default de Ana (backward compatibility)
        const defaultAnaBible =
            'A 32-year-old Spanish sports analyst Ana Martínez with short black curly hair, wearing a red Fantasy La Liga polo shirt';
        const bible = characterBible || defaultAnaBible;

        // Prompt base usando el character bible dinámicamente
        let prompt = `ultra realistic cinematic portrait, ${bible}, presenting inside the FLP studio, same person as in the reference images, same face, hairstyle and clothing, integrated with the studio lighting and reflections, balanced neutral white balance, realistic soft shadows and light diffusion, cinematic tone, Canon EOS R5 85mm f1.4 lens, shallow depth of field, film grain, authentic human skin texture, no CGI, no render, no plastic skin`;

        // Contexto emocional del segmento
        const emotionMap = {
            curiosidad: ', curious expression with raised eyebrows',
            autoridad: ', confident smile with direct eye contact',
            urgencia: ', pointing at camera with urgent expression',
            excitement: ', excited expression with wide smile and raised eyebrows',
            intrigue: ', focused analytical expression looking at data',
            confidence: ', confident smile with direct eye contact',
            surprise: ', surprised expression with open mouth',
            enthusiasm: ', energetic expression with bright eyes',
            analysis: ', thoughtful expression while analyzing',
            concern: ', concerned expression with furrowed brows',
            determination: ', determined expression with strong eye contact',
            joy: ', joyful smile with genuine happiness',
            satisfaction: ', satisfied smile with relaxed posture',
            anticipation: ', anticipatory expression with slight smile',
            tension: ', tense expression with focused gaze',
            resolution: ', resolved expression with calm demeanor'
        };

        prompt += emotionMap[segment.emotion] || ', confident professional expression';

        return prompt.trim();
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
            logger.info(
                `[NanoBananaVeo3Integrator] 🧹 ${files.length} archivos temporales eliminados`
            );
        } catch (error) {
            logger.error(
                `[NanoBananaVeo3Integrator] ⚠️  Error limpiando archivos: ${error.message}`
            );
        }
    }
}

module.exports = new NanoBananaVeo3Integrator(); // Singleton export
