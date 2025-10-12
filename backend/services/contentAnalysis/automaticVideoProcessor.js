/**
 * Automatic Video Processor
 *
 * Procesa videos de competidores automáticamente de forma secuencial:
 * 1. Obtiene el video más antiguo no procesado
 * 2. Transcribe audio (Whisper AI)
 * 3. Analiza contenido (GPT)
 * 4. Extrae insights y viral patterns
 * 5. Guarda en BD
 * 6. Repite con el siguiente
 */

const youtubeMonitor = require('./youtubeMonitor');
const transcriptionService = require('./transcriptionService');
const contentAnalyzer = require('./contentAnalyzer');
const playerNameNormalizer = require('./playerNameNormalizer');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class AutomaticVideoProcessor {
    constructor() {
        this.isProcessing = false;
        this.currentVideo = null;
        this.stats = {
            totalProcessed: 0,
            totalFailed: 0,
            totalCost: 0,
            startedAt: null,
            lastProcessedAt: null
        };
    }

    /**
     * Iniciar procesamiento automático
     * Procesa videos secuencialmente hasta que no queden más
     */
    async startAutoProcessing() {
        if (this.isProcessing) {
            logger.warn('[AutoProcessor] ⚠️ Procesamiento ya en curso');
            return {
                success: false,
                message: 'Procesamiento ya en curso'
            };
        }

        this.isProcessing = true;
        this.stats.startedAt = new Date().toISOString();

        logger.info('[AutoProcessor] 🚀 Iniciando procesamiento automático');

        try {
            while (this.isProcessing) {
                // Obtener siguiente video a procesar (más antiguo primero)
                const video = await this._getNextVideo();

                if (!video) {
                    logger.info('[AutoProcessor] ✅ No hay más videos por procesar');
                    this.isProcessing = false;
                    break;
                }

                this.currentVideo = video;

                logger.info('[AutoProcessor] 📹 Procesando video', {
                    videoId: video.video_id,
                    title: video.title,
                    channel: video.channel_name
                });

                // Procesar video completo
                await this._processVideo(video);

                this.stats.totalProcessed++;
                this.stats.lastProcessedAt = new Date().toISOString();

                // Pequeña pausa entre videos para no saturar
                await this._sleep(2000);
            }

            return {
                success: true,
                message: 'Procesamiento automático completado',
                stats: this.stats
            };
        } catch (error) {
            logger.error('[AutoProcessor] ❌ Error en procesamiento automático', {
                error: error.message
            });

            this.isProcessing = false;
            this.currentVideo = null;

            throw error;
        }
    }

    /**
     * Detener procesamiento automático
     */
    async stopAutoProcessing() {
        logger.info('[AutoProcessor] 🛑 Deteniendo procesamiento automático');
        this.isProcessing = false;
        this.currentVideo = null;

        return {
            success: true,
            message: 'Procesamiento detenido',
            stats: this.stats
        };
    }

    /**
     * Obtener estado actual del procesamiento
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            currentVideo: this.currentVideo
                ? {
                      videoId: this.currentVideo.video_id,
                      title: this.currentVideo.title,
                      channel: this.currentVideo.channel_name
                  }
                : null,
            stats: this.stats
        };
    }

    /**
     * Obtener siguiente video a procesar (más antiguo primero)
     */
    async _getNextVideo() {
        try {
            const { data, error } = await supabase
                .from('competitive_videos')
                .select(
                    `
                    *,
                    competitive_channels (
                        channel_name,
                        priority
                    )
                `
                )
                .eq('processing_status', 'onboarding_analyzed')
                .order('published_at', { ascending: true }) // Más antiguo primero
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    return null;
                }
                throw error;
            }

            return {
                ...data,
                channel_name: data.competitive_channels?.channel_name
            };
        } catch (error) {
            logger.error('[AutoProcessor] Error obteniendo siguiente video', {
                error: error.message
            });
            return null;
        }
    }

    /**
     * Procesar un video completo
     */
    async _processVideo(video) {
        const result = {
            videoId: video.video_id,
            steps: [],
            insights: null,
            cost: 0,
            errors: []
        };

        try {
            // PASO 1: Marcar como en proceso
            await supabase
                .from('competitive_videos')
                .update({
                    processing_status: 'analyzing'
                })
                .eq('id', video.id);

            result.steps.push({ step: 'mark_processing', status: 'completed' });

            // PASO 2: Descargar video
            logger.info('[AutoProcessor] ⬇️ Descargando video', { videoId: video.video_id });

            const tempDir = path.join(__dirname, '../../../temp/auto-processor');
            await fs.mkdir(tempDir, { recursive: true });

            const videoPath = path.join(tempDir, `${video.video_id}.mp4`);
            const audioPath = path.join(tempDir, `${video.video_id}.mp3`);

            try {
                await youtubeMonitor.downloadVideo(video.video_url, videoPath);
                result.steps.push({ step: 'download_video', status: 'completed' });
            } catch (downloadError) {
                logger.error('[AutoProcessor] Error descargando video', {
                    error: downloadError.message
                });
                result.errors.push(`Download failed: ${downloadError.message}`);
                await this._markVideoAsFailed(video.id, 'download_failed');
                return;
            }

            // PASO 3: Extraer audio
            logger.info('[AutoProcessor] 🎵 Extrayendo audio', { videoId: video.video_id });

            try {
                await youtubeMonitor.extractAudio(videoPath, audioPath);
                result.steps.push({ step: 'extract_audio', status: 'completed' });
            } catch (audioError) {
                logger.error('[AutoProcessor] Error extrayendo audio', {
                    error: audioError.message
                });
                result.errors.push(`Audio extraction failed: ${audioError.message}`);
                await this._markVideoAsFailed(video.id, 'audio_extraction_failed');
                await this._cleanup([videoPath]);
                return;
            }

            // PASO 4: Transcribir (Whisper AI - $0.006/min)
            logger.info('[AutoProcessor] 📝 Transcribiendo audio', { videoId: video.video_id });

            let transcription = null;
            try {
                transcription = await transcriptionService.transcribe(audioPath);
                result.steps.push({
                    step: 'transcribe',
                    status: 'completed',
                    duration: transcription.duration
                });

                // Calcular costo
                const minutes = transcription.duration / 60;
                const cost = minutes * 0.006;
                result.cost += cost;
                this.stats.totalCost += cost;

                logger.info('[AutoProcessor] ✅ Transcripción completada', {
                    duration: transcription.duration,
                    cost: cost.toFixed(4)
                });
            } catch (transcribeError) {
                logger.error('[AutoProcessor] Error transcribiendo', {
                    error: transcribeError.message
                });
                result.errors.push(`Transcription failed: ${transcribeError.message}`);
                await this._markVideoAsFailed(video.id, 'transcription_failed');
                await this._cleanup([videoPath, audioPath]);
                return;
            }

            // PASO 5: Analizar contenido (GPT)
            logger.info('[AutoProcessor] 🧠 Analizando contenido', { videoId: video.video_id });

            let analysis = null;
            try {
                analysis = await contentAnalyzer.analyze(transcription.text, {
                    title: video.title
                });

                // Filtrar branding del competidor
                const cleanedAnalysis = this._removeBranding(analysis, video.channel_name);

                result.steps.push({ step: 'analyze_content', status: 'completed' });
                result.insights = cleanedAnalysis;

                logger.info('[AutoProcessor] ✅ Análisis completado', {
                    players: cleanedAnalysis.players?.length || 0,
                    claims: cleanedAnalysis.claims?.length || 0
                });
            } catch (analyzeError) {
                logger.error('[AutoProcessor] Error analizando contenido', {
                    error: analyzeError.message
                });
                result.errors.push(`Content analysis failed: ${analyzeError.message}`);
                // Continuar sin análisis
            }

            // PASO 5.5: Normalizar nombres de jugadores
            if (result.insights && result.insights.players && result.insights.players.length > 0) {
                logger.info('[AutoProcessor] 🔍 Normalizando nombres de jugadores', {
                    videoId: video.video_id,
                    count: result.insights.players.length
                });

                try {
                    const normalizedPlayers = await playerNameNormalizer.normalizePlayers(
                        result.insights.players
                    );

                    result.insights.players = normalizedPlayers;
                    result.steps.push({ step: 'normalize_players', status: 'completed' });

                    const corrected = normalizedPlayers.filter(p => p.playerId !== null).length;
                    logger.info('[AutoProcessor] ✅ Jugadores normalizados', {
                        total: normalizedPlayers.length,
                        corrected,
                        failed: normalizedPlayers.length - corrected
                    });
                } catch (normalizeError) {
                    logger.error('[AutoProcessor] Error normalizando jugadores', {
                        error: normalizeError.message
                    });
                    result.errors.push(`Player normalization failed: ${normalizeError.message}`);
                    // Continuar con nombres sin normalizar
                }
            }

            // PASO 6: Guardar en BD
            logger.info('[AutoProcessor] 💾 Guardando resultados', { videoId: video.video_id });

            try {
                await supabase
                    .from('competitive_videos')
                    .update({
                        transcription: {
                            text: transcription.text,
                            duration: transcription.duration,
                            language: transcription.language,
                            processed_at: new Date().toISOString()
                        },
                        analysis: result.insights,
                        processing_status: 'completed',
                        processed: true,
                        quality_score: this._calculateQualityScore(result.insights, video)
                    })
                    .eq('id', video.id);

                result.steps.push({ step: 'save_to_database', status: 'completed' });

                logger.info('[AutoProcessor] ✅ Video procesado completamente', {
                    videoId: video.video_id,
                    cost: result.cost.toFixed(4),
                    qualityScore: this._calculateQualityScore(result.insights, video)
                });
            } catch (saveError) {
                logger.error('[AutoProcessor] Error guardando en BD', {
                    error: saveError.message
                });
                result.errors.push(`Database save failed: ${saveError.message}`);
            }

            // PASO 7: Limpiar archivos temporales
            await this._cleanup([videoPath, audioPath]);

            return result;
        } catch (error) {
            logger.error('[AutoProcessor] ❌ Error procesando video', {
                videoId: video.video_id,
                error: error.message
            });

            this.stats.totalFailed++;

            await this._markVideoAsFailed(video.id, 'processing_error');

            throw error;
        }
    }

    /**
     * Marcar video como fallido
     */
    async _markVideoAsFailed(videoId, reason) {
        try {
            await supabase
                .from('competitive_videos')
                .update({
                    processing_status: 'failed',
                    analysis: { error: reason }
                })
                .eq('id', videoId);
        } catch (error) {
            logger.error('[AutoProcessor] Error marcando video como fallido', {
                error: error.message
            });
        }
    }

    /**
     * Calcular quality score del video
     */
    _calculateQualityScore(analysis, video) {
        let score = 5.0; // Base score

        // Engagement rate (40% del score)
        const engagementWeight = video.engagement_rate * 100;
        score += Math.min(engagementWeight * 0.4, 4);

        // Cantidad de insights (30% del score)
        if (analysis) {
            const keywordsCount = analysis.keywords?.length || 0;
            const claimsCount = analysis.claims?.length || 0;
            const insightsScore = (keywordsCount * 0.1 + claimsCount * 0.2) / 2;
            score += Math.min(insightsScore, 3);
        }

        // Views relativos (20% del score)
        if (video.views > 50000) {
            score += 2;
        } else if (video.views > 20000) {
            score += 1;
        } else if (video.views > 10000) {
            score += 0.5;
        }

        // Duración óptima 30-60s para Shorts (10% del score)
        if (video.duration_seconds >= 30 && video.duration_seconds <= 60) {
            score += 1;
        }

        return Math.min(score, 10);
    }

    /**
     * Remover branding del competidor
     */
    _removeBranding(analysis, channelName) {
        if (!analysis) {
            return null;
        }

        const brandingPatterns = [
            channelName,
            'mi canal',
            'suscríbete',
            'suscribete',
            'like',
            'campanita',
            'link en',
            'descripción'
        ];

        const cleaned = JSON.parse(JSON.stringify(analysis));

        if (cleaned.claims && Array.isArray(cleaned.claims)) {
            cleaned.claims = cleaned.claims
                .map(claim => {
                    // Extraer texto del claim (puede ser string o objeto)
                    let text;
                    if (typeof claim === 'string') {
                        text = claim;
                    } else if (claim && typeof claim === 'object' && claim.text) {
                        text = claim.text;
                    } else {
                        // Si el claim no tiene formato válido, ignorarlo
                        return null;
                    }

                    // Asegurar que text es string antes de usar .replace()
                    if (typeof text !== 'string') {
                        return null;
                    }

                    // Remover branding patterns
                    brandingPatterns.forEach(pattern => {
                        const regex = new RegExp(pattern, 'gi');
                        text = text.replace(regex, '');
                    });

                    // Filtrar claims de branding
                    const textLower = text.toLowerCase();
                    if (
                        textLower.includes('suscr') ||
                        textLower.includes('link') ||
                        textLower.includes('canal')
                    ) {
                        return null;
                    }

                    // Retornar en el mismo formato que vino
                    const cleanedText = text.trim();
                    return typeof claim === 'string'
                        ? cleanedText
                        : { ...claim, text: cleanedText };
                })
                .filter(claim => {
                    if (!claim) {
                        return false;
                    }
                    const text = typeof claim === 'string' ? claim : claim.text;
                    return text && text.length > 10;
                });
        }

        return cleaned;
    }

    /**
     * Limpiar archivos temporales
     */
    async _cleanup(files) {
        for (const file of files) {
            try {
                await fs.unlink(file);
            } catch (error) {
                // Ignorar errores de limpieza
            }
        }
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AutomaticVideoProcessor();
