/**
 * Rutas para generación automática de carruseles Instagram
 * Sistema automatizado usando ContentDrips API
 * Basado en: docs/INSTAGRAM_CARRUSELES_AUTOMATIZACION.md
 */
const express = require('express');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();
const BargainAnalyzer = require('../services/bargainAnalyzer');
const PlayersManager = require('../services/playersManager');
const FixtureAnalyzer = require('../services/fixtureAnalyzer');

// Inicializar servicios
const bargainAnalyzer = new BargainAnalyzer();
const playersManager = new PlayersManager();
// const fixtureAnalyzer = new FixtureAnalyzer(); // TODO: Usar para análisis fixtures

/**
 * Test endpoint del sistema de carruseles
 */
router.get(
    '/test',
    asyncHandler(async (_req, res) => {
        logger.info('🔄 Test del sistema de carruseles...');

        res.json({
            success: true,
            message: 'Sistema de carruseles funcionando correctamente',
            service: 'CarouselGenerator',
            timestamp: new Date().toISOString(),
            endpoints: {
                '/api/carousels/top-chollos': 'Top 10 chollos jornada (12 slides)',
                '/api/carousels/player-comparison': 'Comparativa 2 jugadores (10 slides)',
                '/api/carousels/lineup-recommendation':
                    'Alineación recomendada jornada (12 slides)',
                '/api/carousels/test': 'Test del sistema'
            },
            integration: {
                api: 'ContentDrips API',
                templates: ['top_chollos', 'player_comparison', 'lineup_optimal'],
                format: 'Instagram Carousel (1080x1350px)',
                automation: 'n8n workflows'
            }
        });
    })
);

/**
 * GET /api/carousels/top-chollos
 * Genera datos para carrusel "Top 10 Chollos Jornada"
 *
 * Query params:
 * - limit: número de jugadores (default: 10)
 * - maxPrice: precio máximo (default: 8.0)
 *
 * Returns: Datos formateados para ContentDrips API
 */
router.get(
    '/top-chollos',
    asyncHandler(async (req, res) => {
        logger.info('🎯 Generando datos carrusel Top Chollos...');

        // Parámetros
        const limit = parseInt(req.query.limit) || 10;
        const maxPrice = parseFloat(req.query.maxPrice) || 8.0;

        // 1. Obtener top chollos
        logger.info(`📊 Obteniendo top ${limit} chollos (precio max: ${maxPrice})...`);
        const chollos = await bargainAnalyzer.getTopBargains({ maxPrice, limit });

        if (chollos.length === 0) {
            return res.json({
                success: false,
                message: 'No se encontraron chollos con los criterios especificados',
                data: null
            });
        }

        // 2. Enriquecer con datos completos de jugadores
        logger.info('🔍 Enriqueciendo datos de jugadores...');
        const enrichedPlayers = await Promise.all(
            chollos.map(async player => {
                try {
                    // Obtener datos completos del jugador
                    const fullData = await playersManager.getPlayer(player.id);

                    // Obtener próximo rival
                    const nextFixture = fullData.nextFixture || {};

                    return {
                        player_id: player.id,
                        player_name: player.name,
                        team: player.team,
                        position: player.position,
                        price: `${player.priceEstimated.toFixed(1)}M`,
                        price_value: player.priceEstimated,
                        value_ratio: player.valueRatio.toFixed(2),
                        photo_url: fullData.photo || '',
                        // Stats clave
                        goals: player.goalsTotal || 0,
                        assists: player.assists || 0,
                        rating: player.rating ? player.rating.toFixed(2) : 'N/A',
                        minutes: player.minutesPlayed || 0,
                        games: player.gamesPlayed || 0,
                        // Próximo partido
                        next_rival: nextFixture.opponent || 'TBD',
                        next_rival_difficulty: nextFixture.difficulty || 'medium',
                        next_match_home: nextFixture.isHome || false,
                        // Predicción
                        predicted_points: player.predictedPoints
                            ? player.predictedPoints.toFixed(1)
                            : 'N/A'
                    };
                } catch (error) {
                    logger.error(`Error enriqueciendo jugador ${player.id}:`, error.message);
                    // Retornar datos básicos si falla el enriquecimiento
                    return {
                        player_id: player.id,
                        player_name: player.name,
                        team: player.team,
                        position: player.position,
                        price: `${player.priceEstimated.toFixed(1)}M`,
                        value_ratio: player.valueRatio.toFixed(2),
                        photo_url: '',
                        goals: player.goalsTotal || 0,
                        assists: player.assists || 0,
                        rating: player.rating ? player.rating.toFixed(2) : 'N/A'
                    };
                }
            })
        );

        // 3. Obtener jornada actual
        const currentGameweek = await getCurrentGameweek();

        // 4. Formatear para ContentDrips API
        const carouselData = {
            template_id: process.env.CONTENTDRIPS_TEMPLATE_TOP10 || 'template_top_chollos',
            intro_slide: {
                title: `Top ${limit} Chollos Jornada ${currentGameweek}`,
                subtitle: 'Análisis por Ana Fantasy 🔥',
                date: new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            },
            content_slides: enrichedPlayers,
            ending_slide: {
                cta: 'Link en bio para análisis completo',
                footer: '@laligafantasyspain',
                engagement_text: '¿Cuál vas a fichar? 💬'
            },
            metadata: {
                generated_at: new Date().toISOString(),
                gameweek: currentGameweek,
                total_players: enrichedPlayers.length,
                avg_price: (
                    enrichedPlayers.reduce((sum, p) => sum + p.price_value, 0) /
                    enrichedPlayers.length
                ).toFixed(1),
                positions: {
                    GK: enrichedPlayers.filter(p => p.position === 'GK').length,
                    DEF: enrichedPlayers.filter(p => p.position === 'DEF').length,
                    MID: enrichedPlayers.filter(p => p.position === 'MID').length,
                    FWD: enrichedPlayers.filter(p => p.position === 'FWD').length
                }
            }
        };

        logger.info(`✅ Datos carrusel generados: ${enrichedPlayers.length} jugadores`);

        res.json({
            success: true,
            message: `Datos carrusel Top ${limit} Chollos generados correctamente`,
            data: carouselData,
            stats: {
                players_count: enrichedPlayers.length,
                gameweek: currentGameweek,
                avg_price: carouselData.metadata.avg_price,
                positions: carouselData.metadata.positions
            }
        });
    })
);

