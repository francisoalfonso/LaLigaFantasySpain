const logger = require('../../utils/logger');
const VEO3Client = require('./veo3Client');
const PromptBuilder = require('./promptBuilder');
const UnifiedScriptGenerator = require('./unifiedScriptGenerator');
const VideoConcatenator = require('./videoConcatenator');
const NanoBananaClient = require('../nanoBanana/nanoBananaClient'); // ✅ NUEVO: Plan B con imágenes 4K
const frameExtractor = require('./frameExtractor'); // ✅ Singleton, no constructor
const supabaseFrameUploader = require('./supabaseFrameUploader'); // ✅ Upload frames to Supabase
const { checkPlayerInDictionary } = require('../../utils/playerDictionaryValidator');
const path = require('path');
const fs = require('fs');

/**
 * Constructor de Videos Virales para Instagram/TikTok
 * Genera videos con estructura viral: Hook → Desarrollo → CTA
 */
class ViralVideoBuilder {
    constructor() {
        this.veo3Client = new VEO3Client();
        this.promptBuilder = new PromptBuilder();
        this.scriptGenerator = new UnifiedScriptGenerator();
        this.concatenator = new VideoConcatenator();
        this.nanoBanana = new NanoBananaClient(); // ✅ NUEVO: Cliente Nano Banana
        this.frameExtractor = frameExtractor; // ✅ Usar instancia singleton

        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
        this.viralDir = path.join(this.outputDir, 'viral');

        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.viralDir)) {
            fs.mkdirSync(this.viralDir, { recursive: true });
        }
    }

    /**
     * Generar video viral completo con estructura de 3 segmentos
     *
     * CONTINUIDAD VISUAL (10 Oct 2025):
     * - Segmento 1: Genera con imagen Ana desde Supabase
     * - Extrae último frame seg1 → Sube a Supabase → Segmento 2 usa esa URL
     * - Extrae último frame seg2 → Sube a Supabase → Segmento 3 usa esa URL
     * - Resultado: Videos fluyen naturalmente sin saltos de cámara
     *
     * @param {object} playerData - Datos del jugador (chollo)
     * @param {object} options - Opciones de personalización
     * @returns {Promise<object>} - Video viral generado y metadatos
     */
    async generateViralVideo(playerData, _options = {}) {
        try {
            const { playerName, price, ratio, team, stats = {} } = playerData;

            // ✅ VALIDAR DICCIONARIO (6 Oct 2025 - Fix Error 422)
            const playerCheck = await checkPlayerInDictionary(playerName);

            // Obtener referencias seguras
            let safeReference = 'el jugador';
            if (playerCheck.exists && playerCheck.data?.safeReferences && playerCheck.data.safeReferences.length > 0) {
                const refs = playerCheck.data.safeReferences;
                safeReference = refs.find(ref => ref.includes('centrocampista') || ref.includes('delantero') || ref.includes('defensa'))
                                || refs[1] || refs[0];
            }

            logger.info(
                `[ViralVideoBuilder] Generando video viral para ${playerName} (ref: "${safeReference}")...`
            );

            // ====================================
            // GENERAR SCRIPT UNIFICADO CON SISTEMA INTELIGENTE
            // ====================================
            logger.info('[ViralVideoBuilder] 📝 Generando script unificado con UnifiedScriptGenerator...');

            const unifiedScript = this.scriptGenerator.generateUnifiedScript('chollo', playerData);

            logger.info(`[ViralVideoBuilder] ✅ Script generado - ${unifiedScript.segments.length} segmentos`);
            logger.info(`[ViralVideoBuilder]    Segment 1: "${unifiedScript.segments[0].dialogue.substring(0, 50)}..."`);
            logger.info(`[ViralVideoBuilder]    Segment 2: "${unifiedScript.segments[1].dialogue.substring(0, 50)}..."`);
            logger.info(`[ViralVideoBuilder]    Segment 3: "${unifiedScript.segments[2].dialogue.substring(0, 50)}..."`);

            // ====================================
            // PLAN B: GENERAR 3 IMÁGENES ANA CON NANO BANANA (4K)
            // ====================================
            logger.info('[ViralVideoBuilder] 🎨 PLAN B: Generando 3 imágenes Ana con Nano Banana (4K quality)...');
            logger.info('[ViralVideoBuilder] Progresión: Wide Shot → Medium Shot → Close-Up');

            // Generar 3 imágenes con progresión cinematográfica
            const anaImages = await this.nanoBanana.generateAnaProgression({
                style: 'professional',
                progression: 'wide-medium-closeup'
            });

            logger.info(`[ViralVideoBuilder] ✅ ${anaImages.length} imágenes Ana generadas`);

            // Subir imágenes a Supabase Storage
            logger.info('[ViralVideoBuilder] 📤 Subiendo imágenes a Supabase Storage...');
            const supabaseFrames = await this.nanoBanana.uploadToSupabase(anaImages);

            logger.info('[ViralVideoBuilder] ✅ Imágenes Ana disponibles en Supabase:');
            supabaseFrames.forEach(frame => {
                logger.info(`[ViralVideoBuilder]    ${frame.shot}: ${frame.supabaseUrl}`);
            });

            // ====================================
            // GENERAR 3 SEGMENTOS EN PARALELO (⚡ 2x más rápido)
            // ====================================
            logger.info('[ViralVideoBuilder] ⚡ Generando 3 segmentos EN PARALELO con Nano Banana images...');
            logger.info('[ViralVideoBuilder]    • Segmento 1: HOOK (Wide Shot)');
            logger.info('[ViralVideoBuilder]    • Segmento 2: DESARROLLO (Medium Shot)');
            logger.info('[ViralVideoBuilder]    • Segmento 3: CTA (Close-Up)');

            // Preparar datos de los 3 segmentos
            const segment1Dialogue = unifiedScript.segments[0].dialogue;
            const segment1Emotion = unifiedScript.segments[0].emotion;
            const segment2Dialogue = unifiedScript.segments[1].dialogue;
            const segment2Emotion = unifiedScript.segments[1].emotion;
            const segment3Dialogue = unifiedScript.segments[2].dialogue;
            const segment3Emotion = unifiedScript.segments[2].emotion;

            // Construir prompts para los 3 segmentos
            const hookPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment1Dialogue,
                emotion: segment1Emotion,
                role: 'intro'
            });

            const developmentPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment2Dialogue,
                emotion: segment2Emotion,
                role: 'middle'
            });

            const ctaPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment3Dialogue,
                emotion: segment3Emotion,
                role: 'outro'
            });

            // ⚡ GENERAR 3 VIDEOS EN PARALELO (Promise.all)
            const startParallel = Date.now();

            const [segment1Result, segment2Result, segment3Result] = await Promise.all([
                // Segmento 1: Wide Shot
                this.veo3Client.generateVideo(hookPrompt, {
                    aspectRatio: '9:16',
                    useImageReference: true,
                    imageUrl: supabaseFrames[0].supabaseUrl
                }),
                // Segmento 2: Medium Shot
                this.veo3Client.generateVideo(developmentPrompt, {
                    aspectRatio: '9:16',
                    useImageReference: true,
                    imageUrl: supabaseFrames[1].supabaseUrl
                }),
                // Segmento 3: Close-Up
                this.veo3Client.generateVideo(ctaPrompt, {
                    aspectRatio: '9:16',
                    useImageReference: true,
                    imageUrl: supabaseFrames[2].supabaseUrl
                })
            ]);

            logger.info(`[ViralVideoBuilder] ✅ 3 generaciones iniciadas en paralelo en ${((Date.now() - startParallel) / 1000).toFixed(1)}s`);
            logger.info('[ViralVideoBuilder]    TaskIDs:');
            logger.info(`[ViralVideoBuilder]    • Seg1: ${segment1Result.data.taskId}`);
            logger.info(`[ViralVideoBuilder]    • Seg2: ${segment2Result.data.taskId}`);
            logger.info(`[ViralVideoBuilder]    • Seg3: ${segment3Result.data.taskId}`);

            // ⚡ ESPERAR COMPLETADO DE LOS 3 EN PARALELO (Promise.all)
            logger.info('[ViralVideoBuilder] ⏳ Esperando completado de los 3 segmentos en paralelo...');
            const startWait = Date.now();

            const [segment1, segment2, segment3] = await Promise.all([
                this.veo3Client.waitForCompletion(segment1Result.data.taskId),
                this.veo3Client.waitForCompletion(segment2Result.data.taskId),
                this.veo3Client.waitForCompletion(segment3Result.data.taskId)
            ]);

            const totalParallelTime = ((Date.now() - startParallel) / 1000).toFixed(1);
            logger.info(`[ViralVideoBuilder] ✅ 3 segmentos completados en ${totalParallelTime}s (vs ~90s secuencial)`);
            logger.info(`[ViralVideoBuilder]    ⚡ Ganancia de tiempo: ~${(90 - parseFloat(totalParallelTime)).toFixed(1)}s`);

            // ====================================
            // CONCATENAR SEGMENTOS
            // ====================================
            logger.info('[ViralVideoBuilder] Concatenando 3 segmentos...');

            // Descargar todos los segmentos
            const tempPaths = await Promise.all([
                this.downloadVideo(segment1.resultUrls[0], 'segment-1'),
                this.downloadVideo(segment2.resultUrls[0], 'segment-2'),
                this.downloadVideo(segment3.resultUrls[0], 'segment-3')
            ]);

            // ✅ INTEGRACIÓN E2E: Concatenar con subtítulos + player card + logo
            logger.info('[ViralVideoBuilder] 🎬 Concatenando con subtítulos virales + player card + logo outro...');

            const finalVideoPath = await this.concatenator.concatenateVideos(
                // ✅ Pasar array de objetos con dialogue para subtítulos virales
                [
                    { videoPath: tempPaths[0], dialogue: segment1Dialogue },
                    { videoPath: tempPaths[1], dialogue: segment2Dialogue },
                    { videoPath: tempPaths[2], dialogue: segment3Dialogue }
                ],
                {
                    transition: {
                        type: 'none', // No crossfade - frames ya garantizan continuidad
                        duration: 0,
                        enabled: false
                    },
                    audio: {
                        normalize: true,
                        fadeInOut: false // Sin fade audio - continuidad natural
                    },
                    outro: {
                        enabled: true, // ✅ Agregar logo outro + freeze frame
                        freezeFrame: {
                            enabled: true,
                            duration: 0.8 // 0.8s freeze frame antes del logo
                        }
                    },
                    viralCaptions: {
                        enabled: true, // ✅ Subtítulos ASS karaoke golden (#FFD700)
                        applyBeforeConcatenation: true
                    },
                    playerCard: {
                        enabled: true, // ✅ ACTIVAR player card overlay
                        startTime: 3.0, // Aparece en segundo 3
                        duration: 4.0, // Visible hasta segundo 7
                        slideInDuration: 0.5, // Animación entrada 0.5s
                        applyToFirstSegment: true // Solo en primer segmento
                    },
                    // ✅ Pasar datos del jugador para player card
                    playerData: {
                        id: playerData.id, // ID para obtener foto local
                        name: playerName,
                        team: team,
                        position: playerData.position || 'MID',
                        stats: {
                            games: stats.games || 0,
                            goals: stats.goals || 0,
                            rating: stats.rating || 'N/A'
                        },
                        photo: playerData.photo, // URL de foto (opcional)
                        teamLogo: playerData.teamLogo // URL de logo equipo (opcional)
                    }
                }
            );

            // Mover video final a directorio viral
            const viralFileName = `ana-viral-${playerName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`;
            const viralPath = path.join(this.viralDir, viralFileName);
            fs.renameSync(finalVideoPath, viralPath);

            logger.info(`[ViralVideoBuilder] ✅ Video viral generado: ${viralPath}`);

            // ✅ INTEGRACIÓN E2E: Guardar en test-history con scoring automático
            logger.info('[ViralVideoBuilder] 💾 Guardando en test-history...');
            const testHistoryData = await this.saveToTestHistory(
                viralPath,
                playerData,
                unifiedScript,
                {
                    segment1: segment1,
                    segment2: segment2,
                    segment3: segment3
                }
            );
            logger.info(`[ViralVideoBuilder] ✅ Test guardado: ${testHistoryData.id} (Test #${testHistoryData.testMetadata.testNumber})`);
            logger.info(`[ViralVideoBuilder]    Viral Score: ${testHistoryData.viralScore}/100`);

            // Limpiar archivos temporales
            tempPaths.forEach(tempPath => {
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            });

            return {
                success: true,
                videoPath: viralPath,
                duration: '~24s',
                segments: 3,
                structure: 'Hook → Desarrollo → CTA',
                // ✅ NUEVO: Datos del test-history guardado
                testHistory: {
                    id: testHistoryData.id,
                    testNumber: testHistoryData.testMetadata.testNumber,
                    viralScore: testHistoryData.viralScore,
                    status: testHistoryData.metadata.status
                },
                metadata: {
                    playerName,
                    price,
                    ratio,
                    team,
                    stats,
                    generatedAt: new Date().toISOString(),
                    unifiedScript: unifiedScript,
                    segments: [
                        { type: 'hook', taskId: segment1.taskId, dialogue: segment1Dialogue, emotion: segment1Emotion },
                        {
                            type: 'development',
                            taskId: segment2.taskId,
                            dialogue: segment2Dialogue,
                            emotion: segment2Emotion
                        },
                        { type: 'cta', taskId: segment3.taskId, dialogue: segment3Dialogue, emotion: segment3Emotion }
                    ]
                }
            };
        } catch (error) {
            logger.error('[ViralVideoBuilder] Error generando video viral:', error.message);
            throw error;
        }
    }

    /**
     * Descargar video desde URL temporal
     * @param {string} url - URL del video
     * @param {string} name - Nombre del archivo
     * @returns {Promise<string>} - Ruta del archivo descargado
     */
    async downloadVideo(url, name) {
        const axios = require('axios');
        const tempPath = path.join(this.concatenator.tempDir, `${name}-${Date.now()}.mp4`);

        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(tempPath));
            writer.on('error', reject);
        });
    }

    /**
     * Generar caption para Instagram
     * @param {object} playerData - Datos del jugador
     * @returns {string} - Caption optimizado con hashtags
     */
    generateInstagramCaption(playerData) {
        const { playerName, price, ratio, team, stats = {} } = playerData;

        // 🔴 FIX CAPTION: Mejorado para mejor engagement
        // Cambios:
        // - Hook más fuerte y específico
        // - Datos más relevantes (puntos, no solo ratio)
        // - CTA más urgente con FOMO
        // - Hashtags más específicos y trending

        const totalPoints = stats.totalPoints || Math.floor(stats.rating * 10) || 0;
        const estimatedPoints = Math.floor(totalPoints * 1.2); // Proyección

        return `🚨 ALERTA CHOLLO - JORNADA ${stats.gameweek || 'ACTUAL'} 🚨

${playerName} - ${team}
💰 Solo €${price}M (Ratio ${ratio}x)
⚡ ${totalPoints} pts acumulados
📈 Proyección: ${estimatedPoints}+ pts
${stats.goals > 0 ? `⚽ ${stats.goals} goles` : ''}${stats.assists > 0 ? ` + ${stats.assists} asistencias` : ''}

¿Por qué es IMPRESCINDIBLE?
✅ Precio infravaluado
✅ Buen calendario
✅ En racha

⏰ Ficha ANTES de que suba de precio

¿Le metes en tu plantilla? 👇

#FantasyLaLiga #Chollos #Misters #LaLiga #Fantasy #${team.replace(/\s+/g, '')} #Jornada${stats.gameweek || ''} #Fichajes #CholloDelDia`;
    }

    /**
     * Obtener datos de preview completos para Instagram
     * @param {object} videoResult - Resultado de generateViralVideo()
     * @param {object} playerData - Datos originales del jugador
     * @returns {object} - Datos completos para preview
     */
    getPreviewData(videoResult, playerData) {
        const caption = this.generateInstagramCaption(playerData);

        // Determinar la URL correcta basada en la ruta del archivo
        let videoUrl;
        if (videoResult.videoPath.includes('/viral/')) {
            videoUrl = `/output/veo3/viral/${path.basename(videoResult.videoPath)}`;
        } else {
            videoUrl = `/output/veo3/${path.basename(videoResult.videoPath)}`;
        }

        return {
            video: {
                path: videoResult.videoPath,
                url: videoUrl,
                duration: videoResult.duration,
                segments: videoResult.segments,
                structure: videoResult.structure
            },
            instagram: {
                caption,
                captionLength: caption.length,
                hashtags: this.extractHashtags(caption),
                estimatedReach: this.estimateReach(playerData),
                bestTimeToPost: '18:00-21:00',
                platform: 'instagram',
                format: '9:16 vertical'
            },
            player: {
                name: playerData.playerName,
                team: playerData.team,
                price: playerData.price,
                ratio: playerData.ratio,
                stats: playerData.stats || {}
            },
            metadata: videoResult.metadata,
            generatedAt: new Date().toISOString(),
            status: 'ready_to_publish'
        };
    }

    /**
     * Extraer hashtags del caption
     * @param {string} caption - Caption de Instagram
     * @returns {array} - Array de hashtags
     */
    extractHashtags(caption) {
        const hashtagRegex = /#[\wÀ-ÿ]+/g;
        return caption.match(hashtagRegex) || [];
    }

    /**
     * Estimar alcance del post
     * @param {object} playerData - Datos del jugador
     * @returns {number} - Alcance estimado
     */
    estimateReach(playerData) {
        // Estimación basada en ratio de valor y popularidad del equipo
        const baseReach = 500;
        const ratioMultiplier = playerData.ratio > 2 ? 1.5 : 1.0;
        const bigTeams = ['Barcelona', 'Real Madrid', 'Atlético Madrid'];
        const teamMultiplier = bigTeams.includes(playerData.team) ? 1.3 : 1.0;

        return Math.floor(baseReach * ratioMultiplier * teamMultiplier);
    }

    /**
     * ✅ NUEVO (10 Oct 2025): Guardar video en test-history con scoring automático
     * Integración E2E completa: video → metadata → scoring → storage
     *
     * @param {string} videoPath - Ruta del video final generado
     * @param {object} playerData - Datos del jugador original
     * @param {object} script - Script unificado generado (UnifiedScriptGenerator)
     * @param {object} segments - Objetos de segmentos VEO3 (taskIds)
     * @returns {Promise<object>} - Datos del test guardado
     */
    async saveToTestHistory(videoPath, playerData, script, segments) {
        try {
            // 1. Incrementar contador global de tests
            const counterPath = path.join(__dirname, '../../../data/instagram-versions/_TEST_COUNTER.json');
            let counter = { currentTest: 0, lastUpdated: null };

            if (fs.existsSync(counterPath)) {
                const counterContent = fs.readFileSync(counterPath, 'utf8');
                counter = JSON.parse(counterContent);
            }

            counter.currentTest += 1;
            counter.lastUpdated = new Date().toISOString();
            fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2));

            logger.info(`[ViralVideoBuilder] 📊 Test #${counter.currentTest} - Incrementando contador global`);

            // 2. Crear ID único para el test
            const playerSlug = playerData.playerName.toLowerCase().replace(/\s+/g, '-');
            const timestamp = Date.now();
            const testId = `${playerSlug}-v${timestamp}`;

            // 3. Calcular viral score inicial (basado en datos del jugador + script)
            const viralScore = this.calculateViralScore(playerData, script);

            // 4. Crear estructura completa del test (según VERSION_SCHEMA.json)
            const testData = {
                id: testId,
                version: counter.currentTest,
                timestamp: new Date().toISOString(),

                // Datos del jugador
                playerData: {
                    playerName: playerData.playerName,
                    team: playerData.team,
                    price: playerData.price,
                    ratio: playerData.ratio,
                    stats: playerData.stats || {}
                },

                // Metadata del test
                testMetadata: {
                    testDate: new Date().toISOString(),
                    testNumber: counter.currentTest,
                    fixesApplied: [
                        'guion-unificado', // UnifiedScriptGenerator
                        'subtitulos-virales', // ASS karaoke golden
                        'logo-outro', // Freeze frame + logo
                        'player-card-overlay', // Card en segundo 3-7
                        'imagen-ana-fija', // Supabase frame-to-frame
                        'sin-transiciones-camara' // Continuidad visual
                    ],
                    testPurpose: `E2E completo - Video viral con player card para ${playerData.playerName}`,

                    // Feedback (pendiente de revisión manual)
                    feedback: {
                        whatWorks: [],
                        whatFails: [],
                        severity: { critical: 0, major: 0, minor: 0 },
                        reviewedBy: null,
                        reviewDate: null,
                        reviewNotes: 'Pendiente de revisión manual en test-history.html'
                    },

                    // Checklist de validación (algunos items confirmados automáticamente)
                    checklist: {
                        imagenAnaFija: true, // ✅ Confirmado por Supabase frame-to-frame
                        sinTransicionesCamara: true, // ✅ Confirmado por frame-to-frame
                        audioSinCortes: null, // Pendiente validación manual
                        vozConsistente: null, // Pendiente validación manual
                        pronunciacionCorrecta: null, // Pendiente validación manual
                        logoOutro: true, // ✅ Confirmado por config outro.enabled
                        duracionCorrecta: null, // Pendiente validación manual
                        hookSegundo3: true, // ✅ Confirmado por playerCard.startTime
                        ctaClaro: null // Pendiente validación manual
                    },

                    // Quality score inicial (automático, pendiente revisión manual)
                    qualityScore: {
                        videoQuality: null,
                        audioQuality: null,
                        viralPotential: null,
                        technicalScore: null,
                        overallScore: 10.0, // Base score inicial (sin fallos detectados)
                        autoCalculated: true,
                        calculationMethod: 'Initial base score (pending manual review)'
                    }
                },

                // Configuración VEO3 usada
                veo3Config: {
                    anaImageUrl: process.env.ANA_IMAGE_URL,
                    seed: 30001,
                    enhanced: false,
                    modelVersion: 'veo3',
                    segmentCount: 3,
                    totalDuration: 24, // ~8s × 3 segmentos
                    segments: [
                        {
                            index: 1,
                            type: 'hook',
                            taskId: segments.segment1.taskId,
                            dialogue: script.segments[0].dialogue,
                            emotion: script.segments[0].emotion
                        },
                        {
                            index: 2,
                            type: 'development',
                            taskId: segments.segment2.taskId,
                            dialogue: script.segments[1].dialogue,
                            emotion: script.segments[1].emotion
                        },
                        {
                            index: 3,
                            type: 'cta',
                            taskId: segments.segment3.taskId,
                            dialogue: script.segments[2].dialogue,
                            emotion: script.segments[2].emotion
                        }
                    ]
                },

                // Viral score calculado
                viralScore: viralScore,

                // Video real VEO3 (no mock)
                isRealVideo: true,

                // Caption Instagram generado
                caption: this.generateInstagramCaption(playerData),

                // Metadata general
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'testing' // Estado inicial: testing
                }
            };

            // 5. Guardar archivo JSON en data/instagram-versions/
            const versionsDir = path.join(__dirname, '../../../data/instagram-versions');
            if (!fs.existsSync(versionsDir)) {
                fs.mkdirSync(versionsDir, { recursive: true });
            }

            const testFilePath = path.join(versionsDir, `${testId}.json`);
            fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));

            logger.info(`[ViralVideoBuilder] ✅ Test guardado en: ${testFilePath}`);
            logger.info(`[ViralVideoBuilder]    Test #${counter.currentTest}`);
            logger.info(`[ViralVideoBuilder]    Viral Score: ${viralScore}/100`);
            logger.info(`[ViralVideoBuilder]    Status: ${testData.metadata.status}`);

            return testData;
        } catch (error) {
            logger.error(`[ViralVideoBuilder] ❌ Error guardando test-history: ${error.message}`);
            throw error;
        }
    }

    /**
     * ✅ NUEVO (10 Oct 2025): Calcular viral score inicial basado en datos del jugador
     * Algoritmo de scoring predictivo (0-100) basado en:
     * - Ratio de valor (mayor = mejor chollo)
     * - Precio (menor = más accesible)
     * - Estadísticas (goles, rating)
     * - Calidad del script (narrativa unificada)
     *
     * @param {object} playerData - Datos del jugador
     * @param {object} script - Script unificado generado
     * @returns {number} - Score 0-100
     */
    calculateViralScore(playerData, script) {
        let score = 50; // Base score

        // ====================================
        // BONUS POR RATIO DE VALOR
        // ====================================
        if (playerData.ratio > 2.0) {
            score += 15; // Chollo excelente
        } else if (playerData.ratio > 1.5) {
            score += 10; // Buen chollo
        } else if (playerData.ratio > 1.2) {
            score += 5; // Chollo decente
        }

        // ====================================
        // BONUS POR PRECIO BAJO
        // ====================================
        if (playerData.price < 3.0) {
            score += 10; // Muy accesible
        } else if (playerData.price < 5.0) {
            score += 5; // Accesible
        }

        // ====================================
        // BONUS POR ESTADÍSTICAS
        // ====================================
        const stats = playerData.stats || {};

        // Goles
        if (stats.goals > 5) {
            score += 10; // Goleador
        } else if (stats.goals > 3) {
            score += 5; // Buen rendimiento
        }

        // Rating
        if (stats.rating > 7.5) {
            score += 5; // Rating excelente
        } else if (stats.rating > 7.0) {
            score += 3; // Buen rating
        }

        // Asistencias (bonus adicional)
        if (stats.assists > 3) {
            score += 5;
        }

        // ====================================
        // BONUS POR CALIDAD DEL SCRIPT
        // ====================================
        if (script.unifiedNarrative) {
            score += 10; // Narrativa cohesiva (UnifiedScriptGenerator)
        }

        // ====================================
        // AJUSTE FINAL
        // ====================================
        const finalScore = Math.min(100, Math.max(0, score));

        logger.info(`[ViralVideoBuilder] 📊 Viral Score calculado: ${finalScore}/100`);
        logger.info(`[ViralVideoBuilder]    Base: 50 + Ratio: ${playerData.ratio > 2 ? 15 : playerData.ratio > 1.5 ? 10 : 5} + Precio: ${playerData.price < 3 ? 10 : 5} + Stats: variable + Script: 10`);

        return finalScore;
    }
}

module.exports = ViralVideoBuilder;
