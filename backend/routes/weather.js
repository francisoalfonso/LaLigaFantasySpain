/**
 * Rutas API para funcionalidad meteorológica
 * Integra OpenWeatherMap con personalización avatar para Fantasy La Liga
 * Refactorizado para usar Error Handler centralizado
 */

const express = require('express');
const router = express.Router();
const WeatherService = require('../services/weatherService');
const { STADIUMS_WEATHER_CONFIG } = require('../config/stadiumsWeatherConfig');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');

// Inicializar servicio meteorológico
const weatherService = new WeatherService();

/**
 * GET /api/weather/test
 * Test de conexión con OpenWeatherMap API
 */
router.get(
    '/test',
    asyncHandler(async (req, res) => {
        const validation = weatherService.validateConfiguration();

        // Test con Real Madrid como ejemplo
        const testWeather = await weatherService.getCurrentWeatherForTeam('real_madrid');

        res.json({
            success: true,
            message: 'Weather service funcionando correctamente',
            configuration: validation,
            test_data: testWeather,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * GET /api/weather/teams
 * Lista todos los equipos configurados con sus ubicaciones
 */
router.get(
    '/teams',
    asyncHandler(async (req, res) => {
        const teams = Object.entries(STADIUMS_WEATHER_CONFIG.teams).map(([key, data]) => ({
            key,
            name: data.name,
            stadium: data.stadium,
            city: data.city,
            coordinates: data.coordinates,
            timezone: data.timezone,
            altitude: data.altitude
        }));

        res.json({
            success: true,
            teams,
            total_teams: teams.length,
            coverage: 'La Liga 2025-2026 completa'
        });
    })
);

/**
 * GET /api/weather/current/:teamKey
 * Obtener clima actual para un equipo específico
 */
router.get(
    '/current/:teamKey',
    asyncHandler(async (req, res) => {
        const { teamKey } = req.params;

        if (!STADIUMS_WEATHER_CONFIG.teams[teamKey]) {
            throw new NotFoundError('Equipo', teamKey);
        }

        const weatherData = await weatherService.getCurrentWeatherForTeam(teamKey);
        const n8nFormat = weatherService.formatForN8nWorkflow(weatherData);

        res.json({
            success: true,
            data: weatherData,
            n8n_format: n8nFormat,
            is_default: weatherData.isDefault || false
        });
    })
);

/**
 * GET /api/weather/forecast/:teamKey
 * Obtener pronóstico para un equipo (próximas 24h)
 */
router.get(
    '/forecast/:teamKey',
    asyncHandler(async (req, res) => {
        const { teamKey } = req.params;
        const { matchDateTime } = req.query;

        if (!STADIUMS_WEATHER_CONFIG.teams[teamKey]) {
            throw new NotFoundError('Equipo', teamKey);
        }

        let weatherData;
        if (matchDateTime) {
            // Pronóstico específico para hora del partido
            weatherData = await weatherService.getMatchTimeWeather(teamKey, matchDateTime);
        } else {
            // Clima actual por defecto
            weatherData = await weatherService.getCurrentWeatherForTeam(teamKey);
        }

        res.json({
            success: true,
            data: weatherData,
            match_time: matchDateTime || null,
            is_forecast: !!matchDateTime
        });
    })
);

/**
 * GET /api/weather/all-teams
 * Obtener clima actual para todos los equipos de La Liga
 */
router.get(
    '/all-teams',
    asyncHandler(async (req, res) => {
        const teamKeys = Object.keys(STADIUMS_WEATHER_CONFIG.teams);
        const allWeatherData = await weatherService.getWeatherForMultipleTeams(teamKeys);

        // Agregar estadísticas generales
        const stats = {
            total_teams: teamKeys.length,
            successful_calls: Object.values(allWeatherData).filter((data) => !data.isDefault)
                .length,
            failed_calls: Object.values(allWeatherData).filter((data) => data.isDefault).length,
            average_temperature:
                Object.values(allWeatherData).reduce(
                    (sum, data) => sum + data.current.temperature,
                    0
                ) / teamKeys.length
        };

        res.json({
            success: true,
            data: allWeatherData,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * POST /api/weather/avatar-config
 * Generar configuración de avatar para condiciones específicas
 */
router.post(
    '/avatar-config',
    asyncHandler(async (req, res) => {
        const { teamKey, matchDateTime, customConditions } = req.body;

        if (!teamKey && !customConditions) {
            throw new ValidationError('Se requiere teamKey o customConditions');
        }

        let weatherData;

        if (teamKey) {
            // Usar datos reales del equipo
            if (matchDateTime) {
                weatherData = await weatherService.getMatchTimeWeather(teamKey, matchDateTime);
            } else {
                weatherData = await weatherService.getCurrentWeatherForTeam(teamKey);
            }
        } else {
            // Usar condiciones personalizadas para testing
            weatherData = {
                current: customConditions,
                avatar: weatherService.determineAvatarConfiguration(
                    weatherService.categorizeTemperature(customConditions.temperature),
                    weatherService.categorizePrecipitation(customConditions.precipitation || 0),
                    weatherService.categorizeWind(customConditions.windSpeed || 0),
                    weatherService.categorizeWeatherCondition(customConditions.code || 800)
                )
            };
        }

        res.json({
            success: true,
            avatar_configuration: weatherData.avatar,
            weather_conditions: weatherData.current,
            heygen_template: weatherData.avatar.heygen_template,
            commentary_suggestion:
                weatherData.commentary || 'Condiciones normales para el fútbol'
        });
    })
);

/**
 * GET /api/weather/match-context/:homeTeam/:awayTeam
 * Contexto meteorológico completo para un partido específico
 */
router.get(
    '/match-context/:homeTeam/:awayTeam',
    asyncHandler(async (req, res) => {
        const { homeTeam, awayTeam } = req.params;
        const { matchDateTime } = req.query;

        // El clima siempre se basa en el estadio del equipo local
        const weatherData = matchDateTime
            ? await weatherService.getMatchTimeWeather(homeTeam, matchDateTime)
            : await weatherService.getCurrentWeatherForTeam(homeTeam);

        // Generar contexto específico del partido
        const matchContext = {
            home_team: STADIUMS_WEATHER_CONFIG.teams[homeTeam]?.name || homeTeam,
            away_team: STADIUMS_WEATHER_CONFIG.teams[awayTeam]?.name || awayTeam,
            venue: weatherData.team,
            weather: weatherData,
            match_time: matchDateTime,
            content_suggestions: {
                pre_match: weatherData.commentary,
                hashtags: [
                    `#${homeTeam}vs${awayTeam}`,
                    `#LaLiga`,
                    weatherData.current.temperature < 10
                        ? '#FutbolInvernal'
                        : weatherData.current.temperature > 30
                          ? '#CalorEnElCampo'
                          : '#TiempoIdeal',
                    weatherData.current.precipitation > 0 ? '#FutbolBajoLaLluvia' : '#TiempoSeco'
                ]
            }
        };

        res.json({
            success: true,
            match_context: matchContext,
            n8n_ready: weatherService.formatForN8nWorkflow(weatherData)
        });
    })
);

/**
 * GET /api/weather/stats
 * Estadísticas generales del servicio meteorológico
 */
router.get(
    '/stats',
    asyncHandler(async (req, res) => {
        const validation = weatherService.validateConfiguration();
        const teamKeys = Object.keys(STADIUMS_WEATHER_CONFIG.teams);

        // Test rápido con 3 equipos principales
        const sampleTeams = ['real_madrid', 'barcelona', 'atletico_madrid'];
        const sampleWeather = await weatherService.getWeatherForMultipleTeams(sampleTeams);

        const stats = {
            service_status: validation.isValid ? 'operational' : 'degraded',
            configuration: validation.configuration,
            total_stadiums: teamKeys.length,
            geographic_coverage: {
                cities: [
                    ...new Set(Object.values(STADIUMS_WEATHER_CONFIG.teams).map((t) => t.city))
                ].length,
                timezones: [
                    ...new Set(Object.values(STADIUMS_WEATHER_CONFIG.teams).map((t) => t.timezone))
                ],
                altitude_range: {
                    min: Math.min(
                        ...Object.values(STADIUMS_WEATHER_CONFIG.teams).map((t) => t.altitude)
                    ),
                    max: Math.max(
                        ...Object.values(STADIUMS_WEATHER_CONFIG.teams).map((t) => t.altitude)
                    )
                }
            },
            sample_data: sampleWeather,
            last_check: new Date().toISOString()
        };

        res.json({
            success: true,
            statistics: stats
        });
    })
);

module.exports = router;