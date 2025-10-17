/**
 * Outlier Script Generator
 *
 * ⚠️ DEPRECATED - 15 Oct 2025
 * Este generador basado en templates NO se usa en producción.
 * Usar intelligentScriptGenerator.js (GPT-driven) para el flujo E2E de outliers.
 *
 * MOTIVO DEPRECACIÓN:
 * - intelligentScriptGenerator.js es más completo: usa GPT-4o + datos reales API-Sports
 * - Este es template-based y menos flexible
 * - Sistema de producción usa intelligentScriptGenerator.js
 *
 * MANTENER SEPARADO DE:
 * - unifiedScriptGenerator.js (chollos - contenido proactivo)
 * - intelligentScriptGenerator.js (outliers - contenido reactivo GPT)
 *
 * ────────────────────────────────────────────────────────────────────────
 *
 * PROPÓSITO ORIGINAL:
 * Convertir outliers virales detectados en guiones VEO3 de 3 segmentos
 * para que Carlos/Ana creen videos de respuesta automáticamente.
 *
 * ESTRATEGIA NARRATIVA:
 * - Segmento 1 (8s): Hook + Presentar el descubrimiento del outlier
 * - Segmento 2 (8s): Analizar por qué está funcionando viralmente
 * - Segmento 3 (8s): Aplicar el aprendizaje a Fantasy La Liga + CTA
 *
 * INPUTS:
 * - Outlier data (título, canal, views, likes, outlier_score, viral_ratio)
 *
 * OUTPUTS:
 * - Script compatible con UnifiedScriptGenerator (3 segmentos con dialogue)
 */

const logger = require('../../utils/logger');
const EmotionAnalyzer = require('../veo3/emotionAnalyzer');

class OutlierScriptGenerator {
    constructor() {
        this.emotionAnalyzer = new EmotionAnalyzer();

        // Plantilla para videos de outlier/respuesta
        this.outlierTemplate = {
            contentType: 'outlier_response',
            totalDuration: 24,
            emotionalJourney: ['descubrimiento', 'analisis', 'aplicacion'],
            structure: {
                segment1: { role: 'intro', duration: 8, function: 'Hook + Descubrimiento' },
                segment2: { role: 'middle', duration: 8, function: 'Análisis viral' },
                segment3: { role: 'outro', duration: 8, function: 'Aplicación + CTA' }
            }
        };
    }

    /**
     * Generar script completo desde un outlier
     *
     * @param {Object} outlierData - Datos del outlier viral
     * @param {Object} options - Opciones adicionales
     * @param {string} options.platform - Plataforma objetivo ('instagram' | 'youtube') - DEFAULT: 'youtube'
     * @param {string} options.presenter - Presentador ('Carlos' | 'Ana')
     * @param {string} options.customHook - Hook personalizado opcional
     * @returns {Object} Script en formato compatible con VEO3
     */
    generateScriptFromOutlier(outlierData, options = {}) {
        const { presenter = 'Carlos', customHook = null, platform = 'youtube' } = options;

        // ✅ NUEVO: Extraer target_player del análisis de contenido
        const targetPlayer = outlierData.content_analysis?.target_player || null;

        logger.info('[OutlierScriptGenerator] Generando script desde outlier:', {
            videoId: outlierData.video_id,
            title: outlierData.title?.substring(0, 50),
            priority: outlierData.priority,
            platform: platform.toUpperCase(),
            targetPlayer: targetPlayer // ✅ Log jugador objetivo
        });

        // Validar datos mínimos
        this._validateOutlierData(outlierData);

        // Construir script de 3 segmentos optimizado por plataforma
        const script = this._buildOutlierScript(
            outlierData,
            presenter,
            customHook,
            platform,
            targetPlayer
        ); // ✅ Pasar targetPlayer

        // Convertir a formato VEO3 (3 segmentos con dialogue, emotion, etc.)
        const veo3Script = this._convertToVEO3Format(script, outlierData, platform, targetPlayer); // ✅ Pasar targetPlayer

        logger.info('[OutlierScriptGenerator] ✅ Script generado exitosamente:', {
            segments: veo3Script.segments.length,
            totalWords: veo3Script.metadata.totalWords,
            cohesionScore: veo3Script.validation.score,
            targetPlayer: targetPlayer // ✅ Confirmar jugador en metadata
        });

        return veo3Script;
    }

