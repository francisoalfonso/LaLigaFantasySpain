// Configuración de Referencias Visuales de Personajes
// Sistema multi-imagen para variedad visual con consistencia

/**
 * Base URL para repositorio de imágenes en GitHub
 */
const BASE_GITHUB_URL =
    'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main';

/**
 * ANA MARTÍNEZ - Analista Táctica Principal
 * Edad: 32 años
 * Personalidad: Profesional cercana, energía media-alta
 * Especialidades: Análisis táctico, preview partidos, chollos
 */
const ANA_REFERENCES = {
    // Imágenes base para identidad facial
    base: {
        main: `${BASE_GITHUB_URL}/ana-main/base/Ana-001.jpeg`, // Frontal profesional
        sideRight: `${BASE_GITHUB_URL}/ana-main/base/Ana-002.jpeg`, // Lateral derecho 45°
        sideLeft: `${BASE_GITHUB_URL}/ana-main/base/Ana-003.jpeg` // Lateral izquierdo 45°
    },

    // Outfits por contexto
    outfits: {
        studioBlazer: `${BASE_GITHUB_URL}/ana-main/outfits/estudio-blazer-azul.jpeg`,
        stadiumPolo: `${BASE_GITHUB_URL}/ana-main/outfits/estadio-polo-blanco.jpeg`,
        casualJacket: `${BASE_GITHUB_URL}/ana-main/outfits/exteriores-chaqueta-rosa.jpeg`,
        galaDress: `${BASE_GITHUB_URL}/ana-main/outfits/gala-vestido-elegante.jpeg`
    },

    // Ambientes/Locaciones
    environments: {
        studio: `${BASE_GITHUB_URL}/ana-main/environments/estudio-profesional.jpeg`,
        stadiumField: `${BASE_GITHUB_URL}/ana-main/environments/estadio-campo.jpeg`,
        stadiumStands: `${BASE_GITHUB_URL}/ana-main/environments/grada-estadio.jpeg`,
        officeAnalysis: `${BASE_GITHUB_URL}/ana-main/environments/oficina-analisis.jpeg`
    },

    // Expresiones faciales
    expressions: {
        serious: `${BASE_GITHUB_URL}/ana-main/expressions/seria-confianza.jpeg`,
        enthusiastic: `${BASE_GITHUB_URL}/ana-main/expressions/entusiasta-sonrisa.jpeg`,
        conspiratorial: `${BASE_GITHUB_URL}/ana-main/expressions/conspirativa-secreto.jpeg`
    },

    // Seed fijo para consistencia
    seed: 30001,

    // Character Bible
    characterBible: `A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, defined cheekbones, Mediterranean complexion. Confident posture, natural hand gestures for emphasis, professional broadcaster energy.`
};

/**
 * CARLOS GONZÁLEZ - Especialista en Estadísticas
 * Edad: 32 años
 * Personalidad: Dinámico entusiasta, energía alta
 * Especialidades: Stats jugadores, consejos Fantasy, alineaciones
 */
const CARLOS_REFERENCES = {
    base: {
        main: `${BASE_GITHUB_URL}/carlos-stats/base/Carlos-001.jpeg`,
        sideRight: `${BASE_GITHUB_URL}/carlos-stats/base/Carlos-002.jpeg`,
        sideLeft: `${BASE_GITHUB_URL}/carlos-stats/base/Carlos-003.jpeg`
    },

    outfits: {
        studioShirt: `${BASE_GITHUB_URL}/carlos-stats/outfits/estudio-camisa-azul-tech.jpeg`,
        stadiumPolo: `${BASE_GITHUB_URL}/carlos-stats/outfits/estadio-polo-deportivo.jpeg`,
        casualTech: `${BASE_GITHUB_URL}/carlos-stats/outfits/casual-hoodie-tech.jpeg`
    },

    environments: {
        studioTech: `${BASE_GITHUB_URL}/carlos-stats/environments/estudio-tech-screens.jpeg`,
        stadiumBox: `${BASE_GITHUB_URL}/carlos-stats/environments/palco-estadio.jpeg`,
        officeData: `${BASE_GITHUB_URL}/carlos-stats/environments/oficina-data-analytics.jpeg`
    },

    expressions: {
        analytical: `${BASE_GITHUB_URL}/carlos-stats/expressions/analitico-concentrado.jpeg`,
        excited: `${BASE_GITHUB_URL}/carlos-stats/expressions/emocionado-dato.jpeg`,
        confident: `${BASE_GITHUB_URL}/carlos-stats/expressions/confiado-prediccion.jpeg`
    },

    seed: 30002,

    characterBible: `A 32-year-old Spanish sports statistician with short dark hair, modern professional style, athletic build, expressive brown eyes. Dynamic energy, enthusiastic hand gestures when explaining data, tech-savvy appearance with modern sportswear.`
};

