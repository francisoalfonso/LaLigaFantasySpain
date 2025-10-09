const logger = require('../../utils/logger');
const VEO3Client = require('./veo3Client');
const PromptBuilder = require('./promptBuilder');
const UnifiedScriptGenerator = require('./unifiedScriptGenerator');
const VideoConcatenator = require('./videoConcatenator');
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
            // SEGMENTO 1: HOOK (8s) - Susurro conspirativo
            // ====================================
            logger.info('[ViralVideoBuilder] Generando segmento 1: HOOK conspirativo (FRAME-TO-FRAME)...');

            const segment1Dialogue = unifiedScript.segments[0].dialogue;
            const segment1Emotion = unifiedScript.segments[0].emotion;

            // ✅ FIX (9 Oct 2025): Usar prompts simples + Image-to-Video para continuidad REAL
            // NO usar descripciones textuales (artificia), sino extraer frame real del video anterior
            const hookPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment1Dialogue,
                emotion: segment1Emotion,
                role: 'intro'
            });

            // ✅ FIX (6 Oct 2025): SÍ pasar imagen Ana (necesaria para que aparezca en video)
            const segment1Result = await this.veo3Client.generateVideo(hookPrompt, {
                aspectRatio: '9:16',
                useImageReference: true // ✅ Usar imagen Ana para que aparezca en el video
            });

            // ✅ ESPERAR segmento 1 ANTES de generar segmento 2 (secuencial)
            logger.info('[ViralVideoBuilder] Esperando segmento 1...');
            const segment1 = await this.veo3Client.waitForCompletion(segment1Result.data.taskId);

            // 🎬 Extraer último frame del segmento 1 y subir a Supabase para continuidad
            logger.info('[ViralVideoBuilder] Extrayendo último frame del segmento 1...');
            const segment1VideoPath = await this.downloadVideo(segment1.resultUrls[0], 'seg1-for-frame');
            const segment1LastFrameLocal = await this.frameExtractor.extractLastFrame(segment1VideoPath);
            logger.info(`[ViralVideoBuilder] ✅ Frame local extraído: ${segment1LastFrameLocal}`);

            // ✅ Subir frame a Supabase Storage y obtener URL pública
            const segment1LastFrame = await supabaseFrameUploader.uploadFrame(segment1LastFrameLocal, 'seg1-end');
            logger.info(`[ViralVideoBuilder] ✅ Frame en Supabase: ${segment1LastFrame}`);

            // ====================================
            // SEGMENTO 2: DESARROLLO (8s) - Revelación + Datos
            // ====================================
            logger.info(
                `[ViralVideoBuilder] Generando segmento 2: REVELACIÓN (Image-to-Video desde Supabase)...`
            );

            const segment2Dialogue = unifiedScript.segments[1].dialogue;
            const segment2Emotion = unifiedScript.segments[1].emotion;

            // ✅ Prompt simple para continuidad natural
            const developmentPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment2Dialogue,
                emotion: segment2Emotion,
                role: 'middle'
            });

            // ✅ Generar segmento 2 con URL pública de Supabase (Image-to-Video)
            const segment2Result = await this.veo3Client.generateVideo(developmentPrompt, {
                aspectRatio: '9:16',
                useImageReference: true,
                imageUrl: segment1LastFrame // ✅ URL pública de Supabase Storage
            });

            // ✅ ESPERAR segmento 2 ANTES de generar segmento 3 (secuencial)
            logger.info('[ViralVideoBuilder] Esperando segmento 2...');
            const segment2 = await this.veo3Client.waitForCompletion(segment2Result.data.taskId);

            // 🎬 Extraer último frame del segmento 2 y subir a Supabase para continuidad
            logger.info('[ViralVideoBuilder] Extrayendo último frame del segmento 2...');
            const segment2VideoPath = await this.downloadVideo(segment2.resultUrls[0], 'seg2-for-frame');
            const segment2LastFrameLocal = await this.frameExtractor.extractLastFrame(segment2VideoPath);
            logger.info(`[ViralVideoBuilder] ✅ Frame local extraído: ${segment2LastFrameLocal}`);

            // ✅ Subir frame a Supabase Storage y obtener URL pública
            const segment2LastFrame = await supabaseFrameUploader.uploadFrame(segment2LastFrameLocal, 'seg2-end');
            logger.info(`[ViralVideoBuilder] ✅ Frame en Supabase: ${segment2LastFrame}`);

            // ====================================
            // SEGMENTO 3: CALL-TO-ACTION (8s) - Urgencia
            // ====================================
            logger.info(
                `[ViralVideoBuilder] Generando segmento 3: CALL-TO-ACTION (Image-to-Video desde Supabase)...`
            );

            const segment3Dialogue = unifiedScript.segments[2].dialogue;
            const segment3Emotion = unifiedScript.segments[2].emotion;

            // ✅ Prompt simple para continuidad natural
            const ctaPrompt = this.promptBuilder.buildPrompt({
                dialogue: segment3Dialogue,
                emotion: segment3Emotion,
                role: 'outro'
            });

            // ✅ Generar segmento 3 con URL pública de Supabase (Image-to-Video)
            const segment3Result = await this.veo3Client.generateVideo(ctaPrompt, {
                aspectRatio: '9:16',
                useImageReference: true,
                imageUrl: segment2LastFrame // ✅ URL pública de Supabase Storage
            });

            // ✅ ESPERAR segmento 3
            logger.info('[ViralVideoBuilder] Esperando segmento 3...');
            const segment3 = await this.veo3Client.waitForCompletion(segment3Result.data.taskId);

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

            // ✅ Concatenar SIN transiciones (continuidad visual ya garantizada por Supabase frames)
            const finalVideoPath = await this.concatenator.concatenateVideos(tempPaths, {
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
                }
            });

            // Mover video final a directorio viral
            const viralFileName = `ana-viral-${playerName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`;
            const viralPath = path.join(this.viralDir, viralFileName);
            fs.renameSync(finalVideoPath, viralPath);

            logger.info(`[ViralVideoBuilder] ✅ Video viral generado: ${viralPath}`);

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
}

module.exports = ViralVideoBuilder;