    /**
     * Construir script personalizado para el outlier optimizado por plataforma
     * @private
     */
    _buildOutlierScript(outlier, presenter, customHook, platform, targetPlayer = null) {
        // Extraer datos clave del outlier
        const channelName = outlier.channel_name || 'un canal competidor';
        const views = this._formatNumber(outlier.views);
        const likes = this._formatNumber(outlier.likes);
        const viralRatio = outlier.viral_ratio ? outlier.viral_ratio.toFixed(1) : 'alto';
        const outlierScore = outlier.outlier_score ? Math.round(outlier.outlier_score) : '95';

        // Simplificar título del video para mencionar (primeras 5-6 palabras)
        const shortTitle = this._simplifyTitle(outlier.title);

        // ✅ NUEVO: Hook personalizado basado en target_player
        let hook;
        if (customHook) {
            hook = customHook;
        } else if (targetPlayer) {
            // Hook específico con nombre del jugador
            hook = `Misters, acabo de ver el video de Carrasco sobre ${targetPlayer}...`;
        } else {
            // Hook genérico si no hay jugador identificado
            hook = `Misters, acabo de descubrir un video que está rompiendo YouTube...`;
        }

        // SEGMENTO 1 (0-8s): Hook + Descubrimiento
        // 24-25 palabras (~7-8s de audio)
        const segment1 = {
            hook: hook, // ~10 palabras
            discovery: `"${shortTitle}" de ${channelName}.`, // ~8 palabras
            impact: `Lleva ${views} visualizaciones en tiempo récord.` // ~7 palabras
        };

        // SEGMENTO 2 (8-16s): Análisis viral
        // 24-25 palabras
        const segment2 = {
            stats: `${likes} me gusta, ratio viral de ${viralRatio}.`, // ~9 palabras
            analysis: `El algoritmo lo está potenciando brutalmente.`, // ~7 palabras
            insight: `¿Qué hace diferente? El hook y el timing perfecto.` // ~10 palabras
        };

        // SEGMENTO 3 (16-24s): Aplicación + CTA (optimizado por plataforma)
        // 24-25 palabras
        let segment3;

        if (platform === 'instagram') {
            // CTA Instagram: Más agresivo, enfoque en engagement
            segment3 = {
                application: `Vamos a aplicar esto a nuestros chollos ahora mismo.`, // ~9 palabras
                value: `Hooks más fuertes, datos concretos, timing perfecto.`, // ~7 palabras
                cta: `Guarda este video y compártelo con tu compi de Liga.` // ~10 palabras
            };
        } else if (platform === 'youtube') {
            // CTA YouTube: Enfoque en suscripción y engagement
            segment3 = {
                application: `Vamos a aplicar esta estrategia a nuestros chollos.`, // ~9 palabras
                value: `Hooks más fuertes, datos concretos, timing optimizado.`, // ~7 palabras
                cta: `Dale like y suscríbete para más análisis de outliers.` // ~10 palabras
            };
        } else {
            // Default (neutral)
            segment3 = {
                application: `Vamos a aplicar esta estrategia a nuestros chollos.`, // ~9 palabras
                value: `Hooks más fuertes, datos concretos, timing optimizado.`, // ~7 palabras
                cta: `Si queréis que analice más outliers, decídmelo abajo.` // ~9 palabras
            };
        }

        return { segment1, segment2, segment3 };
    }

