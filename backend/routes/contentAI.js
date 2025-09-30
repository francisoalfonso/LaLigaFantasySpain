/**
 * Rutas para generación de contenido con GPT-5 Mini
 * Fantasy La Liga 2025-26 - Optimizado para avatares IA
 */

const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const OpenAIGPT5MiniService = require('../services/openaiGPT5Mini');
const WeatherService = require('../services/weatherService');

// Inicializar servicios
const aiService = new OpenAIGPT5MiniService();
const weatherService = new WeatherService();

/**
 * GET /api/ai/test
 * Test de conexión con GPT-5 Mini
 */
router.get('/test', async (req, res) => {
    try {
        const validation = aiService.validateConfiguration();

        // Test básico de generación
        const testContent = await aiService.generateSocialPost('chollo', {
            name: 'Test Player',
            team: 'Test Team',
            price: 5.0,
            valueRatio: 1.5,
            expectedPoints: 8
        });

        res.json({
            success: true,
            message: 'GPT-5 Mini funcionando correctamente',
            configuration: validation,
            test_generation: testContent,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error en el servicio GPT-5 Mini'
        });
    }
});

/**
 * POST /api/ai/player-analysis
 * Generar análisis de jugador para avatar
 */
router.post('/player-analysis', async (req, res) => {
    try {
        const { playerData, includeWeather, teamKey } = req.body;

        if (!playerData || !playerData.name) {
            return res.status(400).json({
                success: false,
                error: 'playerData con name es requerido'
            });
        }

        // Contexto adicional
        let context = {};

        // Añadir contexto meteorológico si se solicita
        if (includeWeather && teamKey) {
            try {
                const weatherData = await weatherService.getCurrentWeatherForTeam(teamKey);
                context.weather = {
                    description: weatherData.current.description,
                    temperature: weatherData.current.temperature
                };
            } catch (weatherError) {
                logger.warn('⚠️ No se pudo obtener clima:', weatherError.message);
            }
        }

        // Generar análisis con GPT-5 Mini
        const analysis = await aiService.generatePlayerAnalysis(playerData, context);

        res.json({
            success: true,
            player: playerData.name,
            team: playerData.team,
            analysis: analysis.content,
            context,
            usage: {
                tokens: analysis.tokens,
                cost: analysis.cost,
                model: 'gpt-5-mini'
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/matchday-prediction
 * Generar predicción de jornada
 */
router.post('/matchday-prediction', async (req, res) => {
    try {
        const { matchdayData, includeWeather } = req.body;

        let weatherData = {};
        if (includeWeather) {
            // Obtener clima general de Madrid como referencia
            try {
                const madridWeather = await weatherService.getCurrentWeatherForTeam('real_madrid');
                weatherData.generalConditions = `${madridWeather.current.description} (${madridWeather.current.temperature}°C)`;
            } catch (error) {
                weatherData.generalConditions = 'Condiciones normales';
            }
        }

        const prediction = await aiService.generateMatchdayPrediction(matchdayData, weatherData);

        res.json({
            success: true,
            matchday: matchdayData,
            prediction: prediction.content,
            weather_context: weatherData,
            usage: {
                tokens: prediction.tokens,
                cost: prediction.cost,
                model: 'gpt-5-mini'
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/social-post
 * Generar contenido para redes sociales
 */
router.post('/social-post', async (req, res) => {
    try {
        const { type, data, options } = req.body;

        if (!type || !data) {
            return res.status(400).json({
                success: false,
                error: 'type y data son requeridos'
            });
        }

        const validTypes = ['chollo', 'clima', 'resultado', 'prediccion'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Tipo debe ser uno de: ${validTypes.join(', ')}`
            });
        }

        const socialPost = await aiService.generateSocialPost(type, data, options);

        res.json({
            success: true,
            type,
            content: socialPost.content,
            data,
            usage: {
                tokens: socialPost.tokens,
                cost: socialPost.cost,
                model: 'gpt-5-mini'
            },
            ready_for: ['Instagram', 'TikTok', 'X'],
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/stats
 * Estadísticas de uso de GPT-5 Mini
 */
router.get('/stats', async (req, res) => {
    try {
        const validation = aiService.validateConfiguration();

        // Estimaciones de coste para diferentes volúmenes
        const costEstimates = {
            daily: {
                content_pieces: 50,
                avg_tokens: 500,
                estimated_cost: '$0.01',
                use_cases: ['Análisis jugadores', 'Posts redes sociales']
            },
            monthly: {
                content_pieces: 1500,
                avg_tokens: 15000,
                estimated_cost: '$0.29',
                use_cases: ['Análisis completos', 'Predicciones', 'Contenido social']
            },
            yearly: {
                content_pieces: 18000,
                avg_tokens: 180000,
                estimated_cost: '$3.48',
                use_cases: ['Temporada completa 2025-26']
            }
        };

        res.json({
            success: true,
            service_status: validation.isValid ? 'operational' : 'degraded',
            configuration: validation,
            cost_estimates: costEstimates,
            features: [
                'Análisis de jugadores contextual',
                'Predicciones de jornada',
                'Contenido para redes sociales',
                'Integración con datos clima',
                'Optimizado para Fantasy La Liga 2025-26'
            ],
            advantages: {
                vs_gpt4o_mini: '2.6x mejor calidad, solo $0.18/mes más',
                vs_gpt4o: 'Misma calidad, 12x más barato',
                cache_savings: '90% descuento en contenido repetitivo'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/bulk-analysis
 * Análisis masivo de jugadores (optimizado con cache)
 */
router.post('/bulk-analysis', async (req, res) => {
    try {
        const { players, maxPlayers = 10 } = req.body;

        if (!players || !Array.isArray(players)) {
            return res.status(400).json({
                success: false,
                error: 'players array es requerido'
            });
        }

        // Limitar para evitar costes excesivos
        const limitedPlayers = players.slice(0, maxPlayers);
        const results = [];
        let totalCost = 0;

        for (const playerData of limitedPlayers) {
            try {
                const analysis = await aiService.generatePlayerAnalysis(playerData);
                if (analysis.success) {
                    results.push({
                        player: playerData.name,
                        team: playerData.team,
                        analysis: analysis.content,
                        cost: analysis.cost.total
                    });
                    totalCost += analysis.cost.total;
                }
            } catch (error) {
                results.push({
                    player: playerData.name,
                    error: error.message
                });
            }

            // Pausa entre peticiones
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        res.json({
            success: true,
            processed: results.length,
            results,
            total_cost: {
                amount: totalCost,
                formatted: `$${totalCost.toFixed(4)}`
            },
            cache_note: 'Contenido similar obtendrá 90% descuento',
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;