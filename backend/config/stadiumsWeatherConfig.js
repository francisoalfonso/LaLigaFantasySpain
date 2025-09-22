/**
 * Configuración de estadios La Liga con coordenadas para API meteorológica
 * Incluye datos geográficos precisos para obtener condiciones climáticas
 */

const STADIUMS_WEATHER_CONFIG = {
    // Equipos La Liga 2024-2025 con coordenadas GPS exactas
    teams: {
        'real_madrid': {
            name: 'Real Madrid',
            stadium: 'Santiago Bernabéu',
            city: 'Madrid',
            coordinates: {
                latitude: 40.453053,
                longitude: -3.688344
            },
            timezone: 'Europe/Madrid',
            altitude: 667 // metros sobre el nivel del mar
        },
        'barcelona': {
            name: 'FC Barcelona',
            stadium: 'Camp Nou',
            city: 'Barcelona',
            coordinates: {
                latitude: 41.380898,
                longitude: 2.122820
            },
            timezone: 'Europe/Madrid',
            altitude: 12
        },
        'atletico_madrid': {
            name: 'Atlético de Madrid',
            stadium: 'Cívitas Metropolitano',
            city: 'Madrid',
            coordinates: {
                latitude: 40.436183,
                longitude: -3.599333
            },
            timezone: 'Europe/Madrid',
            altitude: 690
        },
        'sevilla': {
            name: 'Sevilla FC',
            stadium: 'Ramón Sánchez-Pizjuán',
            city: 'Sevilla',
            coordinates: {
                latitude: 37.384,
                longitude: -5.9705
            },
            timezone: 'Europe/Madrid',
            altitude: 11
        },
        'real_betis': {
            name: 'Real Betis',
            stadium: 'Benito Villamarín',
            city: 'Sevilla',
            coordinates: {
                latitude: 37.356111,
                longitude: -5.981667
            },
            timezone: 'Europe/Madrid',
            altitude: 8
        },
        'valencia': {
            name: 'Valencia CF',
            stadium: 'Mestalla',
            city: 'Valencia',
            coordinates: {
                latitude: 39.474722,
                longitude: -0.358611
            },
            timezone: 'Europe/Madrid',
            altitude: 15
        },
        'villarreal': {
            name: 'Villarreal CF',
            stadium: 'Estadio de la Cerámica',
            city: 'Villarreal',
            coordinates: {
                latitude: 39.944167,
                longitude: -0.103333
            },
            timezone: 'Europe/Madrid',
            altitude: 50
        },
        'athletic_bilbao': {
            name: 'Athletic Club',
            stadium: 'San Mamés',
            city: 'Bilbao',
            coordinates: {
                latitude: 43.264167,
                longitude: -2.949167
            },
            timezone: 'Europe/Madrid',
            altitude: 25
        },
        'real_sociedad': {
            name: 'Real Sociedad',
            stadium: 'Reale Arena',
            city: 'San Sebastián',
            coordinates: {
                latitude: 43.301389,
                longitude: -2.035833
            },
            timezone: 'Europe/Madrid',
            altitude: 251
        },
        'getafe': {
            name: 'Getafe CF',
            stadium: 'Coliseum Alfonso Pérez',
            city: 'Getafe',
            coordinates: {
                latitude: 40.325556,
                longitude: -3.714444
            },
            timezone: 'Europe/Madrid',
            altitude: 620
        },
        'osasuna': {
            name: 'CA Osasuna',
            stadium: 'El Sadar',
            city: 'Pamplona',
            coordinates: {
                latitude: 42.797222,
                longitude: -1.636667
            },
            timezone: 'Europe/Madrid',
            altitude: 449
        },
        'celta_vigo': {
            name: 'RC Celta',
            stadium: 'Balaídos',
            city: 'Vigo',
            coordinates: {
                latitude: 42.212,
                longitude: -8.738056
            },
            timezone: 'Europe/Madrid',
            altitude: 31
        },
        'deportivo_alaves': {
            name: 'Deportivo Alavés',
            stadium: 'Mendizorrotza',
            city: 'Vitoria-Gasteiz',
            coordinates: {
                latitude: 42.836944,
                longitude: -2.689722
            },
            timezone: 'Europe/Madrid',
            altitude: 524
        },
        'espanyol': {
            name: 'RCD Espanyol',
            stadium: 'RCDE Stadium',
            city: 'Cornellà de Llobregat',
            coordinates: {
                latitude: 41.347778,
                longitude: 2.075833
            },
            timezone: 'Europe/Madrid',
            altitude: 52
        },
        'girona': {
            name: 'Girona FC',
            stadium: 'Montilivi',
            city: 'Girona',
            coordinates: {
                latitude: 41.961667,
                longitude: 2.826944
            },
            timezone: 'Europe/Madrid',
            altitude: 77
        },
        'las_palmas': {
            name: 'UD Las Palmas',
            stadium: 'Estadio Gran Canaria',
            city: 'Las Palmas',
            coordinates: {
                latitude: 28.099722,
                longitude: -15.454722
            },
            timezone: 'Atlantic/Canary',
            altitude: 5
        },
        'leganes': {
            name: 'CD Leganés',
            stadium: 'Butarque',
            city: 'Leganés',
            coordinates: {
                latitude: 40.340278,
                longitude: -3.766667
            },
            timezone: 'Europe/Madrid',
            altitude: 610
        },
        'mallorca': {
            name: 'RCD Mallorca',
            stadium: 'Son Moix',
            city: 'Palma',
            coordinates: {
                latitude: 39.590278,
                longitude: 2.630833
            },
            timezone: 'Europe/Madrid',
            altitude: 12
        },
        'rayo_vallecano': {
            name: 'Rayo Vallecano',
            stadium: 'Campo de Fútbol de Vallecas',
            city: 'Madrid',
            coordinates: {
                latitude: 40.392222,
                longitude: -3.659167
            },
            timezone: 'Europe/Madrid',
            altitude: 666
        },
        'valladolid': {
            name: 'Real Valladolid',
            stadium: 'José Zorrilla',
            city: 'Valladolid',
            coordinates: {
                latitude: 41.644167,
                longitude: -4.761111
            },
            timezone: 'Europe/Madrid',
            altitude: 735
        }
    }
};