    /**
     * Convertir script a formato VEO3 compatible
     * @private
     */
    _convertToVEO3Format(script, outlierData, platform, targetPlayer = null) {
        const segments = [];

        // Segmento 1: Hook + Descubrimiento
        const dialogue1 = this._joinScriptParts(script.segment1);
        const segment1Analysis = this.emotionAnalyzer.analyzeSegment(dialogue1, {
            narrativeRole: 'hook',
            contentType: 'outlier_response',
            position: 0
        });

        segments.push({
            role: 'intro',
            duration: 8,
            timeRange: '0-8s',
            dialogue: dialogue1,
            emotion: segment1Analysis.dominantEmotion || 'descubrimiento',
            emotionDistribution: segment1Analysis.emotionDistribution,
            narrativeFunction: 'Hook + Descubrimiento del outlier',
            transitionTo: 'segment2'
        });

        // Segmento 2: Análisis viral
        const dialogue2 = this._joinScriptParts(script.segment2);
        const segment2Analysis = this.emotionAnalyzer.analyzeSegment(dialogue2, {
            narrativeRole: 'analisis',
            contentType: 'outlier_response',
            position: 0.5,
            previousEmotion: segment1Analysis.dominantEmotion
        });

        segments.push({
            role: 'middle',
            duration: 8,
            timeRange: '8-16s',
            dialogue: dialogue2,
            emotion: segment2Analysis.dominantEmotion || 'analisis',
            emotionDistribution: segment2Analysis.emotionDistribution,
            narrativeFunction: 'Análisis de por qué es viral',
            transitionTo: 'segment3'
        });

        // Segmento 3: Aplicación + CTA
        const dialogue3 = this._joinScriptParts(script.segment3);
        const segment3Analysis = this.emotionAnalyzer.analyzeSegment(dialogue3, {
            narrativeRole: 'cta',
            contentType: 'outlier_response',
            position: 1.0,
            previousEmotion: segment2Analysis.dominantEmotion
        });

        segments.push({
            role: 'outro',
            duration: 8,
            timeRange: '16-24s',
            dialogue: dialogue3,
            emotion: segment3Analysis.dominantEmotion || 'aplicacion',
            emotionDistribution: segment3Analysis.emotionDistribution,
            narrativeFunction: 'Aplicación práctica + CTA',
            transitionTo: null
        });

        // Validar longitud de diálogos
        const validation1 = this._validateDialogueDuration(dialogue1, 'Segmento 1');
        const validation2 = this._validateDialogueDuration(dialogue2, 'Segmento 2');
        const validation3 = this._validateDialogueDuration(dialogue3, 'Segmento 3');

        // Calcular validación general
        const validation = this._calculateValidation([validation1, validation2, validation3]);

        // Metadata completa
        const totalWords = validation1.wordCount + validation2.wordCount + validation3.wordCount;

        return {
            segments,
            arc: this.outlierTemplate,
            validation,
            metadata: {
                contentType: 'outlier_response',
                platform: platform || 'youtube', // ✅ Incluir plataforma
                targetPlayer: targetPlayer, // ✅ NUEVO: Jugador objetivo identificado
                outlierVideoId: outlierData.video_id,
                outlierTitle: outlierData.title,
                outlierChannel: outlierData.channel_name,
                totalDuration: 24,
                totalWords,
                emotionalJourney: this.outlierTemplate.emotionalJourney,
                cohesionScore: validation.score,
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Validar que el outlier tiene datos mínimos
     * @private
     */
    _validateOutlierData(outlier) {
        if (!outlier) {
            throw new Error('outlierData es requerido');
        }

        if (!outlier.title || outlier.title.trim().length === 0) {
            throw new Error('outlier.title es requerido');
        }

        if (!outlier.video_id) {
            throw new Error('outlier.video_id es requerido');
        }

        // Advertencias si faltan datos opcionales
        if (!outlier.views) {
            logger.warn('[OutlierScriptGenerator] outlier.views no disponible');
        }

        if (!outlier.channel_name) {
            logger.warn('[OutlierScriptGenerator] outlier.channel_name no disponible');
        }
    }

    /**
     * Simplificar título del video (primeras 5-6 palabras)
     * @private
     */
    _simplifyTitle(title) {
        if (!title) {
            return 'Un video viral';
        }

        // Remover hashtags y emojis
        const cleanTitle = title.replace(/#\w+/g, '').replace(/[^\w\s]/g, '');

        // Primeras 6 palabras máximo
        const words = cleanTitle.trim().split(/\s+/).slice(0, 6);
        return words.join(' ');
    }

    /**
     * Formatear número con separadores de miles (ej: 1234567 → "1.2 millones")
     * @private
     */
    _formatNumber(num) {
        if (!num) {
            return 'muchas';
        }

        const n = parseInt(num);

        if (n >= 1000000) {
            return `${(n / 1000000).toFixed(1)} millones`;
        } else if (n >= 1000) {
            return `${(n / 1000).toFixed(0)} mil`;
        } else {
            return n.toString();
        }
    }

    /**
     * Unir partes de un segmento en diálogo continuo
     * @private
     */
    _joinScriptParts(segmentParts) {
        return Object.values(segmentParts).join(' ');
    }

    /**
     * Validar duración del diálogo (24-26 palabras óptimo para 8s)
     * @private
     */
    _validateDialogueDuration(dialogue, segmentName) {
        const words = dialogue.trim().split(/\s+/);
        const wordCount = words.length;
        const estimatedDuration = wordCount / 3.43; // Ana/Carlos hablan ~3.43 palabras/segundo

        const minWords = 24;
        const maxWords = 26;
        const idealMin = 24;
        const idealMax = 25;

        const fitsIn8s = wordCount >= minWords && wordCount <= maxWords;
        const isIdeal = wordCount >= idealMin && wordCount <= idealMax;

        if (wordCount < minWords) {
            logger.warn(`[OutlierScriptGenerator] ⚠️ ${segmentName} MUY CORTO:`);
            logger.warn(
                `[OutlierScriptGenerator]    - Palabras: ${wordCount} (mínimo: ${minWords})`
            );
            logger.warn(
                `[OutlierScriptGenerator]    - Duración estimada: ${estimatedDuration.toFixed(1)}s (objetivo: 8s)`
            );
        } else if (wordCount > maxWords) {
            logger.warn(`[OutlierScriptGenerator] ⚠️ ${segmentName} MUY LARGO:`);
            logger.warn(
                `[OutlierScriptGenerator]    - Palabras: ${wordCount} (máximo: ${maxWords})`
            );
            logger.warn(
                `[OutlierScriptGenerator]    - Duración estimada: ${estimatedDuration.toFixed(1)}s (objetivo: 8s)`
            );
        } else if (isIdeal) {
            logger.info(
                `[OutlierScriptGenerator] ✅ ${segmentName}: ${wordCount} palabras (~${estimatedDuration.toFixed(1)}s audio) - IDEAL`
            );
        } else {
            logger.info(
                `[OutlierScriptGenerator] ✅ ${segmentName}: ${wordCount} palabras (~${estimatedDuration.toFixed(1)}s audio) - OK`
            );
        }

        return {
            wordCount,
            estimatedDuration,
            fitsIn8s,
            isIdeal
        };
    }

    /**
     * Calcular validación general del script
     * @private
     */
    _calculateValidation(segmentValidations) {
        const checks = [];
        let score = 100;

        // Check: Todos los segmentos caben en 8s
        segmentValidations.forEach((v, i) => {
            if (!v.fitsIn8s) {
                checks.push({ check: `Segmento ${i + 1} duración`, passed: false });
                score -= 20;
            } else {
                checks.push({ check: `Segmento ${i + 1} duración`, passed: true });
            }
        });

        // Check: Al menos 2 segmentos ideales
        const idealsCount = segmentValidations.filter(v => v.isIdeal).length;
        if (idealsCount >= 2) {
            checks.push({ check: 'Segmentos ideales (≥2)', passed: true });
        } else {
            checks.push({ check: 'Segmentos ideales (≥2)', passed: false });
            score -= 10;
        }

        return {
            score: Math.max(0, score),
            checks,
            cohesive: score >= 70,
            recommendations:
                score < 70
                    ? ['Ajustar longitud de diálogos para 8s', 'Reducir a 24-25 palabras/segmento']
                    : []
        };
    }
}

module.exports = OutlierScriptGenerator;