/**
 * POST /api/carousels/player-comparison
 * Genera datos para carrusel "Comparativa 2 Jugadores"
 *
 * Body:
 * {
 *   "player1Id": 162686,
 *   "player2Id": 521,
 *   "title": "Pere Milla vs Joselu"
 * }
 */
router.post(
    '/player-comparison',
    asyncHandler(async (req, res) => {
        logger.info('⚖️ Generando datos carrusel comparativa jugadores...');

        const { player1Id, player2Id, title } = req.body;

        // Validación básica
        if (!player1Id || !player2Id) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren player1Id y player2Id'
            });
        }

        // 1. Obtener datos completos de ambos jugadores
        logger.info(`📊 Obteniendo datos de jugadores ${player1Id} y ${player2Id}...`);

        const [player1Data, player2Data] = await Promise.all([
            playersManager.getPlayer(player1Id),
            playersManager.getPlayer(player2Id)
        ]);

        if (!player1Data || !player2Data) {
            return res.status(404).json({
                success: false,
                message: 'Uno o ambos jugadores no encontrados'
            });
        }

        // 2. Obtener análisis de chollos para obtener value ratio
        const allBargains = await bargainAnalyzer.getTopBargains({ limit: 100 });
        const player1Bargain = allBargains.find(p => p.id === player1Id);
        const player2Bargain = allBargains.find(p => p.id === player2Id);

        // 3. Formatear datos de comparación
        const comparison = {
            player1: {
                id: player1Id,
                name: player1Data.name,
                team: player1Data.team?.name || 'Unknown',
                position: player1Data.position,
                photo: player1Data.photo,
                // Stats
                goals: player1Data.statistics?.goals?.total || 0,
                assists: player1Data.statistics?.goals?.assists || 0,
                rating: player1Data.statistics?.games?.rating || 0,
                minutes: player1Data.statistics?.games?.minutes || 0,
                games: player1Data.statistics?.games?.appearences || 0,
                // Fantasy data
                price: player1Bargain ? player1Bargain.priceEstimated : 8.0,
                value_ratio: player1Bargain ? player1Bargain.valueRatio : 1.0,
                predicted_points: player1Bargain ? player1Bargain.predictedPoints : 0
            },
            player2: {
                id: player2Id,
                name: player2Data.name,
                team: player2Data.team?.name || 'Unknown',
                position: player2Data.position,
                photo: player2Data.photo,
                // Stats
                goals: player2Data.statistics?.goals?.total || 0,
                assists: player2Data.statistics?.goals?.assists || 0,
                rating: player2Data.statistics?.games?.rating || 0,
                minutes: player2Data.statistics?.games?.minutes || 0,
                games: player2Data.statistics?.games?.appearences || 0,
                // Fantasy data
                price: player2Bargain ? player2Bargain.priceEstimated : 8.0,
                value_ratio: player2Bargain ? player2Bargain.valueRatio : 1.0,
                predicted_points: player2Bargain ? player2Bargain.predictedPoints : 0
            }
        };

        // 4. Determinar ganador basado en value ratio
        const winner =
            comparison.player1.value_ratio > comparison.player2.value_ratio ? 'player1' : 'player2';

        // 5. Formatear para ContentDrips API
        const carouselData = {
            template_id: process.env.CONTENTDRIPS_TEMPLATE_COMPARISON || 'template_comparison',
            intro_slide: {
                title: title || `${comparison.player1.name} vs ${comparison.player2.name}`,
                subtitle: '¿Quién es mejor chollo? ⚔️',
                date: new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long'
                })
            },
            player1_slides: {
                name: comparison.player1.name,
                team: comparison.player1.team,
                photo: comparison.player1.photo,
                stats: {
                    goals: comparison.player1.goals,
                    assists: comparison.player1.assists,
                    rating: comparison.player1.rating.toFixed(2),
                    games: comparison.player1.games
                },
                fantasy: {
                    price: comparison.player1.price.toFixed(1),
                    value_ratio: comparison.player1.value_ratio.toFixed(2),
                    predicted_points: comparison.player1.predicted_points.toFixed(1)
                }
            },
            player2_slides: {
                name: comparison.player2.name,
                team: comparison.player2.team,
                photo: comparison.player2.photo,
                stats: {
                    goals: comparison.player2.goals,
                    assists: comparison.player2.assists,
                    rating: comparison.player2.rating.toFixed(2),
                    games: comparison.player2.games
                },
                fantasy: {
                    price: comparison.player2.price.toFixed(1),
                    value_ratio: comparison.player2.value_ratio.toFixed(2),
                    predicted_points: comparison.player2.predicted_points.toFixed(1)
                }
            },
            verdict_slide: {
                winner: winner === 'player1' ? comparison.player1.name : comparison.player2.name,
                reason:
                    winner === 'player1'
                        ? `Mejor ratio valor (${comparison.player1.value_ratio.toFixed(2)} vs ${comparison.player2.value_ratio.toFixed(2)})`
                        : `Mejor ratio valor (${comparison.player2.value_ratio.toFixed(2)} vs ${comparison.player1.value_ratio.toFixed(2)})`,
                recommendation: `${winner === 'player1' ? comparison.player1.name : comparison.player2.name} es el mejor chollo para tu equipo Fantasy`
            },
            ending_slide: {
                cta: 'Link en bio para más comparativas',
                footer: '@laligafantasyspain',
                engagement_text: '¿Cuál prefieres tú? 💬'
            }
        };

        logger.info('✅ Datos carrusel comparativa generados');

        res.json({
            success: true,
            message: 'Datos carrusel comparativa generados correctamente',
            data: carouselData,
            winner: winner === 'player1' ? comparison.player1.name : comparison.player2.name
        });
    })
);

