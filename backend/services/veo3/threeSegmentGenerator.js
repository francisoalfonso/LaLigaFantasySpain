/**
 * Generador de videos multi-segmento para VEO3
 * Estructura flexible: 2-4 segmentos según tipo de contenido
 * Optimizado para Instagram Reels (16-32s)
 *
 * ACTUALIZADO: Soporte para 4 segmentos (32s) - óptimo para viralidad
 */

const PromptBuilder = require('./promptBuilder');
const logger = require('../../utils/logger');
const StatsCardPromptBuilder = require('./statsCardPromptBuilder');
const UnifiedScriptGenerator = require('./unifiedScriptGenerator');

class ThreeSegmentGenerator {
    constructor() {
        this.promptBuilder = new PromptBuilder();
        this.statsCardBuilder = new StatsCardPromptBuilder();
        this.unifiedScriptGenerator = new UnifiedScriptGenerator();

        // ✅ ACTUALIZADO: Duraciones recomendadas - Ahora con 4 segmentos para chollos
        this.durationPresets = {
            // Breaking news rápido (2 segmentos = 16s)
            breaking_news: {
                segments: 2,
                intro: 8,
                outro: 8,
                total: 16
            },
            // Predicción estándar (3 segmentos = 24s)
            prediccion_standard: {
                segments: 3,
                intro: 8,
                stats: 8,
                outro: 8,
                total: 24
            },
            // ⭐ OPTIMIZADO: Chollo viral (3 segmentos = 24s) - ESTRATEGIA REVELACIÓN SEGUNDO 3
            chollo_viral: {
                segments: 3,
                intro: 8, // Hook + REVELACIÓN (segundo 3) + Precio
                stats: 8, // Validación con datos
                outro: 8, // Urgencia + CTA
                total: 24
            },
            // Análisis profundo (4 segmentos = 32s)
            analisis_deep: {
                segments: 4,
                intro: 8,
                analysis: 8,
                stats: 8,
                outro: 8,
                total: 32
            }
        };
    }

    /**
     * ✅ ACTUALIZADO: Generar estructura multi-segmento (2-4 segmentos)
     * @param {string} contentType - Tipo de contenido (chollo, analisis, breaking, prediccion)
     * @param {object} playerData - Datos del jugador
     * @param {object} viralData - Datos para estructura viral (hook, contexto, etc)
     * @param {object} options - Opciones adicionales
     * @returns {object} - Estructura completa multi-segmento
     */
    generateThreeSegments(contentType, playerData, viralData, options = {}) {
        const {
            preset = 'chollo_viral', // ✅ NUEVO: Usar chollo_viral (4 segmentos) por defecto
            statsStyle = 'fantasy_premium',
            emphasizeStats = ['price', 'goals', 'valueRatio'],
            useViralStructure = true,
            anaImageIndex = null
        } = options;

        const durations = this.durationPresets[preset];
        const segmentCount = durations.segments;

        // ✅ FIX CRÍTICO: Seleccionar UNA imagen de Ana para TODOS los segmentos
        const fixedAnaImageIndex =
            anaImageIndex !== null ? anaImageIndex : Math.floor(Math.random() * 4);

        logger.info(
            `[MultiSegmentGenerator] Generando estructura ${segmentCount}-segmentos: ${contentType}`
        );
        logger.info(`[MultiSegmentGenerator] Preset: ${preset} (${durations.total}s total)`);
        logger.info(
            `[MultiSegmentGenerator] ✅ Ana imagen FIJA: índice ${fixedAnaImageIndex} (MISMA en TODOS los segmentos)`
        );

        // 🎬 NUEVO: Generar guión unificado PRIMERO para cohesión narrativa
        let unifiedScript = null;
        let viralityScore = null;

        if (segmentCount >= 3 && useViralStructure) {
            logger.info(
                `[MultiSegmentGenerator] 📝 Generando guión unificado con arco narrativo...`
            );

            const scriptResult = this.unifiedScriptGenerator.generateUnifiedScript(
                contentType,
                playerData,
                { viralData }
            );

            unifiedScript = scriptResult;
            viralityScore = scriptResult.validation.cohesive ? scriptResult.validation.score : null;

            logger.info(`[MultiSegmentGenerator] ✅ Guión unificado generado:`);
            logger.info(
                `[MultiSegmentGenerator]    - Cohesión: ${scriptResult.validation.score}/100`
            );
            logger.info(
                `[MultiSegmentGenerator]    - Arco emocional: ${scriptResult.arc.emotionalJourney.join(' → ')}`
            );
            logger.info(
                `[MultiSegmentGenerator]    - Segmentos con diálogo: ${scriptResult.segments.length}`
            );
        }

        const segments = {};
        const generationOrder = [];

        // ✅ NUEVO: Generar segmentos según preset (2, 3 o 4 segmentos)
        if (segmentCount === 2) {
            // Breaking news rápido (intro + outro)
            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            generationOrder.push(
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            );
        } else if (segmentCount === 3) {
            // ⭐ ACTUALIZADO: Chollo viral (intro + middle + outro) - TODOS Ana hablando
            // 🎬 Usar diálogos del guión unificado si disponible
            const segment1Dialogue = unifiedScript?.segments[0]?.dialogue || null;
            const segment2Dialogue = unifiedScript?.segments[1]?.dialogue || null;
            const segment3Dialogue = unifiedScript?.segments[2]?.dialogue || null;

            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment1Dialogue
            });

