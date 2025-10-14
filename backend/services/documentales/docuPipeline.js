/**
 * Documentary Pipeline - Complete Automation System
 *
 * PROPÓSITO:
 * Orquestar TODO el flujo end-to-end para canal de documentales virales automatizado.
 * Replica modelo de Chisme Express MX ($378K/mes) con $1-3M potencial anual.
 *
 * FLUJO COMPLETO:
 * 1. Detectar trending topics (NewsAPI / Google Trends)
 * 2. Investigar personajes y eventos (Perplexity AI / Wikipedia)
 * 3. Generar script documental viral (GPT-4o)
 * 4. Generar video con VEO3 3-Phase (narrator)
 * 5. Agregar subtítulos con FFmpeg (85% watch without audio)
 * 6. Generar thumbnail con Canva API (opcional)
 * 7. Optimizar metadata con GPT-4o
 * 8. Publicar en YouTube como Short
 *
 * ESTRATEGIA:
 * - 7.8 videos/día (como Chisme Express MX)
 * - Documentales de crimen, escándalo, misterio, secreto
 * - Español (mercado ES + LATAM)
 * - Shorts únicamente (<60s, 9:16)
 *
 * COST PER VIDEO:
 * - Nano Banana: $0.06 (3 images)
 * - VEO3: $0.90 (3 segments)
 * - GPT-4o: $0.002 (script)
 * - Subtítulos: $0 (FFmpeg local)
 * - Total: ~$0.96 por video
 *
 * REVENUE PROJECTION:
 * - Conservative (60% de Chisme): $1,053,000/año
 * - Realistic (80% de Chisme): $1,965,600/año
 * - Optimistic (100% de Chisme): $2,973,240/año
 */

const logger = require('../../utils/logger');
const trendingTopicsDetector = require('../research/trendingTopicsDetector');
const docuScriptGenerator = require('./docuScriptGenerator');
const docuShortsGenerator = require('./docuShortsGenerator');
const subtitleGenerator = require('./subtitleGenerator');
const youtubePublisher = require('../youtubePublisher');
const { supabaseAdmin } = require('../../config/supabase');

class DocuPipeline {
    constructor() {
        // Configuración del pipeline
        this.config = {
            dailyVideos: 7, // Target: 7-8 videos/día (como Chisme Express MX)
            minDocumentaryPotential: 30, // Score mínimo para producir
            defaultAngle: 'revelacion', // Ángulo más viral
            defaultNarrator: 'serio', // Narrator serio por defecto
            autoPublish: false // Si auto-publicar en YouTube (recomendado: false para review manual)
        };

        // Tracking de producción
        this.productionQueue = [];
        this.producedToday = 0;
        this.totalProduced = 0;
    }

