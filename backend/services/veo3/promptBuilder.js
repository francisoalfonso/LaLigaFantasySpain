const {
    ANA_CHARACTER_BIBLE,
    STUDIO_CONFIGURATIONS,
    EMOTIONAL_DIRECTIONS,
    CAMERA_SHOTS,
    VISUAL_STYLES,
    AUDIO_ENVIRONMENTS
} = require('../../config/veo3/anaCharacter');

/**
 * Constructor de prompts optimizados para Ana Real
 * Genera prompts siguiendo las mejores prácticas de VEO3
 */
class PromptBuilder {
    constructor() {
        this.maxLength = 500; // Límite recomendado VEO3
    }

    /**
     * Construir prompt base para Ana
     * @param {object} config - Configuración del prompt
     * @returns {string} - Prompt optimizado
     */
    buildPrompt(config) {
        const {
            dialogue = ''
        } = config;

        // Prompt minimal para máxima adherencia a imagen de referencia
        const prompt = `The person in the reference image speaking in Spanish: "${dialogue}". Exact appearance from reference image.`;

        console.log(`[PromptBuilder] Prompt minimal generado: ${prompt.length} chars`);
        return prompt;
    }

    /**
     * Prompt para revelación de chollo
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para chollo
     */
    buildCholloPrompt(playerName, price, options = {}) {
        const dialogue = options.dialogue || `¡Misters! He descubierto algo sobre ${playerName}... ¡A ${price}€ es INCREÍBLE! ¡Preparaos para el chollo del SIGLO!`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para análisis de jugador
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} stats - Estadísticas del jugador
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para análisis
     */
    buildAnalysisPrompt(playerName, price, stats = {}, options = {}) {
        const dialogue = options.dialogue || `${playerName}... los números son ESPECTACULARES! ${price}€ por este nivel... ¡Es MATEMÁTICA pura!`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para noticias urgentes/breaking news
     * @param {string} news - Noticia urgente
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para breaking news
     */
    buildBreakingNewsPrompt(news, options = {}) {
        const dialogue = options.dialogue || `¡ATENCIÓN Misters! Acaba de confirmarse... ¡${news}! ¡Actualizad vuestros equipos YA!`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para predicciones de jornada
     * @param {number} gameweek - Número de jornada
     * @param {string} prediction - Predicción principal
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para predicciones
     */
    buildPredictionPrompt(gameweek, prediction, options = {}) {
        const dialogue = options.dialogue || `Para la jornada ${gameweek}... mi análisis indica que ¡${prediction}! Seguid mis consejos.`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para introducción/saludo
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para saludo
     */
    buildIntroPrompt(options = {}) {
        const dialogue = options.dialogue || "¡Hola Misters! Bienvenidos a Fantasy La Liga. Soy Ana, y hoy tenemos análisis espectaculares.";

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para despedida/outro
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para despedida
     */
    buildOutroPrompt(options = {}) {
        const dialogue = options.dialogue || "¡Hasta la próxima, Misters! Recordad: en Fantasy La Liga, cada punto cuenta. ¡Nos vemos pronto!";

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para transición entre segmentos
     * @param {string} transition - Texto de transición
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para transición
     */
    buildTransitionPrompt(transition, options = {}) {
        const dialogue = options.dialogue || transition;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Simplificar prompt si viola políticas de contenido
     * @param {string} prompt - Prompt original
     * @returns {string} - Prompt simplificado
     */
    simplifyPrompt(prompt) {
        // Extraer diálogo del prompt original si es posible
        const dialogueMatch = prompt.match(/"([^"]+)"/);
        const dialogue = dialogueMatch ? dialogueMatch[1] : "Hola Misters! Bienvenidos a Fantasy La Liga.";

        // Usar prompt minimal como fallback
        const simplifiedPrompt = `The person in the reference image speaking in Spanish: "${dialogue}". Exact appearance from reference image.`;

        console.log(`[PromptBuilder] Prompt simplificado de ${prompt.length} a ${simplifiedPrompt.length} chars`);
        return simplifiedPrompt;
    }

    /**
     * Validar prompt antes de envío
     * @param {string} prompt - Prompt a validar
     * @returns {object} - Resultado de validación
     */
    validatePrompt(prompt) {
        const validation = {
            valid: true,
            warnings: [],
            errors: []
        };

        // Check longitud
        if (prompt.length > this.maxLength) {
            validation.warnings.push(`Prompt muy largo: ${prompt.length} chars (recomendado: <${this.maxLength})`);
        }

        // Check que incluye Ana Character Bible
        if (!prompt.includes(ANA_CHARACTER_BIBLE.substring(0, 50))) {
            validation.errors.push('Prompt no incluye Ana Character Bible');
            validation.valid = false;
        }

        // Check que incluye español
        if (!prompt.includes('Spanish')) {
            validation.warnings.push('Prompt no especifica idioma español');
        }

        // Check que incluye setup de transición
        if (!prompt.includes('neutral position')) {
            validation.warnings.push('Prompt no incluye setup para transiciones');
        }

        return validation;
    }
}

module.exports = PromptBuilder;