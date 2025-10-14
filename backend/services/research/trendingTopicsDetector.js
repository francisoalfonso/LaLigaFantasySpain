/**
 * Trending Topics Detector - NewsAPI Integration
 *
 * PROPÓSITO:
 * Detectar temas trending en tiempo real aptos para documentales virales.
 * Replica la estrategia de Chisme Express MX: crimen, escándalo, misterio, secretos.
 *
 * ESTRATEGIA:
 * - NewsAPI: Top headlines + Everything endpoint
 * - Keywords: crimen, escándalo, misterio, secreto, viral, controversial
 * - Filtros: Español, últimas 24h, engagement alto
 * - Output: Temas con personajes/eventos documentables
 *
 * COST: NewsAPI Developer Plan $449/mes (50K requests/día)
 * Alternative FREE: Web scraping de trending.google.com (100% gratis)
 *
 * FUENTES:
 * - NewsAPI.org: https://newsapi.org/docs
 * - Google Trends: https://trends.google.com/trends/
 */

const axios = require('axios');
const logger = require('../../utils/logger');
const { supabaseAdmin } = require('../../config/supabase');

class TrendingTopicsDetector {
    constructor() {
        this.apiKey = process.env.NEWSAPI_KEY; // NewsAPI key (optional)
        this.baseUrl = 'https://newsapi.org/v2';

        // Keywords para documentales virales (estilo Chisme Express MX)
        this.documentaryKeywords = [
            'crimen',
            'escándalo',
            'misterio',
            'secreto',
            'revelación',
            'controversial',
            'viral',
            'polémico',
            'investigación',
            'denuncia',
            'famoso',
            'celebridad',
            'empresario',
            'político',
            'caso',
            'fraude',
            'estafa'
        ];

        // Categorías para NewsAPI
        this.categories = ['general', 'entertainment', 'business'];

        // Países (español)
        this.countries = ['es', 'mx', 'ar', 'co', 'cl'];

        // Filtros de calidad
        this.minEngagementScore = 15; // Score mínimo para considerar
        this.minRelevanceScore = 20; // Score mínimo de relevancia documental
    }

