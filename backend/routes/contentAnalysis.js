/**
 * Content Analysis Routes
 *
 * Endpoints para análisis de contenido de competencia YouTube
 * Integra: YouTube Monitor + Transcription + Content Analyzer + VEO3
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const transcriptionService = require('../services/contentAnalysis/transcriptionService');
const contentAnalyzer = require('../services/contentAnalysis/contentAnalyzer');
const youtubeMonitor = require('../services/contentAnalysis/youtubeMonitor');
const bargainAnalyzer = require('../services/bargainAnalyzer');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/content/analyze-youtube
 *
 * Analizar video de YouTube completo:
 * 1. Descargar video (opcional)
 * 2. Transcribir audio
 * 3. Analizar contenido
 * 4. Investigar con nuestros datos
 * 5. Generar guión respuesta
 */
router.post('/analyze-youtube', async (req, res) => {
    const startTime = Date.now();

    try {
        const { videoUrl, transcription, generateResponse = true } = req.body;

        logger.info('[ContentAnalysis] Iniciando análisis YouTube', {
            videoUrl,
            hasTranscription: !!transcription,
            generateResponse
        });

        // Validaciones
        if (!videoUrl && !transcription) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere videoUrl o transcription'
            });
        }

        let transcriptionResult = null;
        let audioPath = null;
        let videoPath = null;

        // PASO 1: Obtener transcripción
        if (transcription) {
            // Transcripción ya proporcionada
            transcriptionResult = {
                text: transcription,
                segments: [],
                duration: 0,
                language: 'es'
            };

            logger.info('[ContentAnalysis] Usando transcripción proporcionada');
        } else {
            // Descargar video y transcribir
            try {
                // Crear directorio temporal
                const tempDir = path.join(__dirname, '../../temp/content-analysis');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const videoId = youtubeMonitor._extractVideoId(videoUrl);
                videoPath = path.join(tempDir, `${videoId}.mp4`);
                audioPath = path.join(tempDir, `${videoId}.mp3`);

                // Descargar video
                logger.info('[ContentAnalysis] Descargando video...');
                await youtubeMonitor.downloadVideo(videoUrl, videoPath);

                // Extraer audio
                logger.info('[ContentAnalysis] Extrayendo audio...');
                await youtubeMonitor.extractAudio(videoPath, audioPath);

                // Transcribir
                logger.info('[ContentAnalysis] Transcribiendo audio...');
                transcriptionResult = await transcriptionService.transcribe(audioPath, {
                    timestamps: true,
                    responseFormat: 'verbose_json'
                });

                logger.info('[ContentAnalysis] ✅ Transcripción completa', {
                    textLength: transcriptionResult.text.length,
                    segments: transcriptionResult.segments.length
                });
            } catch (error) {
                logger.error('[ContentAnalysis] Error en transcripción', {
                    error: error.message
                });

                // Limpiar archivos temporales
                if (audioPath && fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                }
                if (videoPath && fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                }

                return res.status(500).json({
                    success: false,
                    message: 'Error en transcripción',
                    error: error.message
                });
            }
        }

        // PASO 2: Analizar contenido
        logger.info('[ContentAnalysis] Analizando contenido...');
        const analysis = await contentAnalyzer.analyze(transcriptionResult.text, {
            title: req.body.title || '',
            channelName: req.body.channelName || '',
            publishedAt: req.body.publishedAt || new Date().toISOString()
        });

        logger.info('[ContentAnalysis] ✅ Análisis completo', {
            players: analysis.players.length,
            claims: analysis.claims.length,
            contentType: analysis.contentType
        });

        // PASO 3: Investigar con nuestros datos (si hay jugadores)
        let research = null;
        if (analysis.players.length > 0 && generateResponse) {
            logger.info('[ContentAnalysis] Investigando con datos FLP...');

            research = await Promise.all(
                analysis.players.map(async player => {
                    try {
                        // Buscar datos del jugador
                        const playerData = await bargainAnalyzer.analyzePlayer(
                            player.name,
                            player.team
                        );

                        return {
                            player: player.name,
                            data: playerData
                        };
                    } catch (error) {
                        logger.warn('[ContentAnalysis] No se encontraron datos del jugador', {
                            player: player.name,
                            error: error.message
                        });

                        return {
                            player: player.name,
                            data: null
                        };
                    }
                })
            );

            logger.info('[ContentAnalysis] ✅ Investigación completa', {
                playersResearched: research.length,
                withData: research.filter(r => r.data).length
            });
        }

        // PASO 4: Generar guión de respuesta (opcional)
        let responseScript = null;
        if (generateResponse && research) {
            logger.info('[ContentAnalysis] Generando guión de respuesta...');

            responseScript = await contentAnalyzer.generateResponse(analysis, research);

            logger.info('[ContentAnalysis] ✅ Guión generado', {
                segments: responseScript.segments.length,
                targetPlayer: responseScript.targetPlayer
            });
        }

        // PASO 5: Calcular score de calidad
        const qualityScore = contentAnalyzer.calculateQualityScore(analysis);

        // Limpiar archivos temporales
        if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
        if (videoPath && fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        const duration = Date.now() - startTime;

        logger.info('[ContentAnalysis] ✅ Análisis completo exitoso', {
            duration: `${duration}ms`,
            qualityScore,
            hasScript: !!responseScript
        });

        res.json({
            success: true,
            data: {
                transcription: transcriptionResult,
                analysis,
                research,
                responseScript,
                qualityScore,
                processingTime: duration
            }
        });
    } catch (error) {
        logger.error('[ContentAnalysis] Error en análisis YouTube', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Error en análisis de contenido',
            error: error.message
        });
    }
});

/**
 * Helper: Extraer video ID de URL
 */
youtubeMonitor._extractVideoId = function (url) {
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://www.youtube.com/shorts/VIDEO_ID
    // https://youtu.be/VIDEO_ID

    const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/shorts\/([^?]+)/,
        /youtu\.be\/([^?]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    throw new Error('No se pudo extraer video ID de la URL');
};

/**
 * POST /api/content/test-transcription
 *
 * Endpoint de test para transcripción aislada
 */
router.post('/test-transcription', async (req, res) => {
    try {
        const { audioPath } = req.body;

        if (!audioPath) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere audioPath'
            });
        }

        const result = await transcriptionService.transcribe(audioPath);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('[ContentAnalysis] Error test transcription', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/content/test-analysis
 *
 * Endpoint de test para análisis aislado
 */
router.post('/test-analysis', async (req, res) => {
    try {
        const { transcription } = req.body;

        if (!transcription) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere transcription'
            });
        }

        const analysis = await contentAnalyzer.analyze(transcription);
        const qualityScore = contentAnalyzer.calculateQualityScore(analysis);

        res.json({
            success: true,
            data: {
                analysis,
                qualityScore
            }
        });
    } catch (error) {
        logger.error('[ContentAnalysis] Error test analysis', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
