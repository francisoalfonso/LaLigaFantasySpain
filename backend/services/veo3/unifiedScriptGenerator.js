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
                totalDuration: 24,
                emotionalJourney: ['curiosidad', 'revelacion', 'validacion', 'urgencia'],
                structure: {
                    hook: { start: 0, duration: 2, emotion: 'curiosidad' },
                    transition: { start: 2, duration: 1, emotion: 'curiosidad' },
                    revelation: { start: 3, duration: 2, emotion: 'revelacion' }, // ⭐ SEGUNDO 3 - FACTOR X
                    preview: { start: 5, duration: 3, emotion: 'revelacion' },
                    validation: { start: 8, duration: 8, emotion: 'validacion' }, // Seg 2: Stats + prueba
                    urgency: { start: 16, duration: 5, emotion: 'urgencia' },
                    cta: { start: 21, duration: 3, emotion: 'urgencia' }
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
     * ⭐ Template de guión para chollos (24s) - ESTRATEGIA REVELACIÓN SEGUNDO 3
     * Basado en estrategia viral: Hook (0-2s) → Transición (2-3s) → REVELACIÓN (3-4s)
     */
    _getCholloTemplate() {
        return {
            // SEGMENTO 1 (0-8s): Hook susurrante + REVELACIÓN SEGUNDO 3
            // ✅ BASADO EN VIDEO QUE FUNCIONA: Tono conspiratorio, texto corto
            segment1: {
                whisper: "He encontrado el chollo absoluto...", // 0-3s: Susurro conspirativo
                revelation: "{{player}} por solo {{price}} millones...", // 3-6s: ⭐ REVELACIÓN SEGUNDO 3
                explosion: "va a explotar." // 6-8s: Explosión emocional
            },
            // SEGMENTO 2 (8-16s): Stats clave con tono entusiasta
            segment2: {
                stats: "{{goals}} goles, {{assists}} asistencias.", // 3s: Datos rápidos
                insight: "Su ratio valor es {{valueRatio}} veces superior.", // 3s: Insight clave
                proof: "Está dando el doble de puntos." // 2s: Prueba contundente
            },
            // SEGMENTO 3 (16-24s): Urgencia + CTA directo
            segment3: {
                urgency: "A {{price}} millones es una ganga.", // 3s: Urgencia clara
                scarcity: "Nadie lo ha fichado aún.", // 2s: Escasez
                cta: "Fichad a {{player}} ahora." // 3s: CTA directo
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
                moraleja: "A {{price}} millones, con este nuevo rol, es una inversión inteligente.", // 4s
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
        // 📋 OPTIMIZACIÓN DICCIONARIO: Usar solo apellido (sin nombre completo, sin equipo)
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'El Jugador';

        // ✅ Convertir precio numérico a texto en español
        const priceText = this._numberToSpanishText(playerData.price || 5.0);

        const data = {
            player: playerLastName,  // ✅ Solo apellido para optimizar con diccionario
            team: playerData.team || 'su equipo',
            price: priceText,  // ✅ Precio en texto (ej: "cuatro punto cinco")
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
     * ⭐ Dividir guión en 3 segmentos de 8s cada uno (CHOLLO VIRAL - REVELACIÓN SEGUNDO 3)
     */
    _divideIntoSegments(fullScript, arc) {
        const segments = [];

        // Segmento 1 (0-8s): Hook + REVELACIÓN SEGUNDO 3 + Precio
        segments.push({
            role: 'intro',
            duration: 8,
            timeRange: '0-8s',
            dialogue: this._joinScriptParts(fullScript.segment1),
            emotion: 'curiosidad → revelación',
            narrativeFunction: 'Hook + REVELACIÓN (seg 3) + Preview',
            transitionTo: 'segment2'
        });

        // Segmento 2 (8-16s): Validación con datos
        segments.push({
            role: 'stats',
            duration: 8,
            timeRange: '8-16s',
            dialogue: this._joinScriptParts(fullScript.segment2),
            emotion: 'validación con pruebas',
            narrativeFunction: 'Stats + Ratio valor + Proof',
            transitionTo: 'segment3'
        });

        // Segmento 3 (16-24s): Urgencia + CTA
        segments.push({
            role: 'outro',
            duration: 8,
            timeRange: '16-24s',
            dialogue: this._joinScriptParts(fullScript.segment3),
            emotion: 'urgencia + acción',
            narrativeFunction: 'Urgencia + Scarcity + CTA',
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

    /**
     * Convertir número a texto en español para pronunciación correcta
     * @private
     */
    _numberToSpanishText(number) {
        if (!number) return 'cero';
        const num = parseFloat(number);

        // Separar parte entera y decimal
        const parts = num.toString().split('.');
        const integerPart = parseInt(parts[0]);
        const decimalPart = parts[1] ? parts[1] : null;

        // Números básicos
        const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
        const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

        let result = '';

        // Parte entera
        if (integerPart === 0) {
            result = 'cero';
        } else if (integerPart < 10) {
            result = ones[integerPart];
        } else if (integerPart < 20) {
            result = teens[integerPart - 10];
        } else if (integerPart < 30) {
            result = integerPart === 20 ? 'veinte' : 'veinti' + ones[integerPart - 20];
        } else if (integerPart < 100) {
            const ten = Math.floor(integerPart / 10);
            const one = integerPart % 10;
            result = tens[ten] + (one > 0 ? ' y ' + ones[one] : '');
        }

        // Agregar parte decimal si existe
        if (decimalPart) {
            result += ' punto ' + decimalPart.split('').map(d => ones[parseInt(d)] || 'cero').join(' ');
        }

        return result;
    }
}

module.exports = UnifiedScriptGenerator;
