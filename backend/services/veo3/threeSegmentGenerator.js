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

class ThreeSegmentGenerator {
    constructor() {
        this.promptBuilder = new PromptBuilder();
        this.statsCardBuilder = new StatsCardPromptBuilder();

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
            // ⭐ NUEVO: Chollo viral profundo (4 segmentos = 32s) - ÓPTIMO PARA VIRALIDAD
            chollo_viral: {
                segments: 4,
                intro: 8,      // Hook + Contexto
                analysis: 8,   // Análisis datos
                stats: 8,      // Stats visuales
                outro: 8,      // Revelación + CTA
                total: 32
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
        const fixedAnaImageIndex = anaImageIndex !== null ? anaImageIndex : Math.floor(Math.random() * 4);

        logger.info(`[MultiSegmentGenerator] Generando estructura ${segmentCount}-segmentos: ${contentType}`);
        logger.info(`[MultiSegmentGenerator] Preset: ${preset} (${durations.total}s total)`);
        logger.info(`[MultiSegmentGenerator] ✅ Ana imagen FIJA: índice ${fixedAnaImageIndex} (MISMA en TODOS los segmentos)`);

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
            // Predicción estándar (intro + stats + outro)
            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            segments.stats = this._buildStatsSegment(playerData, {
                duration: durations.stats,
                style: statsStyle,
                emphasizeStats,
                contentType
            });
            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            generationOrder.push(
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'stats', taskIdKey: 'statsTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            );
        } else if (segmentCount === 4) {
            // ⭐ NUEVO: Chollo viral profundo (intro + analysis + stats + outro)
            segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
                duration: durations.intro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            segments.analysis = this._buildAnalysisSegment(contentType, playerData, viralData, {
                duration: durations.analysis,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
            });
            segments.stats = this._buildStatsSegment(playerData, {
                duration: durations.stats,
                style: statsStyle,
                emphasizeStats,
                contentType
            });
            segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
                duration: durations.outro,
                useViralStructure,
                anaImageIndex: fixedAnaImageIndex
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
                anaImageIndex: fixedAnaImageIndex
            },
            generationOrder,
            concatenationConfig: {
                outputName: `${playerData.name.toLowerCase()}_${contentType}_${segmentCount}seg_${Date.now()}.mp4`,
                transition: 'direct_cut', // ✅ Cortes directos (sin crossfade)
                transitionDuration: 0
            }
        };

        const segmentDurations = Object.values(segments).map(s => s.duration).join('s + ');
        logger.info(`[MultiSegmentGenerator] Estructura generada: ${durations.total}s (${segmentDurations}s)`);

        return structure;
    }

    /**
     * Construir segmento intro (Ana)
     * @private
     */
    _buildIntroSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure, anaImageIndex } = options; // ✅ Extraer anaImageIndex

        let prompt, dialogue;

        if (useViralStructure && viralData.hook && viralData.contexto) {
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

            prompt = result.prompt || this.promptBuilder.buildPrompt({ dialogue });
        } else {
            // Fallback a diálogo simple
            dialogue = viralData.intro || this._generateDefaultIntro(contentType, playerData);
            prompt = this.promptBuilder.buildPrompt({ dialogue });
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
        const { duration, useViralStructure, anaImageIndex } = options;

        let prompt, dialogue;

        if (useViralStructure && viralData.conflicto && viralData.inflexion) {
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
     * Construir segmento stats card
     * @private
     */
    _buildStatsSegment(playerData, options) {
        const { duration, style, emphasizeStats, contentType } = options;

        const cholloContext = contentType === 'chollo' ? {
            reason: `Precio bajo para ${playerData.position} de ${playerData.team}`,
            valueProposition: `${playerData.valueRatio}x valor vs precio`,
            urgency: 'Precio puede subir pronto'
        } : null;

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
        const { duration, useViralStructure, anaImageIndex } = options; // ✅ Extraer anaImageIndex

        let prompt, dialogue;

        if (useViralStructure && viralData.resolucion && viralData.cta) {
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
     * @private
     */
    _generateDefaultIntro(contentType, playerData) {
        const intros = {
            chollo: `¡Misters! He descubierto algo sobre ${playerData.name}. A ${playerData.price}€ es increíble.`,
            analisis: `Hoy analizamos a ${playerData.name}. Los números son espectaculares.`,
            breaking: `¡ATENCIÓN! Noticia urgente sobre ${playerData.name}.`,
            prediccion: `Para la próxima jornada, ${playerData.name} es clave.`
        };
        return intros[contentType] || `Hablemos de ${playerData.name}.`;
    }

    /**
     * ⭐ NUEVO: Generar análisis por defecto (segmento 2 en videos de 4 segmentos)
     * @private
     */
    _generateDefaultAnalysis(contentType, playerData) {
        const analysis = {
            chollo: `Tiene ${playerData.stats?.goals || 0} goles en ${playerData.stats?.games || 0} partidos. Ratio de valor ${playerData.valueRatio || '1.0'}x. Los números no mienten.`,
            analisis: `En los últimos partidos ha rendido a nivel de jugador top. La tendencia es clara: está en forma.`,
            breaking: `Esto cambia completamente la estrategia Fantasy. Hay que actuar rápido.`,
            prediccion: `Partido favorable, rival débil, alta probabilidad de puntos. Todo apunta a un rendimiento alto.`
        };
        return analysis[contentType] || `Los datos confirman que es buena opción.`;
    }

    /**
     * Generar outro por defecto si no se proporciona viral data
     * @private
     */
    _generateDefaultOutro(contentType, playerData) {
        const outros = {
            chollo: `¡${playerData.name} a ${playerData.price}€ es matemática pura! ¡Fichalo AHORA!`,
            analisis: `Los datos son claros: ${playerData.name} es una gran opción.`,
            breaking: `¡Actualizad vuestros equipos inmediatamente!`,
            prediccion: `Seguid mi consejo: ${playerData.name} dará puntos.`
        };
        return outros[contentType] || `¡No lo dudéis, Misters!`;
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
        if (!structure.segments || !structure.segments.intro || !structure.segments.stats || !structure.segments.outro) {
            validation.errors.push('Faltan segmentos en la estructura');
            validation.valid = false;
            return validation;
        }

        // Check duración total
        if (structure.totalDuration > 30) {
            validation.warnings.push(`Duración total ${structure.totalDuration}s excede límite Instagram (30s)`);
        }

        if (structure.totalDuration > 20) {
            validation.warnings.push(`Duración ${structure.totalDuration}s no óptima para Instagram/TikTok (recomendado: <20s)`);
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
        if (structure.segments.intro.veo3Config?.seed !== 30001 || structure.segments.outro.veo3Config?.seed !== 30001) {
            validation.errors.push('Ana seed inconsistente - debe ser 30001 en intro y outro');
            validation.valid = false;
        }

        logger.info(`[ThreeSegmentGenerator] Validación: ${validation.valid ? 'PASSED' : 'FAILED'}`);
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