            // 🎬 Segmento 2: Ana hablando (NO stats visuales)
            segments.middle = this._buildMiddleSegment(contentType, playerData, viralData, {
                duration: durations.stats,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment2Dialogue
            });

            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment3Dialogue
            });
            generationOrder.push(
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'middle', taskIdKey: 'middleTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            );
        } else if (segmentCount === 4) {
            // ⭐ NUEVO: Chollo viral profundo (intro + analysis + stats + outro)
            // 🎬 Usar diálogos del guión unificado si disponible
            const segment1Dialogue = unifiedScript?.segments[0]?.dialogue || null;
            const segment2Dialogue = unifiedScript?.segments[1]?.dialogue || null;
            const segment3Dialogue = unifiedScript?.segments[2]?.dialogue || null;
            const segment4Dialogue = unifiedScript?.segments[3]?.dialogue || null;

            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment1Dialogue
            });
            segments.analysis = this._buildAnalysisSegment(contentType, playerData, viralData, {
                duration: durations.analysis,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment2Dialogue
            });

            // 🎬 DECISIÓN: Si hay guión unificado, segmento 3 es Ana hablando, NO stats visuales
            if (segment3Dialogue) {
                segments.stats = this._buildMiddleSegment(contentType, playerData, viralData, {
                    duration: durations.stats,
                    useViralStructure,
                    anaImageIndex: fixedAnaImageIndex,
                    customDialogue: segment3Dialogue
                });
            } else {
                segments.stats = this._buildStatsSegment(playerData, {
                    duration: durations.stats,
                    style: statsStyle,
                    emphasizeStats,
                    contentType
                });
            }
            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment4Dialogue
            });
            generationOrder.push(
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'analysis', taskIdKey: 'analysisTaskId' },
                { segment: 'stats', taskIdKey: 'statsTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            );
        }

        const structure = {
            contentType,
            preset,
            totalDuration: durations.total,
            segmentCount,
            segments,
            metadata: {
                playerName: playerData.name,
                team: playerData.team,
                statsShown: emphasizeStats,
                viralStructure: useViralStructure,
                instagramOptimized: durations.total <= 35,
                anaImageIndex: fixedAnaImageIndex,
                viralityScore: viralityScore,
                narrativeCohesion: unifiedScript ? unifiedScript.validation.cohesive : null,
                emotionalJourney: unifiedScript ? unifiedScript.arc.emotionalJourney : null
            },
            generationOrder,
            concatenationConfig: {
                outputName: `${playerData.name.toLowerCase()}_${contentType}_${segmentCount}seg_${Date.now()}.mp4`,
                transition: 'direct_cut', // ✅ Cortes directos (sin crossfade)
                transitionDuration: 0
            }
        };

        const segmentDurations = Object.values(segments)
            .map(s => s.duration)
            .join('s + ');
        logger.info(
            `[MultiSegmentGenerator] Estructura generada: ${durations.total}s (${segmentDurations}s)`
        );

        return structure;
    }

    /**
     * Construir segmento intro (Ana)
     * @private
     */
    _buildIntroSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure, anaImageIndex, customDialogue } = options; // ✅ Agregar customDialogue

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;
            // 🔧 FIX: Agregar pausa inicial para evitar audio trabado
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                enhanced: true,
                behavior:
                    'Brief pause before speaking (0.5 seconds), then speaks naturally and clearly.'
            });
            logger.info(
                `[MultiSegmentGenerator] ✅ Usando diálogo unificado para intro: "${dialogue.substring(0, 50)}..."`
            );
        } else if (useViralStructure && viralData.hook && viralData.contexto) {
            // Usar estructura viral
            dialogue = `${viralData.hook} ${viralData.contexto}`;

            const structuredData = {
                hook: viralData.hook,
                contexto: viralData.contexto
            };

            const result = this.promptBuilder.buildViralStructuredPrompt(
                contentType,
                structuredData,
                { partial: true }
            );

            prompt =
                result.prompt ||
                this.promptBuilder.buildPrompt({
                    dialogue,
                    enhanced: true,
                    behavior:
                        'Brief pause before speaking (0.5 seconds), then speaks naturally and clearly.'
                });
        } else {
            // Fallback a diálogo simple
            dialogue = viralData.intro || this._generateDefaultIntro(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                enhanced: true,
                behavior:
                    'Brief pause before speaking (0.5 seconds), then speaks naturally and clearly.'
            });
        }

        return {
            type: 'ana_speaking',
            role: 'intro',
            duration,
            dialogue,
            prompt,
            veo3Config: {
                aspectRatio: '9:16',
                duration,
                seed: 30001, // Ana fixed seed
                model: 'veo3_fast',
                imageRotation: 'fixed', // ✅ Imagen fija
                imageIndex: anaImageIndex // ✅ Usar índice fijo para este video
            }
        };
    }

    /**
     * ⭐ NUEVO: Construir segmento analysis (Ana hablando sobre datos)
     * Solo para videos de 4 segmentos
     * @private
     */
    _buildAnalysisSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure, anaImageIndex, customDialogue } = options;

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;
            prompt = this.promptBuilder.buildPrompt({ dialogue });
            logger.info(
                `[MultiSegmentGenerator] ✅ Usando diálogo unificado para analysis: "${dialogue.substring(0, 50)}..."`
            );
        } else if (useViralStructure && viralData.conflicto && viralData.inflexion) {
            // Usar estructura viral (conflicto + inflexión)
            dialogue = `${viralData.conflicto} ${viralData.inflexion}`;

            const structuredData = {
                conflicto: viralData.conflicto,
                inflexion: viralData.inflexion
            };

            const result = this.promptBuilder.buildViralStructuredPrompt(
                contentType,
                structuredData,
                { partial: true }
            );

            prompt = result.prompt || this.promptBuilder.buildPrompt({ dialogue });
        } else {
            // Fallback: Análisis de datos del jugador
            dialogue = this._generateDefaultAnalysis(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({ dialogue });
        }

        return {
            type: 'ana_speaking',
            role: 'analysis',
            duration,
            dialogue,
            prompt,
            veo3Config: {
                aspectRatio: '9:16',
                duration,
                seed: 30001,
                model: 'veo3_fast',
                imageRotation: 'fixed',
                imageIndex: anaImageIndex
            }
        };
    }

    /**
     * ⭐ NUEVO: Construir segmento middle (Ana hablando - inflexión + resolución)
     * Solo para videos de 4 segmentos con guión unificado
     * @private
     */
    _buildMiddleSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure, anaImageIndex, customDialogue } = options;

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;
            prompt = this.promptBuilder.buildPrompt({ dialogue });
            logger.info(
                `[MultiSegmentGenerator] ✅ Usando diálogo unificado para middle: "${dialogue.substring(0, 50)}..."`
            );
        } else if (useViralStructure && viralData.inflexion && viralData.resolucion) {
            // Usar estructura viral (inflexión + resolución)
            dialogue = `${viralData.inflexion} ${viralData.resolucion}`;

            const structuredData = {
                inflexion: viralData.inflexion,
                resolucion: viralData.resolucion
            };

            const result = this.promptBuilder.buildViralStructuredPrompt(
                contentType,
                structuredData,
                { partial: true }
            );

            prompt = result.prompt || this.promptBuilder.buildPrompt({ dialogue });
        } else {
            // Fallback: Resolución de datos del jugador
            dialogue = this._generateDefaultMiddle(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({ dialogue });
        }

        return {
            type: 'ana_speaking',
            role: 'middle',
            duration,
            dialogue,
            prompt,
            veo3Config: {
                aspectRatio: '9:16',
                duration,
                seed: 30001,
                model: 'veo3_fast',
                imageRotation: 'fixed',
                imageIndex: anaImageIndex
            }
        };
    }

    /**
     * Construir segmento stats card
     * @private
     */
    _buildStatsSegment(playerData, options) {
        const { duration, style, emphasizeStats, contentType } = options;

        const cholloContext =
            contentType === 'chollo'
                ? {
                    reason: `Precio bajo para ${playerData.position} de ${playerData.team}`,
                    valueProposition: `${playerData.valueRatio}x valor vs precio`,
                    urgency: 'Precio puede subir pronto'
                }
                : null;

        const statsCardResult = cholloContext
            ? this.statsCardBuilder.buildCholloStatsSegment(playerData, cholloContext, {
                duration,
                style,
                emphasizeStats
            })
            : this.statsCardBuilder.buildStatsCardPrompt(playerData, {
                duration,
                style,
                emphasizeStats
            });

        return {
            type: 'stats_card',
            role: 'middle',
            duration,
            prompt: statsCardResult.prompt,
            textOverlays: statsCardResult.textOverlays,
            metadata: statsCardResult.metadata,
            cholloContext: statsCardResult.cholloContext,
            veo3Config: {
                aspectRatio: '9:16',
                duration,
                model: 'veo3_fast'
            }
        };
    }

    /**
     * Construir segmento outro (Ana)
     * @private
     */
    _buildOutroSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure, anaImageIndex, customDialogue } = options; // ✅ Agregar customDialogue

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;
            prompt = this.promptBuilder.buildPrompt({ dialogue });
            logger.info(
                `[MultiSegmentGenerator] ✅ Usando diálogo unificado para outro: "${dialogue.substring(0, 50)}..."`
            );
        } else if (useViralStructure && viralData.resolucion && viralData.cta) {
            // Usar estructura viral
            dialogue = `${viralData.resolucion} ${viralData.moraleja || ''} ${viralData.cta}`;

            const structuredData = {
                resolucion: viralData.resolucion,
                moraleja: viralData.moraleja || '',
                cta: viralData.cta
            };

            const result = this.promptBuilder.buildViralStructuredPrompt(
                contentType,
                structuredData,
                { partial: true }
            );

            prompt = result.prompt || this.promptBuilder.buildPrompt({ dialogue });
        } else {
            // Fallback a diálogo simple
            dialogue = viralData.outro || this._generateDefaultOutro(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({ dialogue });
        }

        return {
            type: 'ana_speaking',
            role: 'outro',
            duration,
            dialogue,
            prompt,
            veo3Config: {
                aspectRatio: '9:16',
                duration,
                seed: 30001, // Ana fixed seed
                model: 'veo3_fast',
                imageRotation: 'fixed', // ✅ Imagen fija
                imageIndex: anaImageIndex // ✅ Usar índice fijo para este video
            }
        };
    }

    /**
     * Generar intro por defecto si no se proporciona viral data
     * ✅ ACTUALIZADO: Textos CORTOS basados en video referencia que funciona
     * @private
     */
    _generateDefaultIntro(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';
        // ✅ Convertir precio numérico a texto para pronunciación correcta
        const priceText = this._numberToSpanishText(playerData.price);
        const intros = {
            chollo: `He encontrado el chollo absoluto... ${playerLastName} por solo ${priceText} millones... va a explotar.`,
            analisis: `${playerLastName}. Los números hablan solos.`,
            breaking: `ÚLTIMA HORA sobre ${playerLastName}.`,
            prediccion: `${playerLastName} es clave esta jornada.`
        };
        return intros[contentType] || `Hablemos de ${playerLastName}.`;
    }

    /**
     * ⭐ NUEVO: Generar análisis por defecto (segmento 2 en videos de 4 segmentos)
     * ✅ ACTUALIZADO: Textos CORTOS y claros
     * @private
     */
    _generateDefaultAnalysis(contentType, playerData) {
        const analysis = {
            chollo: `${playerData.stats?.goals || 0} goles, ${playerData.stats?.assists || 0} asistencias. Vale ${playerData.valueRatio || '1.5'} veces más de lo que cuesta. Está dando el doble de puntos.`,
            analisis: `Los últimos partidos confirman: está en forma. La tendencia es clara.`,
            breaking: `Esto cambia TODO. Hay que actuar rápido.`,
            prediccion: `Partido favorable. Alta probabilidad de puntos.`
        };
        return analysis[contentType] || `Los datos lo confirman.`;
    }

    /**
     * ⭐ NUEVO: Generar middle por defecto (segmento 2 en videos de 3 segmentos)
     * ✅ ACTUALIZADO: Textos CORTOS para validación con datos
     * @private
     */
    _generateDefaultMiddle(contentType, playerData) {
        const middle = {
            chollo: `${playerData.stats?.goals || 0} goles, ${playerData.stats?.assists || 0} asistencias. Vale ${playerData.valueRatio || '1.5'} veces más de lo que cuesta. Está dando el doble de puntos.`,
            analisis: `El contexto táctico favorece su rendimiento. Los números lo respaldan.`,
            breaking: `Esta información cambia TODO. Los que actúen YA tendrán ventaja.`,
            prediccion: `Mi análisis predice ${playerData.expectedPoints || 8} puntos. Fiabilidad alta.`
        };
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';
        return middle[contentType] || `Los indicadores son muy positivos para ${playerLastName}.`;
    }

    /**
     * Generar outro por defecto si no se proporciona viral data
     * ✅ ACTUALIZADO: Textos CORTOS y urgentes
     * @private
     */
    _generateDefaultOutro(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';
        // ✅ Convertir precio numérico a texto para pronunciación correcta
        const priceText = this._numberToSpanishText(playerData.price);
        const outros = {
            chollo: `A ${priceText} millones es una ganga. Nadie lo ha fichado aún. Fichad a ${playerLastName} ahora.`,
            analisis: `Los datos son claros. ${playerLastName} es una gran opción.`,
            breaking: `Actualizad vuestros equipos inmediatamente.`,
            prediccion: `${playerLastName} dará puntos. No lo dudéis.`
        };
        return outros[contentType] || `No lo dudéis, Misters.`;
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

    /**
     * Validar que la estructura está completa y lista para generación
     * @param {object} structure - Estructura de 3 segmentos
     * @returns {object} - Resultado de validación
     */
    validateStructure(structure) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check que existen los 3 segmentos
        if (
            !structure.segments ||
            !structure.segments.intro ||
            !structure.segments.stats ||
            !structure.segments.outro
        ) {
            validation.errors.push('Faltan segmentos en la estructura');
            validation.valid = false;
            return validation;
        }

        // Check duración total
        if (structure.totalDuration > 30) {
            validation.warnings.push(
                `Duración total ${structure.totalDuration}s excede límite Instagram (30s)`
            );
        }

        if (structure.totalDuration > 20) {
            validation.warnings.push(
                `Duración ${structure.totalDuration}s no óptima para Instagram/TikTok (recomendado: <20s)`
            );
        }

        // Check que cada segmento tiene prompt
        ['intro', 'stats', 'outro'].forEach(segmentKey => {
            const segment = structure.segments[segmentKey];
            if (!segment.prompt) {
                validation.errors.push(`Segmento ${segmentKey} no tiene prompt generado`);
                validation.valid = false;
            }
        });

        // Check consistencia de Ana (seed 30001)
        if (
            structure.segments.intro.veo3Config?.seed !== 30001 ||
            structure.segments.outro.veo3Config?.seed !== 30001
        ) {
            validation.errors.push('Ana seed inconsistente - debe ser 30001 en intro y outro');
            validation.valid = false;
        }

        logger.info(
            `[ThreeSegmentGenerator] Validación: ${validation.valid ? 'PASSED' : 'FAILED'}`
        );
        if (validation.warnings.length > 0) {
            logger.info(`[ThreeSegmentGenerator] Warnings: ${validation.warnings.join(', ')}`);
        }

        return validation;
    }

    /**
     * Obtener instrucciones de generación para VEO3Client
     * @param {object} structure - Estructura de 3 segmentos
     * @returns {array} - Array de configuraciones para VEO3Client.generateVideo()
     */
    getGenerationInstructions(structure) {
        return [
            {
                name: 'intro',
                prompt: structure.segments.intro.prompt,
                duration: structure.segments.intro.duration,
                aspectRatio: '9:16',
                seed: 30001,
                imageUrl: process.env.ANA_IMAGE_URL
            },
            {
                name: 'stats',
                prompt: structure.segments.stats.prompt,
                duration: structure.segments.stats.duration,
                aspectRatio: '9:16'
            },
            {
                name: 'outro',
                prompt: structure.segments.outro.prompt,
                duration: structure.segments.outro.duration,
                aspectRatio: '9:16',
                seed: 30001,
                imageUrl: process.env.ANA_IMAGE_URL
            }
        ];
    }
}

module.exports = ThreeSegmentGenerator;
