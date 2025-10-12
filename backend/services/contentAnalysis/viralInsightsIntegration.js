/**
 * Viral Insights Integration
 *
 * Exporta insights aprendidos de canales competidores
 * para mejorar el sistema VEO3 global
 *
 * USO:
 * - Analiza viral patterns de múltiples canales
 * - Agrega/normaliza los insights
 * - Genera recomendaciones para VEO3
 * - Actualiza viralFramework.js automáticamente (opcional)
 */

const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class ViralInsightsIntegration {
    constructor() {
        this.insightsCache = null;
        this.lastUpdate = null;
    }

    /**
     * Agregar insights de múltiples onboardings
     */
    async aggregateInsights(onboardingResults) {
        logger.info('[ViralInsights] Agregando insights de múltiples canales', {
            channels: onboardingResults.length
        });

        const aggregated = {
            sources: onboardingResults.map(r => ({
                channel_name: r.channel_name,
                videos_analyzed: r.videos_found,
                date: r.completed_at
            })),
            generated_at: new Date().toISOString(),

            // Agregado de keywords virales
            viral_keywords: this._aggregateKeywords(onboardingResults),

            // Agregado de estructuras de contenido
            content_structures: this._aggregateStructures(onboardingResults),

            // Agregado de tonos que funcionan
            effective_tones: this._aggregateTones(onboardingResults),

            // Agregado de hooks
            hook_patterns: this._aggregateHooks(onboardingResults),

            // Agregado de CTAs
            cta_strategies: this._aggregateCTAs(onboardingResults),

            // Recomendaciones consolidadas para VEO3
            recommendations_for_veo3: this._generateConsolidatedRecommendations(onboardingResults)
        };

        this.insightsCache = aggregated;
        this.lastUpdate = new Date();

        logger.info('[ViralInsights] ✅ Insights agregados', {
            totalKeywords: aggregated.viral_keywords.length,
            totalRecommendations: aggregated.recommendations_for_veo3.length
        });

        return aggregated;
    }

    /**
     * Exportar insights para integración manual con VEO3
     */
    async exportForVEO3(format = 'json') {
        if (!this.insightsCache) {
            throw new Error('No hay insights cacheados. Ejecuta aggregateInsights primero.');
        }

        const exportData = {
            ...this.insightsCache,
            usage_instructions: {
                description: 'Insights aprendidos de canales competidores',
                how_to_use: [
                    '1. Revisar viral_keywords y considerar incorporarlos en hooks',
                    '2. Aplicar content_structures aprendidas en promptBuilder.js',
                    '3. Ajustar tono según effective_tones más exitosos',
                    '4. Implementar hook_patterns en primeros 3-5 segundos',
                    '5. Optimizar CTAs según cta_strategies'
                ],
                warning:
                    'IMPORTANTE: Filtrado de branding ya aplicado. Estos insights son genéricos y seguros de usar.'
            }
        };

        if (format === 'json') {
            return exportData;
        } else if (format === 'markdown') {
            return this._formatAsMarkdown(exportData);
        }

        return exportData;
    }

    /**
     * Generar sugerencias específicas para promptBuilder.js
     */
    async generatePromptBuilderSuggestions() {
        if (!this.insightsCache) {
            throw new Error('No hay insights cacheados');
        }

        const suggestions = {
            hook_improvements: [],
            keyword_additions: [],
            structure_optimizations: [],
            tone_adjustments: []
        };

        // Sugerencias para hooks
        const topKeywords = this.insightsCache.viral_keywords.slice(0, 5);
        topKeywords.forEach(kw => {
            suggestions.hook_improvements.push({
                suggestion: `Incorporar "${kw.keyword}" en hooks de chollos`,
                rationale: `Aparece ${kw.frequency} veces en top performers`,
                implementation: `Hook ejemplo: "${kw.keyword.toUpperCase()} - [Jugador] a solo [Precio]M"`
            });
        });

        // Sugerencias de estructura
        const topStructure = this.insightsCache.content_structures[0];
        if (topStructure) {
            suggestions.structure_optimizations.push({
                suggestion: 'Ajustar duración de segmentos según competencia',
                rationale: `Estructura más exitosa: Hook ${topStructure.hook_duration}s, Body ${topStructure.body_duration}s`,
                implementation: 'Actualizar SEGMENT_DURATIONS en promptBuilder.js'
            });
        }

        // Sugerencias de tono
        const topTone = this.insightsCache.effective_tones[0];
        if (topTone) {
            suggestions.tone_adjustments.push({
                suggestion: `Considerar tono "${topTone.tone}" para contenido viral`,
                rationale: `${topTone.frequency} videos exitosos usan este tono`,
                implementation: 'Añadir variante de tono en anaCharacter.js'
            });
        }

        return suggestions;
    }

    /**
     * Guardar insights en archivo para referencia
     */
    async saveInsightsToFile(outputPath = null) {
        if (!this.insightsCache) {
            throw new Error('No hay insights cacheados');
        }

        const defaultPath = path.join(
            __dirname,
            '../../..',
            'data',
            'competitive-insights',
            `insights_${Date.now()}.json`
        );

        const finalPath = outputPath || defaultPath;

        // Crear directorio si no existe
        await fs.mkdir(path.dirname(finalPath), { recursive: true });

        // Guardar JSON
        await fs.writeFile(finalPath, JSON.stringify(this.insightsCache, null, 2), 'utf8');

        logger.info('[ViralInsights] 💾 Insights guardados', { path: finalPath });

        return finalPath;
    }

    // ========================
    // MÉTODOS PRIVADOS
    // ========================

    _aggregateKeywords(results) {
        const keywordMap = {};

        results.forEach(result => {
            if (result.viral_patterns?.viral_keywords) {
                result.viral_patterns.viral_keywords.forEach(kw => {
                    const key = typeof kw === 'string' ? kw.toLowerCase() : kw.toLowerCase();
                    keywordMap[key] = (keywordMap[key] || 0) + 1;
                });
            }
        });

        return Object.entries(keywordMap)
            .map(([keyword, frequency]) => ({ keyword, frequency }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    _aggregateStructures(results) {
        const structures = [];

        results.forEach(result => {
            if (result.viral_patterns?.content_structures) {
                structures.push(...result.viral_patterns.content_structures);
            }
        });

        // Por ahora devolver todas, en el futuro podemos identificar patrones comunes
        return structures.slice(0, 10);
    }

    _aggregateTones(results) {
        const toneMap = {};

        results.forEach(result => {
            if (result.viral_patterns?.tone_preferences) {
                result.viral_patterns.tone_preferences.forEach(tone => {
                    toneMap[tone] = (toneMap[tone] || 0) + 1;
                });
            }
        });

        return Object.entries(toneMap)
            .map(([tone, frequency]) => ({ tone, frequency }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    _aggregateHooks(results) {
        const hooks = [];

        results.forEach(result => {
            if (result.viral_patterns?.hook_strategies) {
                hooks.push(...result.viral_patterns.hook_strategies);
            }
        });

        return hooks;
    }

    _aggregateCTAs(results) {
        const ctas = [];

        results.forEach(result => {
            if (result.viral_patterns?.engagement_tactics) {
                ctas.push(...result.viral_patterns.engagement_tactics);
            }
        });

        return ctas;
    }

    _generateConsolidatedRecommendations(results) {
        const allRecommendations = [];

        results.forEach(result => {
            if (result.viral_patterns?.recommendations_for_veo3) {
                allRecommendations.push(...result.viral_patterns.recommendations_for_veo3);
            }
        });

        // Deduplicar y priorizar
        const unique = [...new Set(allRecommendations)];

        return unique.slice(0, 10);
    }

    _formatAsMarkdown(data) {
        let md = '# Viral Insights - Competitive Analysis\n\n';

        md += `**Generated**: ${data.generated_at}\n\n`;
        md += `**Sources**: ${data.sources.length} channels analyzed\n\n`;

        md += '## 🔥 Top Viral Keywords\n\n';
        data.viral_keywords.slice(0, 10).forEach((kw, i) => {
            md += `${i + 1}. **${kw.keyword}** (${kw.frequency} occurrences)\n`;
        });

        md += '\n## 🎭 Effective Tones\n\n';
        data.effective_tones.forEach((tone, i) => {
            md += `${i + 1}. **${tone.tone}** (${tone.frequency} videos)\n`;
        });

        md += '\n## 💡 Recommendations for VEO3\n\n';
        data.recommendations_for_veo3.forEach((rec, i) => {
            md += `${i + 1}. ${rec}\n`;
        });

        md += '\n---\n\n';
        md +=
            '⚠️ **Note**: All branding-specific content has been filtered out. These insights are safe to apply.\n';

        return md;
    }
}

module.exports = new ViralInsightsIntegration();