/**
 * Configuración de condiciones climáticas para personalización avatar
 */
const WEATHER_AVATAR_CONFIG = {
    // Rangos de temperatura (Celsius)
    temperature: {
        very_cold: { min: -10, max: 5, description: 'Muy frío' },
        cold: { min: 6, max: 12, description: 'Frío' },
        cool: { min: 13, max: 18, description: 'Fresco' },
        mild: { min: 19, max: 24, description: 'Templado' },
        warm: { min: 25, max: 30, description: 'Cálido' },
        hot: { min: 31, max: 40, description: 'Muy calor' }
    },

    // Condiciones de lluvia
    precipitation: {
        none: { min: 0, max: 0.1, description: 'Sin lluvia' },
        light: { min: 0.1, max: 2.5, description: 'Lluvia ligera' },
        moderate: { min: 2.5, max: 10, description: 'Lluvia moderada' },
        heavy: { min: 10, max: 50, description: 'Lluvia intensa' },
        very_heavy: { min: 50, max: 200, description: 'Lluvia torrencial' }
    },

    // Velocidad del viento (km/h)
    wind: {
        calm: { min: 0, max: 11, description: 'Viento calmo' },
        light: { min: 12, max: 19, description: 'Brisa ligera' },
        moderate: { min: 20, max: 28, description: 'Brisa moderada' },
        fresh: { min: 29, max: 38, description: 'Brisa fresca' },
        strong: { min: 39, max: 61, description: 'Viento fuerte' },
        gale: { min: 62, max: 88, description: 'Vendaval' }
    },

    // Tipos de clima por código OpenWeatherMap
    conditions: {
        clear: { codes: [800], description: 'Despejado', icon: '☀️' },
        few_clouds: { codes: [801], description: 'Pocas nubes', icon: '🌤️' },
        scattered_clouds: { codes: [802], description: 'Nubes dispersas', icon: '⛅' },
        broken_clouds: { codes: [803, 804], description: 'Muy nublado', icon: '☁️' },
        rain: { codes: [500, 501, 502, 503, 504], description: 'Lluvia', icon: '🌧️' },
        drizzle: { codes: [300, 301, 302, 310, 311, 312, 313, 314, 321], description: 'Llovizna', icon: '🌦️' },
        thunderstorm: { codes: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232], description: 'Tormenta', icon: '⛈️' },
        snow: { codes: [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622], description: 'Nieve', icon: '🌨️' },
        mist: { codes: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781], description: 'Niebla', icon: '🌫️' }
    }
};

/**
 * Configuración de vestuario del avatar según condiciones climáticas
 */
