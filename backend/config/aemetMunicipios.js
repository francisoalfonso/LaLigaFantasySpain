/**
 * Mapeo de equipos La Liga con códigos de municipios AEMET
 * AEMET utiliza códigos específicos para cada municipio español
 */

const AEMET_MUNICIPIOS_MAPPING = {
    // Equipos principales por ciudad
    'real_madrid': {
        municipio: 'Madrid',
        codigo_aemet: '28079', // Madrid capital
        provincia: 'Madrid',
        codigo_provincia: '28'
    },
    'atletico_madrid': {
        municipio: 'Madrid',
        codigo_aemet: '28079', // Madrid capital
        provincia: 'Madrid',
        codigo_provincia: '28'
    },
    'rayo_vallecano': {
        municipio: 'Madrid',
        codigo_aemet: '28079', // Madrid capital (Vallecas)
        provincia: 'Madrid',
        codigo_provincia: '28'
    },
    'barcelona': {
        municipio: 'Barcelona',
        codigo_aemet: '08019', // Barcelona capital
        provincia: 'Barcelona',
        codigo_provincia: '08'
    },
    'espanyol': {
        municipio: 'Cornellà de Llobregat',
        codigo_aemet: '08088', // Cornellà de Llobregat
        provincia: 'Barcelona',
        codigo_provincia: '08'
    },
    'sevilla': {
        municipio: 'Sevilla',
        codigo_aemet: '41091', // Sevilla capital
        provincia: 'Sevilla',
        codigo_provincia: '41'
    },
    'real_betis': {
        municipio: 'Sevilla',
        codigo_aemet: '41091', // Sevilla capital
        provincia: 'Sevilla',
        codigo_provincia: '41'
    },
    'valencia': {
        municipio: 'Valencia',
        codigo_aemet: '46250', // Valencia capital
        provincia: 'Valencia',
        codigo_provincia: '46'
    },
    'villarreal': {
        municipio: 'Villarreal',
        codigo_aemet: '12135', // Villarreal
        provincia: 'Castellón',
        codigo_provincia: '12'
    },
    'athletic_bilbao': {
        municipio: 'Bilbao',
        codigo_aemet: '48020', // Bilbao
        provincia: 'Vizcaya',
        codigo_provincia: '48',
        estacion_meteorologica: '1082' // Bilbao Aeropuerto - Datos en tiempo real
    },
    'real_sociedad': {
        municipio: 'San Sebastián',
        codigo_aemet: '20069', // Donostia-San Sebastián
        provincia: 'Gipuzkoa',
        codigo_provincia: '20'
    },
    'getafe': {
        municipio: 'Getafe',
        codigo_aemet: '28065', // Getafe
        provincia: 'Madrid',
        codigo_provincia: '28'
    },
    'leganes': {
        municipio: 'Leganés',
        codigo_aemet: '28074', // Leganés
        provincia: 'Madrid',
        codigo_provincia: '28'
    },
    'osasuna': {
        municipio: 'Pamplona',
        codigo_aemet: '31201', // Pamplona
        provincia: 'Navarra',
        codigo_provincia: '31'
    },
    'celta_vigo': {
        municipio: 'Vigo',
        codigo_aemet: '36057', // Vigo
        provincia: 'Pontevedra',
        codigo_provincia: '36'
    },
    'deportivo_alaves': {
        municipio: 'Vitoria-Gasteiz',
        codigo_aemet: '01059', // Vitoria-Gasteiz
        provincia: 'Álava',
        codigo_provincia: '01'
    },
    'girona': {
        municipio: 'Girona',
        codigo_aemet: '17079', // Girona
        provincia: 'Girona',
        codigo_provincia: '17'
    },
    'las_palmas': {
        municipio: 'Las Palmas de Gran Canaria',
        codigo_aemet: '35016', // Las Palmas de Gran Canaria
        provincia: 'Las Palmas',
        codigo_provincia: '35'
    },
    'mallorca': {
        municipio: 'Palma',
        codigo_aemet: '07040', // Palma
        provincia: 'Baleares',
        codigo_provincia: '07'
    },
    'valladolid': {
        municipio: 'Valladolid',
        codigo_aemet: '47186', // Valladolid
        provincia: 'Valladolid',
        codigo_provincia: '47'
    }
};

/**
 * Configuración de endpoints AEMET OpenData
 */
const AEMET_ENDPOINTS = {
    base_url: 'https://opendata.aemet.es/opendata/api',
    prediccion_municipio: '/prediccion/especifica/municipio/diaria',
    observacion_meteorologica: '/observacion/convencional/datos/estacion',
    prediccion_por_horas: '/prediccion/especifica/municipio/horaria',
    estaciones_automaticas: '/estaciones/automáticas',
    // Formato: {base_url}{endpoint}/{codigo_municipio}?api_key={api_key}
};

/**
 * Mapeo de códigos de estado del tiempo AEMET a nuestro sistema
 */
