/**
 * Content Enrichment Engine
 *
 * Agente analizador intermedio que:
 * 1. Lee insights de competidores
 * 2. Consulta Data Catalog para ver qué datos tenemos
 * 3. Sugiere enriquecimientos específicos
 * 4. Genera briefs filtrados para creador de contenido
 *
 * VENTAJA COMPETITIVA: Ellos opinan, nosotros probamos con datos
 */

const { DATA_CATALOG, DATA_CAPABILITIES } = require('./dataCatalog');
const logger = require('../../utils/logger');
const openaiGPT5Mini = require('../openaiGPT5Mini');

class ContentEnrichmentEngine {
    constructor() {
        this.dataCatalog = DATA_CATALOG;
        this.capabilities = DATA_CAPABILITIES;
    }

    /**
     * Analizar insights de competidores y sugerir enriquecimientos
     *
     * @param {Array} competitorInsights - Insights extraídos de videos competidores
     * @param {Object} ourRecentContent - Nuestro contenido reciente (últimos 7 días)
     * @returns {Promise<Object>} Content opportunities con datos sugeridos
     */
    async analyzeAndEnrich(competitorInsights, ourRecentContent = {}) {
        try {
            logger.info('[ContentEnrichment] Analizando insights de competidores', {
                totalInsights: competitorInsights.length,
                ourRecentPosts: ourRecentContent.posts?.length || 0
            });

            // PASO 1: Agrupar insights por tema
            const groupedByTopic = this._groupByTopic(competitorInsights);

            // PASO 2: Identificar content gaps (qué NO hemos cubierto nosotros)
            const gaps = this._identifyContentGaps(groupedByTopic, ourRecentContent);

            // PASO 3: Para cada gap, sugerir enriquecimiento con datos
            const opportunities = await this._generateEnrichedOpportunities(gaps);

            // PASO 4: Puntuar y priorizar
            const scored = this._scoreOpportunities(opportunities);

            // PASO 5: Generar brief ejecutivo
            const brief = await this._generateStrategicBrief(scored);

            logger.info('[ContentEnrichment] Análisis completado', {
                opportunities: scored.length,
                topScore: scored[0]?.score || 0
            });

            return {
                success: true,
                timestamp: new Date().toISOString(),
                summary: {
                    total_competitor_insights: competitorInsights.length,
                    topics_detected: Object.keys(groupedByTopic).length,
                    content_gaps: gaps.length,
                    opportunities_generated: scored.length
                },
                opportunities: scored,
                strategic_brief: brief,
                data_catalog_used: Object.keys(this.dataCatalog)
            };
        } catch (error) {
            logger.error('[ContentEnrichment] Error en análisis', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Agrupar insights por tema principal
     */
    _groupByTopic(insights) {
        const grouped = {};

        const topicKeywords = {
            chollos: ['chollo', 'barato', 'precio', 'valor', 'oportunidad', 'infravalorado'],
            lesiones: ['lesión', 'lesionado', 'baja', 'duda', 'sanción', 'ausencia'],
            calendario: ['calendario', 'fixture', 'rival', 'próximo', 'enfrentar'],
            jugadores: ['jugador', 'futbolista', 'rendimiento', 'forma', 'estadística'],
            predicciones: ['predicción', 'pronostico', 'espero', 'creo', 'pienso', 'va a'],
            alineaciones: ['alineación', 'equipo', 'once', 'formación', 'plantilla'],
            analisis_jornada: ['jornada', 'fecha', 'partido', 'enfrentamiento']
        };

        insights.forEach(insight => {
            const text = (insight.text || insight.claim || '').toLowerCase();

            // Detectar tema principal
            let primaryTopic = 'general';
            let maxScore = 0;

            for (const [topic, keywords] of Object.entries(topicKeywords)) {
                const score = keywords.filter(kw => text.includes(kw)).length;
                if (score > maxScore) {
                    maxScore = score;
                    primaryTopic = topic;
                }
            }

            if (!grouped[primaryTopic]) {
                grouped[primaryTopic] = [];
            }

            grouped[primaryTopic].push(insight);
        });

        return grouped;
    }

    /**
     * Identificar content gaps (qué temas cubren ellos que nosotros NO)
     */
    _identifyContentGaps(groupedInsights, ourRecentContent) {
        const gaps = [];

        for (const [topic, insights] of Object.entries(groupedInsights)) {
            // Verificar si nosotros ya cubrimos este tema recientemente
            const weCoveredThis = ourRecentContent.topics?.some(t =>
                t.toLowerCase().includes(topic.toLowerCase())
            );

            if (!weCoveredThis || insights.length >= 3) {
                // GAP: Ellos lo cubren, nosotros no (o ellos lo cubren mucho)
                gaps.push({
                    topic,
                    competitor_mentions: insights.length,
                    we_covered: weCoveredThis,
                    priority: weCoveredThis ? 'medium' : 'high',
                    insights: insights.slice(0, 5) // Top 5 insights de ese tema
                });
            }
        }

        // Ordenar por priority y número de menciones
        return gaps.sort((a, b) => {
            const priorityScore = { high: 3, medium: 2, low: 1 };
            const scoreA = priorityScore[a.priority] * a.competitor_mentions;
            const scoreB = priorityScore[b.priority] * b.competitor_mentions;
            return scoreB - scoreA;
        });
    }

    /**
     * Generar oportunidades enriquecidas con datos sugeridos
     */
    async _generateEnrichedOpportunities(gaps) {
        const opportunities = [];

        for (const gap of gaps) {
            // Consultar Data Catalog para ver qué datos tenemos disponibles
            const relevantDataSources = this._getRelevantDataSources(gap.topic);

            // Extraer claims específicos
            const claims = gap.insights.map(i => i.text || i.claim).filter(Boolean);

            // Para cada claim, sugerir validación
            const validations = claims.map(claim => ({
                competitor_claim: claim,
                validation_method: this._suggestValidationMethod(claim),
                data_source: this._identifyDataSource(claim)
            }));

            // Sugerir datos adicionales
            const additionalData = this._suggestAdditionalData(gap.topic);

            // Crear oportunidad enriquecida
            opportunities.push({
                topic: gap.topic,
                priority: gap.priority,
                competitor_coverage: gap.competitor_mentions,
                we_covered: gap.we_covered,

                // Datos que podemos usar
                data_enrichment: {
                    available_data_sources: relevantDataSources,
                    validations_suggested: validations,
                    additional_data_points: additionalData
                },

                // Ángulo de contenido sugerido
                content_angle: this._suggestContentAngle(gap.topic, validations),

                // Claims originales de competidores
                competitor_insights: gap.insights.slice(0, 3)
            });
        }

        return opportunities;
    }

    /**
     * Obtener fuentes de datos relevantes para un tema
     */
    _getRelevantDataSources(topic) {
        const sourceMap = {
            chollos: [
                {
                    source: 'bargains',
                    description: 'Algoritmo de chollos propietario',
                    endpoints: ['bargainAnalyzer.getTopBargains()'],
                    datos_clave: ['valor_score', 'precio', 'puntos_esperados']
                },
                {
                    source: 'players',
                    description: 'Stats oficiales jugadores',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['forma reciente', 'puntos últimos 5', 'ownership']
                },
                {
                    source: 'calendar_analysis',
                    description: 'Dificultad de calendario',
                    endpoints: ['fixtureAnalyzer.analyzeNextFixtures()'],
                    datos_clave: ['próximos rivales', 'dificultad', 'partidos casa/fuera']
                }
            ],

            lesiones: [
                {
                    source: 'injuries',
                    description: 'Estado oficial lesiones/sanciones',
                    endpoints: ['apiFootball.getInjuries()'],
                    datos_clave: ['estado', 'tiempo estimado fuera', 'fecha retorno']
                },
                {
                    source: 'players',
                    description: 'Alternativas disponibles',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['suplentes', 'forma', 'precio']
                }
            ],

            calendario: [
                {
                    source: 'calendar_analysis',
                    description: 'Análisis de fixtures',
                    endpoints: ['fixtureAnalyzer.analyzeNextFixtures()'],
                    datos_clave: ['dificultad promedio', 'enfrentamientos clave']
                },
                {
                    source: 'teams',
                    description: 'Forma de equipos',
                    endpoints: ['apiFootball.getTeams()'],
                    datos_clave: ['racha actual', 'goles promedio', 'porterías cero']
                }
            ],

            jugadores: [
                {
                    source: 'players',
                    description: 'Estadísticas completas',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['todas las stats disponibles']
                },
                {
                    source: 'trends',
                    description: 'Tendencias históricas',
                    endpoints: ['fantasyEvolution.getTrends()'],
                    datos_clave: ['evolución precio', 'consistencia', 'volatilidad']
                }
            ],

            predicciones: [
                {
                    source: 'players',
                    description: 'Forma reciente',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['puntos últimos 5', 'tendencia']
                },
                {
                    source: 'fixtures',
                    description: 'Contexto del partido',
                    endpoints: ['apiFootball.getFixtures()'],
                    datos_clave: ['rival', 'local/visitante', 'histórico']
                }
            ],

            alineaciones: [
                {
                    source: 'bargains',
                    description: 'Chollos detectados',
                    endpoints: ['bargainAnalyzer.getTopBargains()'],
                    datos_clave: ['top valor', 'por posición']
                },
                {
                    source: 'players',
                    description: 'Forma y stats',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['rendimiento', 'precio', 'ownership']
                }
            ],

            analisis_jornada: [
                {
                    source: 'fixtures',
                    description: 'Partidos de la jornada',
                    endpoints: ['apiFootball.getFixtures()'],
                    datos_clave: ['todos los partidos', 'horarios', 'contexto']
                },
                {
                    source: 'players',
                    description: 'Jugadores destacados',
                    endpoints: ['apiFootball.getPlayers()'],
                    datos_clave: ['forma reciente', 'proyecciones']
                }
            ]
        };

        return sourceMap[topic] || [];
    }

    /**
     * Sugerir método de validación para un claim
     */
    _suggestValidationMethod(claim) {
        const claimLower = claim.toLowerCase();

        if (claimLower.match(/\d+\s*gol/)) {
            return {
                method: 'Verificar goles en API-Sports',
                endpoint: 'players.ofensivas.goles',
                action: 'Confirmar número exacto + añadir contexto (asistencias, remates)'
            };
        }

        if (claimLower.includes('chollo') || claimLower.includes('barato')) {
            return {
                method: 'Calcular valor con algoritmo propio',
                endpoint: 'bargains.metricas.valor_score',
                action: 'Validar si realmente es chollo + mostrar score objetivo'
            };
        }

        if (claimLower.includes('racha') || claimLower.includes('forma')) {
            return {
                method: 'Analizar puntos últimos 5 partidos',
                endpoint: 'players.forma.puntos_ultimos_5',
                action: 'Mostrar datos reales de forma reciente'
            };
        }

        if (claimLower.includes('calendari')) {
            return {
                method: 'Analizar dificultad de fixtures',
                endpoint: 'calendar_analysis.equipo.dificultad_promedio',
                action: 'Mostrar próximos rivales con rating de dificultad'
            };
        }

        return {
            method: 'Verificar stats generales',
            endpoint: 'players.forma.rating_promedio',
            action: 'Contrastar con datos oficiales'
        };
    }

    /**
     * Identificar fuente de datos para un claim
     */
    _identifyDataSource(claim) {
        const claimLower = claim.toLowerCase();

        if (claimLower.includes('chollo') || claimLower.includes('precio')) {
            return 'bargains';
        }
        if (claimLower.includes('lesión') || claimLower.includes('sanción')) {
            return 'injuries';
        }
        if (claimLower.includes('calendari') || claimLower.includes('rival')) {
            return 'calendar_analysis';
        }
        if (claimLower.includes('gol') || claimLower.includes('asist')) {
            return 'players';
        }
        if (claimLower.includes('equipo') || claimLower.includes('defensa')) {
            return 'teams';
        }

        return 'players'; // Default
    }

    /**
     * Sugerir datos adicionales relevantes
     */
    _suggestAdditionalData(topic) {
        const suggestions = {
            chollos: [
                'Precio actual y tendencia',
                'Puntos Fantasy últimos 5 partidos',
                'Dificultad próximos 3 rivales',
                '% Ownership (diferencial)',
                'Proyección de puntos próxima jornada'
            ],

            lesiones: [
                'Tiempo estimado de baja',
                'Impacto en el equipo (% minutos)',
                'Alternativas en mismo precio',
                'Histórico de lesiones similares'
            ],

            calendario: [
                'Próximos 5 rivales con rating',
                'Partidos casa vs fuera',
                'Enfrentamientos vs Top 6',
                'Densidad de calendario (días entre partidos)'
            ],

            jugadores: [
                'Stats completas última jornada',
                'Comparativa con jugadores similares',
                'Evolución de precio temporada',
                'Consistency score (regularidad)'
            ],

            predicciones: [
                'Forma reciente (últimos 5)',
                'Histórico vs próximo rival',
                'Stats en casa/fuera',
                'xG (expected goals) si disponible'
            ]
        };

        return suggestions[topic] || ['Stats oficiales relevantes'];
    }

    /**
     * Sugerir ángulo de contenido
     */
    _suggestContentAngle(topic, validations) {
        const hasValidations = validations && validations.length > 0;

        const angles = {
            chollos: {
                title: 'TOP Chollos con DATOS REALES',
                hook: '¿Son realmente chollos? Te lo demostramos con números',
                format: 'Short 45-60s',
                structure: [
                    '1. Claim del competidor',
                    '2. "Veamos los DATOS" (suspense)',
                    '3. Validación con stats oficiales',
                    '4. Datos adicionales (calendario, forma)',
                    '5. Conclusión: ¿Chollo confirmado o trampa?'
                ]
            },

            lesiones: {
                title: 'ALERTA Lesiones: Qué hacer AHORA',
                hook: 'Lesión confirmada - Aquí está tu plan B con datos',
                format: 'Short urgente 30-45s',
                structure: [
                    '1. Noticia oficial (API actualizada)',
                    '2. Tiempo de baja estimado',
                    '3. Alternativas con mismo precio',
                    '4. Call to action: "Ficha ya a X"'
                ]
            },

            calendario: {
                title: 'Calendario de ORO para tus fichajes',
                hook: 'Estos equipos tienen el calendario MÁS FÁCIL',
                format: 'Carousel con datos',
                structure: [
                    '1. TOP 3 equipos con mejor calendario',
                    '2. Próximos rivales con rating',
                    '3. Jugadores clave de cada equipo',
                    '4. Precio y valor de cada uno'
                ]
            }
        };

        return (
            angles[topic] || {
                title: `Análisis ${topic.toUpperCase()} con datos oficiales`,
                hook: 'Lo que NO te cuentan los demás - Datos reales',
                format: 'Short 45-60s',
                structure: ['Validación con datos', 'Contexto adicional', 'Conclusión']
            }
        );
    }

    /**
     * Puntuar oportunidades
     */
    _scoreOpportunities(opportunities) {
        return opportunities
            .map(opp => {
                let score = 0;

                // Factor 1: Priority (30 puntos)
                const priorityScore = { high: 30, medium: 20, low: 10 };
                score += priorityScore[opp.priority] || 0;

                // Factor 2: Cobertura de competidores (20 puntos)
                score += Math.min(opp.competitor_coverage * 5, 20);

                // Factor 3: Content gap (25 puntos si NO lo cubrimos)
                if (!opp.we_covered) {
                    score += 25;
                }

                // Factor 4: Datos disponibles (25 puntos)
                const dataScore = opp.data_enrichment.available_data_sources.length * 5;
                score += Math.min(dataScore, 25);

                return {
                    ...opp,
                    score: Math.min(score, 100),
                    score_breakdown: {
                        priority: priorityScore[opp.priority] || 0,
                        competitor_coverage: Math.min(opp.competitor_coverage * 5, 20),
                        content_gap: !opp.we_covered ? 25 : 0,
                        data_availability: Math.min(dataScore, 25)
                    }
                };
            })
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Generar brief estratégico con GPT-5 Mini
     */
    async _generateStrategicBrief(opportunities) {
        const topOpportunities = opportunities.slice(0, 10);

        const prompt = `
Eres un estratega de contenido para Fantasy La Liga.

CONTEXTO:
- Analizamos ${opportunities.length} oportunidades de contenido
- Basadas en análisis de competencia + nuestros datos propios
- Tenemos acceso a API-Sports oficial + algoritmos propietarios

TOP 10 OPORTUNIDADES (ordenadas por score):

${topOpportunities
    .map(
        (opp, idx) => `
${idx + 1}. ${opp.topic.toUpperCase()} (Score: ${opp.score}/100)
   - Competidores lo mencionan ${opp.competitor_coverage} veces
   - Nosotros lo cubrimos: ${opp.we_covered ? 'SÍ' : 'NO'}
   - Datos disponibles: ${opp.data_enrichment.available_data_sources.length} fuentes
   - Ángulo sugerido: ${opp.content_angle.title}
`
    )
    .join('\n')}

GENERA:
1. Executive Summary (2-3 líneas): Qué temas dominan y por qué
2. Recomendación Semanal: TOP 3 contenidos a crear esta semana
3. Timing sugerido: Cuándo publicar cada uno
4. Diferenciación clave: Cómo nos diferenciamos con datos

Formato: JSON con estructura clara.
`;

        try {
            const response = await openaiGPT5Mini.generateJSON(prompt, {
                temperature: 0.7
            });

            return {
                executive_summary: response.executive_summary || 'Brief generado automáticamente',
                weekly_recommendation:
                    response.weekly_recommendation || topOpportunities.slice(0, 3),
                timing_strategy: response.timing_strategy || 'Publicar según calendario jornada',
                differentiation: response.differentiation || 'Datos oficiales vs opiniones',
                raw_gpt_response: response
            };
        } catch (error) {
            logger.error('[ContentEnrichment] Error generando brief con GPT', {
                error: error.message
            });

            // Fallback: Brief simple
            return {
                executive_summary: `Análisis de ${opportunities.length} oportunidades. Top tema: ${topOpportunities[0]?.topic}`,
                weekly_recommendation: topOpportunities.slice(0, 3).map(o => o.topic),
                timing_strategy: 'Publicar contenido antes de cada jornada',
                differentiation: 'Usar datos de API-Sports para validar claims de competidores'
            };
        }
    }
}

module.exports = new ContentEnrichmentEngine();
