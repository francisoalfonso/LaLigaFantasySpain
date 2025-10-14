/**
 * Outliers Testing Routes
 *
 * Endpoints para testing del sistema de outliers sin consumir recursos externos.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/outliers/test/seed-mock
 * Crear outlier mock completamente analizado para testing
 *
 * Simula un outlier P0 con transcripción y análisis completo,
 * listo para generar script y video de respuesta.
 */
router.post('/test/seed-mock', async (req, res) => {
    try {
        logger.info('[Outliers Test] Generando outlier mock para testing...');

        const mockVideoId = `MOCK_${Date.now()}`;

        // Mock transcription (típico análisis de Fantasy La Liga)
        const mockTranscription = `
Misters, hoy vamos a hablar de Lewandowski en Fantasy La Liga.
Mucha gente me pregunta si sigue siendo un buen fichaje, y os voy a dar mi opinión sincera.

Lewandowski está en una racha increíble. Lleva 8 goles en las últimas 5 jornadas.
Está jugando como un auténtico killer del área. Los números no mienten.

Pero hay un problema: su precio. A 11 millones, es el delantero más caro de Fantasy.
¿Vale la pena? Yo creo que sí, pero con matices.

Si tienes presupuesto, es una apuesta segura. Pero si tienes que hacer sacrificios en otras posiciones,
quizás es mejor buscar chollos como Pere Milla o Iago Aspas que están rindiendo increíblemente bien.

Mi recomendación: si tu equipo está equilibrado, Lewandowski es TOP.
Si necesitas armar tu plantilla, hay mejores opciones calidad-precio.

¿Qué opináis vosotros? Dejadme en los comentarios si lo tenéis fichado o no.
        `.trim();

        // Mock content analysis (GPT-4o output simulado)
        const mockContentAnalysis = {
            thesis: "Lewandowski sigue siendo TOP en Fantasy pero su precio de 11M puede ser prohibitivo para equipos en construcción",
            key_arguments: [
                "Racha de 8 goles en 5 jornadas demuestra su forma actual",
                "Es el delantero más caro (11M) lo que limita opciones en otras posiciones",
                "Existen chollos como Pere Milla e Iago Aspas con mejor relación calidad-precio"
            ],
            players_mentioned: ["Lewandowski", "Pere Milla", "Iago Aspas"],
            viral_hooks: [
                "¿Vale 11 millones Lewandowski en Fantasy?",
                "8 goles en 5 jornadas - Los números no mienten",
                "Chollos que rinden mejor que Lewandowski"
            ],
            response_angle: "complementar",
            suggested_data_points: [
                "Stats reales de Lewandowski últimas 5 jornadas",
                "Comparación precio/rendimiento vs Pere Milla e Iago Aspas",
                "Minutos jugados y tendencia titular"
            ],
            emotional_tone: "equilibrado",
            target_audience: "Jugadores Fantasy que buscan optimizar presupuesto"
        };

        // Crear outlier en DB
        const { data: outlier, error } = await supabaseAdmin
            .from('youtube_outliers')
            .insert({
                video_id: mockVideoId,
                title: "¿LEWANDOWSKI vale 11M en Fantasy? Los NÚMEROS no MIENTEN | Análisis COMPLETO",
                channel_id: "UC_test_channel_fantasy_pro",
                channel_name: "Fantasy Football Pro España",
                channel_subscribers: 45000,
                published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
                thumbnail_url: `https://i.ytimg.com/vi/${mockVideoId}/maxresdefault.jpg`,
                video_url: `https://www.youtube.com/watch?v=${mockVideoId}`,
                duration: "PT12M45S",
                views: 85000,
                likes: 6200,
                comments: 420,
                engagement_rate: 7.8,
                outlier_score: 88.5,
                priority: "P0",
                viral_ratio: 189.0,
                velocity: 14166.67,
                processing_status: "analyzed", // ✅ Ya analizado
                transcription: mockTranscription,
                content_analysis: mockContentAnalysis,
                mentioned_players: mockContentAnalysis.players_mentioned,
                detected_at: new Date().toISOString(),
                analyzed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[Outliers Test] ✅ Outlier mock creado exitosamente', {
            videoId: mockVideoId,
            status: 'analyzed'
        });

        res.json({
            success: true,
            message: 'Outlier mock creado y analizado exitosamente',
            data: {
                videoId: mockVideoId,
                title: outlier.title,
                priority: outlier.priority,
                outlierScore: outlier.outlier_score,
                processingStatus: outlier.processing_status,
                playersDetected: outlier.mentioned_players.length,
                transcriptionLength: mockTranscription.length,
                nextStep: `POST /api/outliers/generate-script/${mockVideoId} con responseAngle: "rebatir" o "complementar"`
            },
            testing: {
                info: "Este es un outlier mock para testing. No requiere descargar video ni consumir APIs externas.",
                readyFor: [
                    "Script generation (/api/outliers/generate-script/:videoId)",
                    "VEO3 video generation (/api/veo3/prepare-session)",
                    "YouTube publishing (/api/youtube/upload)"
                ],
                cost: {
                    youtubeQuota: 0,
                    openai: 0,
                    whisper: 0,
                    total: "$0.00"
                }
            }
        });

    } catch (error) {
        logger.error('[Outliers Test] Error creando outlier mock', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/outliers/test/cleanup-mocks
 * Limpiar todos los outliers mock de la base de datos
 */
router.delete('/test/cleanup-mocks', async (req, res) => {
    try {
        logger.info('[Outliers Test] Limpiando outliers mock...');

        const { data, error } = await supabaseAdmin
            .from('youtube_outliers')
            .delete()
            .like('video_id', 'MOCK_%')
            .select();

        if (error) {
            throw error;
        }

        logger.info('[Outliers Test] ✅ Outliers mock limpiados', {
            count: data?.length || 0
        });

        res.json({
            success: true,
            message: `${data?.length || 0} outliers mock eliminados`,
            data: {
                deleted: data?.length || 0
            }
        });

    } catch (error) {
        logger.error('[Outliers Test] Error limpiando mocks', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