    /**
     * Detectar trending topics aptos para documentales
     *
     * @param {Object} options - Opciones de búsqueda
     * @param {number} [options.hoursBack=24] - Buscar noticias de últimas N horas
     * @param {number} [options.maxTopics=50] - Máximo de topics a retornar
     * @param {string} [options.method='newsapi'] - 'newsapi' | 'google_trends' | 'scraping'
     * @returns {Array} Topics detectados con metadata
     */
    async detectTrendingTopics(options = {}) {
        try {
            const { hoursBack = 24, maxTopics = 50, method = 'newsapi' } = options;

            logger.info('🔍 [TrendingTopicsDetector] Iniciando detección de trending topics', {
                hoursBack,
                maxTopics,
                method
            });

            let topics = [];

            // Seleccionar método de detección
            if (method === 'newsapi' && this.apiKey) {
                topics = await this._detectWithNewsAPI(hoursBack, maxTopics);
            } else if (method === 'google_trends') {
                topics = await this._detectWithGoogleTrends(hoursBack, maxTopics);
            } else if (method === 'scraping') {
                topics = await this._detectWithScraping(hoursBack, maxTopics);
            } else {
                // Fallback: Usar Google Trends (gratis)
                logger.warn(
                    '⚠️ [TrendingTopicsDetector] NewsAPI key no configurada, usando Google Trends (gratis)'
                );
                topics = await this._detectWithGoogleTrends(hoursBack, maxTopics);
            }

            // Calcular engagement score para cada topic
            const topicsWithScores = topics.map(topic => ({
                ...topic,
                engagementScore: this._calculateEngagementScore(topic),
                relevanceScore: this._calculateRelevanceScore(topic),
                documentaryPotential: this._calculateDocumentaryPotential(topic)
            }));

            // Filtrar por calidad mínima
            const qualityTopics = topicsWithScores.filter(
                topic =>
                    topic.engagementScore >= this.minEngagementScore &&
                    topic.relevanceScore >= this.minRelevanceScore
            );

            // Ordenar por documentary potential descendente
            qualityTopics.sort((a, b) => b.documentaryPotential - a.documentaryPotential);

            // Limitar cantidad
            const finalTopics = qualityTopics.slice(0, maxTopics);

            logger.info('✅ [TrendingTopicsDetector] Trending topics detectados', {
                total: topics.length,
                afterFilters: qualityTopics.length,
                final: finalTopics.length
            });

            // Guardar en Supabase
            if (finalTopics.length > 0) {
                await this._saveTopicsToDatabase(finalTopics);
            }

            return finalTopics;
        } catch (error) {
            logger.error('❌ [TrendingTopicsDetector] Error detectando trending topics', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Detectar topics usando NewsAPI
     * @private
     */
    async _detectWithNewsAPI(hoursBack, maxTopics) {
        try {
            logger.info('[TrendingTopicsDetector] Usando NewsAPI...');

            if (!this.apiKey) {
                throw new Error('NEWSAPI_KEY no configurada en .env');
            }

            const fromDate = new Date();
            fromDate.setHours(fromDate.getHours() - hoursBack);
            const fromISO = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD

            const allArticles = [];

            // Buscar en todas las keywords documentales
            for (const keyword of this.documentaryKeywords.slice(0, 5)) {
                // Limitar a 5 keywords para no gastar quota
                try {
                    const response = await axios.get(`${this.baseUrl}/everything`, {
                        params: {
                            apiKey: this.apiKey,
                            q: keyword,
                            language: 'es',
                            sortBy: 'popularity',
                            from: fromISO,
                            pageSize: 20
                        }
                    });

                    if (response.data && response.data.articles) {
                        allArticles.push(...response.data.articles);
                    }

                    logger.info(`[TrendingTopicsDetector] Keyword "${keyword}": ${response.data.totalResults} artículos`);
                } catch (error) {
                    logger.warn(`[TrendingTopicsDetector] Error con keyword "${keyword}"`, {
                        error: error.message
                    });
                }
            }

            // Eliminar duplicados (mismo título)
            const uniqueArticles = this._deduplicateArticles(allArticles);

            // Transformar a formato topic
            const topics = uniqueArticles.map(article => ({
                titulo: article.title,
                descripcion: article.description || '',
                url: article.url,
                fuente: article.source.name,
                fechaPublicacion: article.publishedAt,
                imagen: article.urlToImage,
                personajes: this._extractPersonajes(article.title + ' ' + (article.description || '')),
                keywords: this._extractKeywords(article.title + ' ' + (article.description || '')),
                method: 'newsapi'
            }));

            return topics;
        } catch (error) {
            logger.error('[TrendingTopicsDetector] Error en NewsAPI', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Detectar topics usando Google Trends (GRATIS)
     * @private
     */
    async _detectWithGoogleTrends(hoursBack, maxTopics) {
        try {
            logger.info('[TrendingTopicsDetector] Usando Google Trends (gratis)...');

            // Usar google-trends-api npm package
            const googleTrends = require('google-trends-api');

            // Get daily trends para España
            const trendsData = await googleTrends.dailyTrends({
                trendDate: new Date(),
                geo: 'ES'
            });

            const trends = JSON.parse(trendsData);
            const trendingSearches = trends.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

            // Transformar a formato topic
            const topics = trendingSearches
                .map(trend => {
                    const article = trend.articles?.[0] || {};
                    return {
                        titulo: trend.title.query,
                        descripcion: article.snippet || '',
                        url: article.url || '',
                        fuente: article.source || 'Google Trends',
                        fechaPublicacion: new Date().toISOString(),
                        imagen: trend.image?.imageUrl || null,
                        personajes: this._extractPersonajes(trend.title.query),
                        keywords: this._extractKeywords(
                            trend.title.query + ' ' + (article.snippet || '')
                        ),
                        trafficVolume: parseInt(trend.formattedTraffic) || 0,
                        method: 'google_trends'
                    };
                })
                .filter(topic => {
                    // Filtrar solo temas documentales
                    const text = (topic.titulo + ' ' + topic.descripcion).toLowerCase();
                    return this.documentaryKeywords.some(keyword =>
                        text.includes(keyword.toLowerCase())
                    );
                });

            logger.info(`[TrendingTopicsDetector] Google Trends: ${topics.length} topics documentales encontrados`);

            return topics;
        } catch (error) {
            logger.error('[TrendingTopicsDetector] Error en Google Trends', {
                error: error.message
            });

            // Si falla Google Trends, usar scraping como fallback
            logger.info('[TrendingTopicsDetector] Fallback a web scraping...');
            return this._detectWithScraping(hoursBack, maxTopics);
        }
    }

    /**
     * Detectar topics usando web scraping (GRATIS - 100% libre)
     * @private
     */
    async _detectWithScraping(hoursBack, maxTopics) {
        try {
            logger.info('[TrendingTopicsDetector] Usando web scraping (gratis)...');

            // Scraping de fuentes abiertas españolas
            const sources = [
                'https://www.elconfidencial.com/',
                'https://www.elmundo.es/',
                'https://www.abc.es/'
            ];

            const topics = [];

            // Por ahora, retornar array vacío con mensaje
            logger.warn(
                '⚠️ [TrendingTopicsDetector] Web scraping requiere implementación de cheerio/puppeteer'
            );
            logger.info(
                '💡 [TrendingTopicsDetector] Recomendación: Configurar NEWSAPI_KEY o usar google-trends-api'
            );

            return [];
        } catch (error) {
            logger.error('[TrendingTopicsDetector] Error en web scraping', {
                error: error.message
            });
            return [];
        }
    }

    /**
     * Eliminar artículos duplicados
     * @private
     */
    _deduplicateArticles(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = article.title.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Extraer personajes del texto (nombres propios)
     * @private
     */
    _extractPersonajes(text) {
        // Regex básico para nombres propios (capitalización)
        const regex = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+\b/g;
        const matches = text.match(regex) || [];

        // Filtrar nombres comunes que no son personajes
        const commonWords = [
            'España',
            'Barcelona',
            'Madrid',
            'Valencia',
            'Sevilla',
            'La Liga',
            'Real Madrid',
            'Google Trends'
        ];

        const personajes = matches.filter(
            name => !commonWords.includes(name) && name.length > 5 && name.length < 50
        );

        // Eliminar duplicados
        return [...new Set(personajes)];
    }

    /**
     * Extraer keywords documentales del texto
     * @private
     */
    _extractKeywords(text) {
        const textLower = text.toLowerCase();
        const foundKeywords = this.documentaryKeywords.filter(keyword =>
            textLower.includes(keyword)
        );
        return foundKeywords;
    }

    /**
     * Calcular engagement score
     * @private
     */
    _calculateEngagementScore(topic) {
        let score = 0;

        // +20 puntos si tiene imagen
        if (topic.imagen) {
            score += 20;
        }

        // +10 puntos por cada keyword documental
        score += (topic.keywords?.length || 0) * 10;

        // +15 puntos si tiene personajes identificados
        if (topic.personajes?.length > 0) {
            score += 15;
        }

        // +30 puntos si tiene trafficVolume alto (Google Trends)
        if (topic.trafficVolume && topic.trafficVolume > 50000) {
            score += 30;
        } else if (topic.trafficVolume && topic.trafficVolume > 10000) {
            score += 15;
        }

        return score;
    }

    /**
     * Calcular relevance score (qué tan documental es el tema)
     * @private
     */
    _calculateRelevanceScore(topic) {
        let score = 0;

        const text = (topic.titulo + ' ' + topic.descripcion).toLowerCase();

        // Keywords de alto valor documental
        const highValueKeywords = ['crimen', 'escándalo', 'misterio', 'secreto', 'revelación'];
        const mediumValueKeywords = ['viral', 'polémico', 'controversial', 'denuncia'];

        highValueKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 20;
            }
        });

        mediumValueKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 10;
            }
        });

        // +25 puntos si menciona personajes conocidos
        if (topic.personajes && topic.personajes.length >= 2) {
            score += 25;
        } else if (topic.personajes && topic.personajes.length === 1) {
            score += 15;
        }

        return score;
    }

    /**
     * Calcular documentary potential (score final)
     * @private
     */
    _calculateDocumentaryPotential(topic) {
        // Weighted average
        const engagement = topic.engagementScore * 0.4;
        const relevance = topic.relevanceScore * 0.6;

        return Math.round((engagement + relevance) * 10) / 10;
    }

    /**
     * Guardar topics en Supabase
     * @private
     */
    async _saveTopicsToDatabase(topics) {
        try {
            const records = topics.map(topic => ({
                titulo: topic.titulo,
                descripcion: topic.descripcion,
                url: topic.url,
                fuente: topic.fuente,
                fecha_publicacion: topic.fechaPublicacion,
                imagen_url: topic.imagen,
                personajes: topic.personajes || [],
                keywords: topic.keywords || [],
                engagement_score: topic.engagementScore,
                relevance_score: topic.relevanceScore,
                documentary_potential: topic.documentaryPotential,
                method: topic.method,
                traffic_volume: topic.trafficVolume || null,
                detected_at: new Date().toISOString(),
                processing_status: 'detected' // detected, researching, scripted, produced
            }));

            // Upsert para evitar duplicados
            const { data, error } = await supabaseAdmin.from('trending_topics').upsert(records, {
                onConflict: 'titulo,fuente',
                ignoreDuplicates: true
            });

            if (error) {
                throw error;
            }

            logger.info('✅ [TrendingTopicsDetector] Topics guardados en Supabase', {
                count: records.length
            });

            return data;
        } catch (error) {
            logger.error('❌ [TrendingTopicsDetector] Error guardando topics en DB', {
                error: error.message
            });
            // No lanzar error, solo log (no fallar toda la detección)
        }
    }

    /**
     * Obtener trending topics desde base de datos
     *
     * @param {Object} filters - Filtros opcionales
     * @param {number} [filters.hoursBack=48] - Topics de últimas N horas
     * @param {string} [filters.status] - Filtrar por status
     * @param {number} [filters.minScore=20] - Score mínimo
     * @returns {Array} Topics
     */
    async getTopics(filters = {}) {
        try {
            const { hoursBack = 48, status, minScore = 20 } = filters;

            let query = supabaseAdmin
                .from('trending_topics')
                .select('*')
                .order('documentary_potential', { ascending: false });

            // Filtrar por tiempo
            if (hoursBack) {
                const cutoffDate = new Date();
                cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
                query = query.gte('detected_at', cutoffDate.toISOString());
            }

            // Filtrar por status
            if (status) {
                query = query.eq('processing_status', status);
            }

            // Filtrar por score mínimo
            if (minScore) {
                query = query.gte('documentary_potential', minScore);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            logger.error('❌ [TrendingTopicsDetector] Error obteniendo topics', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new TrendingTopicsDetector();