/**
 * LUCÍA RODRÍGUEZ - Fútbol Femenino y Cantera
 * Edad: 26 años
 * Personalidad: Fresca moderna, energía alta
 * Especialidades: Liga femenina, jugadores emergentes, cantera
 */
const LUCIA_REFERENCES = {
    base: {
        main: `${BASE_GITHUB_URL}/lucia-femenina/base/Lucia-001.jpeg`,
        sideRight: `${BASE_GITHUB_URL}/lucia-femenina/base/Lucia-002.jpeg`,
        sideLeft: `${BASE_GITHUB_URL}/lucia-femenina/base/Lucia-003.jpeg`
    },

    outfits: {
        studioPolo: `${BASE_GITHUB_URL}/lucia-femenina/outfits/estudio-polo-moderno.jpeg`,
        stadiumJacket: `${BASE_GITHUB_URL}/lucia-femenina/outfits/estadio-chaqueta-deportiva.jpeg`,
        casualUrban: `${BASE_GITHUB_URL}/lucia-femenina/outfits/urbano-casual-joven.jpeg`
    },

    environments: {
        studio: `${BASE_GITHUB_URL}/lucia-femenina/environments/estudio-femenino.jpeg`,
        stadiumOutdoor: `${BASE_GITHUB_URL}/lucia-femenina/environments/campo-femenino.jpeg`,
        trainingGround: `${BASE_GITHUB_URL}/lucia-femenina/environments/centro-entrenamiento.jpeg`
    },

    expressions: {
        passionate: `${BASE_GITHUB_URL}/lucia-femenina/expressions/apasionada-femenino.jpeg`,
        inspiring: `${BASE_GITHUB_URL}/lucia-femenina/expressions/inspiradora-cantera.jpeg`,
        friendly: `${BASE_GITHUB_URL}/lucia-femenina/expressions/amigable-cercana.jpeg`
    },

    seed: 30003,

    characterBible: `A 26-year-old Spanish sports reporter with modern long hair, youthful energetic appearance, bright expressive eyes, athletic build. Fresh modern style, passionate about women's football, inspiring hand gestures, approachable and friendly demeanor.`
};

/**
 * PABLO MARTÍN - Especialista Gen Z
 * Edad: 19 años
 * Personalidad: Joven conectado, energía muy alta
 * Especialidades: Fantasy hacks, TikTok viral, memes fútbol
 */
const PABLO_REFERENCES = {
    base: {
        main: `${BASE_GITHUB_URL}/pablo-genz/base/Pablo-001.jpeg`,
        sideRight: `${BASE_GITHUB_URL}/pablo-genz/base/Pablo-002.jpeg`,
        sideLeft: `${BASE_GITHUB_URL}/pablo-genz/base/Pablo-003.jpeg`
    },

    outfits: {
        streetwear: `${BASE_GITHUB_URL}/pablo-genz/outfits/streetwear-urbano.jpeg`,
        gamingHoodie: `${BASE_GITHUB_URL}/pablo-genz/outfits/gaming-hoodie.jpeg`,
        jerseyTeam: `${BASE_GITHUB_URL}/pablo-genz/outfits/camiseta-equipo.jpeg`,
        casualTeen: `${BASE_GITHUB_URL}/pablo-genz/outfits/casual-teenager.jpeg`
    },

    environments: {
        gamingSetup: `${BASE_GITHUB_URL}/pablo-genz/environments/setup-gaming-rgb.jpeg`,
        urbanStreet: `${BASE_GITHUB_URL}/pablo-genz/environments/calle-urbana.jpeg`,
        greenScreen: `${BASE_GITHUB_URL}/pablo-genz/environments/green-screen-studio.jpeg`,
        stadiumYouth: `${BASE_GITHUB_URL}/pablo-genz/environments/estadio-grada-joven.jpeg`
    },

    expressions: {
        hyped: `${BASE_GITHUB_URL}/pablo-genz/expressions/emocionado-viral.jpeg`,
        cheeky: `${BASE_GITHUB_URL}/pablo-genz/expressions/picaro-meme.jpeg`,
        intense: `${BASE_GITHUB_URL}/pablo-genz/expressions/intenso-hack.jpeg`
    },

    seed: 30004,

    characterBible: `A 19-year-old Spanish Gen Z content creator with modern trendy haircut, youthful energetic face, streetwear fashion sense. Very high energy, rapid hand gestures, TikTok-style expressiveness, connected to youth culture and gaming aesthetics.`
};

