/**
 * Generador de videos 3-segmentos para VEO3
 * Estructura: Ana Intro + Stats Card + Ana Outro
 * Optimizado para Instagram Reels/TikTok (<20s)
 */

const PromptBuilder = require('./promptBuilder');
const StatsCardPromptBuilder = require('./statsCardPromptBuilder');

class ThreeSegmentGenerator {
    constructor() {
        this.promptBuilder = new PromptBuilder();
        this.statsCardBuilder = new StatsCardPromptBuilder();

        // Duraciones recomendadas por tipo de contenido
        this.durationPresets = {
            chollo_quick: {
                intro: 5,
                stats: 6,
                outro: 5,
                total: 16
            },
            chollo_standard: {
                intro: 6,
                stats: 6,
                outro: 6,
                total: 18
            },
            analisis_deep: {
                intro: 7,
                stats: 8,
                outro: 7,
                total: 22
            },
            breaking_news: {
                intro: 4,
                stats: 5,
                outro: 4,
                total: 13
            }
        };
    }

    /**
     * Generar estructura completa de 3 segmentos
     * @param {string} contentType - Tipo de contenido (chollo, analisis, breaking, prediccion)
     * @param {object} playerData - Datos del jugador
     * @param {object} viralData - Datos para estructura viral (hook, contexto, etc)
     * @param {object} options - Opciones adicionales
     * @returns {object} - Estructura completa de 3 segmentos
     */
    generateThreeSegments(contentType, playerData, viralData, options = {}) {
        const {
            preset = 'chollo_standard',
            statsStyle = 'fantasy_premium',
            emphasizeStats = ['price', 'goals', 'valueRatio'],
            useViralStructure = true
        } = options;

        const durations = this.durationPresets[preset];

        console.log(`[ThreeSegmentGenerator] Generando estructura 3-segmentos: ${contentType}`);
        console.log(`[ThreeSegmentGenerator] Preset: ${preset} (${durations.total}s total)`);

        // Segmento 1: Ana Intro (Hook + Contexto)
        const segment1 = this._buildIntroSegment(contentType, playerData, viralData, {
            duration: durations.intro,
            useViralStructure
        });

        // Segmento 2: Stats Card
        const segment2 = this._buildStatsSegment(playerData, {
            duration: durations.stats,
            style: statsStyle,
            emphasizeStats,
            contentType
        });

        // Segmento 3: Ana Outro (Resolución + CTA)
        const segment3 = this._buildOutroSegment(contentType, playerData, viralData, {
            duration: durations.outro,
            useViralStructure
        });

        const structure = {
            contentType,
            preset,
            totalDuration: durations.total,
            segments: {
                intro: segment1,
                stats: segment2,
                outro: segment3
            },
            metadata: {
                playerName: playerData.name,
                team: playerData.team,
                statsShown: emphasizeStats,
                viralStructure: useViralStructure,
                instagramOptimized: durations.total <= 20
            },
            generationOrder: [
                { segment: 'intro', taskIdKey: 'introTaskId' },
                { segment: 'stats', taskIdKey: 'statsTaskId' },
                { segment: 'outro', taskIdKey: 'outroTaskId' }
            ],
            concatenationConfig: {
                outputName: `${playerData.name.toLowerCase()}_${contentType}_${Date.now()}.mp4`,
                transition: 'crossfade',
                transitionDuration: 0.5
            }
        };

        console.log(`[ThreeSegmentGenerator] Estructura generada: ${durations.total}s (${segment1.duration}s + ${segment2.duration}s + ${segment3.duration}s)`);

        return structure;
    }

    /**
     * Construir segmento intro (Ana)
     * @private
     */
    _buildIntroSegment(contentType, playerData, viralData, options) {
        const { duration, useViralStructure } = options;

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
                model: 'veo3_fast'
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
        const { duration, useViralStructure } = options;

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
                model: 'veo3_fast'
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

        console.log(`[ThreeSegmentGenerator] Validación: ${validation.valid ? 'PASSED' : 'FAILED'}`);
        if (validation.warnings.length > 0) {
            console.log(`[ThreeSegmentGenerator] Warnings: ${validation.warnings.join(', ')}`);
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