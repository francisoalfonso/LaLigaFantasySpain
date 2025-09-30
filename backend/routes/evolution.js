/**
 * Rutas para evolución de valor Fantasy de jugadores
 */

const express = require('express');
const logger = require('../utils/logger');
const { validate, schemas } = require('../middleware/validation');
const FantasyEvolution = require('../services/fantasyEvolution');
const ApiFootballClient = require('../services/apiFootball');

const router = express.Router();
const fantasyEvolution = new FantasyEvolution();
const apiFootball = new ApiFootballClient();

/**
 * GET /api/evolution/player/:playerId
 * Obtener evolución de valor Fantasy de un jugador específico
 */
router.get('/player/:playerId', validate(schemas.evolutionPlayer), async (req, res) => {
    try {
        const playerId = parseInt(req.params.playerId);

        logger.info(`📈 Generando evolución Fantasy para jugador ${playerId}...`);

        // Obtener datos del jugador
        const playerResult = await apiFootball.getPlayerStats(playerId);

        if (!playerResult.success) {
            return res.status(404).json({
                success: false,
                error: 'Jugador no encontrado'
            });
        }

        // Formatear datos del jugador para el servicio
        const apiPlayer = playerResult.data;
        const player = {
            id: apiPlayer.player.id,
            name: apiPlayer.player.name,
            team: {
                id: apiPlayer.team.id,
                name: apiPlayer.team.name
            },
            position: apiPlayer.games.position,
            stats: {
                games: {
                    appearences: apiPlayer.games.appearences,
                    minutes: apiPlayer.games.minutes,
                    rating: apiPlayer.games.rating
                },
                goals: {
                    total: apiPlayer.goals.total,
                    assists: apiPlayer.goals.assists
                }
            }
        };

        // Generar evolución (ahora es async)
        const evolution = await fantasyEvolution.generatePlayerEvolution(playerId);

        res.json({
            success: true,
            message: `Evolución generada para ${evolution.playerName}`,
            data: evolution,
            metadata: {
                playerInfo: {
                    id: player.id,
                    name: player.name,
                    team: player.team.name,
                    position: player.position
                },
                currentGameweek: evolution.currentGameweek,
                dataPoints: evolution.evolution.length,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('❌ Error generando evolución Fantasy:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            service: 'FantasyEvolution'
        });
    }
});

/**
 * GET /api/evolution/compare/:playerId1/:playerId2
 * Comparar evolución de dos jugadores
 */
router.get('/compare/:playerId1/:playerId2', async (req, res) => {
    try {
        const playerId1 = parseInt(req.params.playerId1);
        const playerId2 = parseInt(req.params.playerId2);

        if (!playerId1 || !playerId2) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren dos Player IDs válidos'
            });
        }

        logger.info(`🆚 Comparando evolución Fantasy: ${playerId1} vs ${playerId2}...`);

        // Obtener datos de ambos jugadores en paralelo
        const [player1Result, player2Result] = await Promise.all([
            apiFootball.getPlayerStats(playerId1),
            apiFootball.getPlayerStats(playerId2)
        ]);

        if (!player1Result.success || !player2Result.success) {
            return res.status(404).json({
                success: false,
                error: 'Uno o ambos jugadores no encontrados'
            });
        }

        // Formatear datos
        const formatPlayer = (apiPlayer) => ({
            id: apiPlayer.player.id,
            name: apiPlayer.player.name,
            team: {
                id: apiPlayer.team.id,
                name: apiPlayer.team.name
            },
            position: apiPlayer.games.position,
            stats: {
                games: {
                    appearences: apiPlayer.games.appearences,
                    minutes: apiPlayer.games.minutes,
                    rating: apiPlayer.games.rating
                },
                goals: {
                    total: apiPlayer.goals.total,
                    assists: apiPlayer.goals.assists
                }
            }
        });

        const player1 = formatPlayer(player1Result.data);
        const player2 = formatPlayer(player2Result.data);

        // Generar evoluciones (ahora es async)
        const evolution1 = await fantasyEvolution.generatePlayerEvolution(playerId1);
        const evolution2 = await fantasyEvolution.generatePlayerEvolution(playerId2);

        // Análisis comparativo
        const comparison = {
            player1: evolution1,
            player2: evolution2,
            analysis: {
                valueDifference: Math.round((evolution1.summary.currentValue - evolution2.summary.currentValue) * 10) / 10,
                pointsDifference: evolution1.summary.totalFantasyPoints - evolution2.summary.totalFantasyPoints,
                betterInvestment: evolution1.summary.totalPercentChange > evolution2.summary.totalPercentChange ?
                    evolution1.playerName : evolution2.playerName,
                moreConsistent: this.calculateConsistency(evolution1) > this.calculateConsistency(evolution2) ?
                    evolution1.playerName : evolution2.playerName
            }
        };

        res.json({
            success: true,
            message: `Comparación generada: ${player1.name} vs ${player2.name}`,
            data: comparison,
            metadata: {
                comparedAt: new Date().toISOString(),
                gameweek: evolution1.currentGameweek
            }
        });

    } catch (error) {
        logger.error('❌ Error comparando evoluciones:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            service: 'FantasyEvolution'
        });
    }
});