const AEMET_WEATHER_CODES = {
    // Códigos AEMET -> códigos OpenWeatherMap equivalentes
    '11': 800, // Despejado
    '11n': 800, // Despejado noche
    '12': 801, // Poco nuboso
    '12n': 801, // Poco nuboso noche
    '13': 802, // Intervalos nubosos
    '13n': 802, // Intervalos nubosos noche
    '14': 803, // Nuboso
    '14n': 803, // Nuboso noche
    '15': 804, // Muy nuboso
    '15n': 804, // Muy nuboso noche
    '16': 804, // Cubierto
    '16n': 804, // Cubierto noche
    '17': 804, // Nubes altas
    '17n': 804, // Nubes altas noche
    '23': 500, // Intervalos nubosos con lluvia escasa
    '23n': 500, // Intervalos nubosos con lluvia escasa noche
    '24': 501, // Nuboso con lluvia escasa
    '24n': 501, // Nuboso con lluvia escasa noche
    '25': 502, // Muy nuboso con lluvia escasa
    '25n': 502, // Muy nuboso con lluvia escasa noche
    '26': 503, // Cubierto con lluvia escasa
    '26n': 503, // Cubierto con lluvia escasa noche
    '43': 501, // Intervalos nubosos con lluvia
    '43n': 501, // Intervalos nubosos con lluvia noche
    '44': 502, // Nuboso con lluvia
    '44n': 502, // Nuboso con lluvia noche
    '45': 503, // Muy nuboso con lluvia
    '45n': 503, // Muy nuboso con lluvia noche
    '46': 504, // Cubierto con lluvia
    '46n': 504, // Cubierto con lluvia noche
    '51': 200, // Intervalos nubosos con tormenta
    '51n': 200, // Intervalos nubosos con tormenta noche
    '52': 201, // Nuboso con tormenta
    '52n': 201, // Nuboso con tormenta noche
    '53': 202, // Muy nuboso con tormenta
    '53n': 202, // Muy nuboso con tormenta noche
    '54': 211, // Cubierto con tormenta
    '54n': 211, // Cubierto con tormenta noche
    '61': 600, // Intervalos nubosos con nieve escasa
    '61n': 600, // Intervalos nubosos con nieve escasa noche
    '62': 601, // Nuboso con nieve escasa
    '62n': 601, // Nuboso con nieve escasa noche
    '63': 602, // Muy nuboso con nieve escasa
    '63n': 602, // Muy nuboso con nieve escasa noche
    '64': 602, // Cubierto con nieve escasa
    '64n': 602, // Cubierto con nieve escasa noche
    '71': 601, // Intervalos nubosos con nieve
    '71n': 601, // Intervalos nubosos con nieve noche
    '72': 602, // Nuboso con nieve
    '72n': 602, // Nuboso con nieve noche
    '73': 622, // Muy nuboso con nieve
    '73n': 622, // Muy nuboso con nieve noche
    '74': 622, // Cubierto con nieve
    '74n': 622, // Cubierto con nieve noche
    '81': 741, // Niebla
    '81n': 741, // Niebla noche
    '82': 721, // Bruma
    '82n': 721, // Bruma noche
    '83': 751, // Calima
    '83n': 751 // Calima noche
};

/**
 * Descripción en español de estados meteorológicos AEMET
 */
const AEMET_WEATHER_DESCRIPTIONS = {
    '11': 'Despejado',
    '11n': 'Despejado',
    '12': 'Poco nuboso',
    '12n': 'Poco nuboso',
    '13': 'Intervalos nubosos',
    '13n': 'Intervalos nubosos',
    '14': 'Nuboso',
    '14n': 'Nuboso',
    '15': 'Muy nuboso',
    '15n': 'Muy nuboso',
    '16': 'Cubierto',
    '16n': 'Cubierto',
    '17': 'Nubes altas',
    '17n': 'Nubes altas',
    '23': 'Intervalos nubosos con lluvia escasa',
    '23n': 'Intervalos nubosos con lluvia escasa',
    '24': 'Nuboso con lluvia escasa',
    '24n': 'Nuboso con lluvia escasa',
    '25': 'Muy nuboso con lluvia escasa',
    '25n': 'Muy nuboso con lluvia escasa',
    '26': 'Cubierto con lluvia escasa',
    '26n': 'Cubierto con lluvia escasa',
    '43': 'Intervalos nubosos con lluvia',
    '43n': 'Intervalos nubosos con lluvia',
    '44': 'Nuboso con lluvia',
    '44n': 'Nuboso con lluvia',
    '45': 'Muy nuboso con lluvia',
    '45n': 'Muy nuboso con lluvia',
    '46': 'Cubierto con lluvia',
    '46n': 'Cubierto con lluvia',
    '51': 'Intervalos nubosos con tormenta',
    '51n': 'Intervalos nubosos con tormenta',
    '52': 'Nuboso con tormenta',
    '52n': 'Nuboso con tormenta',
    '53': 'Muy nuboso con tormenta',
    '53n': 'Muy nuboso con tormenta',
    '54': 'Cubierto con tormenta',
    '54n': 'Cubierto con tormenta',
    '61': 'Intervalos nubosos con nieve escasa',
    '61n': 'Intervalos nubosos con nieve escasa',
    '62': 'Nuboso con nieve escasa',
    '62n': 'Nuboso con nieve escasa',
    '63': 'Muy nuboso con nieve escasa',
    '63n': 'Muy nuboso con nieve escasa',
    '64': 'Cubierto con nieve escasa',
    '64n': 'Cubierto con nieve escasa',
    '71': 'Intervalos nubosos con nieve',
    '71n': 'Intervalos nubosos con nieve',
    '72': 'Nuboso con nieve',
    '72n': 'Nuboso con nieve',
    '73': 'Muy nuboso con nieve',
    '73n': 'Muy nuboso con nieve',
    '74': 'Cubierto con nieve',
    '74n': 'Cubierto con nieve',
    '81': 'Niebla',
    '81n': 'Niebla',
    '82': 'Bruma',
    '82n': 'Bruma',
    '83': 'Calima',
    '83n': 'Calima'
};

module.exports = {
    AEMET_MUNICIPIOS_MAPPING,
    AEMET_ENDPOINTS,
    AEMET_WEATHER_CODES,
    AEMET_WEATHER_DESCRIPTIONS
};