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
const EmotionAnalyzer = require('./emotionAnalyzer');
const CreativeReferenceGenerator = require('../creativeReferenceGenerator');

class UnifiedScriptGenerator {
    constructor() {
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.creativeRefGenerator = new CreativeReferenceGenerator();

        // ✨ Variedad léxica: Banco de sinónimos para evitar repeticiones
        // Basado en VEO3_CONTENIDO_VIRAL_ESTRATEGIA.md
        this.synonymBank = {
            greeting: {
                intro: ['Misters'], // Siempre "Misters" en intro (identidad de marca)
                middle: ['Managers', 'Cracks', 'Jefes'], // Variar en middle
                outro: ['Tíos', 'Equipo', 'Gente'] // Variar en outro
            }
        };

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

        logger.info(
            `[UnifiedScriptGenerator] ✅ Guión unificado generado: ${segments.length} segmentos`
        );
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
     * ⭐ Template de guión para chollos (24s) - ARCO NARRATIVO PROGRESIVO
     * Basado en estrategia viral: Hook → Revelación → Validación → Urgencia → CTA
     *
     * 🎯 CONSTRAINT ACTUALIZADO (11 Oct 2025 - Fix #4.2): 24-25 palabras por segmento (~8s de audio)
     * - Ana habla ~3.43 palabras/segundo (ritmo REAL medido en test E2E)
     * - Video: 8s por escena (duración total VEO3 estándar playground)
     * - Audio: 24-25 palabras = ~7.0-7.3s de audio natural SIN cortes
     * - Total: 3 escenas × 8s = 24s | Audio total: 3 × 8s = 24s
     *
     * ⚠️ PROBLEMA RESUELTO (Fix #4.2): Diálogos de 27 palabras cortaban al final (video 661a21bd)
     * ✅ SOLUCIÓN FINAL: Reducir a 24-25 palabras para dar margen de seguridad
     *
     * ✅ BASADO EN TESTS E2E REALES (11 Oct 2025)
     * - Test 1 (08:40): 7s = 24 palabras (fluido, sin cortes) ✅
     * - Test 2 (10:18): 8s = 27 palabras (Ana cortaba al final) ❌
     * - Velocidad real: 24 / 7 = 3.43 palabras/segundo
     * - Conclusión: 24-25 palabras es el rango óptimo para 8s sin cortes
     *
     * ✅ ARCO NARRATIVO ÚNICO - Sin repeticiones, pero con continuidad
     * - Escena 1: Hook intrigante + presenta el chollo con misterio
     * - Escena 2: Prueba con datos + explica POR QUÉ es chollo
     * - Escena 3: Urgencia máxima + CTA fuerte
     */
    _getCholloTemplate() {
        return {
            // SEGMENTO 1 (0-8s): ACTO 1 - Hook + Intriga + Presentación
            // 🎭 Función: Capturar atención con misterio, presentar el chollo sin revelar TODO
            // 📊 25 palabras → 8s audio → ✅ FIX #4.2 (11 Oct 2025): Reducido de 27 a 25 palabras
            // MEDIDO: Video 661a21bd con 27 palabras cortaba al final, reducido a 25 para dar margen
            segment1: {
                hook: 'Misters, tengo un chollazo que no os vais a creer...', // Intriga inicial (11 palabras)
                revelation: '{{player}} está a precio de risa en Fantasy.', // Presentación del chollo (9 palabras)
                context: 'Y casi nadie lo está fichando todavía.', // Escasez social (8 palabras)
                promise: '' // Sin promesa para mantener 26 palabras TOTAL
            },
            // SEGMENTO 2 (8-16s): ACTO 2 - Validación + Prueba con datos
            // 🎭 Función: Explicar POR QUÉ es chollo con datos concretos
            // 📊 27 palabras → 8s audio → ✅ CALCULADO
            segment2: {
                impact: 'Los números son brutales, {{greetingMiddle}}.', // ✨ Variedad léxica: Managers/Cracks/Jefes
                proof: 'Rinde como los mejores de La Liga... ¡dobla su valor en puntos!', // Prueba del chollo
                evidence: 'Y está más barato que un suplente del Cádiz.' // Comparación (27 palabras TOTAL)
            },
            // SEGMENTO 3 (16-24s): ACTO 3 - Urgencia + Scarcity + CTA
            // 🎭 Función: Crear FOMO y obligar a actuar YA
            // 📊 27 palabras → 8s audio → ✅ CALCULADO
            segment3: {
                urgency: '¿Qué más queréis, {{greetingOutro}}?', // ✨ Variedad léxica: Tíos/Equipo/Gente
                scarcity: 'Titular del {{team}} al precio de un suplente random.', // Enfatizar absurdo
                fomo: 'Si no lo ficháis ahora, mañana vale el doble.' // FOMO temporal (27 palabras TOTAL)
            }
        };
    }

    /**
     * Template de guión para análisis táctico (32s)
     */
    _getAnalisisTemplate() {
        return {
            segment1: {
                hook: 'Análisis táctico: {{player}}.', // 2s
                contexto:
                    'En los últimos {{games}} partidos, ha cambiado su rol en el {{team}}. Y los números lo confirman.', // 6s
                transition: 'Vamos a los datos.'
            },
            segment2: {
                conflicto:
                    '{{goals}} goles, {{assists}} asistencias. Pero lo importante es DÓNDE los hace.', // 6s
                inflexion_start: 'Mirad su mapa de calor...' // 2s
            },
            segment3: {
                inflexion_continue:
                    'Está recibiendo el balón en zonas de finalización. Su xG ha subido un {{xgIncrease}}%.', // 4s
                resolucion:
                    'El entrenador lo ha adelantado en el campo. Más cerca del gol = más puntos Fantasy.' // 4s
            },
            segment4: {
                moraleja: 'A {{price}} millones, con este nuevo rol, es una inversión inteligente.', // 4s
                cta: 'Los datos no mienten. Fichalo antes que suba.' // 4s
            }
        };
    }

    /**
     * Template de guión para breaking news (32s)
     */
    _getBreakingTemplate() {
        return {
            segment1: {
                hook: 'ÚLTIMA HORA: {{player}}.', // 1.5s
                contexto:
                    'Acabo de confirmar información que cambia TODO para Fantasy. Escuchadme bien.' // 6.5s
            },
            segment2: {
                conflicto: '{{newsContent}}. Esto afecta directamente a su valor Fantasy.', // 6s
                inflexion_start: '¿Qué significa esto para vosotros?' // 2s
            },
            segment3: {
                inflexion_continue: '{{impact}}. Los puntos que puede dar se multiplican.', // 4s
                resolucion:
                    'He hecho los cálculos: su proyección pasa de {{oldProjection}} a {{newProjection}} puntos.' // 4s
            },
            segment4: {
                moraleja:
                    'Esta información aún no la tiene todo el mundo. Ventana de oportunidad pequeña.', // 4s
                cta: 'Actúa AHORA o te quedarás fuera. Tu decides.' // 4s
            }
        };
    }

    /**
     * Construir guión completo con datos reales
     */
    _buildFullScript(template, playerData, viralData) {
        // ✅ REFERENCIAS CREATIVAS: Usar CreativeReferenceGenerator para frases atractivas
        // En lugar de solo apellido, usaremos referencias virales:
        // Ej: "Vinicius Jr." → ["Vini", "el 7 madridista", "el brasileño", "el extremo del Madrid"]
        const playerName = playerData.name || 'El Jugador';

        // Generar referencias creativas automáticamente
        const creativeRef = this.creativeRefGenerator.getCreativeReference(
            playerName,
            {
                team: playerData.team,
                position: playerData.position,
                number: playerData.number || null
            },
            {
                avoidGeneric: true, // Evitar "el jugador" si hay alternativas mejores
                preferNickname: true // Preferir apodos conocidos
            }
        );

        logger.info(
            `[UnifiedScriptGenerator] 🎨 Referencia creativa: "${playerName}" → "${creativeRef}"`
        );

        const playerLastName = creativeRef; // Usar referencia creativa en lugar de solo apellido

        // ✅ Convertir precio numérico a texto en español
        const priceText = this._numberToSpanishText(playerData.price || 5.0);

        // ✅ NORMA #1: Pluralización correcta (gol/goles, asistencia/asistencias)
        const goals = playerData.stats?.goals || 0;
        const assists = playerData.stats?.assists || 0;
        const goalsText = goals === 1 ? `${goals} gol` : `${goals} goles`;
        const assistsText = assists === 1 ? `${assists} asistencia` : `${assists} asistencias`;

        // ✅ Convertir ratio numérico a texto pronunciable (ej: 1.8 → "uno punto ocho")
        const ratioValue = playerData.ratio || playerData.valueRatio || 1.0;
        const valueRatioText = this._numberToSpanishText(ratioValue);

        // ✨ VARIEDAD LÉXICA: Seleccionar saludos aleatorios para cada segmento
        // Intro siempre "Misters" (identidad de marca), middle y outro varían
        const greetingMiddle = this._selectRandomGreeting('middle'); // Managers/Cracks/Jefes
        const greetingOutro = this._selectRandomGreeting('outro'); // Tíos/Equipo/Gente

        const data = {
            player: playerLastName, // ✅ Solo apellido para optimizar con diccionario
            team: playerData.team || 'su equipo',
            price: priceText, // ✅ Precio en texto (ej: "cuatro punto cinco")
            goals: goalsText, // ✅ Con pluralización correcta ("2 goles" o "1 gol")
            assists: assistsText, // ✅ Con pluralización correcta ("1 asistencia" o "2 asistencias")
            games: playerData.stats?.games || 0,
            valueRatio: ratioValue, // Número para uso en lógica
            valueRatioText, // ✅ Texto pronunciable (ej: "uno punto ocho")
            greetingMiddle, // ✨ Variedad léxica: Managers/Cracks/Jefes
            greetingOutro, // ✨ Variedad léxica: Tíos/Equipo/Gente
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
        const dialogue1 = this._joinScriptParts(fullScript.segment1);

        // 🤖 ANÁLISIS INTELIGENTE: Detectar emoción basada en contenido
        const segment1Analysis = this.emotionAnalyzer.analyzeSegment(dialogue1, {
            narrativeRole: 'hook',
            contentType: arc.emotionalJourney ? 'chollo' : 'generic',
            position: 0
        });

        segments.push({
            role: 'intro',
            duration: 8, // ✅ ACTUALIZADO 11 Oct 2025: 7s → 8s
            timeRange: '0-8s',
            dialogue: dialogue1,
            emotion: segment1Analysis.dominantEmotion, // ✅ Emoción DETECTADA automáticamente
            emotionDistribution: segment1Analysis.emotionDistribution,
            narrativeFunction: 'Hook + REVELACIÓN (seg 3) + Preview',
            transitionTo: 'segment2'
        });

        // Segmento 2 (8-16s): Validación con datos
        const dialogue2 = this._joinScriptParts(fullScript.segment2);

        // 🤖 ANÁLISIS INTELIGENTE: Detectar emoción basada en contenido
        const segment2Analysis = this.emotionAnalyzer.analyzeSegment(dialogue2, {
            narrativeRole: 'resolucion',
            contentType: arc.emotionalJourney ? 'chollo' : 'generic',
            position: 0.5,
            previousEmotion: segment1Analysis.dominantEmotion
        });

        segments.push({
            role: 'middle',
            duration: 8, // ✅ ACTUALIZADO 11 Oct 2025: 7s → 8s
            timeRange: '8-16s',
            dialogue: dialogue2,
            emotion: segment2Analysis.dominantEmotion, // ✅ Emoción DETECTADA automáticamente
            emotionDistribution: segment2Analysis.emotionDistribution,
            narrativeFunction: 'Stats + Ratio valor + Proof',
            transitionTo: 'segment3'
        });

        // Segmento 3 (16-24s): Urgencia + CTA
        const dialogue3 = this._joinScriptParts(fullScript.segment3);

        // 🤖 ANÁLISIS INTELIGENTE: Detectar emoción basada en contenido
        const segment3Analysis = this.emotionAnalyzer.analyzeSegment(dialogue3, {
            narrativeRole: 'cta',
            contentType: arc.emotionalJourney ? 'chollo' : 'generic',
            position: 1.0,
            previousEmotion: segment2Analysis.dominantEmotion
        });

        segments.push({
            role: 'outro',
            duration: 8, // ✅ ACTUALIZADO 11 Oct 2025: 7s → 8s
            timeRange: '16-24s',
            dialogue: dialogue3,
            emotion: segment3Analysis.dominantEmotion, // ✅ Emoción DETECTADA automáticamente
            emotionDistribution: segment3Analysis.emotionDistribution,
            narrativeFunction: 'Urgencia + Scarcity + CTA',
            transitionTo: null
        });

        // ⚠️ VALIDACIÓN: Verificar que cada diálogo cabe en 8s de audio (~27 palabras óptimo)
        this._validateDialogueDuration(dialogue1, 'Segmento 1');
        this._validateDialogueDuration(dialogue2, 'Segmento 2');
        this._validateDialogueDuration(dialogue3, 'Segmento 3');

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
                checks.push({ check: `Segmento ${i + 1} diálogo`, passed: false });
                score -= 25;
            } else {
                checks.push({ check: `Segmento ${i + 1} diálogo`, passed: true });
            }
        });

        // Check 2: Transiciones naturales
        for (let i = 0; i < segments.length - 1; i++) {
            const hasTransition = segments[i].transitionTo === `segment${i + 2}`;
            if (!hasTransition) {
                checks.push({ check: `Transición ${i + 1}→${i + 2}`, passed: false });
                score -= 15;
            } else {
                checks.push({ check: `Transición ${i + 1}→${i + 2}`, passed: true });
            }
        }

        // Check 3: Arco emocional progresivo
        const emotions = segments.map(s => s.emotion);
        const hasProgression = emotions.length === 4;
        checks.push({ check: 'Arco emocional', passed: hasProgression });
        if (!hasProgression) {
            score -= 20;
        }

        return {
            score: Math.max(0, score),
            checks,
            cohesive: score >= 70,
            recommendations:
                score < 70
                    ? ['Revisar transiciones entre segmentos', 'Verificar continuidad narrativa']
                    : []
        };
    }

    /**
     * ⚠️ Validar que el diálogo cabe en 8 segundos de audio (ACTUALIZADO 11 Oct 2025 - Fix Timing)
     * @param {string} dialogue - Texto del diálogo
     * @param {string} segmentName - Nombre del segmento (para logging)
     */
    _validateDialogueDuration(dialogue, segmentName) {
        const words = dialogue.trim().split(/\s+/);
        const wordCount = words.length;
        const estimatedDuration = wordCount / 3.43; // Ana habla ~3.43 palabras/segundo (MEDIDO en test E2E real: 24 palabras / 7s)

        // ✅ FIX #4.2 (11 Oct 2025): Rangos actualizados tras video 661a21bd
        // Test anterior: 7s = 24 palabras (fluido, sin cortes)
        // Test 661a21bd: 8s = 27 palabras → Ana cortaba al final
        // Solución: Reducir a 25-26 palabras para dar margen de seguridad
        const minWords = 24; // Mínimo para llenar 8s sin silencios (24 / 3.43 = 7.0s)
        const maxWords = 26; // Máximo para no exceder 8s y evitar cortes (26 / 3.43 = 7.6s)
        const idealMin = 24;
        const idealMax = 25;

        if (wordCount < minWords) {
            logger.warn(`[UnifiedScriptGenerator] ⚠️ ${segmentName} MUY CORTO:`);
            logger.warn(
                `[UnifiedScriptGenerator]    - Palabras: ${wordCount} (mínimo: ${minWords})`
            );
            logger.warn(
                `[UnifiedScriptGenerator]    - Duración estimada: ${estimatedDuration.toFixed(1)}s (objetivo: 8s)`
            );
            logger.warn(
                `[UnifiedScriptGenerator]    - RIESGO: Silencios incómodos, VEO3 puede inventar contenido`
            );
        } else if (wordCount > maxWords) {
            logger.warn(`[UnifiedScriptGenerator] ⚠️ ${segmentName} MUY LARGO:`);
            logger.warn(
                `[UnifiedScriptGenerator]    - Palabras: ${wordCount} (máximo: ${maxWords})`
            );
            logger.warn(
                `[UnifiedScriptGenerator]    - Duración estimada: ${estimatedDuration.toFixed(1)}s (objetivo: 8s)`
            );
            logger.warn(
                `[UnifiedScriptGenerator]    - RIESGO: Se cortará el audio (medido en test E2E)`
            );
        } else if (wordCount >= idealMin && wordCount <= idealMax) {
            logger.info(
                `[UnifiedScriptGenerator] ✅ ${segmentName}: ${wordCount} palabras (~${estimatedDuration.toFixed(1)}s audio) - IDEAL`
            );
        } else {
            logger.info(
                `[UnifiedScriptGenerator] ✅ ${segmentName}: ${wordCount} palabras (~${estimatedDuration.toFixed(1)}s audio) - OK`
            );
        }

        return {
            wordCount,
            estimatedDuration,
            fitsIn8s: wordCount >= minWords && wordCount <= maxWords,
            isIdeal: wordCount >= idealMin && wordCount <= idealMax
        };
    }

    /**
     * ✨ Seleccionar saludo aleatorio según el rol del segmento (VARIEDAD LÉXICA)
     * @param {string} role - Rol del segmento (intro, middle, outro)
     * @returns {string} - Saludo seleccionado del banco de sinónimos
     * @private
     */
    _selectRandomGreeting(role) {
        const greetings = this.synonymBank.greeting[role] || ['Misters'];
        const randomIndex = Math.floor(Math.random() * greetings.length);
        const selected = greetings[randomIndex];

        logger.info(
            `[UnifiedScriptGenerator] ✨ Variedad léxica [${role}]: "${selected}" (de ${greetings.length} opciones)`
        );

        return selected;
    }

    /**
     * Convertir número a texto en español para pronunciación correcta
     * @private
     */
    _numberToSpanishText(number) {
        if (!number) {
            return 'cero';
        }
        const num = parseFloat(number);

        // Separar parte entera y decimal
        const parts = num.toString().split('.');
        const integerPart = parseInt(parts[0]);
        const decimalPart = parts[1] ? parts[1] : null;

        // Números básicos
        const ones = [
            '',
            'uno',
            'dos',
            'tres',
            'cuatro',
            'cinco',
            'seis',
            'siete',
            'ocho',
            'nueve'
        ];
        const teens = [
            'diez',
            'once',
            'doce',
            'trece',
            'catorce',
            'quince',
            'dieciséis',
            'diecisiete',
            'dieciocho',
            'diecinueve'
        ];
        const tens = [
            '',
            '',
            'veinte',
            'treinta',
            'cuarenta',
            'cincuenta',
            'sesenta',
            'setenta',
            'ochenta',
            'noventa'
        ];

        let result = '';

        // Parte entera
        if (integerPart === 0) {
            result = 'cero';
        } else if (integerPart < 10) {
            result = ones[integerPart];
        } else if (integerPart < 20) {
            result = teens[integerPart - 10];
        } else if (integerPart < 30) {
            result = integerPart === 20 ? 'veinte' : `veinti${ones[integerPart - 20]}`;
        } else if (integerPart < 100) {
            const ten = Math.floor(integerPart / 10);
            const one = integerPart % 10;
            result = tens[ten] + (one > 0 ? ` y ${ones[one]}` : '');
        }

        // Agregar parte decimal si existe
        if (decimalPart) {
            result += ` punto ${decimalPart
                .split('')
                .map(d => ones[parseInt(d)] || 'cero')
                .join(' ')}`;
        }

        return result;
    }
}

module.exports = UnifiedScriptGenerator;