/**
 * Calcular consistencia de un jugador
 */
function calculateConsistency(evolution) {
    const values = evolution.evolution.map(e => e.fantasyValue);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return 1 / (1 + variance); // Menor varianza = mayor consistencia
}

/**
 * GET /api/evolution/top-risers
 * Obtener jugadores con mayor crecimiento de valor
 */
router.get('/top-risers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        logger.info(`📈 Obteniendo top ${limit} jugadores con mayor crecimiento...`);

        // Obtener muestra de jugadores (primeros 50 para el ejemplo)
        const playersResult = await apiFootball.getLaLigaPlayers(1);

        if (!playersResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Error obteniendo jugadores'
            });
        }

        // Generar evoluciones para todos los jugadores
        const evolutions = [];
        const players = playersResult.data.slice(0, 20); // Limitar para performance

        for (const playerData of players) {
            // Generar evolución (ahora es async)
            const evolution = await fantasyEvolution.generatePlayerEvolution(playerData.id);
            if (evolution && !evolution.error) {
                evolutions.push(evolution);
            }
        }

        // Ordenar por mayor crecimiento porcentual
        const topRisers = evolutions
            .sort((a, b) => b.summary.totalPercentChange - a.summary.totalPercentChange)
            .slice(0, limit)
            .map(evolution => ({
                playerId: evolution.playerId,
                playerName: evolution.playerName,
                team: evolution.team,
                position: evolution.position,
                startValue: evolution.summary.startValue,
                currentValue: evolution.summary.currentValue,
                totalChange: evolution.summary.totalPriceChange,
                percentChange: evolution.summary.totalPercentChange,
                trend: evolution.trend,
                totalPoints: evolution.summary.totalFantasyPoints
            }));

        res.json({
            success: true,
            message: `Top ${topRisers.length} jugadores con mayor crecimiento`,
            data: topRisers,
            metadata: {
                totalAnalyzed: evolutions.length,
                averageGrowth: Math.round(evolutions.reduce((sum, e) => sum + e.summary.totalPercentChange, 0) / evolutions.length * 10) / 10,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('❌ Error obteniendo top risers:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            service: 'FantasyEvolution'
        });
    }
});

/**
 * GET /api/evolution/test
 * Test endpoint para verificar funcionamiento
 */
router.get('/test', async (req, res) => {
    try {
        logger.info('🧪 Ejecutando test del FantasyEvolution...');

        // Test con jugador de ejemplo
        const testPlayer = {
            id: 521,
            name: 'R. Lewandowski',
            team: { id: 529, name: 'Barcelona' },
            position: 'Attacker',
            stats: {
                games: {
                    appearences: 15,
                    minutes: 1200,
                    rating: '7.8'
                },
                goals: {
                    total: 12,
                    assists: 3
                }
            }
        };

        // Test con Lewandowski (playerId: 521)
        const testPlayerId = 521;
        const evolution = await fantasyEvolution.generatePlayerEvolution(testPlayerId);

        res.json({
            success: true,
            message: 'Test FantasyEvolution completado - DATOS REALES desde API-Sports',
            testData: {
                testPlayerId: testPlayerId,
                evolution: evolution
            },
            serviceStatus: {
                fantasyEvolution: 'operational',
                currentGameweek: evolution.currentGameweek,
                dataPointsGenerated: evolution.evolution.length
            }
        });

    } catch (error) {
        logger.error('❌ Error en test FantasyEvolution:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            service: 'FantasyEvolution'
        });
    }
});

module.exports = router;