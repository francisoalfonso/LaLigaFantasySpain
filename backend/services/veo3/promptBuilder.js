const logger = require('../../utils/logger');

const {
    ANA_CHARACTER_BIBLE,
    STUDIO_CONFIGURATIONS,
    EMOTIONAL_DIRECTIONS,
    CAMERA_SHOTS,
    VISUAL_STYLES,
    AUDIO_ENVIRONMENTS
} = require('../../config/veo3/anaCharacter');

/**
 * Tipos de emociones por elemento de estructura viral
 * Basado en Framework Viral Comprobado (1,350M visitas)
 */
const EMOCIONES_POR_ELEMENTO = {
    hook: {
        chollo: 'conspiratorial_whisper',
        prediccion: 'professional_authority',
        breaking: 'urgent_alert_max_energy',
        analisis: 'confident_expert'
    },
    contexto: {
        chollo: 'building_tension',
        prediccion: 'analytical_calm',
        breaking: 'rising_urgency',
        analisis: 'establishing_credibility'
    },
    conflicto: {
        chollo: 'implicit_tension',
        prediccion: 'data_confrontation',
        breaking: 'crisis_building',
        analisis: 'problem_identification'
    },
    inflexion: {
        chollo: 'explosive_revelation',
        prediccion: 'eureka_moment',
        breaking: 'breaking_news_announcement',
        analisis: 'key_insight_discovery'
    },
    resolucion: {
        chollo: 'explosive_excitement',
        prediccion: 'confident_conclusion',
        breaking: 'impact_explanation',
        analisis: 'solution_presentation'
    },
    moraleja: {
        chollo: 'knowing_wisdom',
        prediccion: 'expert_advice',
        breaking: 'urgent_warning',
        analisis: 'professional_takeaway'
    },
    cta: {
        chollo: 'urgent_call_to_action',
        prediccion: 'expert_recommendation',
        breaking: 'immediate_action_required',
        analisis: 'informed_suggestion'
    }
};

/**
 * Arcos emocionales completos por tipo de contenido
 */
const ARCOS_EMOCIONALES = {
    chollo: {
        nombre: 'Chollo Revelation',
        duracion: '10-12s',
        secuencia: [
            { elemento: 'hook', emocion: 'conspiratorial_whisper', tiempo: '0-2s' },
            { elemento: 'contexto', emocion: 'building_tension', tiempo: '2-4s' },
            { elemento: 'conflicto', emocion: 'implicit_tension', tiempo: '4-5s' },
            { elemento: 'inflexion', emocion: 'explosive_revelation', tiempo: '5-7s' },
            { elemento: 'resolucion', emocion: 'explosive_excitement', tiempo: '7-9s' },
            { elemento: 'moraleja', emocion: 'knowing_wisdom', tiempo: '9-10s' },
            { elemento: 'cta', emocion: 'urgent_call_to_action', tiempo: '10-12s' }
        ]
    },
    prediccion: {
        nombre: 'Data Confidence',
        duracion: '12-15s',
        secuencia: [
            { elemento: 'hook', emocion: 'professional_authority', tiempo: '0-2s' },
            { elemento: 'contexto', emocion: 'analytical_calm', tiempo: '2-5s' },
            { elemento: 'conflicto', emocion: 'data_confrontation', tiempo: '5-7s' },
            { elemento: 'inflexion', emocion: 'eureka_moment', tiempo: '7-9s' },
            { elemento: 'resolucion', emocion: 'confident_conclusion', tiempo: '9-12s' },
            { elemento: 'moraleja', emocion: 'expert_advice', tiempo: '12-13s' },
            { elemento: 'cta', emocion: 'expert_recommendation', tiempo: '13-15s' }
        ]
    },
    breaking: {
        nombre: 'Breaking News',
        duracion: '8-10s',
        secuencia: [
            { elemento: 'hook', emocion: 'urgent_alert_max_energy', tiempo: '0-1s' },
            { elemento: 'contexto', emocion: 'rising_urgency', tiempo: '1-3s' },
            { elemento: 'inflexion', emocion: 'breaking_news_announcement', tiempo: '3-5s' },
            { elemento: 'resolucion', emocion: 'impact_explanation', tiempo: '5-7s' },
            { elemento: 'moraleja', emocion: 'urgent_warning', tiempo: '7-8s' },
            { elemento: 'cta', emocion: 'immediate_action_required', tiempo: '8-10s' }
        ]
    },
    analisis: {
        nombre: 'Professional Analysis',
        duracion: '12-15s',
        secuencia: [
            { elemento: 'hook', emocion: 'confident_expert', tiempo: '0-2s' },
            { elemento: 'contexto', emocion: 'establishing_credibility', tiempo: '2-4s' },
            { elemento: 'conflicto', emocion: 'problem_identification', tiempo: '4-6s' },
            { elemento: 'inflexion', emocion: 'key_insight_discovery', tiempo: '6-9s' },
            { elemento: 'resolucion', emocion: 'solution_presentation', tiempo: '9-12s' },
            { elemento: 'moraleja', emocion: 'professional_takeaway', tiempo: '12-13s' },
            { elemento: 'cta', emocion: 'informed_suggestion', tiempo: '13-15s' }
        ]
    }
};

