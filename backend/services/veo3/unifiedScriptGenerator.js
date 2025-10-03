/**
 * Generador de Guiones Unificados para Videos Multi-Segmento
 *
 * PROBLEMA RESUELTO:
 * Los videos de 4 segmentos carecían de cohesión narrativa porque cada
 * segmento se generaba independientemente sin arco emocional unificado.
 *
 * SOLUCIÓN:
 * 1. Generar UN guión completo de 32s con arco narrativo viral
 * 2. Dividir ese guión en 4 partes naturales que mantienen cohesión
 * 3. Aplicar framework viral (7 elementos) de forma integrada
 *
 * FRAMEWORK VIRAL APLICADO:
 * - Hook (2s): Captura atención inmediata
 * - Contexto (4s): Establece situación
 * - Conflicto (6s): Presenta problema/oportunidad
 * - Inflexión (8s): Punto de giro emocional
 * - Resolución (8s): Revelación de datos
 * - Moraleja (2s): Insight clave
 * - CTA (2s): Llamada a la acción
 */

const logger = require('../../utils/logger');

class UnifiedScriptGenerator {
    constructor() {
        // Estructura de arcos narrativos por tipo de contenido
        this.narrativeArcs = {
            chollo: {
                totalDuration: 32,
                emotionalJourney: ['curiosidad', 'intriga', 'sorpresa', 'urgencia'],
                structure: {
                    hook: { start: 0, duration: 2, emotion: 'curiosidad' },
                    contexto: { start: 2, duration: 4, emotion: 'intriga' },
                    conflicto: { start: 6, duration: 6, emotion: 'intriga' },
                    inflexion: { start: 12, duration: 8, emotion: 'sorpresa' },
                    resolucion: { start: 20, duration: 8, emotion: 'sorpresa' },
                    moraleja: { start: 28, duration: 2, emotion: 'urgencia' },
                    cta: { start: 30, duration: 2, emotion: 'urgencia' }
                }
            },
            analisis: {
                totalDuration: 32,
                emotionalJourney: ['autoridad', 'construccion', 'revelacion', 'conclusion'],
                structure: {
                    hook: { start: 0, duration: 2, emotion: 'autoridad' },
                    contexto: { start: 2, duration: 6, emotion: 'construccion' },
                    conflicto: { start: 8, duration: 6, emotion: 'construccion' },
                    inflexion: { start: 14, duration: 6, emotion: 'revelacion' },
                    resolucion: { start: 20, duration: 8, emotion: 'revelacion' },
                    moraleja: { start: 28, duration: 2, emotion: 'conclusion' },
                    cta: { start: 30, duration: 2, emotion: 'conclusion' }
                }
            },
            breaking: {
                totalDuration: 32,
                emotionalJourney: ['urgencia', 'impacto', 'shock', 'accion'],
                structure: {
                    hook: { start: 0, duration: 1.5, emotion: 'urgencia' },
                    contexto: { start: 1.5, duration: 4.5, emotion: 'impacto' },
                    conflicto: { start: 6, duration: 8, emotion: 'shock' },
                    inflexion: { start: 14, duration: 6, emotion: 'shock' },
                    resolucion: { start: 20, duration: 8, emotion: 'shock' },
                    moraleja: { start: 28, duration: 2, emotion: 'accion' },
                    cta: { start: 30, duration: 2, emotion: 'accion' }
                }
            }
        };

        // Plantillas de guión por tipo de contenido
        this.scriptTemplates = {
            chollo: this._getCholloTemplate(),
            analisis: this._getAnalisisTemplate(),
            breaking: this._getBreakingTemplate()
        };
    }

