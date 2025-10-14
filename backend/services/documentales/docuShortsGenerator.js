/**
 * Documentary Shorts Generator - VEO3 Adapter
 *
 * PROPÓSITO:
 * Adaptar el sistema VEO3 3-Phase para generar documentales virales en formato Shorts.
 * Usa un NARRATOR especializado (NOT Ana/Carlos) con tono serio estilo Netflix/HBO.
 *
 * DIFERENCIA CON viralVideoBuilder.js:
 * - viralVideoBuilder: Ana/Carlos para Fantasy La Liga (casual, viral)
 * - docuShortsGenerator: Narrator para documentales (serio, profesional, revelador)
 *
 * ARQUITECTURA:
 * - Reutiliza 100% del VEO3 3-Phase System
 * - Nuevo presentador: "narrator" (seed 40001)
 * - Character Bible: Hombre de 40-45 años, voz seria, estilo periodista investigación
 * - Prompts adaptados para tono documental
 *
 * FLUJO:
 * 1. Recibe script documental (docuScriptGenerator)
 * 2. Adapta prompts para narrator (NOT Ana/Carlos)
 * 3. Llama a VEO3 3-Phase System (prepare → generate × 3 → finalize)
 * 4. Output: Video documental de 24s (3 segmentos × 8s)
 *
 * COST: ~$0.96 por video ($0.06 Nano Banana + $0.90 VEO3 3 segments)
 */

const logger = require('../../utils/logger');
const nanoBananaClient = require('../nanoBanana/nanoBananaClient');
const veo3Client = require('../veo3/veo3Client');
const videoConcatenator = require('../veo3/videoConcatenator');
const promptBuilder = require('../veo3/promptBuilder');
const fs = require('fs');
const path = require('path');

class DocuShortsGenerator {
    constructor() {
        // Configuración del NARRATOR (nuevo presentador para documentales)
        this.narrator = {
            seed: 40001, // Seed único para narrator (NOT 30001 Ana, NOT 30002 Carlos)
            name: 'Narrator',
            characterBible: {
                age: '40-45 years old',
                gender: 'Male',
                appearance: 'Professional journalist look, short gray hair, glasses, neutral background',
                voice: {
                    tone: 'Serious, authoritative, measured pace',
                    style: 'Documentary narrator like Netflix/HBO documentaries',
                    energy: 'Medium-low, controlled, emphasizes key words',
                    accent: 'Neutral Spanish from Spain (Castilian)'
                },
                personality:
                    'Professional investigative journalist. Serious, revealing, generates suspense. NOT casual or funny. Focuses on facts and verified data.',
                clothing: 'Dark button-up shirt or blazer, professional look'
            },
            referenceImage: process.env.NARRATOR_IMAGE_URL || null // TODO: Upload narrator reference image
        };

        // Configuración VEO3
        this.veo3Config = {
            aspectRatio: '9:16', // Shorts format
            duration: 8, // segundos por segmento
            segments: 3, // Total 24s
            watermark: 'DOCS' // Watermark para canal de documentales
        };

        // Session tracking
        this.sessions = new Map();
    }

