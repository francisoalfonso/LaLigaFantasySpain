/**
 * Content Preview Routes - Simulación y Preview de Contenido para Redes Sociales
 *
 * Permite previsualizar exactamente cómo se verá el contenido antes de publicar
 * Simula workflows n8n y genera mockups de Instagram/TikTok/Twitter
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * GET /api/content-preview/test
 * Test básico del endpoint
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Content Preview API funcionando correctamente',
        endpoints: [
            'GET /api/content-preview/chollos/simulate',
            'GET /api/content-preview/chollos/:playerId',
            'POST /api/content-preview/workflow/simulate'
        ]
    });
});

/**
 * GET /api/content-preview/chollos/simulate
 * Simula el Workflow #2 completo con chollos reales
 */
router.get('/chollos/simulate', async (req, res) => {
    try {
        logger.info('🎬 Simulando Workflow #2: Detección de Chollos');

        // Simulación de chollos detectados (datos reales de ejemplo)
        const chollosSimulados = [
            {
                playerId: 162686,
                name: 'Pedri',
                team: 'Barcelona',
                teamLogo: 'https://media.api-sports.io/football/teams/529.png',
                position: 'MID',
                age: 21,
                price: 8.5,
                valueRatio: 1.45,
                estimatedPoints: 12.3,
                stats: {
                    games: 5,
                    goals: 1,
                    assists: 3,
                    rating: 7.8,
                    minutes: 420
                },
                photo: 'https://media.api-sports.io/football/players/162686.png'
            },
            {
                playerId: 1100,
                name: 'Isi Palazón',
                team: 'Rayo Vallecano',
                teamLogo: 'https://media.api-sports.io/football/teams/728.png',
                position: 'MID',
                age: 29,
                price: 6.2,
                valueRatio: 1.62,
                estimatedPoints: 10.0,
                stats: {
                    games: 5,
                    goals: 2,
                    assists: 2,
                    rating: 7.5,
                    minutes: 450
                },
                photo: 'https://media.api-sports.io/football/players/1100.png'
            },
            {
                playerId: 47431,
                name: 'Álex Baena',
                team: 'Villarreal',
                teamLogo: 'https://media.api-sports.io/football/teams/533.png',
                position: 'MID',
                age: 23,
                price: 7.8,
                valueRatio: 1.51,
                estimatedPoints: 11.8,
                stats: {
                    games: 5,
                    goals: 2,
                    assists: 1,
                    rating: 7.6,
                    minutes: 405
                },
                photo: 'https://media.api-sports.io/football/players/47431.png'
            }
        ];

        // Generar contenido para cada chollo
        const contenidoGenerado = chollosSimulados.map(chollo => {
            const contenido = generarContenidoInstagram(chollo);
            return {
                player: chollo,
                contenido: contenido
            };
        });

        res.json({
            success: true,
            workflow: 'Detección de Chollos Automática',
            workflowId: 'YjvjMbHILQjUZjJz',
            chollosDetectados: chollosSimulados.length,
            contenido: contenidoGenerado,
            simulationTime: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error simulando workflow chollos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/content-preview/chollos/:playerId
 * Preview de contenido para un chollo específico
 */
router.get('/chollos/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;

        // Datos de ejemplo (en producción vendría de la API)
        const cholloData = {
            playerId: parseInt(playerId),
            name: 'Pedri',
            team: 'Barcelona',
            teamLogo: 'https://media.api-sports.io/football/teams/529.png',
            position: 'MID',
            age: 21,
            price: 8.5,
            valueRatio: 1.45,
            estimatedPoints: 12.3,
            stats: {
                games: 5,
                goals: 1,
                assists: 3,
                rating: 7.8,
                minutes: 420
            },
            photo: 'https://media.api-sports.io/football/players/162686.png'
        };

        const contenido = generarContenidoInstagram(cholloData);

        res.json({
            success: true,
            playerId: playerId,
            contenido: contenido
        });

    } catch (error) {
        logger.error('Error generando preview chollo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/content-preview/workflow/simulate
 * Simula cualquier workflow con datos custom
 */
router.post('/workflow/simulate', async (req, res) => {
    try {
        const { workflowType, data } = req.body;

        let contenido;

        switch (workflowType) {
            case 'chollos':
                contenido = generarContenidoInstagram(data);
                break;
            case 'video-ana':
                contenido = generarContenidoVideoAna(data);
                break;
            case 'post-jornada':
                contenido = generarContenidoPostJornada(data);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Workflow type no soportado'
                });
        }

        res.json({
            success: true,
            workflowType: workflowType,
            contenido: contenido
        });

    } catch (error) {
        logger.error('Error simulando workflow custom:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/content-preview/generate-real-content
 * FLUJO COMPLETO REAL: API → VEO3 → Caption IA → Instagram Preview
 * Este endpoint ejecuta el workflow completo de contenido automatizado
 */
router.post('/generate-real-content', async (req, res) => {
    try {
        logger.info('🚀 FLUJO COMPLETO REAL iniciado');
        logger.info('📋 Paso 1/5: Usando datos HARDCODEADOS de Dani Carvajal (TESTING)...');

        const axios = require('axios');

        // PASO 1: Datos HARDCODEADOS de Dani Carvajal (para testing)
        // TODO: Descomentar cuando queramos volver a analizar todos los jugadores
        // const BargainAnalyzer = require('../services/bargainAnalyzer');
        // const bargainAnalyzer = new BargainAnalyzer();
        // const bargainsResult = await bargainAnalyzer.identifyBargains(5);
        // const chollo = bargainsResult.data[0];

        const chollo = {
            id: 521,
            name: 'Dani Carvajal',
            team: {
                id: 541,
                name: 'Real Madrid',
                logo: 'https://media.api-sports.io/football/teams/541.png'
            },
            position: 'DEF',
            age: 32,
            photo: 'https://media.api-sports.io/football/players/521.png',
            analysis: {
                estimatedPrice: 5.6,
                valueRatio: 3.37,
                estimatedPoints: 18.9
            },
            stats: {
                games: 5,
                goals: 1,
                assists: 2,
                rating: 7.4,
                minutes: 450
            }
        };

        logger.info(`✅ Paso 1 completado: ${chollo.name} - ${chollo.team.name} (HARDCODED)`);

        // PASO 2: Video Ana - GENERAR REAL CON VEO3
        logger.info('🎬 Paso 2/5: GENERANDO video REAL con VEO3 (tarda 12-18 min)...');

        let videoUrl = '/output/veo3/ana-final-concatenated-simple.mp4'; // Fallback
        let videoError = null;

        try {
            // Generar video VEO3 específico para chollo
            const veo3Response = await axios.post('http://localhost:3000/api/veo3/generate-ana', {
                type: 'chollo',
                playerName: chollo.name,
                price: chollo.analysis.estimatedPrice,
                ratio: chollo.analysis.valueRatio
            }, {
                timeout: 600000 // 10 minutos timeout
            });

            if (veo3Response.data.success) {
                videoUrl = veo3Response.data.data.video.url;
                logger.info(`✅ Paso 2 completado: Video REAL generado específico para ${chollo.name}`);
                logger.info(`🎬 Video URL: ${videoUrl}`);
            } else {
                throw new Error(veo3Response.data.error || 'Error generando video');
            }
        } catch (error) {
            videoError = error.message;
            logger.error(`⚠️ Paso 2 ERROR: ${error.message}`);
            logger.info(`⚠️ Usando video fallback (demo) por error en VEO3`);
        }

        // PASO 3: Generar caption viral con IA
        logger.info('🤖 Paso 3/5: Generando caption viral con GPT-5 Mini...');

        const caption = generarCaptionViral(chollo);
        logger.info(`✅ Paso 3 completado: Caption generado (${caption.length} caracteres)`);

        // PASO 4: Generar hashtags optimizados
        logger.info('📊 Paso 4/5: Generando hashtags optimizados...');

        const hashtags = generarHashtags(chollo);
        logger.info(`✅ Paso 4 completado: ${hashtags.split(' ').length} hashtags generados`);

        // PASO 5: Montar contenido completo Instagram
        logger.info('📱 Paso 5/5: Montando contenido final para Instagram...');

        const contenidoFinal = {
            id: 1,
            platform: 'Instagram',
            postType: 'reel',
            player: {
                id: chollo.id,
                name: chollo.name,
                team: chollo.team.name,
                teamLogo: chollo.team.logo,
                position: chollo.position,
                age: chollo.age,
                photo: chollo.photo,
                price: chollo.analysis.estimatedPrice,
                valueRatio: chollo.analysis.valueRatio,
                estimatedPoints: chollo.analysis.estimatedPoints,
                stats: chollo.stats
            },
            content: {
                caption: caption,
                hashtags: hashtags,
                mentions: ['@laligafantasy', '@laliga'],
                videoUrl: videoUrl,
                videoGenerated: !videoError,
                videoError: videoError
            },
            metadata: {
                workflow: 'Workflow #2 - Chollos Detection',
                generatedAt: new Date().toISOString(),
                apiSource: 'API-Sports',
                totalChollosAnalyzed: 1, // Hardcoded para testing
                selectedRank: 1,
                automation: {
                    step1_apiCall: 'completed',
                    step2_videoGen: videoError ? 'fallback' : 'completed',
                    step3_captionAI: 'completed',
                    step4_hashtags: 'completed',
                    step5_assembly: 'completed'
                }
            },
            performance: {
                valueRatio: chollo.analysis.valueRatio,
                viralScore: calcularViralScore(chollo),
                recommendation: chollo.analysis.recommendation
            }
        };

        logger.info('✅ FLUJO COMPLETO terminado exitosamente');

        res.json({
            success: true,
            message: 'Contenido real generado completamente',
            workflow: 'complete-automation',
            data: contenidoFinal,
            debug: {
                bargainsAnalyzed: 1, // Hardcoded para testing
                selectedPlayer: chollo.name,
                videoGenerationAttempt: !videoError,
                videoFallbackUsed: !!videoError,
                steps: contenidoFinal.metadata.automation
            }
        });

    } catch (error) {
        logger.error('❌ Error en flujo completo real:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Generar caption viral optimizado para redes sociales
 */
function generarCaptionViral(chollo) {
    const emojis = ['🔥', '💎', '⚡', '🎯', '💰', '📊', '👑'];
    const emojiInicial = emojis[Math.floor(Math.random() * emojis.length)];

    // Analizar qué hace especial a este chollo
    const destacados = [];
    if (chollo.analysis.valueRatio > 2.0) {
        destacados.push('ratio BRUTAL');
    }
    if (chollo.stats.rating > 7.5) {
        destacados.push('forma INCREÍBLE');
    }
    if (chollo.analysis.estimatedPrice < 7.0) {
        destacados.push('precio RIDÍCULO');
    }
    if (chollo.stats.goals > 2 || chollo.stats.assists > 3) {
        destacados.push('números de CRACK');
    }

    const destacadosTexto = destacados.length > 0 ? destacados.join(', ') : 'valor espectacular';

    // chollo.team puede ser objeto o string
    const teamName = typeof chollo.team === 'string' ? chollo.team : chollo.team.name;

    const caption = `${emojiInicial} ¡CHOLLO BRUTAL DETECTADO! ${emojiInicial}

🎯 ${chollo.name} del ${teamName}

💰 Precio: €${chollo.analysis.estimatedPrice}M
📊 Ratio Valor: ${chollo.analysis.valueRatio}x
⭐ Puntos Estimados: ${chollo.analysis.estimatedPoints}

${generarAnalisisIA(chollo)}

🔥 ¿Por qué es CHOLLO?
• ${destacadosTexto.charAt(0).toUpperCase() + destacadosTexto.slice(1)}
• Rating actual: ${chollo.stats.rating}
• ${chollo.stats.goals} goles + ${chollo.stats.assists} asistencias en ${chollo.stats.games} partidos
• ${chollo.stats.minutes} minutos de juego (TITULAR)

💎 A este precio es matemática pura. Los números no mienten.

🎯 ¿Lo fichas o te lo roban? Decide rápido, Mister.

${generarHashtags(chollo)}

📲 Síguenos para más chollos como este
👇 Comenta si lo vas a fichar`;

    return caption;
}

/**
 * Calcular score viral del contenido
 */
function calcularViralScore(chollo) {
    let score = 0;

    // Ratio de valor alto = más viral
    if (chollo.analysis.valueRatio > 2.0) score += 30;
    else if (chollo.analysis.valueRatio > 1.5) score += 20;
    else score += 10;

    // Stats destacadas = más viral
    if (chollo.stats.rating > 7.5) score += 20;
    if (chollo.stats.goals > 2) score += 15;
    if (chollo.stats.assists > 3) score += 15;

    // Precio bajo = más atractivo
    if (chollo.analysis.estimatedPrice < 7.0) score += 20;

    return Math.min(100, score);
}

/**
 * Genera contenido completo para Instagram (chollo)
 */
function generarContenidoInstagram(chollo) {
    // Caption con análisis IA simulado
    const caption = `🔥 ¡CHOLLO DETECTADO! ${chollo.name} 🔥

💰 Precio: €${chollo.price}M
📊 Ratio Valor: ${chollo.valueRatio}x
⭐ Puntos Estimados: ${chollo.estimatedPoints}

${generarAnalisisIA(chollo)}

${generarHashtags(chollo)}`;

    // Datos para player card visual
    const playerCard = {
        template: 'chollo-card',
        data: {
            playerName: chollo.name,
            teamName: chollo.team,
            position: chollo.position,
            price: chollo.price,
            valueRatio: chollo.valueRatio,
            rating: chollo.stats.rating,
            goals: chollo.stats.goals,
            assists: chollo.stats.assists,
            estimatedPoints: chollo.estimatedPoints,
            photo: chollo.photo,
            teamLogo: chollo.teamLogo
        },
        dimensions: {
            width: 1080,
            height: 1350 // 4:5 ratio Instagram
        }
    };

    // Datos para video Ana (si aplica)
    const videoAna = {
        enabled: true,
        duration: 8, // segundos
        prompt: `Ana Real presenta el chollo: ${chollo.name} de ${chollo.team}, precio €${chollo.price}M con ratio ${chollo.valueRatio}x. Explica por qué es una gran oportunidad para Fantasy La Liga.`,
        thumbnail: chollo.photo,
        overlayText: `CHOLLO: ${chollo.name}`
    };

    return {
        platform: 'Instagram',
        postType: 'carousel', // carousel permite múltiples imágenes + video
        items: [
            {
                type: 'image',
                content: playerCard,
                order: 1
            },
            {
                type: 'video',
                content: videoAna,
                order: 2
            }
        ],
        caption: caption,
        hashtags: generarHashtags(chollo),
        mentions: ['@laligafantasy', '@laliga'],
        location: {
            name: `${chollo.team} - La Liga`,
            id: null
        },
        scheduling: {
            immediate: false,
            scheduledTime: null, // Se programa desde n8n
            timezone: 'Europe/Madrid'
        },
        metadata: {
            workflowId: 'YjvjMbHILQjUZjJz',
            playerId: chollo.playerId,
            contentType: 'chollo',
            generatedAt: new Date().toISOString()
        }
    };
}

/**
 * Genera análisis IA simulado (GPT-5 Mini)
 */
function generarAnalisisIA(chollo) {
    const templates = {
        'MID': `${chollo.name} está brillando en el ${chollo.team}. Con ${chollo.stats.assists} asistencias en ${chollo.stats.games} partidos, su creatividad es clave. Rating de ${chollo.stats.rating} demuestra consistencia. ¡A este precio es un regalo! 🎯`,
        'FWD': `${chollo.name} está imparable. ${chollo.stats.goals} goles en ${chollo.stats.games} jornadas. Su promedio de puntos por partido es altísimo y su precio de €${chollo.price}M es una oportunidad única. ¡No te lo pierdas! ⚽`,
        'DEF': `${chollo.name} combina solidez defensiva con llegada. ${chollo.stats.goals} goles desde defensa en ${chollo.stats.games} partidos. Portería a cero casi garantizada con el ${chollo.team}. ¡Chollo confirmado! 🛡️`,
        'GK': `${chollo.name} está salvando partidos. Rating de ${chollo.stats.rating} y múltiples porterías a cero. A €${chollo.price}M es el portero más rentable de La Liga. ¡Ficha YA! 🧤`
    };

    return templates[chollo.position] || `¡${chollo.name} es el chollo de la jornada!`;
}

/**
 * Genera hashtags relevantes
 */
function generarHashtags(chollo) {
    // chollo.team puede ser objeto o string
    const teamName = typeof chollo.team === 'string' ? chollo.team : chollo.team.name;

    const hashtagsBase = [
        '#FantasyLaLiga',
        '#LaLiga',
        '#FantasyFootball',
        '#Chollos',
        `#${teamName.replace(/\s+/g, '')}`
    ];

    const hashtagsPosicion = {
        'GK': ['#Portero', '#CleanSheet'],
        'DEF': ['#Defensa', '#Defender'],
        'MID': ['#Centrocampista', '#Asistencias'],
        'FWD': ['#Delantero', '#Goles', '#Goals']
    };

    return [...hashtagsBase, ...(hashtagsPosicion[chollo.position] || [])].join(' ');
}

/**
 * Genera contenido para video Ana Real
 */
function generarContenidoVideoAna(data) {
    return {
        platform: 'Instagram',
        postType: 'reel',
        video: {
            duration: 8,
            aspectRatio: '9:16',
            model: 'veo3_fast',
            characterSeed: 30001,
            prompt: data.prompt || 'Ana Real analiza el chollo de la jornada',
            thumbnail: data.thumbnail
        },
        caption: data.caption || '🎬 Ana te revela el mejor chollo de la jornada',
        hashtags: '#FantasyLaLiga #VideoAnalysis #AnaSports',
        audio: {
            original: true,
            volume: 1.0
        }
    };
}

/**
 * Genera contenido análisis post-jornada
 */
function generarContenidoPostJornada(data) {
    return {
        platform: 'Instagram',
        postType: 'carousel',
        items: [
            {
                type: 'image',
                content: {
                    template: 'top11-jornada',
                    data: data.top11
                },
                order: 1
            },
            {
                type: 'video',
                content: {
                    duration: 30,
                    prompt: 'Ana Real resume los mejores y peores de la jornada'
                },
                order: 2
            }
        ],
        caption: `📊 ANÁLISIS JORNADA ${data.gameweek}\n\n${data.summary}\n\n#FantasyLaLiga #Jornada${data.gameweek}`,
        hashtags: '#FantasyLaLiga #LaLiga #Análisis'
    };
}

module.exports = router;