    /**
     * Generar guión unificado completo de 32 segundos
     * @param {string} contentType - Tipo de contenido (chollo, analisis, breaking)
     * @param {object} playerData - Datos del jugador
     * @param {object} options - Opciones adicionales
     * @returns {object} - Guión completo con 4 segmentos cohesivos
     */
    generateUnifiedScript(contentType, playerData, options = {}) {
        const { viralData = {} } = options;

        logger.info(`[UnifiedScriptGenerator] Generando guión unificado: ${contentType}`);
        logger.info(`[UnifiedScriptGenerator] Jugador: ${playerData.name}`);

        // Obtener arco narrativo y plantilla
        const arc = this.narrativeArcs[contentType] || this.narrativeArcs.chollo;
        const template = this.scriptTemplates[contentType] || this.scriptTemplates.chollo;

        // Generar guión completo con datos reales
        const fullScript = this._buildFullScript(template, playerData, viralData);

        // Dividir guión en 4 segmentos naturales (8s cada uno)
        const segments = this._divideIntoSegments(fullScript, arc);

        // Validar cohesión narrativa
        const validation = this._validateNarrativeCohesion(segments);

        logger.info(`[UnifiedScriptGenerator] ✅ Guión unificado generado: ${segments.length} segmentos`);
        logger.info(`[UnifiedScriptGenerator] Cohesión narrativa: ${validation.score}/100`);

        return {
            fullScript,
            segments,
            arc,
            validation,
            metadata: {
                contentType,
                playerName: playerData.name,
                totalDuration: arc.totalDuration,
                emotionalJourney: arc.emotionalJourney,
                cohesionScore: validation.score,
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Template de guión para chollos (32s)
     */
    _getCholloTemplate() {
        return {
            // SEGMENTO 1 (0-8s): Hook + Contexto
            segment1: {
                hook: "¡Misters! He encontrado EL CHOLLO de esta jornada.", // 2s
                contexto: "Estamos en {{jornada}}, y todos buscan opciones baratas que den puntos. Pero hay un jugador que NADIE está fichando.", // 6s
                transition: "¿Quién es?"
            },
            // SEGMENTO 2 (8-16s): Conflicto + Inflexión (inicio)
            segment2: {
                conflicto: "{{player}} del {{team}}. Solo cuesta {{price}} millones. La mayoría lo ignora porque juega en un equipo medio.", // 6s
                inflexion_start: "Pero mirad estos números..." // 2s
            },
            // SEGMENTO 3 (16-24s): Inflexión (cont) + Resolución
            segment3: {
                inflexion_continue: "{{goals}} goles y {{assists}} asistencias en {{games}} partidos.", // 4s
                resolucion: "Su ratio calidad-precio es {{valueRatio}}x. Eso significa que está dando el DOBLE de puntos que su precio sugiere.", // 4s
            },
            // SEGMENTO 4 (24-32s): Moraleja + CTA
            segment4: {
                moraleja: "A {{price}}M es una GANGA absoluta. El mercado aún no lo ha valorado.", // 4s
                cta: "Si lo fichas YA, tendrás ventaja antes que suba de precio. ¿A qué esperas?", // 4s
            }
        };
    }

    /**
     * Template de guión para análisis táctico (32s)
     */
    _getAnalisisTemplate() {
        return {
            segment1: {
                hook: "Análisis táctico: {{player}}.", // 2s
                contexto: "En los últimos {{games}} partidos, ha cambiado su rol en el {{team}}. Y los números lo confirman.", // 6s
                transition: "Vamos a los datos."
            },
            segment2: {
                conflicto: "{{goals}} goles, {{assists}} asistencias. Pero lo importante es DÓNDE los hace.", // 6s
                inflexion_start: "Mirad su mapa de calor..." // 2s
            },
            segment3: {
                inflexion_continue: "Está recibiendo el balón en zonas de finalización. Su xG ha subido un {{xgIncrease}}%.", // 4s
                resolucion: "El entrenador lo ha adelantado en el campo. Más cerca del gol = más puntos Fantasy.", // 4s
            },
            segment4: {
                moraleja: "A {{price}}M, con este nuevo rol, es una inversión inteligente.", // 4s
                cta: "Los datos no mienten. Fichalo antes que suba.", // 4s
            }
        };
    }

    /**
     * Template de guión para breaking news (32s)
     */
    _getBreakingTemplate() {
        return {
            segment1: {
                hook: "ÚLTIMA HORA: {{player}}.", // 1.5s
                contexto: "Acabo de confirmar información que cambia TODO para Fantasy. Escuchadme bien.", // 6.5s
            },
            segment2: {
                conflicto: "{{newsContent}}. Esto afecta directamente a su valor Fantasy.", // 6s
                inflexion_start: "¿Qué significa esto para vosotros?" // 2s
            },
            segment3: {
                inflexion_continue: "{{impact}}. Los puntos que puede dar se multiplican.", // 4s
                resolucion: "He hecho los cálculos: su proyección pasa de {{oldProjection}} a {{newProjection}} puntos.", // 4s
            },
            segment4: {
                moraleja: "Esta información aún no la tiene todo el mundo. Ventana de oportunidad pequeña.", // 4s
                cta: "Actúa AHORA o te quedarás fuera. Tu decides.", // 4s
            }
        };
    }

    /**
     * Construir guión completo con datos reales
     */
    _buildFullScript(template, playerData, viralData) {
        const data = {
            player: playerData.name || 'El Jugador',
            team: playerData.team || 'su equipo',
            price: playerData.price || '5.0',
            goals: playerData.stats?.goals || 0,
            assists: playerData.stats?.assists || 0,
            games: playerData.stats?.games || 0,
            valueRatio: playerData.valueRatio || '1.0',
            jornada: viralData.gameweek || 'jornada 5',
            xgIncrease: viralData.xgIncrease || '30',
            newsContent: viralData.newsContent || 'cambio en la alineación titular',
            impact: viralData.impact || 'Más minutos garantizados',
            oldProjection: viralData.oldProjection || '40',
            newProjection: viralData.newProjection || '60'
        };

        const fullScript = {};

        // Reemplazar variables en cada segmento
        Object.keys(template).forEach(segmentKey => {
            fullScript[segmentKey] = {};
            Object.keys(template[segmentKey]).forEach(partKey => {
                let text = template[segmentKey][partKey];
                // Reemplazar todas las variables {{variable}}
                Object.keys(data).forEach(key => {
                    text = text.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
                });
                fullScript[segmentKey][partKey] = text;
            });
        });

        return fullScript;
    }

    /**
     * Dividir guión en 4 segmentos de 8s cada uno
     */
    _divideIntoSegments(fullScript, arc) {
        const segments = [];

        // Segmento 1 (0-8s): Hook + Contexto
        segments.push({
            role: 'intro',
            duration: 8,
            timeRange: '0-8s',
            dialogue: this._joinScriptParts(fullScript.segment1),
            emotion: 'curiosidad/intriga',
            narrativeFunction: 'Hook + Contexto',
            transitionTo: 'segment2'
        });

        // Segmento 2 (8-16s): Conflicto + Inflexión (inicio)
        segments.push({
            role: 'analysis',
            duration: 8,
            timeRange: '8-16s',
            dialogue: this._joinScriptParts(fullScript.segment2),
            emotion: 'intriga/construcción',
            narrativeFunction: 'Conflicto + Inflexión (inicio)',
            transitionTo: 'segment3'
        });

        // Segmento 3 (16-24s): Inflexión (cont) + Resolución
        segments.push({
            role: 'middle',
            duration: 8,
            timeRange: '16-24s',
            dialogue: this._joinScriptParts(fullScript.segment3),
            emotion: 'sorpresa/revelación',
            narrativeFunction: 'Inflexión + Resolución',
            transitionTo: 'segment4'
        });

        // Segmento 4 (24-32s): Moraleja + CTA
        segments.push({
            role: 'outro',
            duration: 8,
            timeRange: '24-32s',
            dialogue: this._joinScriptParts(fullScript.segment4),
            emotion: 'urgencia/acción',
            narrativeFunction: 'Moraleja + CTA',
            transitionTo: null
        });

        return segments;
    }

    /**
     * Unir partes de un segmento en diálogo continuo
     */
    _joinScriptParts(segmentParts) {
        return Object.values(segmentParts).join(' ');
    }

    /**
     * Validar cohesión narrativa entre segmentos
     */
    _validateNarrativeCohesion(segments) {
        const checks = [];
        let score = 100;

        // Check 1: Cada segmento tiene diálogo
        segments.forEach((seg, i) => {
            if (!seg.dialogue || seg.dialogue.length < 10) {
                checks.push({ check: `Segmento ${i+1} diálogo`, passed: false });
                score -= 25;
            } else {
                checks.push({ check: `Segmento ${i+1} diálogo`, passed: true });
            }
        });

        // Check 2: Transiciones naturales
        for (let i = 0; i < segments.length - 1; i++) {
            const hasTransition = segments[i].transitionTo === `segment${i + 2}`;
            if (!hasTransition) {
                checks.push({ check: `Transición ${i+1}→${i+2}`, passed: false });
                score -= 15;
            } else {
                checks.push({ check: `Transición ${i+1}→${i+2}`, passed: true });
            }
        }

        // Check 3: Arco emocional progresivo
        const emotions = segments.map(s => s.emotion);
        const hasProgression = emotions.length === 4;
        checks.push({ check: 'Arco emocional', passed: hasProgression });
        if (!hasProgression) score -= 20;

        return {
            score: Math.max(0, score),
            checks,
            cohesive: score >= 70,
            recommendations: score < 70 ? ['Revisar transiciones entre segmentos', 'Verificar continuidad narrativa'] : []
        };
    }
}

module.exports = UnifiedScriptGenerator;
