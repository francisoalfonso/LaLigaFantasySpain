/**
 * Configuración Ana Real - Character Bible
 * ⚠️ NUNCA CAMBIAR PARA MANTENER CONSISTENCIA PERFECTA
 */

// Ana Character Bible - EXACTO para consistencia entre videos
const ANA_CHARACTER_BIBLE = "A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy";

// URL imagen Ana Real en GitHub
const ANA_IMAGE_URL = "https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg";

// Configuración por defecto Ana
const ANA_DEFAULT_CONFIG = {
    imageUrls: [ANA_IMAGE_URL],
    model: "veo3_fast",
    aspectRatio: "9:16",
    seed: 30001,
    waterMark: "Fantasy La Liga Pro",
    enableTranslation: true,
    enableFallback: true
};

// Configuración de estudio para Ana
const STUDIO_CONFIGURATIONS = {
    // Estudio principal Fantasy La Liga
    main: {
        description: "modern Fantasy La Liga studio with professional sports lighting",
        lighting: "focused lighting creating authority and professionalism",
        background: "multiple screens displaying La Liga statistics and team logos"
    },

    // Estudio para análisis táctico
    tactical: {
        description: "tactical analysis studio with player statistics prominently displayed",
        lighting: "focused lighting creating authority and conviction",
        background: "tactical boards and real-time data visualization"
    },

    // Estudio para chollos y revelaciones
    dramatic: {
        description: "modern Fantasy La Liga studio with dramatic lighting creating excitement and intrigue",
        lighting: "dramatic lighting with color temperature shifts for emotional impact",
        background: "multiple screens showing mysterious player statistics"
    },

    // Estudio para noticias urgentes
    breaking: {
        description: "breaking news studio with urgent visual elements",
        lighting: "bright, alert lighting with subtle red accents",
        background: "live data feeds and urgent news graphics"
    }
};

// Direcciones emocionales para Ana
const EMOTIONAL_DIRECTIONS = {
    professional: {
        description: "professional analytical confidence",
        voice: "measured analytical confidence with Spanish Madrid accent",
        energy: "controlled professional broadcaster energy"
    },

    exciting: {
        description: "building excitement and anticipation",
        voice: "building conviction through data with rising excitement",
        energy: "dynamic energy building from analysis to revelation"
    },

    conspiratorial: {
        description: "intimate whisper building to explosive revelation",
        voice: "voice modulating from whisper to excited announcement",
        energy: "conspiratorial intimacy exploding into excitement"
    },

    authoritative: {
        description: "commanding authority and expertise",
        voice: "authoritative conclusion with confident delivery",
        energy: "commanding presence with statistical authority"
    },

    urgent: {
        description: "urgent command and immediate action",
        voice: "urgent command with immediate call to action",
        energy: "high-intensity urgent broadcaster mode"
    }
};

// Templates de cámara para diferentes tipos de contenido
const CAMERA_SHOTS = {
    medium: "Medium shot",
    closeup: "Close-up shot",
    dynamic: "Medium shot with dynamic energy building",
    analytical: "Close-up shot with analytical focus shifting to excitement",
    dramatic: "Medium shot with dramatic tension building"
};

// Estilos visuales
const VISUAL_STYLES = {
    professional: "professional broadcast style",
    cinematic: "cinematic broadcast style",
    dynamic: "dynamic professional broadcast style",
    tactical: "analytical tactical broadcast style",
    breaking: "urgent breaking news broadcast style"
};

// Audio environments
const AUDIO_ENVIRONMENTS = {
    studio: "Professional sports broadcast ambiance",
    tactical: "Professional studio ambiance with data processing sounds",
    dramatic: "Dynamic sports broadcast ambiance with tension-building audio cues, rising musical sting",
    breaking: "Urgent news broadcast ambiance with alert tones",
    analysis: "Professional studio ambiance with data processing sounds building to statistical triumph"
};

module.exports = {
    ANA_CHARACTER_BIBLE,
    ANA_IMAGE_URL,
    ANA_DEFAULT_CONFIG,
    STUDIO_CONFIGURATIONS,
    EMOTIONAL_DIRECTIONS,
    CAMERA_SHOTS,
    VISUAL_STYLES,
    AUDIO_ENVIRONMENTS
};