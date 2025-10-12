/**
 * Configuración Carlos González - Character Bible
 * ⚠️ NUNCA CAMBIAR PARA MANTENER CONSISTENCIA PERFECTA
 */

// Carlos Character Bible - EXACTO para consistencia entre videos
const CARLOS_CHARACTER_BIBLE =
    'A 38-year-old Spanish sports data analyst with short dark hair with gray streaks, brown eyes, athletic build, wearing a red Fantasy La Liga polo shirt. Confident analytical expression, professional posture, data-driven broadcaster energy';

// URLs imágenes Carlos - ✅ ACTIVA
const CARLOS_IMAGE_URLS = {
    // ✅ IMAGEN BASE (subida a Supabase)
    fixed: 'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/carlos/carlos-gonzalez-01.jpg',

    // Imagen principal
    main: 'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-main/Carlos-001.jpeg',

    // Variantes outfit tech
    tech: [
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-tech-01.png',
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-tech-02.png',
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-tech-03.png'
    ],

    // Variantes polo deportivo
    polo: [
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-polo-01.png',
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-polo-02.png'
    ],

    // Estudio con pantallas (para referencia)
    studio: 'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/carlos-estudio.jpg'
};

// URL imagen Carlos en GitHub (backward compatibility)
// ✅ Usar imagen fija por defecto (pendiente generar)
const CARLOS_IMAGE_URL = CARLOS_IMAGE_URLS.fixed;

// Todas las imágenes de Carlos disponibles (para rotación)
// ✅ SOLO 1 IMAGEN para desarrollo (agregar más aquí para activar rotación en futuro)
const ALL_CARLOS_IMAGES = [
    CARLOS_IMAGE_URLS.fixed // Solo carlos-base-01.png por ahora
    // Para activar rotación, descomentar:
    // CARLOS_IMAGE_URLS.main,
    // ...CARLOS_IMAGE_URLS.tech,
    // ...CARLOS_IMAGE_URLS.polo
];

// Configuración por defecto Carlos
const CARLOS_DEFAULT_CONFIG = {
    imageUrls: [CARLOS_IMAGE_URL], // ✅ Usa imagen fija
    model: 'veo3_fast',
    aspectRatio: '9:16',
    seed: 30002, // ⚠️ SEED ÚNICO DE CARLOS - NUNCA CAMBIAR
    waterMark: 'Fantasy La Liga Pro',
    enableTranslation: true,
    enableFallback: true,
    // Sistema de rotación automática
    imageRotation: {
        enabled: false, // ⚠️ DESACTIVADO - usar imagen fija para consistencia perfecta
        strategy: 'fixed', // 'random', 'sequential', 'content-based', 'fixed'
        pool: [CARLOS_IMAGE_URLS.fixed] // Solo imagen fija
    }
};

// Configuración de estudio para Carlos
const CARLOS_STUDIO_CONFIGURATIONS = {
    // Estudio tech con múltiples pantallas
    tech: {
        description:
            'modern tech-focused studio with multiple data screens and statistics displays',
        lighting: 'cool blue lighting creating analytical and data-driven atmosphere',
        background:
            'large LED screens showing real-time La Liga statistics, graphs, and player data'
    },

    // Estudio para análisis comparativo
    comparative: {
        description: 'analytical studio with split-screen displays comparing player statistics',
        lighting: 'neutral bright lighting emphasizing data clarity',
        background: 'side-by-side comparison screens with player stats and performance metrics'
    },

    // Estudio para datos en vivo
    liveData: {
        description: 'dynamic data center studio with live updating statistics',
        lighting: 'bright energetic lighting with subtle data visualization reflections',
        background: 'animated data feeds, live match statistics, and real-time updates'
    },

    // Estudio para breaking stats
    breakingStats: {
        description: 'urgent data reveal studio with dramatic statistical displays',
        lighting: 'focused dramatic lighting highlighting key data points',
        background: 'large central screen with shocking statistics and trend arrows'
    }
};

// Direcciones emocionales para Carlos
const CARLOS_EMOTIONAL_DIRECTIONS = {
    analytical: {
        description: 'focused analytical concentration on data',
        voice: 'measured analytical tone with Spanish Madrid accent, emphasizing numbers',
        energy: 'controlled intellectual broadcaster energy'
    },

    revealing: {
        description: 'building excitement through data discovery',
        voice: 'voice rising with conviction as data reveals patterns',
        energy: 'analytical energy building to statistical revelation'
    },

    authoritative: {
        description: 'commanding data-driven authority',
        voice: 'confident authoritative delivery backed by numbers',
        energy: 'professional statistician authority with proof'
    },

    comparative: {
        description: 'balanced comparison presenting both sides',
        voice: 'neutral analytical comparison with objective tone',
        energy: 'steady professional energy maintaining fairness'
    },

    shocking: {
        description: 'surprised revelation of unexpected data',
        voice: 'rising excitement revealing shocking statistics',
        energy: 'controlled surprise building to data-driven wow moment'
    }
};

// Templates de cámara para Carlos (más estático que Ana, enfocado en datos)
const CARLOS_CAMERA_SHOTS = {
    medium: 'Medium shot with space for data graphics on sides',
    closeup: 'Close-up shot with subtle data overlays',
    analytical: 'Medium shot with steady focus, data screens visible in background',
    comparative: 'Medium shot with space for split-screen comparisons',
    dramatic: 'Medium shot slowly pushing in as data reveals patterns'
};

// Estilos visuales de Carlos
const CARLOS_VISUAL_STYLES = {
    professional: 'professional data-focused broadcast style',
    technical: 'technical analytical broadcast style with data emphasis',
    comparative: 'balanced comparative broadcast style',
    dynamic: 'dynamic data-driven broadcast style',
    breaking: 'urgent data reveal broadcast style'
};

// Audio environments para Carlos
const CARLOS_AUDIO_ENVIRONMENTS = {
    studio: 'Professional data analysis studio ambiance with subtle tech sounds',
    technical: 'Technical studio ambiance with data processing sounds',
    comparative: 'Clean professional studio ambiance for objective comparison',
    breaking: 'Dynamic studio ambiance with data visualization whooshes',
    liveData: 'Energetic studio ambiance with real-time data update sounds'
};

module.exports = {
    CARLOS_CHARACTER_BIBLE,
    CARLOS_IMAGE_URL,
    CARLOS_IMAGE_URLS,
    ALL_CARLOS_IMAGES,
    CARLOS_DEFAULT_CONFIG,
    CARLOS_STUDIO_CONFIGURATIONS,
    CARLOS_EMOTIONAL_DIRECTIONS,
    CARLOS_CAMERA_SHOTS,
    CARLOS_VISUAL_STYLES,
    CARLOS_AUDIO_ENVIRONMENTS
};