/**
 * CONTEXTOS DE PRODUCCIÓN
 * Mapeo de tipo de contenido → configuración visual
 */
const PRODUCTION_CONTEXTS = {
    // CHOLLO VIRAL - Intimate revelation
    chollo_viral: {
        environment: 'studio',
        outfit: 'studioBlazer',
        mood: 'intimate',
        cameraStyle: 'push-in',
        lighting: 'warm low-key',
        preferredReporter: 'ana'
    },

    // ANÁLISIS TÁCTICA - Professional authority
    analisis_tactica: {
        environment: 'studio',
        outfit: 'studioBlazer',
        mood: 'professional',
        cameraStyle: 'static medium',
        lighting: 'broadcast bright',
        preferredReporter: 'ana'
    },

    // ESTADÍSTICAS SEMANAL - Tech data focus
    stats_semanal: {
        environment: 'studioTech',
        outfit: 'studioShirt',
        mood: 'analytical',
        cameraStyle: 'medium with graphics',
        lighting: 'cool tech blue',
        preferredReporter: 'carlos'
    },

    // REPORTAJE ESTADIO - On-field energy
    reportaje_estadio: {
        environment: 'stadium',
        outfit: 'stadiumPolo',
        mood: 'energetic',
        cameraStyle: 'wide to medium',
        lighting: 'natural golden hour',
        preferredReporter: 'ana'
    },

    // LIGA FEMENINA - Passionate outdoor
    liga_femenina: {
        environment: 'stadiumOutdoor',
        outfit: 'stadiumJacket',
        mood: 'passionate',
        cameraStyle: 'active handheld',
        lighting: 'natural daylight',
        preferredReporter: 'lucia'
    },

    // TIKTOK VIRAL - Fast paced urban
    tiktok_viral: {
        environment: 'urbanStreet',
        outfit: 'streetwear',
        mood: 'hyped',
        cameraStyle: 'handheld dynamic',
        lighting: 'natural hard',
        preferredReporter: 'pablo'
    },

    // BREAKING NEWS - Urgent direct
    breaking_news: {
        environment: 'studio',
        outfit: 'studioBlazer',
        mood: 'urgent',
        cameraStyle: 'tight close-up',
        lighting: 'high-key urgent',
        preferredReporter: 'ana'
    },

    // FANTASY HACKS - Gaming tech
    fantasy_hacks: {
        environment: 'gamingSetup',
        outfit: 'gamingHoodie',
        mood: 'intense',
        cameraStyle: 'close-up rapid',
        lighting: 'RGB colorful',
        preferredReporter: 'pablo'
    },

    // CANTERA REVEAL - Inspiring outdoor
    cantera_reveal: {
        environment: 'trainingGround',
        outfit: 'casualUrban',
        mood: 'inspiring',
        cameraStyle: 'medium energetic',
        lighting: 'golden hour',
        preferredReporter: 'lucia'
    },

    // ENTREVISTA CASUAL - Friendly informal
    entrevista_casual: {
        environment: 'outdoor',
        outfit: 'casualJacket',
        mood: 'friendly',
        cameraStyle: 'over-shoulder',
        lighting: 'soft natural',
        preferredReporter: 'ana'
    }
};

/**
 * MOOD LIGHTING DESCRIPTIONS
 * Descripciones detalladas de iluminación por mood
 */