const AVATAR_WARDROBE_CONFIG = {
    // Configuración de ropa según temperatura
    clothing: {
        very_cold: {
            outfit: 'abrigo_invierno',
            description: 'Abrigo grueso, bufanda, guantes',
            heygen_template: 'winter_coat_formal',
            colors: ['negro', 'azul_marino', 'gris_oscuro'],
            accessories: ['bufanda', 'guantes']
        },
        cold: {
            outfit: 'chaqueta_abrigada',
            description: 'Chaqueta de invierno, jersey',
            heygen_template: 'jacket_sweater',
            colors: ['azul', 'gris', 'marrón'],
            accessories: ['bufanda_ligera']
        },
        cool: {
            outfit: 'blazer_jersey',
            description: 'Blazer con jersey o camisa manga larga',
            heygen_template: 'blazer_casual',
            colors: ['azul_marino', 'gris', 'beige'],
            accessories: []
        },
        mild: {
            outfit: 'camisa_manga_larga',
            description: 'Camisa manga larga, opcional blazer ligero',
            heygen_template: 'business_casual',
            colors: ['blanco', 'azul_claro', 'gris_claro'],
            accessories: []
        },
        warm: {
            outfit: 'camisa_manga_corta',
            description: 'Camisa manga corta, polo deportivo',
            heygen_template: 'summer_shirt',
            colors: ['blanco', 'azul_claro', 'celeste'],
            accessories: []
        },
        hot: {
            outfit: 'polo_ligero',
            description: 'Polo ligero, camiseta deportiva',
            heygen_template: 'summer_polo',
            colors: ['blanco', 'azul_claro', 'gris_claro'],
            accessories: []
        }
    },

    // Modificaciones por lluvia
    rain_modifications: {
        light: {
            additions: ['paraguas_pequeño'],
            outfit_changes: ['chaqueta_impermeable_ligera']
        },
        moderate: {
            additions: ['paraguas'],
            outfit_changes: ['chaqueta_impermeable', 'capucha']
        },
        heavy: {
            additions: ['paraguas_grande'],
            outfit_changes: ['abrigo_impermeable', 'capucha', 'botas_agua']
        }
    },

    // Modificaciones por viento
    wind_modifications: {
        strong: {
            outfit_changes: ['chaqueta_cerrada', 'sin_bufanda_suelta'],
            hair_style: 'peinado_fijo'
        },
        gale: {
            outfit_changes: ['abrigo_cerrado', 'capucha'],
            hair_style: 'peinado_muy_fijo'
        }
    }
};

/**
 * Plantillas de comentarios meteorológicos para el avatar
 */
const WEATHER_COMMENTARY_TEMPLATES = {
    pre_match: {
        sunny: [
            "¡Perfecto día de fútbol en {city}! Con {temperature}°C y cielo despejado, las condiciones son ideales para el partido de hoy.",
            "El sol acompaña en {stadium} con una temperatura agradable de {temperature}°C. ¡Excelente clima para disfrutar del fútbol!",
            "Día espléndido en {city}. Los {temperature}°C y el cielo despejado prometen un gran espectáculo futbolístico."
        ],
        rainy: [
            "Lluvia en {city} con {temperature}°C. El césped de {stadium} podría estar resbaladizo, lo que añade emoción al encuentro.",
            "Condiciones lluviosas en {stadium}. Los {temperature}°C y la lluvia pueden cambiar la dinámica del juego de hoy.",
            "El clima añade drama al partido: lluvia y {temperature}°C en {city}. ¡Los jugadores tendrán que adaptarse!"
        ],
        cold: [
            "¡Frío intenso en {city}! Con solo {temperature}°C, los jugadores necesitarán entrar en calor rápidamente.",
            "Temperaturas de {temperature}°C en {stadium}. El frío puede afectar el rendimiento, especialmente en los primeros minutos.",
            "Condiciones invernales en {city} con {temperature}°C. ¡La intensidad del juego ayudará a combatir el frío!"
        ],
        hot: [
            "¡Calor intenso en {city}! Con {temperature}°C, la hidratación será clave para ambos equipos.",
            "Temperaturas altas de {temperature}°C en {stadium}. Los cambios serán estratégicos para mantener la intensidad.",
            "Día caluroso en {city} con {temperature}°C. El ritmo del partido podría verse afectado por las altas temperaturas."
        ],
        windy: [
            "Viento fuerte en {stadium} con {temperature}°C. Los saques de esquina y tiros libres serán especialmente desafiantes.",
            "Condiciones ventosas en {city}. Con {temperature}°C y viento, los porteros tendrán trabajo extra hoy.",
            "El viento añade un factor extra en {stadium}. Los {temperature}°C y las ráfgas harán del partido algo impredecible."
        ]
    },

    during_match: {
        weather_change: [
            "¡El clima está cambiando en {stadium}! Ahora tenemos {new_condition} con {temperature}°C.",
            "Actualización meteorológica: {new_condition} y {temperature}°C están afectando las condiciones de juego.",
            "El tiempo evoluciona en {city}: {new_condition} con {temperature}°C. ¡Los jugadores se adaptan sobre la marcha!"
        ]
    },

    post_match: [
        "A pesar de las condiciones de {weather_condition} y {temperature}°C, hemos visto un gran partido en {stadium}.",
        "El clima de {city} ({weather_condition}, {temperature}°C) no impidió que disfrutáramos de un excelente encuentro.",
        "Con {weather_condition} y {temperature}°C en {stadium}, los jugadores demostraron su profesionalidad adaptándose a las condiciones."
    ]
};

module.exports = {
    STADIUMS_WEATHER_CONFIG,
    WEATHER_AVATAR_CONFIG,
    AVATAR_WARDROBE_CONFIG,
    WEATHER_COMMENTARY_TEMPLATES
};