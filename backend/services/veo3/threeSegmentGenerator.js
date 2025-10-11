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
const CinematicProgressionSystem = require('./cinematicProgressionSystem');
const frameExtractor = require('./frameExtractor');

class ThreeSegmentGenerator {
    constructor() {
        this.promptBuilder = new PromptBuilder();
        this.statsCardBuilder = new StatsCardPromptBuilder();
        this.unifiedScriptGenerator = new UnifiedScriptGenerator();
        this.cinematicProgression = new CinematicProgressionSystem();
        this.frameExtractor = frameExtractor;

        // ✅ ACTUALIZADO: Duraciones recomendadas - Ahora con 4 segmentos para chollos
        this.durationPresets = {
            // ⭐ NUEVO: Chollo rápido (2 segmentos = 14s) - ÓPTIMO para Instagram
            chollo_quick: {
                segments: 2,
                intro: 7, // Hook + Revelación + Precio (7s)
                outro: 7, // Datos + CTA (7s)
                total: 14
            },
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
            // ✅ FIX #4 (11 Oct 2025): Aumentado de 7s a 8s para evitar transiciones no deseadas
            // El diálogo de 27 palabras necesita 8 segundos completos (3.4 palabras/segundo)
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

            // 🎬 NUEVO (8 Oct 2025): Generar progresión cinematográfica
            logger.info(`[MultiSegmentGenerator] 🎥 Generando progresión cinematográfica...`);

            const emotionalArc = scriptResult.segments.map(s => s.emotion);
            const cinematicProgression = this.cinematicProgression.getFullProgression(
                contentType,
                emotionalArc
            );

            logger.info(`[MultiSegmentGenerator] ✅ Progresión cinematográfica:`);
            cinematicProgression.forEach((config, idx) => {
                logger.info(
                    `[MultiSegmentGenerator]    Seg${idx + 1}: ${config.shot.name} (${config.shot.distance}) - ${config.behavior.type}`
                );
            });

            // Guardar para uso en _build*Segment
            this.currentCinematicProgression = cinematicProgression;
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
            const segment1 = unifiedScript?.segments[0] || null;
            const segment2 = unifiedScript?.segments[1] || null;
            const segment3 = unifiedScript?.segments[2] || null;

            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment1?.dialogue || null,
                segment: segment1 // ✅ Pasar objeto completo para acceder a emotion
            });

