/**
 * Servicio de integración meteorológica para Fantasy La Liga
 * Integra OpenWeatherMap API con datos de estadios y personalización avatar
 */

const axios = require('axios');
const {
    STADIUMS_WEATHER_CONFIG,
    WEATHER_AVATAR_CONFIG,
    AVATAR_WARDROBE_CONFIG,
    WEATHER_COMMENTARY_TEMPLATES
} = require('../config/stadiumsWeatherConfig');

class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';

        if (!this.apiKey) {
            console.warn('⚠️ OPENWEATHER_API_KEY no configurada. Funcionalidad meteorológica limitada.');
        }
    }

    /**
     * Obtener datos meteorológicos actuales para un equipo específico
     */
    async getCurrentWeatherForTeam(teamKey) {
        try {
            const teamData = STADIUMS_WEATHER_CONFIG.teams[teamKey];
            if (!teamData) {
                throw new Error(`Equipo no encontrado: ${teamKey}`);
            }

            const { latitude, longitude } = teamData.coordinates;

            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: this.apiKey,
                    units: 'metric',
                    lang: 'es'
                }
            });

            return this.processWeatherData(response.data, teamData);
        } catch (error) {
            console.error(`Error obteniendo clima para ${teamKey}:`, error.message);
            return this.getDefaultWeatherData(teamKey);
        }
    }

    /**
     * Obtener pronóstico meteorológico para hora del partido
     */
    async getMatchTimeWeather(teamKey, matchDateTime) {
        try {
            const teamData = STADIUMS_WEATHER_CONFIG.teams[teamKey];
            if (!teamData) {
                throw new Error(`Equipo no encontrado: ${teamKey}`);
            }

            const { latitude, longitude } = teamData.coordinates;

            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: this.apiKey,
                    units: 'metric',
                    lang: 'es'
                }
            });

            // Encontrar el pronóstico más cercano a la hora del partido
            const matchTime = new Date(matchDateTime);
            const forecast = this.findClosestForecast(response.data.list, matchTime);

            return this.processWeatherData(forecast, teamData, matchTime);
        } catch (error) {
            console.error(`Error obteniendo pronóstico para ${teamKey}:`, error.message);
            return this.getDefaultWeatherData(teamKey);
        }
    }

    /**
     * Procesar datos meteorológicos y enriquecer con información del estadio
     */
    processWeatherData(weatherData, teamData, matchTime = null) {
        const temperature = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const humidity = weatherData.main.humidity;
        const windSpeed = Math.round(weatherData.wind?.speed * 3.6); // m/s a km/h
        const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;
        const weatherCode = weatherData.weather[0].id;
        const weatherDescription = weatherData.weather[0].description;

        // Clasificar condiciones climáticas
        const tempCategory = this.categorizeTemperature(temperature);
        const precipCategory = this.categorizePrecipitation(precipitation);
        const windCategory = this.categorizeWind(windSpeed);
        const weatherCondition = this.categorizeWeatherCondition(weatherCode);

        // Determinar configuración del avatar
        const avatarConfig = this.determineAvatarConfiguration(
            tempCategory,
            precipCategory,
            windCategory,
            weatherCondition
        );

        return {
            team: teamData,
            timestamp: matchTime || new Date(),
            current: {
                temperature,
                feelsLike,
                humidity,
                windSpeed,
                precipitation,
                description: weatherDescription,
                code: weatherCode
            },
            categories: {
                temperature: tempCategory,
                precipitation: precipCategory,
                wind: windCategory,
                condition: weatherCondition
            },
            avatar: avatarConfig,
            commentary: this.generateWeatherCommentary(teamData, {
                temperature,
                condition: weatherCondition,
                description: weatherDescription
            })
        };
    }

    /**
     * Encontrar el pronóstico más cercano a la hora del partido
     */
    findClosestForecast(forecastList, matchTime) {
        let closest = forecastList[0];
        let minDiff = Math.abs(new Date(closest.dt * 1000) - matchTime);

        for (const forecast of forecastList) {
            const forecastTime = new Date(forecast.dt * 1000);
            const diff = Math.abs(forecastTime - matchTime);

            if (diff < minDiff) {
                minDiff = diff;
                closest = forecast;
            }
        }

        return closest;
    }

    /**
     * Categorizar temperatura
     */
    categorizeTemperature(temp) {
        for (const [category, range] of Object.entries(WEATHER_AVATAR_CONFIG.temperature)) {
            if (temp >= range.min && temp <= range.max) {
                return category;
            }
        }
        return temp < 5 ? 'very_cold' : 'hot';
    }

    /**
     * Categorizar precipitación
     */
    categorizePrecipitation(precip) {
        for (const [category, range] of Object.entries(WEATHER_AVATAR_CONFIG.precipitation)) {
            if (precip >= range.min && precip <= range.max) {
                return category;
            }
        }
        return 'very_heavy';
    }

    /**
     * Categorizar viento
     */
    categorizeWind(windSpeed) {
        for (const [category, range] of Object.entries(WEATHER_AVATAR_CONFIG.wind)) {
            if (windSpeed >= range.min && windSpeed <= range.max) {
                return category;
            }
        }
        return 'gale';
    }

    /**
     * Categorizar condición meteorológica
     */
    categorizeWeatherCondition(code) {
        for (const [condition, data] of Object.entries(WEATHER_AVATAR_CONFIG.conditions)) {
            if (data.codes.includes(code)) {
                return condition;
            }
        }
        return 'clear';
    }

    /**
     * Determinar configuración completa del avatar según condiciones
     */
    determineAvatarConfiguration(tempCategory, precipCategory, windCategory, weatherCondition) {
        // Configuración base según temperatura
        const baseClothing = AVATAR_WARDROBE_CONFIG.clothing[tempCategory];

        // Modificaciones por lluvia
        let modifications = {
            additions: [],
            outfit_changes: [],
            hair_style: 'normal'
        };

        if (precipCategory !== 'none') {
            const rainMods = AVATAR_WARDROBE_CONFIG.rain_modifications[precipCategory] ||
                           AVATAR_WARDROBE_CONFIG.rain_modifications['light'];
            modifications.additions.push(...rainMods.additions);
            modifications.outfit_changes.push(...rainMods.outfit_changes);
        }

        // Modificaciones por viento
        if (windCategory === 'strong' || windCategory === 'gale') {
            const windMods = AVATAR_WARDROBE_CONFIG.wind_modifications[windCategory];
            modifications.outfit_changes.push(...windMods.outfit_changes);
            modifications.hair_style = windMods.hair_style;
        }

        return {
            base_outfit: baseClothing.outfit,
            heygen_template: baseClothing.heygen_template,
            colors: baseClothing.colors,
            accessories: [...baseClothing.accessories, ...modifications.additions],
            modifications: modifications,
            weather_context: {
                temperature: tempCategory,
                precipitation: precipCategory,
                wind: windCategory,
                condition: weatherCondition
            }
        };
    }

    /**
     * Generar comentarios meteorológicos contextuales
     */
    generateWeatherCommentary(teamData, weatherInfo) {
        const templates = WEATHER_COMMENTARY_TEMPLATES.pre_match;
        let templateCategory = 'sunny'; // default

        // Seleccionar categoría de template según condiciones
        if (weatherInfo.temperature < 10) {
            templateCategory = 'cold';
        } else if (weatherInfo.temperature > 28) {
            templateCategory = 'hot';
        } else if (weatherInfo.condition.includes('rain') || weatherInfo.condition.includes('drizzle')) {
            templateCategory = 'rainy';
        } else if (weatherInfo.condition === 'strong' || weatherInfo.condition === 'gale') {
            templateCategory = 'windy';
        }

        const templateList = templates[templateCategory] || templates['sunny'];
        const template = templateList[Math.floor(Math.random() * templateList.length)];

        // Reemplazar variables en el template
        return template
            .replace('{city}', teamData.city)
            .replace('{stadium}', teamData.stadium)
            .replace('{temperature}', weatherInfo.temperature)
            .replace('{weather_condition}', weatherInfo.description);
    }

    /**
     * Obtener datos meteorológicos por defecto en caso de error
     */
    getDefaultWeatherData(teamKey) {
        const teamData = STADIUMS_WEATHER_CONFIG.teams[teamKey];
        return {
            team: teamData,
            timestamp: new Date(),
            current: {
                temperature: 20,
                feelsLike: 20,
                humidity: 60,
                windSpeed: 10,
                precipitation: 0,
                description: 'condiciones normales',
                code: 800
            },
            categories: {
                temperature: 'mild',
                precipitation: 'none',
                wind: 'light',
                condition: 'clear'
            },
            avatar: {
                base_outfit: 'camisa_manga_larga',
                heygen_template: 'business_casual',
                colors: ['azul_navy', 'blanco'],
                accessories: [],
                modifications: {
                    additions: [],
                    outfit_changes: [],
                    hair_style: 'normal'
                }
            },
            commentary: `Condiciones normales en ${teamData.stadium}. ¡Perfecto para disfrutar del fútbol!`,
            isDefault: true
        };
    }

    /**
     * Obtener clima para múltiples equipos (útil para jornadas completas)
     */
    async getWeatherForMultipleTeams(teamKeys) {
        const promises = teamKeys.map(teamKey =>
            this.getCurrentWeatherForTeam(teamKey).catch(error => ({
                teamKey,
                error: error.message,
                data: this.getDefaultWeatherData(teamKey)
            }))
        );

        const results = await Promise.all(promises);

        return results.reduce((acc, result) => {
            if (result.error) {
                acc[result.teamKey] = result.data;
                console.warn(`Weather fallback for ${result.teamKey}: ${result.error}`);
            } else {
                acc[result.teamKey] = result;
            }
            return acc;
        }, {});
    }

    /**
     * Formatear datos meteorológicos para n8n workflow
     */
    formatForN8nWorkflow(weatherData) {
        return {
            weather: {
                team_info: {
                    name: weatherData.team.name,
                    stadium: weatherData.team.stadium,
                    city: weatherData.team.city
                },
                current_conditions: {
                    temperature: weatherData.current.temperature,
                    feels_like: weatherData.current.feelsLike,
                    description: weatherData.current.description,
                    wind_speed: weatherData.current.windSpeed,
                    humidity: weatherData.current.humidity,
                    precipitation: weatherData.current.precipitation
                },
                avatar_configuration: {
                    outfit: weatherData.avatar.base_outfit,
                    template: weatherData.avatar.heygen_template,
                    colors: weatherData.avatar.colors,
                    accessories: weatherData.avatar.accessories,
                    modifications: weatherData.avatar.modifications
                },
                commentary: weatherData.commentary,
                timestamp: weatherData.timestamp
            }
        };
    }

    /**
     * Validar configuración de API
     */
    validateConfiguration() {
        const issues = [];

        if (!this.apiKey) {
            issues.push('OPENWEATHER_API_KEY no configurada');
        }

        const teamCount = Object.keys(STADIUMS_WEATHER_CONFIG.teams).length;
        if (teamCount < 20) {
            issues.push(`Solo ${teamCount} equipos configurados, se esperan 20`);
        }

        return {
            isValid: issues.length === 0,
            issues,
            configuration: {
                api_key_configured: !!this.apiKey,
                teams_configured: teamCount,
                weather_conditions: Object.keys(WEATHER_AVATAR_CONFIG.conditions).length,
                clothing_options: Object.keys(AVATAR_WARDROBE_CONFIG.clothing).length
            }
        };
    }
}

module.exports = WeatherService;