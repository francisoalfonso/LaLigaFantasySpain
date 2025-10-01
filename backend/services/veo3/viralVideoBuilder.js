const logger = require('../../utils/logger');
const VEO3Client = require('./veo3Client');
const PromptBuilder = require('./promptBuilder');
const VideoConcatenator = require('./videoConcatenator');
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
        this.concatenator = new VideoConcatenator();

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
     * @param {object} playerData - Datos del jugador (chollo)
     * @param {object} options - Opciones de personalización
     * @returns {Promise<object>} - Video viral generado y metadatos
     */
    async generateViralVideo(playerData) {
        try {
            const { playerName, price, ratio, team, stats = {} } = playerData;

            logger.info(`[ViralVideoBuilder] Generando video viral para ${playerName}...`);

            // ====================================
            // SEGMENTO 1: HOOK (8s) - Susurro conspirativo
            // ====================================
            logger.info('[ViralVideoBuilder] Generando segmento 1: HOOK conspirativo...');
            const hookDialogue = `Pssst... Misters, venid que os cuento un secreto... He encontrado un ${stats.position || 'jugador'} del ${team} por €${price}M que está rindiendo como uno de €15M...`;

            const hookPrompt = this.promptBuilder.buildPrompt({
                dialogue: hookDialogue,
                enhanced: true,
                behavior: `She starts with conspiratorial whisper, leaning close to camera with finger to lips in shushing gesture, eyes sparkling with intrigue. Leans forward progressively, creating intimate connection. Background: modern sports studio with subtle La Liga branding.`,
                cinematography: `Camera: Starts at comfortable medium shot, slowly dollies in to intimate close-up as she leans forward. Lighting: warm and intimate, creating conspiratorial mood. Subtle depth of field for cinematic feel.`
            });

            const segment1Result = await this.veo3Client.generateVideo(hookPrompt, {
                duration: 8,
                aspect: '9:16'
            });

            // ====================================
            // SEGMENTO 2: DESARROLLO (8s) - Revelación + Datos
            // ====================================
            logger.info('[ViralVideoBuilder] Generando segmento 2: REVELACIÓN con datos...');
            const developmentDialogue = `${playerName}. Ratio valor ${ratio}x. ${stats.goals || 0} goles, ${stats.assists || 0} asistencias en ${stats.games || 0} partidos. Rating ${stats.rating || 0}. Y lo mejor... buen calendario próximos partidos.`;

            const developmentPrompt = this.promptBuilder.buildPrompt({
                dialogue: developmentDialogue,
                enhanced: true,
                behavior: `She reveals name with confident smile and authoritative body language. Uses natural hand gestures to emphasize key statistics, pointing at imaginary graphics. Professional broadcaster energy with growing enthusiasm.`,
                cinematography: `Camera: Steady medium shot, occasional subtle push-in on key stats. Lighting: brightens slightly from intimate to energetic broadcast lighting. Graphics overlay space on sides.`
            });

            const segment2Result = await this.veo3Client.generateVideo(developmentPrompt, {
                duration: 8,
                aspect: '9:16'
            });

            // ====================================
            // SEGMENTO 3: CALL-TO-ACTION (8s) - Urgencia
            // ====================================
            logger.info('[ViralVideoBuilder] Generando segmento 3: CALL-TO-ACTION urgente...');
            const ctaDialogue = `¿Fichamos o esperamos? Yo lo tengo claro, Misters. A este precio es IMPRESCINDIBLE para vuestra plantilla. ¿A qué esperáis? ¡Fichad ya!`;

            const ctaPrompt = this.promptBuilder.buildPrompt({
                dialogue: ctaDialogue,
                enhanced: true,
                behavior: `She asks question with raised eyebrow and slight head tilt, then builds to passionate conviction with decisive nod. Ends with direct camera address and confident smile, creating urgency and FOMO.`,
                cinematography: `Camera: Medium close-up, slight push-in on final call to action. Lighting: full broadcast lighting, vibrant and energetic. Eye contact maintained throughout for direct connection.`
            });

            const segment3Result = await this.veo3Client.generateVideo(ctaPrompt, {
                duration: 8,
                aspect: '9:16'
            });

            // Esperar a que los 3 videos se completen
            logger.info('[ViralVideoBuilder] Esperando a que se completen los 3 segmentos...');

            const segment1 = await this.veo3Client.waitForCompletion(segment1Result.taskId);
            const segment2 = await this.veo3Client.waitForCompletion(segment2Result.taskId);
            const segment3 = await this.veo3Client.waitForCompletion(segment3Result.taskId);

            // ====================================
            // CONCATENAR SEGMENTOS
            // ====================================
            logger.info('[ViralVideoBuilder] Concatenando 3 segmentos con transiciones suaves...');

            const videoURLs = [
                segment1.resultUrls[0],
                segment2.resultUrls[0],
                segment3.resultUrls[0]
            ];

            // Descargar videos a temp
            const tempPaths = await Promise.all(
                videoURLs.map((url, index) => this.downloadVideo(url, `segment-${index + 1}`))
            );

            // Concatenar con transiciones crossfade
            const finalVideoPath = await this.concatenator.concatenateVideos(tempPaths, {
                transition: {
                    type: 'crossfade',
                    duration: 0.5,
                    enabled: true
                },
                audio: {
                    normalize: true,
                    fadeInOut: true
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
                    segments: [
                        { type: 'hook', taskId: segment1.taskId, dialogue: hookDialogue },
                        {
                            type: 'development',
                            taskId: segment2.taskId,
                            dialogue: developmentDialogue
                        },
                        { type: 'cta', taskId: segment3.taskId, dialogue: ctaDialogue }
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
        const { playerName, price, ratio, team } = playerData;

        return `🔥 ¡CHOLLO DETECTADO, MISTERS! 🔥

${playerName} (${team})
💰 VM: €${price}M
📊 Ratio Valor: ${ratio}x
⚡ IMPRESCINDIBLE para tu plantilla

Un ${team} a este precio... ¿Fichamos ya? 👇

#FantasyLaLiga #Chollos #Misters #${team.replace(/\s+/g, '')} #${playerName.replace(/\s+/g, '')} #LaLiga #Fantasy #Fichajes`;
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