            // 🎬 Segmento 2: Ana hablando (NO stats visuales)
            segments.middle = this._buildMiddleSegment(contentType, playerData, viralData, {
                duration: durations.stats,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment2?.dialogue || null,
                segment: segment2 // ✅ Pasar objeto completo para acceder a emotion
            });

            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment3?.dialogue || null,
                segment: segment3 // ✅ Pasar objeto completo para acceder a emotion
            });
            generationOrder.push(
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'middle', taskIdKey: 'middleTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            );
        } else if (segmentCount === 4) {
            // ⭐ NUEVO: Chollo viral profundo (intro + analysis + stats + outro)
            // 🎬 Usar diálogos del guión unificado si disponible
            const segment1 = unifiedScript?.segments[0] || null;
            const segment2 = unifiedScript?.segments[1] || null;
            const segment3 = unifiedScript?.segments[2] || null;
            const segment4 = unifiedScript?.segments[3] || null;

            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment1?.dialogue || null,
                segment: segment1 // ✅ Pasar objeto completo
            });
            segments.analysis = this._buildAnalysisSegment(contentType, playerData, viralData, {
                duration: durations.analysis,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex,
                customDialogue: segment2?.dialogue || null,
                segment: segment2 // ✅ Pasar objeto completo
            });

            // 🎬 DECISIÓN: Si hay guión unificado, segmento 3 es Ana hablando, NO stats visuales
            if (segment3?.dialogue) {
                segments.stats = this._buildMiddleSegment(contentType, playerData, viralData, {
                    duration: durations.stats,
                    useViralStructure,
                    anaImageIndex: fixedAnaImageIndex,
                    customDialogue: segment3.dialogue,
                    segment: segment3 // ✅ Pasar objeto completo
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
                customDialogue: segment4?.dialogue || null,
                segment: segment4 // ✅ Pasar objeto completo
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
        const { duration, useViralStructure, anaImageIndex, customDialogue, segment } = options; // ✅ Extraer segment

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;

            // 🎥 NUEVO (8 Oct 2025): Obtener progresión cinematográfica para este segmento
            const cinematography = this.currentCinematicProgression
                ? this.currentCinematicProgression[0].promptFragment
                : null;

            // 🔧 FIX (9 Oct 2025): SIEMPRE usar prompt base (NO enhanced) para forzar CASTILIAN SPANISH
            // El prompt base (línea 256 promptBuilder) tiene el dialecto MÁS FUERTE
            // Enhanced tiene dialecto débil que causa acento mexicano
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                emotion: segment?.emotion || 'curiosidad', // ✅ Emoción del guión unificado
                enhanced: false, // ❌ DESACTIVADO - prompt base fuerza dialecto mejor
                role: 'intro' // ✅ Rol para tono dinámico
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
                    enhanced: false, // ⚠️ DESACTIVADO - sin transiciones de cámara
                    behavior:
                        'Brief pause before speaking (0.5 seconds), then speaks naturally and clearly.'
                });
        } else {
            // Fallback a diálogo simple
            dialogue = viralData.intro || this._generateDefaultIntro(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                enhanced: false, // ⚠️ DESACTIVADO - sin transiciones de cámara
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
        const { duration, useViralStructure, anaImageIndex, customDialogue, segment } = options;

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;

            // 🎥 NUEVO (8 Oct 2025): Obtener progresión cinematográfica para este segmento
            const cinematography = this.currentCinematicProgression
                ? this.currentCinematicProgression[1].promptFragment
                : null;

            // 🔧 FIX (9 Oct 2025): SIEMPRE usar prompt base para forzar CASTILIAN SPANISH
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                emotion: segment?.emotion || 'analisis', // ✅ Emoción del guión unificado
                enhanced: false, // ❌ DESACTIVADO - prompt base fuerza dialecto mejor
                role: 'middle' // ✅ Rol para tono dinámico
            });
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
        const { duration, useViralStructure, anaImageIndex, customDialogue, segment } = options;

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;

            // 🎥 NUEVO (8 Oct 2025): Obtener progresión cinematográfica para este segmento
            const cinematography = this.currentCinematicProgression
                ? this.currentCinematicProgression[1].promptFragment
                : null;

            // 🔧 FIX (9 Oct 2025): SIEMPRE usar prompt base para forzar CASTILIAN SPANISH
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                emotion: segment.emotion || 'validacion', // ✅ Emoción del guión unificado
                enhanced: false, // ❌ DESACTIVADO - prompt base fuerza dialecto mejor
                role: 'middle' // ✅ Rol para tono dinámico
            });
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
        const { duration, useViralStructure, anaImageIndex, customDialogue, segment } = options; // ✅ Agregar segment

        let prompt, dialogue;

        // 🎬 PRIORIDAD 1: Usar diálogo del guión unificado si disponible
        if (customDialogue) {
            dialogue = customDialogue;

            // 🎥 NUEVO (8 Oct 2025): Obtener progresión cinematográfica para este segmento
            const cinematography = this.currentCinematicProgression
                ? this.currentCinematicProgression[2].promptFragment
                : null;

            // 🔧 FIX (9 Oct 2025): SIEMPRE usar prompt base para forzar CASTILIAN SPANISH
            prompt = this.promptBuilder.buildPrompt({
                dialogue,
                emotion: segment.emotion || 'urgencia', // ✅ Emoción del guión unificado
                enhanced: false, // ❌ DESACTIVADO - prompt base fuerza dialecto mejor
                role: 'outro' // ✅ Rol para tono dinámico
            });
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
     * ✅ FIX (9 Oct 2025): Scripts conversacionales SIN números decimales
     * Los números se muestran en tarjetas visuales, NO se pronuncian
     * @private
     */
    _generateDefaultIntro(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';
        const team = playerData.team || 'su equipo';

        const intros = {
            chollo: `Misters, he encontrado una ganga que nadie ha visto. ${playerLastName} está volando bajo el radar.`,
            analisis: `Vamos a hablar de ${playerLastName}. Lo que está haciendo en ${team} es impresionante.`,
            breaking: `ÚLTIMA HORA sobre ${playerLastName}. Esto cambia todo para vuestros equipos.`,
            prediccion: `${playerLastName} tiene todo para explotar esta jornada. Os voy a contar por qué.`
        };
        return intros[contentType] || `Hablemos de ${playerLastName}.`;
    }

    /**
     * ⭐ NUEVO: Generar análisis por defecto (segmento 2 en videos de 4 segmentos)
     * ✅ FIX (9 Oct 2025): Conversacional, hablar DEL jugador SIN leer números
     * @private
     */
    _generateDefaultAnalysis(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';

        const analysis = {
            chollo: `Está marcando goles, asistiendo, y su rendimiento está por las nubes. Lo mejor de todo: casi nadie lo tiene fichado.`,
            analisis: `Los últimos partidos lo confirman: ${playerLastName} está en su mejor momento. La tendencia es clarísima.`,
            breaking: `Esto cambia TODO para vuestros equipos. Hay que actuar rápido.`,
            prediccion: `El rival es perfecto para ${playerLastName}. Alta probabilidad de que explote.`
        };
        return analysis[contentType] || `Los datos lo confirman.`;
    }

    /**
     * ⭐ NUEVO: Generar middle por defecto (segmento 2 en videos de 3 segmentos)
     * ✅ FIX (9 Oct 2025): Conversacional, hablar DEL jugador SIN leer números
     * @private
     */
    _generateDefaultMiddle(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';

        const middle = {
            chollo: `Está marcando, asistiendo, y dando muchos más puntos de lo que cuesta. Una auténtica ganga que nadie ha visto.`,
            analisis: `El contexto táctico favorece su rendimiento. Los números lo respaldan totalmente.`,
            breaking: `Esta información lo cambia TODO. Los que actúen YA tendrán ventaja sobre el resto.`,
            prediccion: `Mi análisis es claro: ${playerLastName} va a dar muchos puntos esta jornada. Fiabilidad muy alta.`
        };
        return middle[contentType] || `Los indicadores son muy positivos para ${playerLastName}.`;
    }

    /**
     * Generar outro por defecto si no se proporciona viral data
     * ✅ FIX (9 Oct 2025): CTA conversacional SIN números, con urgencia
     * @private
     */
    _generateDefaultOutro(contentType, playerData) {
        const playerLastName = playerData.name ? playerData.name.split(' ').pop() : 'el jugador';

        const outros = {
            chollo: `Es una ganga absoluta. Casi nadie lo tiene todavía. Fichad a ${playerLastName} antes de que suba de precio.`,
            analisis: `Los datos son clarísimos. ${playerLastName} es una gran opción para vuestros equipos.`,
            breaking: `Actualizad vuestros equipos ya. Los que esperen se van a arrepentir.`,
            prediccion: `${playerLastName} va a dar puntos. No lo dudéis ni un segundo.`
        };
        return outros[contentType] || `No lo dudéis, Misters.`;
    }

    /**
     * Convertir número a texto en español para pronunciación correcta
     * ✅ FIX (8 Oct 2025): Redondear a enteros o .5 para evitar decimales impronunciables
     * Problema: "seis punto sesenta y cuatro" es MUY difícil de pronunciar
     * Solución: 6.64 → "siete" o "seis y medio"
     * @private
     */
    _numberToSpanishText(number) {
        if (!number) {
            return 'cero';
        }
        const num = parseFloat(number);

        // 🔧 ESTRATEGIA: Redondear a .5 o entero
        let roundedNum;
        const decimal = num - Math.floor(num);

        if (decimal >= 0.75) {
            // 6.64 → 7.0
            roundedNum = Math.ceil(num);
        } else if (decimal >= 0.25 && decimal < 0.75) {
            // 6.4 → 6.5
            roundedNum = Math.floor(num) + 0.5;
        } else {
            // 6.1 → 6.0
            roundedNum = Math.floor(num);
        }

        // Separar parte entera y decimal
        const integerPart = Math.floor(roundedNum);
        const hasHalf = roundedNum - integerPart === 0.5;

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

        // ✅ Solo agregar "y medio" si hay decimal .5
        if (hasHalf) {
            result += ' y medio';
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
