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
const {
    AEMET_MUNICIPIOS_MAPPING,
    AEMET_ENDPOINTS,
    AEMET_WEATHER_CODES,
    AEMET_WEATHER_DESCRIPTIONS
} = require('../config/aemetMunicipios');

class WeatherService {
    constructor() {
        // APIs configuradas
        this.aemetApiKey = process.env.AEMET_API_KEY;
        this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

        // URLs base
        this.aemetBaseUrl = AEMET_ENDPOINTS.base_url;
        this.openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';

        // Configurar prioridad: AEMET principal, OpenWeather fallback
        this.useAemet = !!this.aemetApiKey;
        this.useOpenWeather = !!this.openWeatherApiKey;

        if (!this.aemetApiKey && !this.openWeatherApiKey) {
            console.warn('⚠️ Ninguna API meteorológica configurada. Usando datos por defecto.');
        } else if (this.useAemet) {
            console.log('✅ AEMET API configurada como principal');
            if (this.useOpenWeather) {
                console.log('✅ OpenWeatherMap configurada como fallback');
            }
        } else if (this.useOpenWeather) {
            console.log('✅ OpenWeatherMap API configurada (AEMET no disponible)');
        }
    }

    /**
     * Obtener datos meteorológicos usando AEMET (prioritario)
     */
    async getWeatherFromAemet(teamKey) {
        const municipioData = AEMET_MUNICIPIOS_MAPPING[teamKey];
        if (!municipioData) {
            throw new Error(`Municipio AEMET no encontrado para equipo: ${teamKey}`);
        }

        // Priorizar datos de estación meteorológica en tiempo real si está disponible
        if (municipioData.estacion_meteorologica) {
            try {
                return await this.getWeatherFromAemetStation(municipioData.estacion_meteorologica, municipioData);
            } catch (stationError) {
                console.warn(`Estación meteorológica ${municipioData.estacion_meteorologica} falló, usando predicción municipal...`);
            }
        }

        // Fallback a predicción municipal
        const url = `${this.aemetBaseUrl}${AEMET_ENDPOINTS.prediccion_municipio}/${municipioData.codigo_aemet}`;

        try {
            // AEMET API retorna URL de datos en primera llamada
            const response = await axios.get(url, {
                params: { api_key: this.aemetApiKey }
            });

            if (response.data && response.data.datos) {
                // Obtener datos reales de la URL proporcionada
                const dataResponse = await axios.get(response.data.datos);
                return this.processAemetData(dataResponse.data, municipioData);
            }

            throw new Error('No se pudieron obtener datos de AEMET');
        } catch (error) {
            console.error(`Error AEMET para ${teamKey}:`, error.message);
            throw error;
        }
    }

    /**
     * Obtener datos meteorológicos en tiempo real de estación AEMET
     */
    async getWeatherFromAemetStation(stationId, municipioData) {
        const url = `${this.aemetBaseUrl}${AEMET_ENDPOINTS.observacion_meteorologica}/${stationId}`;

        try {
            // AEMET API retorna URL de datos en primera llamada
            const response = await axios.get(url, {
                params: { api_key: this.aemetApiKey }
            });

            if (response.data && response.data.datos) {
                // Obtener datos reales de la URL proporcionada
                const dataResponse = await axios.get(response.data.datos);
                return this.processAemetStationData(dataResponse.data, municipioData);
            }

            throw new Error(`No se pudieron obtener datos de la estación ${stationId}`);
        } catch (error) {
            console.error(`Error estación AEMET ${stationId}:`, error.message);
            throw error;
        }
    }

    /**
     * Procesar datos meteorológicos de AEMET
     */
    processAemetData(aemetData, municipioData) {
        // AEMET retorna array con predicción por días
        const today = aemetData[0];
        if (!today) {
            throw new Error('No hay datos meteorológicos para hoy');
        }

        // Extraer datos del primer período del día
        const temperatura = today.temperatura || {};
        const precipitacion = today.precipitacion || [];
        const viento = today.viento || [];
        const estadoCielo = today.estadoCielo || [];

        const tempMax = parseInt(temperatura.maxima) || 20;
        const tempMin = parseInt(temperatura.minima) || 15;
        const tempActual = Math.round((tempMax + tempMin) / 2);

        // Obtener precipitación y viento del período actual
        const precipitacionHoy = precipitacion[0] ? parseInt(precipitacion[0].value) || 0 : 0;
        const vientoHoy = viento[0] ? parseInt(viento[0].velocidad) || 0 : 0;
        const estadoCieloHoy = estadoCielo[0] ? estadoCielo[0].value : '11';

        // Convertir código AEMET a código OpenWeather equivalente
        const weatherCode = AEMET_WEATHER_CODES[estadoCieloHoy] || 800;
        const description = AEMET_WEATHER_DESCRIPTIONS[estadoCieloHoy] || 'Despejado';

        return {
            main: {
                temp: tempActual,
                feels_like: tempActual,
                humidity: 60 // AEMET no siempre proporciona humedad
            },
            wind: {
                speed: vientoHoy / 3.6 // convertir km/h a m/s
            },
            rain: precipitacionHoy > 0 ? { '1h': precipitacionHoy } : undefined,
            weather: [{
                id: weatherCode,
                main: description,
                description: description.toLowerCase()
            }]
        };
    }