/**
 * Constructor de prompts optimizados para Ana Real
 * Genera prompts siguiendo las mejores prácticas de VEO3
 * Integrado con Framework Viral Comprobado
 */
class PromptBuilder {
    constructor() {
        this.maxLength = 500; // Límite recomendado VEO3
        this.emocionesPorElemento = EMOCIONES_POR_ELEMENTO;
        this.arcosEmocionales = ARCOS_EMOCIONALES;
    }

    /**
     * Construir prompt base para Ana
     * @param {object} config - Configuración del prompt
     * @returns {string} - Prompt optimizado
     */
    buildPrompt(config) {
        const {
            dialogue = '',
            enhanced = false, // Nuevo: activar modo mejorado con descripción
            behavior = '', // Descripción del comportamiento
            cinematography = '' // Descripción de la cinematografía
        } = config;

        if (enhanced && (behavior || cinematography)) {
            // Prompt mejorado con descripción de comportamiento y cinematografía
            let prompt = `Sports analysis video featuring the person from the reference image. `;

            if (behavior) {
                prompt += `${behavior} `;
            }

            prompt += `Speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}" `;

            if (cinematography) {
                prompt += `${cinematography} `;
            }

            prompt += `Exact appearance from reference image.`;

            logger.info(`[PromptBuilder] Prompt mejorado generado: ${prompt.length} chars`);
            return prompt;
        }

        // Prompt minimal para máxima adherencia a imagen de referencia
        // CRÍTICO: SIEMPRE forzar español de España (NO mexicano)
        const prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}". Exact appearance from reference image.`;