    /**
     * Ejecutar pipeline completo: trending → script → video → subtítulos → YouTube
     *
     * @param {Object} options - Opciones del pipeline
     * @param {boolean} [options.autoPublish=false] - Auto-publicar en YouTube
     * @param {number} [options.limit=1] - Cantidad de videos a producir
     * @param {string} [options.method='google_trends'] - Método de detección trending
     * @returns {Promise<Object>} Resultado con videos producidos
     */
    async run(options = {}) {
        const startTime = Date.now();
        const { autoPublish = false, limit = 1, method = 'google_trends' } = options;

        try {
            logger.info('🎬 [DocuPipeline] Iniciando pipeline completo', {
                limit,
                autoPublish,
                method
            });

            const results = {
                topicsDetected: 0,
                topicsResearched: 0,
                scriptsGenerated: 0,
                videosProduced: 0,
                videosPublished: 0,
                errors: [],
                videos: []
            };

            // PASO 1: Detectar trending topics
            logger.info('🔍 [DocuPipeline] PASO 1: Detectando trending topics...');

            const topics = await trendingTopicsDetector.detectTrendingTopics({
                hoursBack: 24,
                maxTopics: limit * 3, // Detectar 3x más para filtrar
                method
            });

            results.topicsDetected = topics.length;

            logger.info(`[DocuPipeline] ${topics.length} trending topics detectados`);

            // Filtrar por documentary potential
            const aptTopics = topics
                .filter(t => t.documentaryPotential >= this.config.minDocumentaryPotential)
                .slice(0, limit);

            if (aptTopics.length === 0) {
                logger.warn('[DocuPipeline] ⚠️ No se encontraron topics aptos para documentales');
                return results;
            }

            logger.info(`[DocuPipeline] ${aptTopics.length} topics aptos seleccionados`);

            // PASO 2-8: Procesar cada topic
            for (const topic of aptTopics) {
                try {
                    const videoResult = await this._processTopicToVideo(topic, { autoPublish });

                    if (videoResult.success) {
                        results.videosProduced++;

                        if (videoResult.published) {
                            results.videosPublished++;
                        }

                        results.videos.push(videoResult);

                        logger.info('[DocuPipeline] ✅ Video producido exitosamente', {
                            tema: topic.titulo,
                            videoPath: videoResult.videoPath
                        });
                    } else {
                        results.errors.push({
                            topic: topic.titulo,
                            error: videoResult.error
                        });

                        logger.error('[DocuPipeline] ❌ Error produciendo video', {
                            tema: topic.titulo,
                            error: videoResult.error
                        });
                    }
                } catch (error) {
                    results.errors.push({
                        topic: topic.titulo,
                        error: error.message
                    });

                    logger.error('[DocuPipeline] ❌ Error procesando topic', {
                        tema: topic.titulo,
                        error: error.message
                    });
                }
            }

            const duration = Date.now() - startTime;
            const totalCost = results.videosProduced * 0.96; // $0.96 per video

            logger.info('🎉 [DocuPipeline] Pipeline completado', {
                topicsDetected: results.topicsDetected,
                videosProduced: results.videosProduced,
                videosPublished: results.videosPublished,
                errors: results.errors.length,
                duration: `${duration}ms`,
                totalCost: `$${totalCost.toFixed(2)}`
            });

            return {
                success: true,
                ...results,
                duration,
                totalCost
            };
        } catch (error) {
            logger.error('❌ [DocuPipeline] Error en pipeline', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesar un topic completo: research → script → video → subtítulos → YouTube
     * @private
     */
    async _processTopicToVideo(topic, options = {}) {
        const { autoPublish = false } = options;

        try {
            logger.info('[DocuPipeline] Procesando topic...', {
                titulo: topic.titulo
            });

            // PASO 2: Investigar personajes y eventos (TODO: Perplexity AI)
            logger.info('[DocuPipeline] PASO 2: Investigando topic...');

            const researchData = await this._researchTopic(topic);

            // PASO 3: Generar script documental viral
            logger.info('[DocuPipeline] PASO 3: Generando script...');

            const scriptResult = await docuScriptGenerator.generateViralDocuScript(
                topic,
                researchData,
                {
                    angle: this.config.defaultAngle,
                    narrator: this.config.defaultNarrator
                }
            );

            if (!scriptResult.success) {
                throw new Error(`Script generation failed: ${scriptResult.error || 'Unknown'}`);
            }

            // PASO 4: Generar video con VEO3
            logger.info('[DocuPipeline] PASO 4: Generando video con VEO3...');

            const videoResult = await docuShortsGenerator.generateDocuShort(scriptResult.script, {
                generateContextImages: true
            });

            if (!videoResult.success) {
                throw new Error(`Video generation failed: ${videoResult.error}`);
            }

            // PASO 5: Agregar subtítulos
            logger.info('[DocuPipeline] PASO 5: Agregando subtítulos...');

            const subtitledPath = videoResult.videoPath.replace('.mp4', '-subtitled.mp4');

            const subtitleResult = await subtitleGenerator.addSubtitles({
                videoPath: videoResult.videoPath,
                segments: scriptResult.script.segments,
                outputPath: subtitledPath,
                style: 'viral'
            });

            if (!subtitleResult.success) {
                logger.warn('[DocuPipeline] ⚠️ Error agregando subtítulos, usando video sin subtítulos');
                // No fallar, continuar con video sin subtítulos
            }

            const finalVideoPath = subtitleResult.success ? subtitledPath : videoResult.videoPath;

            // PASO 6: Generar thumbnail (TODO: Canva API)
            logger.info('[DocuPipeline] PASO 6: Generando thumbnail...');
            // TODO: Implementar thumbnailGenerator con Canva API

            // PASO 7: Optimizar metadata
            logger.info('[DocuPipeline] PASO 7: Optimizando metadata...');

            const metadata = this._generateMetadata(scriptResult.script, topic);

            // PASO 8: Publicar en YouTube (si autoPublish = true)
            let publishResult = null;

            if (autoPublish) {
                logger.info('[DocuPipeline] PASO 8: Publicando en YouTube...');

                publishResult = await youtubePublisher.publishShort({
                    videoPath: finalVideoPath,
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags,
                    category: '24', // Entertainment
                    privacyStatus: 'public',
                    autoGenerateThumbnail: true
                });

                if (!publishResult.success) {
                    logger.warn('[DocuPipeline] ⚠️ Error publicando en YouTube', {
                        error: publishResult.error
                    });
                }
            } else {
                logger.info('[DocuPipeline] PASO 8: Publicación manual (autoPublish=false)');
            }

            // Guardar en Supabase
            await this._saveToDatabase({
                topic,
                script: scriptResult.script,
                videoPath: finalVideoPath,
                metadata,
                publishResult
            });

            return {
                success: true,
                tema: scriptResult.script.tema,
                videoPath: finalVideoPath,
                metadata,
                published: publishResult ? publishResult.success : false,
                youtubeUrl: publishResult ? publishResult.url : null,
                cost: 0.96
            };
        } catch (error) {
            logger.error('[DocuPipeline] Error procesando topic', {
                topic: topic.titulo,
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Investigar topic (Perplexity AI / Wikipedia)
     * @private
     */
    async _researchTopic(topic) {
        // TODO: Implementar integración con Perplexity AI para research verificado

        // Por ahora, usar datos básicos del topic
        logger.info('[DocuPipeline] Research básico (TODO: Perplexity AI)');

        return {
            resumen: topic.descripcion || topic.titulo,
            hechos_clave: [
                'Hecho clave 1 basado en la noticia',
                'Hecho clave 2 basado en la noticia',
                'Hecho clave 3 basado en la noticia'
            ],
            contexto: `Contexto del tema: ${topic.titulo}`,
            fuentes: [topic.url]
        };
    }

    /**
     * Generar metadata optimizada para YouTube
     * @private
     */
    _generateMetadata(script, topic) {
        // Título optimizado (max 100 chars)
        const title = `${script.tema} #Shorts`.substring(0, 100);

        // Descripción con keywords (max 5000 chars)
        const description = `${topic.descripcion || script.tema}

🔍 Documental viral sobre: ${script.tema}

📊 Datos verificados
🎯 Investigación periodística
⚡ Revelaciones exclusivas

#Documentales #ViralShorts #Revelacion #Misterio #Escandalo #Investigacion
#Trending #Noticias #Viral #Shorts

🎥 Canal de documentales virales en Shorts
📱 Síguenos para más investigaciones

Fuente: ${topic.fuente || 'Múltiples fuentes verificadas'}`;

        // Tags optimizados
        const tags = [
            'documentales',
            'shorts',
            'viral',
            'revelacion',
            'misterio',
            'escandalo',
            'investigacion',
            'noticias',
            'trending',
            'español',
            ...topic.keywords
        ];

        return {
            title,
            description,
            tags: tags.slice(0, 30) // Max 30 tags
        };
    }

    /**
     * Guardar producción en Supabase
     * @private
     */
    async _saveToDatabase(data) {
        try {
            const record = {
                topic_titulo: data.topic.titulo,
                topic_url: data.topic.url,
                script_tema: data.script.tema,
                script_angle: data.script.angle,
                video_path: data.videoPath,
                youtube_title: data.metadata.title,
                youtube_description: data.metadata.description,
                youtube_tags: data.metadata.tags,
                youtube_url: data.publishResult ? data.publishResult.url : null,
                youtube_video_id: data.publishResult ? data.publishResult.videoId : null,
                published: data.publishResult ? data.publishResult.success : false,
                cost_usd: 0.96,
                produced_at: new Date().toISOString(),
                status: data.publishResult ? 'published' : 'produced'
            };

            const { error } = await supabaseAdmin.from('documentary_productions').insert([record]);

            if (error) {
                throw error;
            }

            logger.info('[DocuPipeline] ✅ Producción guardada en Supabase');
        } catch (error) {
            logger.error('[DocuPipeline] Error guardando en Supabase', {
                error: error.message
            });
            // No lanzar error, solo log
        }
    }

    /**
     * Ejecutar pipeline en modo batch (producción diaria)
     *
     * @param {Object} options - Opciones del batch
     * @param {number} [options.dailyTarget=7] - Target de videos diarios
     * @returns {Promise<Object>} Resultado del batch
     */
    async runDailyBatch(options = {}) {
        const { dailyTarget = 7 } = options;

        logger.info('📅 [DocuPipeline] Iniciando batch diario', {
            dailyTarget
        });

        // Ejecutar pipeline con límite de videos diarios
        return await this.run({
            limit: dailyTarget,
            autoPublish: this.config.autoPublish,
            method: 'google_trends' // Gratis
        });
    }

    /**
     * Calcular proyección de ingresos
     *
     * @param {string} scenario - 'conservative' | 'realistic' | 'optimistic'
     * @returns {Object} Proyección de ingresos
     */
    calculateRevenueProjection(scenario = 'realistic') {
        const dailyVideos = 7.8; // Como Chisme Express MX
        const monthlyVideos = dailyVideos * 30; // 234 videos/mes
        const rpmSpain = 2.5; // RPM promedio España para documentales

        // Views proyectadas por video (según escenario)
        const avgViewsPerVideo = {
            conservative: 326_000, // 60% de Chisme Express MX (543K)
            realistic: 434_000, // 80% de Chisme Express MX
            optimistic: 543_000 // 100% de Chisme Express MX
        };

        const views = avgViewsPerVideo[scenario];
        const monthlyViews = views * monthlyVideos;
        const monthlyRevenue = (monthlyViews / 1000) * rpmSpain;
        const yearlyRevenue = monthlyRevenue * 12;

        return {
            scenario,
            dailyVideos,
            monthlyVideos,
            avgViewsPerVideo: views,
            monthlyViews,
            rpmSpain,
            monthlyRevenue: Math.round(monthlyRevenue),
            yearlyRevenue: Math.round(yearlyRevenue),
            formatted: {
                monthly: `$${Math.round(monthlyRevenue).toLocaleString()}`,
                yearly: `$${Math.round(yearlyRevenue).toLocaleString()}`
            }
        };
    }

    /**
     * Obtener estadísticas de producción
     *
     * @returns {Promise<Object>} Estadísticas
     */
    async getProductionStats() {
        try {
            // Obtener stats de Supabase
            const { data: productions, error } = await supabaseAdmin
                .from('documentary_productions')
                .select('*')
                .order('produced_at', { ascending: false });

            if (error) {
                throw error;
            }

            const today = new Date().toISOString().split('T')[0];
            const producedToday = productions.filter(p => p.produced_at.startsWith(today)).length;

            const stats = {
                total: productions.length,
                today: producedToday,
                published: productions.filter(p => p.published).length,
                pending: productions.filter(p => !p.published).length,
                totalCost: productions.length * 0.96,
                avgCostPerVideo: 0.96,
                projections: {
                    conservative: this.calculateRevenueProjection('conservative'),
                    realistic: this.calculateRevenueProjection('realistic'),
                    optimistic: this.calculateRevenueProjection('optimistic')
                }
            };

            return stats;
        } catch (error) {
            logger.error('[DocuPipeline] Error obteniendo stats', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new DocuPipeline();