    /**
     * Procesar datos de estación meteorológica AEMET (tiempo real)
     */
    processAemetStationData(stationData, municipioData) {
        // Los datos vienen como array, obtener la lectura más reciente
        if (!stationData || !Array.isArray(stationData) || stationData.length === 0) {
            throw new Error('No hay datos de estación meteorológica disponibles');
        }

        // Obtener la lectura más reciente (último elemento del array)
        const latest = stationData[stationData.length - 1];

        // Extraer datos en tiempo real
        const temperatura = Math.round(parseFloat(latest.ta) || 20); // ta = temperatura actual
        const humedad = parseInt(latest.hr) || 60; // hr = humedad relativa
        const presion = parseFloat(latest.pres) || 1013; // pres = presión
        const viento = parseFloat(latest.vv) || 0; // vv = velocidad viento m/s
        const precipitacion = parseFloat(latest.prec) || 0; // prec = precipitación

        // Determinar descripción basada en precipitación y humedad
        let description = 'despejado';
        let weatherCode = 800;

        if (precipitacion > 0.5) {
            description = 'lluvia';
            weatherCode = 500;
        } else if (humedad > 85) {
            description = 'muy nuboso';
            weatherCode = 804;
        } else if (humedad > 70) {
            description = 'nuboso';
            weatherCode = 803;
        }

        console.log(`🌡️ Estación ${latest.ubi}: ${temperatura}°C, ${description}, hr:${humedad}%, prec:${precipitacion}mm`);

        // Retornar en formato compatible con OpenWeatherMap
        return {
            main: {
                temp: temperatura,
                feels_like: temperatura, // Usar misma temperatura
                humidity: humedad,
                pressure: presion
            },
            wind: {
                speed: viento // AEMET ya en m/s
            },
            rain: precipitacion > 0 ? { '1h': precipitacion } : undefined,
            weather: [{
                id: weatherCode,
                main: description,
                description: description.toLowerCase()
            }]
        };
    }

    /**
     * Obtener datos meteorológicos usando OpenWeatherMap (fallback)
     */
    async getWeatherFromOpenWeather(teamKey) {
        const teamData = STADIUMS_WEATHER_CONFIG.teams[teamKey];
        if (!teamData) {
            throw new Error(`Equipo no encontrado: ${teamKey}`);
        }

        const { latitude, longitude } = teamData.coordinates;

        const response = await axios.get(`${this.openWeatherBaseUrl}/weather`, {
            params: {
                lat: latitude,
                lon: longitude,
                appid: this.openWeatherApiKey,
                units: 'metric',
                lang: 'es'
            }
        });

        return response.data;
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

            let weatherData = null;
            let source = 'default';

            // Intentar AEMET primero
            if (this.useAemet) {
                try {
                    weatherData = await this.getWeatherFromAemet(teamKey);
                    source = 'aemet';
                    console.log(`☀️ Datos AEMET obtenidos para ${teamKey}`);
                } catch (aemetError) {
                    console.warn(`⚠️ AEMET falló para ${teamKey}, intentando OpenWeather...`);
                }
            }

            // Fallback a OpenWeatherMap si AEMET falla
            if (!weatherData && this.useOpenWeather) {
                try {
                    weatherData = await this.getWeatherFromOpenWeather(teamKey);
                    source = 'openweather';
                    console.log(`🌤️ Datos OpenWeather obtenidos para ${teamKey}`);
                } catch (openWeatherError) {
                    console.warn(`⚠️ OpenWeather también falló para ${teamKey}`);
                }
            }

            // Si ambas APIs fallan, usar datos por defecto
            if (!weatherData) {
                console.log(`📋 Usando datos por defecto para ${teamKey}`);
                return this.getDefaultWeatherData(teamKey);
            }

            const processedData = this.processWeatherData(weatherData, teamData);
            processedData.data_source = source;
            return processedData;

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

        if (!this.aemetApiKey && !this.openWeatherApiKey) {
            issues.push('Ninguna API meteorológica configurada (AEMET o OpenWeatherMap)');
        }

        const teamCount = Object.keys(STADIUMS_WEATHER_CONFIG.teams).length;
        if (teamCount < 20) {
            issues.push(`Solo ${teamCount} equipos configurados, se esperan 20`);
        }

        const aemetTeams = Object.keys(AEMET_MUNICIPIOS_MAPPING).length;
        if (aemetTeams < teamCount) {
            issues.push(`Solo ${aemetTeams} municipios AEMET configurados de ${teamCount} equipos`);
        }

        return {
            isValid: issues.length === 0,
            issues,
            configuration: {
                aemet_api_configured: !!this.aemetApiKey,
                openweather_api_configured: !!this.openWeatherApiKey,
                primary_source: this.useAemet ? 'AEMET' : (this.useOpenWeather ? 'OpenWeatherMap' : 'Ninguna'),
                teams_configured: teamCount,
                aemet_municipalities: aemetTeams,
                weather_conditions: Object.keys(WEATHER_AVATAR_CONFIG.conditions).length,
                clothing_options: Object.keys(AVATAR_WARDROBE_CONFIG.clothing).length,
                fallback_enabled: this.useAemet && this.useOpenWeather
            }
        };
    }
}

module.exports = WeatherService;