const MOOD_LIGHTING = {
    intimate:
        'Warm intimate lighting creating conspiratorial mood, low-key with soft shadows, golden tones',
    professional:
        'Professional broadcast lighting, three-point setup, neutral white balance, energetic',
    analytical:
        'Cool blue tech lighting, high contrast for data visibility, modern professional ambiance',
    energetic: 'Bright natural daylight, golden hour warmth, high energy vibrant colors',
    passionate: 'Natural outdoor lighting, soft shadows, warm sunset tones, inspiring atmosphere',
    hyped: 'High contrast natural light, vibrant colors, dynamic shadows, urban street energy',
    urgent: 'High-key bright lighting, sharp clear visibility, slight cool tone for urgency',
    intense: 'Colorful RGB gaming lighting, neon accents, dramatic contrast, tech ambiance',
    inspiring: 'Soft golden hour natural light, warm uplifting tones, gentle shadows',
    friendly: 'Soft diffused natural light, warm welcoming tones, comfortable intimate feel'
};

/**
 * CAMERA MOVEMENT DESCRIPTIONS
 * Descripciones detalladas de movimientos de cámara
 */
const CAMERA_MOVEMENTS = {
    'push-in':
        'Slow dolly push-in from comfortable medium shot to intimate close-up, creating emotional connection',
    'static medium':
        'Steady medium shot, locked-off camera, professional broadcast framing with graphics space',
    'medium with graphics':
        'Static medium shot with occasional subtle push-ins on key statistics, space for data overlays',
    'wide to medium':
        'Starting wide establishing shot, smoothly transitioning to medium shot, revealing context then focusing',
    'active handheld':
        'Dynamic handheld camera movement, following action naturally, energetic documentary style',
    'handheld dynamic':
        'Fast-paced handheld with quick movements, TikTok-style energy, rapid angle changes',
    'tight close-up':
        'Direct tight close-up on face, minimal movement, intense eye contact, urgent delivery',
    'close-up rapid':
        'Close-up framing with quick camera adjustments, following rapid hand gestures and expressions',
    'medium energetic':
        'Medium shot with subtle motivated movements, following natural energy and gestures',
    'over-shoulder':
        'Over-shoulder conversational framing, creating intimate dialogue feel, shifting focus naturally'
};

module.exports = {
    // Referencias de personajes
    ANA_REFERENCES,
    CARLOS_REFERENCES,
    LUCIA_REFERENCES,
    PABLO_REFERENCES,

    // Mapeos de contexto
    PRODUCTION_CONTEXTS,
    MOOD_LIGHTING,
    CAMERA_MOVEMENTS,

    // Helper: Obtener referencias por nombre de reporter
    getReporterReferences(reporterName) {
        const refs = {
            ana: ANA_REFERENCES,
            carlos: CARLOS_REFERENCES,
            lucia: LUCIA_REFERENCES,
            pablo: PABLO_REFERENCES
        };
        return refs[reporterName.toLowerCase()] || ANA_REFERENCES;
    },

    // Helper: Obtener contexto de producción
    getProductionContext(contentType) {
        return PRODUCTION_CONTEXTS[contentType] || PRODUCTION_CONTEXTS.chollo_viral;
    },

    // Helper: Seleccionar imágenes según contexto
    selectContextImages(reporterName, environmentType, outfitType) {
        const refs = this.getReporterReferences(reporterName);

        // SIEMPRE incluir imagen base frontal como primera
        const baseImages = [refs.base.main];

        // Agregar outfit si se especifica
        if (outfitType && refs.outfits[outfitType]) {
            baseImages.push(refs.outfits[outfitType]);
        }

        // Agregar ambiente si se especifica
        if (environmentType && refs.environments[environmentType]) {
            baseImages.push(refs.environments[environmentType]);
        }

        return baseImages;
    },

    // Helper: Construir descripción completa de iluminación
    getLightingDescription(mood) {
        return MOOD_LIGHTING[mood] || MOOD_LIGHTING.professional;
    },

    // Helper: Construir descripción completa de cámara
    getCameraDescription(cameraStyle) {
        return CAMERA_MOVEMENTS[cameraStyle] || CAMERA_MOVEMENTS['static medium'];
    },

    // Helper: Obtener reporter recomendado para tipo de contenido
    getPreferredReporter(contentType) {
        const context = this.getProductionContext(contentType);
        return context.preferredReporter || 'ana';
    }
};