    /**
     * Generar documental Short completo (3-Phase System)
     *
     * @param {Object} script - Script documental (de docuScriptGenerator)
     * @param {string} script.tema - Título del documental
     * @param {array} script.segments - 3 segmentos con dialogues
     * @param {string} script.angle - Ángulo documental (revelacion, misterio, etc.)
     * @param {Object} options - Opciones adicionales
     * @param {string} [options.sessionId] - ID de sesión (auto-generado si no se provee)
     * @param {boolean} [options.generateContextImages=true] - Generar imágenes contextuales con Nano Banana
     * @returns {Promise<Object>} Resultado con path del video final
     */
    async generateDocuShort(script, options = {}) {
        const startTime = Date.now();
        const sessionId = options.sessionId || `docu_${Date.now()}`;

        try {
            logger.info('[DocuShortsGenerator] Iniciando generación de documental Short', {
                sessionId,
                tema: script.tema,
                segments: script.segments.length,
                angle: script.angle
            });

            // Validar script
            this._validateScript(script);

            // Crear carpeta de sesión
            const sessionDir = path.join(
                process.cwd(),
                'output',
                'veo3',
                'sessions',
                `session_${sessionId}`
            );
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            // Guardar session tracking
            this.sessions.set(sessionId, {
                status: 'preparing',
                tema: script.tema,
                startedAt: new Date().toISOString(),
                sessionDir
            });

            // PHASE 1: Preparación (script + imágenes contextuales)
            logger.info('[DocuShortsGenerator] PHASE 1: Preparación...');
            const prepareResult = await this._prepareSession(script, sessionId, options);

            if (!prepareResult.success) {
                throw new Error(`Phase 1 failed: ${prepareResult.error}`);
            }

            // PHASE 2: Generar 3 segmentos con VEO3
            logger.info('[DocuShortsGenerator] PHASE 2: Generando 3 segmentos...');
            const segmentResults = [];

            for (let i = 0; i < 3; i++) {
                const segmentResult = await this._generateSegment(script, sessionId, i);

                if (!segmentResult.success) {
                    throw new Error(`Segment ${i} failed: ${segmentResult.error}`);
                }

                segmentResults.push(segmentResult);

                logger.info(`[DocuShortsGenerator] Segmento ${i} completado`, {
                    videoPath: segmentResult.videoPath
                });
            }

            // PHASE 3: Concatenar videos + logo outro
            logger.info('[DocuShortsGenerator] PHASE 3: Finalizando video...');
            const finalResult = await this._finalizeSession(sessionId, segmentResults);

            if (!finalResult.success) {
                throw new Error(`Phase 3 failed: ${finalResult.error}`);
            }

            const duration = Date.now() - startTime;

            // Update session tracking
            this.sessions.set(sessionId, {
                ...this.sessions.get(sessionId),
                status: 'completed',
                completedAt: new Date().toISOString(),
                duration: `${duration}ms`,
                finalVideo: finalResult.finalVideoPath
            });

            logger.info('[DocuShortsGenerator] ✅ Documental Short generado exitosamente', {
                sessionId,
                tema: script.tema,
                duration: `${duration}ms`,
                finalVideo: finalResult.finalVideoPath,
                cost: '$0.96' // Nano Banana + VEO3 3 segments
            });

            return {
                success: true,
                sessionId,
                videoPath: finalResult.finalVideoPath,
                segments: segmentResults.length,
                duration,
                cost: 0.96,
                metadata: {
                    tema: script.tema,
                    angle: script.angle,
                    narrator: this.narrator.name,
                    generated_at: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('[DocuShortsGenerator] Error generando documental Short', {
                sessionId,
                error: error.message,
                stack: error.stack
            });

            // Update session tracking
            this.sessions.set(sessionId, {
                ...this.sessions.get(sessionId),
                status: 'failed',
                error: error.message
            });

            return {
                success: false,
                sessionId,
                error: error.message
            };
        }
    }

    /**
     * PHASE 1: Preparar sesión (generar imágenes contextuales con Nano Banana)
     * @private
     */
    async _prepareSession(script, sessionId, options) {
        try {
            const { generateContextImages = true } = options;

            logger.info('[DocuShortsGenerator] Preparando sesión...', {
                sessionId,
                generateContextImages
            });

            const sessionDir = this.sessions.get(sessionId).sessionDir;
            const contextImages = [];

            if (generateContextImages) {
                // Generar 3 imágenes contextuales con Nano Banana
                // Cada segmento tendrá su propia imagen adaptada al contexto

                for (let i = 0; i < script.segments.length; i++) {
                    const segment = script.segments[i];

                    // Descripción de contexto para Nano Banana
                    const contextDescription = this._buildContextDescription(segment, script.tema);

                    logger.info(
                        `[DocuShortsGenerator] Generando imagen contextual ${i + 1}/3...`,
                        {
                            role: segment.role
                        }
                    );

                    // TODO: Implementar referenceImages del narrator
                    // Por ahora, usar las de Ana como placeholder
                    const imageResult = await nanoBananaClient.generateContextImage({
                        referenceImages: [], // TODO: Cargar narrator reference images
                        contextDescription,
                        seed: this.narrator.seed,
                        outputPath: path.join(sessionDir, `context-segment-${i}.jpg`)
                    });

                    if (imageResult.success) {
                        contextImages.push(imageResult.imagePath);
                        logger.info(`[DocuShortsGenerator] ✅ Imagen ${i + 1} generada`);
                    } else {
                        logger.warn(`[DocuShortsGenerator] ⚠️ Imagen ${i + 1} falló`, {
                            error: imageResult.error
                        });
                    }
                }
            }

            // Guardar progress.json
            const progressPath = path.join(sessionDir, 'progress.json');
            const progress = {
                sessionId,
                status: 'prepared',
                tema: script.tema,
                segments: script.segments.length,
                contextImages,
                preparedAt: new Date().toISOString()
            };

            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');

            return {
                success: true,
                contextImages,
                sessionDir
            };
        } catch (error) {
            logger.error('[DocuShortsGenerator] Error en Phase 1', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * PHASE 2: Generar un segmento con VEO3
     * @private
     */
    async _generateSegment(script, sessionId, segmentIndex) {
        try {
            const segment = script.segments[segmentIndex];
            const sessionDir = this.sessions.get(sessionId).sessionDir;

            logger.info(`[DocuShortsGenerator] Generando segmento ${segmentIndex}...`, {
                role: segment.role,
                emotion: segment.emotion
            });

            // Build VEO3 prompt (adaptado para narrator)
            const prompt = this._buildVEO3Prompt(segment, script.tema);

            // Generar video con VEO3
            const videoResult = await veo3Client.generateVideo({
                prompt,
                aspectRatio: this.veo3Config.aspectRatio,
                seed: this.narrator.seed,
                referenceImage: this.narrator.referenceImage, // TODO: Cargar imagen del narrator
                watermark: this.veo3Config.watermark
            });

            if (!videoResult.success) {
                throw new Error(`VEO3 generation failed: ${videoResult.error}`);
            }

            // Guardar video del segmento
            const segmentVideoPath = path.join(
                sessionDir,
                `segment-${segmentIndex}-${segment.role}.mp4`
            );

            // Move video to session dir
            if (videoResult.videoPath && fs.existsSync(videoResult.videoPath)) {
                fs.renameSync(videoResult.videoPath, segmentVideoPath);
            }

            logger.info(`[DocuShortsGenerator] ✅ Segmento ${segmentIndex} generado`, {
                videoPath: segmentVideoPath
            });

            return {
                success: true,
                segmentIndex,
                videoPath: segmentVideoPath,
                duration: this.veo3Config.duration,
                cost: 0.3 // VEO3 cost per segment
            };
        } catch (error) {
            logger.error(`[DocuShortsGenerator] Error en segmento ${segmentIndex}`, {
                error: error.message
            });

            return {
                success: false,
                segmentIndex,
                error: error.message
            };
        }
    }

    /**
     * PHASE 3: Finalizar sesión (concatenar + logo outro)
     * @private
     */
    async _finalizeSession(sessionId, segmentResults) {
        try {
            const sessionDir = this.sessions.get(sessionId).sessionDir;

            logger.info('[DocuShortsGenerator] Concatenando segmentos...');

            // Paths de los 3 segmentos
            const segmentPaths = segmentResults.map(r => r.videoPath);

            // Output path para video concatenado
            const concatenatedPath = path.join(sessionDir, 'concatenated.mp4');

            // Concatenar con videoConcatenator
            const concatResult = await videoConcatenator.concatenateVideos({
                videoPaths: segmentPaths,
                outputPath: concatenatedPath,
                addLogoOutro: true // Agregar logo outro al final
            });

            if (!concatResult.success) {
                throw new Error(`Concatenation failed: ${concatResult.error}`);
            }

            // Actualizar progress.json
            const progressPath = path.join(sessionDir, 'progress.json');
            const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
            progress.status = 'completed';
            progress.finalVideoPath = concatResult.finalVideoPath;
            progress.completedAt = new Date().toISOString();

            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');

            logger.info('[DocuShortsGenerator] ✅ Video finalizado', {
                finalVideoPath: concatResult.finalVideoPath
            });

            return {
                success: true,
                finalVideoPath: concatResult.finalVideoPath
            };
        } catch (error) {
            logger.error('[DocuShortsGenerator] Error en Phase 3', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build context description for Nano Banana
     * @private
     */
    _buildContextDescription(segment, tema) {
        const contextDescriptions = {
            hook: `Professional journalist in investigation mode, serious expression, neutral background, dramatic lighting for documentary intro about: ${tema}`,
            story: `Documentary narrator presenting evidence and facts, focused expression, papers or documents visible, professional setting related to: ${tema}`,
            twist: `Investigative journalist revealing final revelation, intense expression, close-up shot, dramatic moment about: ${tema}`
        };

        return contextDescriptions[segment.role] || contextDescriptions.story;
    }

    /**
     * Build VEO3 prompt adaptado para narrator
     * @private
     */
    _buildVEO3Prompt(segment, tema) {
        // Prompt especializado para narrator (tono serio, NOT Ana/Carlos casual)
        const basePrompt = `The person from the reference image speaks in Spanish from Spain with a SERIOUS, AUTHORITATIVE documentary narrator tone: "${segment.dialogue}". Maintain the exact appearance and professional demeanor from the reference image.`;

        return basePrompt;
    }

    /**
     * Validar script documental
     * @private
     */
    _validateScript(script) {
        if (!script.tema) {
            throw new Error('Script missing tema');
        }

        if (!script.segments || script.segments.length !== 3) {
            throw new Error(`Script must have exactly 3 segments, got ${script.segments?.length}`);
        }

        script.segments.forEach((seg, i) => {
            if (!seg.dialogue) {
                throw new Error(`Segment ${i} missing dialogue`);
            }

            if (!seg.role) {
                throw new Error(`Segment ${i} missing role`);
            }

            if (!seg.emotion) {
                throw new Error(`Segment ${i} missing emotion`);
            }
        });
    }

    /**
     * Obtener estado de una sesión
     *
     * @param {string} sessionId - ID de la sesión
     * @returns {Object} Estado de la sesión
     */
    getSessionStatus(sessionId) {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * Calcular costo de generación
     *
     * @param {number} count - Número de videos
     * @returns {number} Costo en USD
     */
    calculateCost(count = 1) {
        const nanoBananaCost = 0.06; // 3 images × $0.02
        const veo3Cost = 0.9; // 3 segments × $0.30
        const totalPerVideo = nanoBananaCost + veo3Cost;

        return count * totalPerVideo;
    }
}

module.exports = new DocuShortsGenerator();