        logger.info(`[PromptBuilder] Prompt minimal generado: ${prompt.length} chars`);
        return prompt;
    }

    /**
     * Construir prompt con estructura viral completa
     * @param {string} type - Tipo de contenido (chollo, prediccion, breaking, analisis)
     * @param {object} data - Datos del contenido
     * @param {object} options - Opciones adicionales
     * @returns {object} - Prompt estructurado con arco emocional
     */
    buildViralStructuredPrompt(type, data, options = {}) {
        const arco = this.arcosEmocionales[type];
        if (!arco) {
            throw new Error(`Tipo de contenido no válido: ${type}`);
        }

        // Construir diálogo completo con estructura viral
        const dialogueParts = {
            hook: data.hook || '',
            contexto: data.contexto || '',
            conflicto: data.conflicto || '',
            inflexion: data.inflexion || '',
            resolucion: data.resolucion || '',
            moraleja: data.moraleja || '',
            cta: data.cta || ''
        };

        // Combinar todo el diálogo
        const fullDialogue = Object.values(dialogueParts)
            .filter(part => part.length > 0)
            .join(' ');

        logger.info(
            `[PromptBuilder] Prompt viral ${type} construido: ${arco.nombre} (${arco.duracion})`
        );
        logger.info(`[PromptBuilder] Arco emocional: ${arco.secuencia.length} elementos`);

        return {
            prompt: this.buildPrompt({ dialogue: fullDialogue }),
            arcoEmocional: arco,
            dialogueParts,
            metadata: {
                type,
                duracionEstimada: arco.duracion,
                elementosEstructura: arco.secuencia.length
            }
        };
    }

    /**
     * Obtener emoción recomendada para elemento y tipo
     * @param {string} elemento - Elemento de estructura (hook, contexto, etc)
     * @param {string} type - Tipo de contenido
     * @returns {string} - Emoción recomendada
     */
    getEmotionForElement(elemento, type) {
        return this.emocionesPorElemento[elemento]?.[type] || 'neutral';
    }

    /**
     * Obtener arco emocional completo para tipo de contenido
     * @param {string} type - Tipo de contenido
     * @returns {object} - Arco emocional completo
     */
    getEmotionalArc(type) {
        return this.arcosEmocionales[type] || null;
    }

    /**
     * Prompt para revelación de chollo (con estructura viral)
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} options - Opciones adicionales (stats, ratio, team)
     * @returns {string} - Prompt optimizado para chollo
     */
    buildCholloPrompt(playerName, price, options = {}) {
        // Si se proporciona estructura completa, usar método viral
        if (options.useViralStructure && options.structuredData) {
            return this.buildViralStructuredPrompt('chollo', options.structuredData, options);
        }

        // Construir diálogo estructurado con estadísticas (NUEVO - siguiendo mejores prácticas)
        const { stats = {}, ratio, team, enhanced = false } = options;

        // Estructura viral de 7 elementos para chollo (10-12s)
        const dialogue = this._buildCholloDialogue(playerName, price, { stats, ratio, team });

        // Si enhanced=true, usar prompt mejorado con comportamiento
        if (enhanced) {
            return this.buildEnhancedCholloPrompt(playerName, price, {
                stats,
                ratio,
                team,
                dialogue
            });
        }

        // Prompt con FORZAR español de España (NO mexicano)
        const prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}". Exact appearance from reference image.`;

        logger.info(
            `[PromptBuilder] Chollo prompt con estructura viral y español de España: ${prompt.length} chars`
        );
        return prompt;
    }

    /**
     * Prompt MEJORADO para revelación de chollo con comportamiento y cinematografía
     * Inspirado en prompts altamente expresivos tipo "Moisés Selfie"
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt mejorado con descripción de comportamiento
     */
    buildEnhancedCholloPrompt(playerName, price, options = {}) {
        const { dialogue } = options;

        // Comportamiento específico para arco emocional de chollo
        const behavior = `She starts leaning forward conspiratorially with an intriguing expression and knowing smile, then explodes with passionate enthusiasm while gesturing dramatically with natural hand movements during the revelation. Modern sports studio setting with Fantasy La Liga graphics visible in background.`;

        // Cinematografía dinámica
        const cinematography = `Camera: Starts in medium shot, slowly dollies in to intimate close-up during conspiratorial setup, then quick push-in for explosive revelation impact. Lighting brightens dynamically matching emotional energy from calm intimate to vibrant energetic. Professional broadcast quality with vertical 9:16 format optimized for social media.`;

        // Usar buildPrompt con modo enhanced
        const prompt = this.buildPrompt({
            dialogue,
            enhanced: true,
            behavior,
            cinematography
        });

        logger.info(`[PromptBuilder] Enhanced chollo prompt generado: ${prompt.length} chars`);
        return prompt;
    }

    /**
     * Construir diálogo estructurado para chollo con 7 elementos virales
     * @private
     */
    _buildCholloDialogue(playerName, price, data) {
        const { stats = {}, ratio, team } = data;

        // Estructura viral: hook → contexto → conflicto → inflexión → resolución → moraleja → cta
        const parts = [];

        // 1. Hook (0-2s) - conspiratorial_whisper
        parts.push(`¡Misters! Venid que os cuento un secreto...`);

        // 2. Contexto (2-4s) - building_tension
        parts.push(`He encontrado un jugador del ${team || 'equipo'} a solo ${price} euros...`);

        // 3. Conflicto (4-5s) - implicit_tension
        parts.push(`¿Demasiado barato para ser bueno?`);

        // 4. Inflexión (5-7s) - explosive_revelation
        parts.push(
            `¡${playerName}! ${stats.goals || 0} goles, ${stats.assists || 0} asistencias en ${stats.games || 0} partidos.`
        );

        // 5. Resolución (7-9s) - explosive_excitement
        if (ratio) {
            parts.push(`Ratio de valor: ${ratio}x. ¡Está RINDIENDO como uno de 15 millones!`);
        } else {
            parts.push(`Rating de ${stats.rating || 7.0}. ¡Es un CHOLLO BRUTAL!`);
        }

        // 6. Moraleja (9-10s) - knowing_wisdom
        parts.push(`A este precio, es IMPRESCINDIBLE para tu plantilla.`);

        // 7. CTA (10-12s) - urgent_call_to_action
        parts.push(`¿Fichamos ya o esperamos? ¡Yo lo tengo CLARO!`);

        return parts.join(' ');
    }

    /**
     * Prompt para análisis de jugador (con estructura viral)
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} stats - Estadísticas del jugador
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para análisis
     */
    buildAnalysisPrompt(playerName, price, stats = {}, options = {}) {
        // Si se proporciona estructura completa, usar método viral
        if (options.useViralStructure && options.structuredData) {
            return this.buildViralStructuredPrompt('analisis', options.structuredData, options);
        }

        // Diálogo simple (legacy)
        const dialogue =
            options.dialogue ||
            `${playerName}... los números son ESPECTACULARES! ${price}€ por este nivel... ¡Es MATEMÁTICA pura!`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para noticias urgentes/breaking news (con estructura viral)
     * @param {string} news - Noticia urgente
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para breaking news
     */
    buildBreakingNewsPrompt(news, options = {}) {
        // Si se proporciona estructura completa, usar método viral
        if (options.useViralStructure && options.structuredData) {
            return this.buildViralStructuredPrompt('breaking', options.structuredData, options);
        }

        // Diálogo simple (legacy)
        const dialogue =
            options.dialogue ||
            `¡ATENCIÓN Misters! Acaba de confirmarse... ¡${news}! ¡Actualizad vuestros equipos YA!`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para predicciones de jornada (con estructura viral)
     * @param {number} gameweek - Número de jornada
     * @param {string} prediction - Predicción principal
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para predicciones
     */
    buildPredictionPrompt(gameweek, prediction, options = {}) {
        // Si se proporciona estructura completa, usar método viral
        if (options.useViralStructure && options.structuredData) {
            return this.buildViralStructuredPrompt('prediccion', options.structuredData, options);
        }

        // Diálogo simple (legacy)
        const dialogue =
            options.dialogue ||
            `Para la jornada ${gameweek}... mi análisis indica que ¡${prediction}! Seguid mis consejos.`;

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para introducción/saludo
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para saludo
     */
    buildIntroPrompt(options = {}) {
        const dialogue =
            options.dialogue ||
            '¡Hola Misters! Bienvenidos a Fantasy La Liga. Soy Ana, y hoy tenemos análisis espectaculares.';

        return this.buildPrompt({ dialogue });
    }

    /**
     * Prompt para despedida/outro
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado para despedida
     */
    buildOutroPrompt(options = {}) {
        const dialogue =
            options.dialogue ||
            '¡Hasta la próxima, Misters! Recordad: en Fantasy La Liga, cada punto cuenta. ¡Nos vemos pronto!';

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
        const dialogue = dialogueMatch
            ? dialogueMatch[1]
            : 'Hola Misters! Bienvenidos a Fantasy La Liga.';

        // Usar prompt minimal como fallback - SIEMPRE forzar español de España
        const simplifiedPrompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}". Exact appearance from reference image.`;

        logger.info(
            `[PromptBuilder] Prompt simplificado de ${prompt.length} a ${simplifiedPrompt.length} chars`
        );
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
            validation.warnings.push(
                `Prompt muy largo: ${prompt.length} chars (recomendado: <${this.maxLength})`
            );
        }

        // Check que incluye Ana Character Bible O es prompt estructurado con "SPANISH FROM SPAIN"
        // Prompts minimales (<300 chars) están optimizados para máxima fidelidad a imagen de referencia
        // Prompts con "SPANISH FROM SPAIN" son prompts estructurados mejorados que fuerzan español de España
        const hasCharacterBible = prompt.includes(ANA_CHARACTER_BIBLE.substring(0, 50));
        const isStructuredSpanish = prompt.includes('SPANISH FROM SPAIN');

        if (!hasCharacterBible && !isStructuredSpanish && prompt.length > 300) {
            validation.errors.push(
                'Prompt no incluye Ana Character Bible ni es prompt estructurado con SPANISH FROM SPAIN'
            );
            validation.valid = false;
        } else if (!hasCharacterBible && !isStructuredSpanish && prompt.length <= 300) {
            validation.warnings.push(
                'Prompt minimal detectado - usando máxima fidelidad a imagen de referencia'
            );
        } else if (isStructuredSpanish) {
            validation.warnings.push(
                'Prompt estructurado con español de España detectado - forzando acento castellano'
            );
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

    /**
     * Validar convergencia viral del contenido
     * @param {string} dialogue - Diálogo completo
     * @param {object} options - Opciones de validación
     * @returns {object} - Resultado de validación de convergencia
     */
    validateViralConvergence(dialogue, options = {}) {
        const validation = {
            valid: true,
            convergenceRatio: { general: 0, niche: 0 },
            warnings: [],
            errors: []
        };

        // Keywords generales emocionales (70% esperado)
        const generalKeywords = [
            'secreto',
            'descubrir',
            'increíble',
            'espectacular',
            'mira',
            'sorpresa',
            'nadie',
            'todos',
            'ahora',
            'urgente',
            'atención',
            'misters',
            'preparaos',
            'explosivo'
        ];

        // Keywords nicho Fantasy La Liga (30% esperado)
        const nicheKeywords = [
            '€',
            'precio',
            'puntos',
            'fantasy',
            'chollo',
            'jornada',
            'gol',
            'asistencia',
            'rating',
            'equipo',
            'fichaje',
            'stats',
            'probabilidad',
            'valor'
        ];

        const words = dialogue.toLowerCase().split(/\s+/);
        let generalCount = 0;
        let nicheCount = 0;

        words.forEach(word => {
            if (generalKeywords.some(kw => word.includes(kw))) {
                generalCount++;
            }
            if (nicheKeywords.some(kw => word.includes(kw))) {
                nicheCount++;
            }
        });

        const totalKeywords = generalCount + nicheCount;
        if (totalKeywords > 0) {
            validation.convergenceRatio.general = Math.round((generalCount / totalKeywords) * 100);
            validation.convergenceRatio.niche = Math.round((nicheCount / totalKeywords) * 100);
        }

        // Validar ratio 70/30 (con margen +/- 10%)
        if (validation.convergenceRatio.general < 60) {
            validation.warnings.push(
                `Ratio general bajo: ${validation.convergenceRatio.general}% (esperado: 70%)`
            );
        }
        if (validation.convergenceRatio.niche < 20) {
            validation.warnings.push(
                `Ratio nicho bajo: ${validation.convergenceRatio.niche}% (esperado: 30%)`
            );
        }

        logger.info(
            `[PromptBuilder] Convergencia viral: ${validation.convergenceRatio.general}% general / ${validation.convergenceRatio.niche}% nicho`
        );

        return validation;
    }

    /**
     * Generar metadata completa para video viral
     * @param {string} type - Tipo de contenido
     * @param {string} dialogue - Diálogo completo
     * @returns {object} - Metadata completa
     */
    generateViralMetadata(type, dialogue) {
        const arco = this.arcosEmocionales[type];
        const convergence = this.validateViralConvergence(dialogue);

        return {
            contentType: type,
            emotionalArc: arco?.nombre || 'Unknown',
            estimatedDuration: arco?.duracion || 'N/A',
            structureElements: arco?.secuencia.length || 0,
            convergenceRatio: convergence.convergenceRatio,
            dialogueLength: dialogue.length,
            wordsCount: dialogue.split(/\s+/).length,
            validations: {
                convergence: convergence.warnings.length === 0,
                arcComplete: arco !== null
            }
        };
    }

    // ============================================================================
    // FRAME-TO-FRAME TRANSITION SYSTEM
    // ============================================================================

    /**
     * Genera descripción exhaustiva de frame de transición
     * Este frame debe ser idéntico entre el final de un segmento y el inicio del siguiente
     *
     * Basado en investigación VEO3 Frame-to-Frame Continuity (Octubre 2025)
     * Ver: docs/VEO3_TRANSICIONES_FRAME_TO_FRAME.md
     *
     * @returns {string} - Descripción textual exhaustiva del frame de transición
     */
    generateTransitionFrameDescription() {
        return `Ana Martínez, 32-year-old Spanish sports analyst, facing camera directly and centered in frame. Shoulders level and square to camera, body weight evenly distributed. Hands resting naturally at sides in relaxed ready position. Neutral professional expression with slight natural smile, eyes focused on camera lens, facial muscles relaxed and attentive. Studio lighting from front-left at 45 degrees creating soft shadow to right, three-point lighting setup with gentle fill from right side. Fantasy football graphics visible in background with natural blur and depth, completely static with no movement. Mid-shot framing at eye-level, static camera locked in position with no movement. Ana holds this stable neutral position for 1 full second with no micro-movements or adjustments. This is a transition frame designed for seamless segment linking.`;
    }

    /**
     * Construir prompt de segmento con frame de transición
     *
     * @param {object} options - Opciones del segmento
     * @param {string} options.contentType - Tipo de contenido (chollo, prediccion, breaking, analisis)
     * @param {number} options.segmentNumber - Número del segmento (1, 2, 3...)
     * @param {number} options.totalSegments - Total de segmentos del video completo
     * @param {string} options.dialogue - Diálogo de Ana para este segmento
     * @param {Array} options.elementos - Elementos de estructura viral para este segmento
     * @param {string} options.previousEndFrame - Descripción del frame final del segmento anterior (null si es primer segmento)
     * @param {boolean} options.needsTransitionEnd - Si este segmento necesita frame de transición al final (false si es último)
     *
     * @returns {object} - { prompt, transitionFrame, metadata }
     */
    buildSegmentWithTransition(options) {
        const {
            contentType,
            segmentNumber,
            totalSegments,
            dialogue,
            elementos = [],
            previousEndFrame = null,
            needsTransitionEnd = true
        } = options;

        logger.info(
            `[PromptBuilder] Construyendo segmento ${segmentNumber}/${totalSegments} con transiciones frame-to-frame`
        );

        // Componentes del prompt
        const promptParts = [];

        // 1. FRAME INICIAL
        if (previousEndFrame) {
            // Usar frame de transición del segmento anterior
            promptParts.push(`[FRAME INICIAL 0-1s - TRANSITION FROM PREVIOUS SEGMENT]`);
            promptParts.push(previousEndFrame);
            promptParts.push(`Starting from this stable transition position.`);
            promptParts.push(``);
        } else {
            // Primer segmento - intro natural
            promptParts.push(`[FRAME INICIAL - Natural Introduction]`);
            promptParts.push(
                `Ana Martínez in professional studio setup, ${this.getIntroPositionByContentType(contentType)}.`
            );
            promptParts.push(``);
        }

        // 2. CONTENIDO PRINCIPAL (desarrollo del segmento)
        const timeStart = previousEndFrame ? '1-7s' : '0-7s';
        promptParts.push(`[CONTENIDO ${timeStart}]`);
        promptParts.push(
            `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish):`
        );
        promptParts.push(`"${dialogue}"`);
        promptParts.push(``);

        // Dirección emocional basada en elementos
        if (elementos.length > 0) {
            const emotionalDirections = elementos
                .map(elem => {
                    const emocion = EMOCIONES_POR_ELEMENTO[elem]?.[contentType];
                    return this.emociones[emocion]?.physicality || 'natural professional energy';
                })
                .join(', ');

            promptParts.push(`Ana's energy: ${emotionalDirections}.`);
            promptParts.push(``);
        }

        // 3. FRAME FINAL
        if (needsTransitionEnd) {
            // Generar frame de transición para siguiente segmento
            promptParts.push(`[FRAME FINAL 7-8s - TRANSITION TO NEXT SEGMENT]`);
            promptParts.push(`Ana transitions smoothly to neutral ready position:`);

            const transitionFrame = this.generateTransitionFrameDescription();
            promptParts.push(transitionFrame);
        } else {
            // Último segmento - cierre natural
            promptParts.push(`[FRAME FINAL 7-8s - Natural Closing]`);
            promptParts.push(
                `Ana professional closing position, ${this.getClosingPositionByContentType(contentType)}.`
            );
        }

        // Construir prompt final
        const finalPrompt = promptParts.join('\n');

        // Metadata
        const metadata = {
            segmentNumber,
            totalSegments,
            contentType,
            elementos,
            hasTransitionStart: !!previousEndFrame,
            hasTransitionEnd: needsTransitionEnd,
            dialogueLength: dialogue.length,
            estimatedDuration: 8
        };

        logger.info(`[PromptBuilder] Segmento ${segmentNumber} construido con éxito`);
        logger.info(
            `[PromptBuilder] - Transition start: ${metadata.hasTransitionStart ? 'YES' : 'NO'}`
        );
        logger.info(
            `[PromptBuilder] - Transition end: ${metadata.hasTransitionEnd ? 'YES' : 'NO'}`
        );

        return {
            prompt: finalPrompt,
            transitionFrame: needsTransitionEnd ? this.generateTransitionFrameDescription() : null,
            metadata
        };
    }

    /**
     * Construir video multi-segmento completo con transiciones frame-to-frame
     *
     * @param {string} contentType - Tipo de contenido
     * @param {object} contentData - Datos del contenido (jugador, stats, etc.)
     * @param {number} targetSegments - Número de segmentos deseados (2-4)
     *
     * @returns {object} - { segments: [], totalDuration, metadata }
     */
    buildMultiSegmentVideo(contentType, contentData, targetSegments = 3) {
        logger.info(
            `[PromptBuilder] Construyendo video multi-segmento: ${targetSegments} segmentos de ${contentType}`
        );

        // Validar parámetros
        if (targetSegments < 2 || targetSegments > 4) {
            throw new Error('targetSegments debe estar entre 2 y 4');
        }

        // Obtener estructura viral del tipo de contenido
        const arco = this.arcosEmocionales[contentType];
        if (!arco) {
            throw new Error(`Tipo de contenido no válido: ${contentType}`);
        }

        // Dividir elementos de la estructura en segmentos
        const elementosPorSegmento = this.distributeElementsAcrossSegments(
            arco.secuencia,
            targetSegments
        );

        // Generar diálogos por segmento
        const dialogosPorSegmento = this.generateDialoguesForSegments(
            contentType,
            contentData,
            targetSegments
        );

        // Construir cada segmento
        const segments = [];
        let previousEndFrame = null;

        for (let i = 0; i < targetSegments; i++) {
            const segmentData = this.buildSegmentWithTransition({
                contentType,
                segmentNumber: i + 1,
                totalSegments: targetSegments,
                dialogue: dialogosPorSegmento[i],
                elementos: elementosPorSegmento[i],
                previousEndFrame: previousEndFrame,
                needsTransitionEnd: i < targetSegments - 1 // Solo si no es el último
            });

            segments.push(segmentData);
            previousEndFrame = segmentData.transitionFrame;
        }

        const totalDuration = targetSegments * 8;

        logger.info(
            `[PromptBuilder] ✅ Video multi-segmento construido: ${segments.length} segmentos, ${totalDuration}s totales`
        );

        return {
            segments,
            totalDuration,
            metadata: {
                contentType,
                targetSegments,
                emotionalArc: arco.nombre,
                transitionMethod: 'frame-to-frame',
                createdAt: new Date().toISOString()
            }
        };
    }

    /**
     * Distribuir elementos de estructura viral entre segmentos
     * @param {Array} secuencia - Secuencia completa del arco emocional
     * @param {number} targetSegments - Número de segmentos objetivo
     * @returns {Array<Array>} - Array de arrays con elementos por segmento
     */
    distributeElementsAcrossSegments(secuencia, targetSegments) {
        const elementos = secuencia.map(s => s.elemento);
        const elementsPerSegment = Math.ceil(elementos.length / targetSegments);

        const distribution = [];
        for (let i = 0; i < targetSegments; i++) {
            const start = i * elementsPerSegment;
            const end = Math.min(start + elementsPerSegment, elementos.length);
            distribution.push(elementos.slice(start, end));
        }

        return distribution;
    }

    /**
     * Generar diálogos específicos por segmento
     * @param {string} contentType - Tipo de contenido
     * @param {object} contentData - Datos del contenido
     * @param {number} targetSegments - Número de segmentos
     * @returns {Array<string>} - Array de diálogos por segmento
     */
    generateDialoguesForSegments(contentType, contentData, targetSegments) {
        // Implementación específica por tipo de contenido
        switch (contentType) {
            case 'chollo':
                return this.generateCholloSegmentDialogues(contentData, targetSegments);
            case 'prediccion':
                return this.generatePrediccionSegmentDialogues(contentData, targetSegments);
            case 'breaking':
                return this.generateBreakingSegmentDialogues(contentData, targetSegments);
            case 'analisis':
                return this.generateAnalisisSegmentDialogues(contentData, targetSegments);
            default:
                throw new Error(`Tipo de contenido no soportado: ${contentType}`);
        }
    }

    /**
     * Generar diálogos para chollo (3 segmentos típico)
     */
    generateCholloSegmentDialogues(contentData, targetSegments) {
        const { playerName, team, price, valueRatio } = contentData;

        if (targetSegments === 2) {
            return [
                `¿Sabéis cuál es el secreto que nadie os cuenta en Fantasy? Los chollos están escondidos donde nadie mira.`,
                `${playerName}. ${price} millones. ${team}. Ratio de valor ${valueRatio}. Es mi chollo de la jornada. Fichad antes de que suba.`
            ];
        } else if (targetSegments === 3) {
            return [
                `¿Sabéis cuál es el secreto que nadie os cuenta en Fantasy? Los chollos están escondidos en sitios donde nadie mira.`,
                `${playerName}. ${price} millones. ${team}. ¿Por qué nadie habla de él? Porque todos están obsesionados con los nombres grandes.`,
                `${playerName} tiene el ratio puntos-precio más alto de La Liga. ${valueRatio}. Por eso es mi chollo de la jornada. Fichad antes de que suba.`
            ];
        } else {
            // 4 segmentos
            return [
                `Tengo que contaros algo que va a cambiar vuestra estrategia en Fantasy para siempre.`,
                `Los chollos de verdad no están en las listas de fichajes trending. Están ocultos en los equipos que nadie mira.`,
                `${playerName}. ${team}. ${price} millones. Ratio de valor ${valueRatio}. Los números no mienten.`,
                `Este es mi chollo número uno de la jornada. Fichad ahora antes de que suba de precio. Lo agradeceréis.`
            ];
        }
    }

    /**
     * Generar diálogos para predicción (2-3 segmentos típico)
     */
    generatePrediccionSegmentDialogues(contentData, targetSegments) {
        const { playerName, team, matchup, expectedPoints } = contentData;

        if (targetSegments === 2) {
            return [
                `Esta jornada hay un partido que todos ignoran pero que puede darte ${expectedPoints} puntos extra. ${matchup}.`,
                `${playerName} capitán. Los datos son claros. Es mi capitán de la jornada.`
            ];
        } else {
            return [
                `Esta jornada hay un partido que todos ignoran pero que puede darte ${expectedPoints} puntos extra.`,
                `${matchup}. ${playerName} de ${team} está en racha y el rival es débil en defensa.`,
                `Los números dicen capitán ${playerName}. Es mi recomendación de la jornada.`
            ];
        }
    }

    /**
     * Generar diálogos para breaking news (2 segmentos típico)
     */
    generateBreakingSegmentDialogues(contentData, targetSegments) {
        const { playerName, newsType, impact } = contentData;

        if (targetSegments === 2) {
            return [
                `Alerta urgente para vuestro Fantasy. Noticia de última hora sobre ${playerName}.`,
                `${newsType}. Esto cambia completamente las estrategias para esta jornada. Actuad rápido.`
            ];
        } else {
            return [
                `Parad todo. Noticia de última hora que afecta a vuestro Fantasy.`,
                `${playerName}. ${newsType}. Esto es oficial.`,
                `${impact}. Tenéis que actuar ahora antes del deadline. No esperéis.`
            ];
        }
    }

    /**
     * Generar diálogos para análisis táctico (3 segmentos típico)
     */
    generateAnalisisSegmentDialogues(contentData, targetSegments) {
        const { playerName, team, tacticalInsight, recommendation } = contentData;

        if (targetSegments === 2) {
            return [
                `He estado analizando los números de ${playerName} y he descubierto algo que nadie está viendo.`,
                `${tacticalInsight}. ${recommendation}.`
            ];
        } else {
            return [
                `Vamos a analizar algo que cambia completamente la evaluación de ${playerName}.`,
                `${team} ha modificado su sistema táctico. ${tacticalInsight}.`,
                `Esto significa que ${recommendation}. Los datos lo confirman.`
            ];
        }
    }

    /**
     * Obtener posición de intro por tipo de contenido
     */
    getIntroPositionByContentType(contentType) {
        const positions = {
            chollo: 'leaning slightly forward with conspiratorial energy',
            prediccion: 'confident analyst pose with professional authority',
            breaking: 'alert position with urgent energy',
            analisis: 'composed professional stance with analytical focus'
        };

        return positions[contentType] || 'professional studio position';
    }

    /**
     * Obtener posición de cierre por tipo de contenido
     */
    getClosingPositionByContentType(contentType) {
        const positions = {
            chollo: 'satisfied knowing expression, confident call-to-action energy',
            prediccion: 'authoritative expert conclusion, confident posture',
            breaking: 'urgent final warning position, high energy maintained',
            analisis: 'professional summary stance, analytical confidence'
        };

        return positions[contentType] || 'professional closing position';
    }
}

module.exports = PromptBuilder;
module.exports.EMOCIONES_POR_ELEMENTO = EMOCIONES_POR_ELEMENTO;
module.exports.ARCOS_EMOCIONALES = ARCOS_EMOCIONALES;