/**
 * GET /api/carousels/lineup-recommendation
 * Genera datos para carrusel "Alineación Recomendada Jornada"
 *
 * Query params:
 * - formation: formación táctica (default: "4-3-3")
 * - budget: presupuesto total (default: 100)
 */
router.get(
    '/lineup-recommendation',
    asyncHandler(async (req, res) => {
        logger.info('⚽ Generando datos carrusel alineación recomendada...');

        const formation = req.query.formation || '4-3-3';
        const budget = parseFloat(req.query.budget) || 100;

        // 1. Obtener chollos por posición
        logger.info('📊 Obteniendo mejores chollos por posición...');

        const [goalkeepers, defenders, midfielders, forwards] = await Promise.all([
            bargainAnalyzer.getTopBargainsByPosition('GK', { limit: 2 }),
            bargainAnalyzer.getTopBargainsByPosition('DEF', { limit: 5 }),
            bargainAnalyzer.getTopBargainsByPosition('MID', { limit: 5 }),
            bargainAnalyzer.getTopBargainsByPosition('FWD', { limit: 4 })
        ]);

        // 2. Construir alineación óptima según formación
        let lineup = [];

        if (formation === '4-3-3') {
            lineup = [
                ...goalkeepers.slice(0, 1), // 1 GK
                ...defenders.slice(0, 4), // 4 DEF
                ...midfielders.slice(0, 3), // 3 MID
                ...forwards.slice(0, 3) // 3 FWD
            ];
        } else if (formation === '3-4-3') {
            lineup = [
                ...goalkeepers.slice(0, 1),
                ...defenders.slice(0, 3),
                ...midfielders.slice(0, 4),
                ...forwards.slice(0, 3)
            ];
        } else if (formation === '4-4-2') {
            lineup = [
                ...goalkeepers.slice(0, 1),
                ...defenders.slice(0, 4),
                ...midfielders.slice(0, 4),
                ...forwards.slice(0, 2)
            ];
        }

        // 3. Enriquecer con datos completos
        const enrichedLineup = await Promise.all(
            lineup.map(async player => {
                try {
                    const fullData = await playersManager.getPlayer(player.id);
                    return {
                        player_id: player.id,
                        name: player.name,
                        team: player.team,
                        position: player.position,
                        price: player.priceEstimated.toFixed(1),
                        value_ratio: player.valueRatio.toFixed(2),
                        photo: fullData.photo || '',
                        rating: player.rating ? player.rating.toFixed(2) : 'N/A',
                        predicted_points: player.predictedPoints
                            ? player.predictedPoints.toFixed(1)
                            : 'N/A'
                    };
                } catch (error) {
                    logger.error(`Error enriqueciendo jugador ${player.id}:`, error.message);
                    return {
                        player_id: player.id,
                        name: player.name,
                        team: player.team,
                        position: player.position,
                        price: player.priceEstimated.toFixed(1),
                        value_ratio: player.valueRatio.toFixed(2)
                    };
                }
            })
        );

        // 4. Calcular totales
        const totalCost = enrichedLineup.reduce((sum, p) => sum + parseFloat(p.price), 0);
        const totalPredictedPoints = enrichedLineup.reduce(
            (sum, p) => sum + (parseFloat(p.predicted_points) || 0),
            0
        );
        const avgValueRatio =
            enrichedLineup.reduce((sum, p) => sum + parseFloat(p.value_ratio), 0) /
            enrichedLineup.length;

        // 5. Obtener jornada actual
        const currentGameweek = await getCurrentGameweek();

        // 6. Formatear para ContentDrips API
        const carouselData = {
            template_id: process.env.CONTENTDRIPS_TEMPLATE_LINEUP || 'template_lineup',
            intro_slide: {
                title: `Alineación Óptima Jornada ${currentGameweek}`,
                subtitle: `Formación ${formation} 🎯`,
                budget: `${totalCost.toFixed(1)}M / ${budget}M`,
                date: new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long'
                })
            },
            formation: formation,
            lineup_slides: {
                goalkeeper: enrichedLineup.filter(p => p.position === 'GK'),
                defenders: enrichedLineup.filter(p => p.position === 'DEF'),
                midfielders: enrichedLineup.filter(p => p.position === 'MID'),
                forwards: enrichedLineup.filter(p => p.position === 'FWD')
            },
            stats_slide: {
                total_cost: totalCost.toFixed(1),
                budget_remaining: (budget - totalCost).toFixed(1),
                predicted_points: totalPredictedPoints.toFixed(1),
                avg_value_ratio: avgValueRatio.toFixed(2),
                total_players: enrichedLineup.length
            },
            ending_slide: {
                cta: 'Link en bio para análisis completo',
                footer: '@laligafantasyspain',
                engagement_text: '¿Usarías esta alineación? 💬'
            }
        };

        logger.info(
            `✅ Datos carrusel alineación generados: ${enrichedLineup.length} jugadores, coste ${totalCost.toFixed(1)}M`
        );

        res.json({
            success: true,
            message: 'Datos carrusel alineación generados correctamente',
            data: carouselData,
            stats: {
                formation: formation,
                total_players: enrichedLineup.length,
                total_cost: totalCost.toFixed(1),
                budget_remaining: (budget - totalCost).toFixed(1),
                predicted_points: totalPredictedPoints.toFixed(1)
            }
        });
    })
);

/**
 * Helper function: Obtener jornada actual
 */
function getCurrentGameweek() {
    // TODO: Integrar con sistema real de jornadas
    // Por ahora, retornar jornada hardcoded
    return 5;
}

module.exports = router;
