/**
 * Presenter Scheduler Service
 *
 * Sistema de asignación automática de presentadores basado en tipología de contenido.
 * Cuando el calendario general tenga un contenido pendiente, este servicio asigna
 * el presentador correcto según las reglas definidas.
 *
 * Features:
 * - Asignación por tipología de contenido (no por días/horarios)
 * - Distribución configurable (ej: 70% Ana / 30% Carlos)
 * - Reglas inteligentes por tipo de contenido
 * - Persistencia en JSON
 * - Tracking de distribución histórica
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Ruta al archivo de configuración del schedule
const ASSIGNMENTS_FILE_PATH = path.join(__dirname, '../../data/presenter-assignments.json');

// Configuración por defecto
const DEFAULT_DISTRIBUTION = {
    ana: 0.7, // 70% Ana
    carlos: 0.3 // 30% Carlos
};

/**
 * REGLAS DE ASIGNACIÓN POR TIPOLOGÍA
 *
 * Cada tipo de contenido tiene asignado un presentador por defecto.
 * Esto garantiza consistencia en la marca y aprovecha las fortalezas de cada presentador.
 */
const CONTENT_TYPE_ASSIGNMENTS = {
    // 🎯 ANA - Contenido de Acción y Engagement (chollos, tips, previews)
    chollos: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Reels de chollos y oportunidades de mercado',
        format: ['reel', 'story']
    },
    bargains: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Análisis de jugadores baratos con alto valor',
        format: ['reel', 'story']
    },
    alineaciones: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Recomendaciones de alineación para la jornada',
        format: ['reel', 'carousel']
    },
    tips: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Tips rápidos y consejos fantasy',
        format: ['story', 'reel']
    },
    match_preview: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Previews de partidos y jornadas',
        format: ['reel']
    },
    player_spotlight: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Spotlight de jugadores individuales',
        format: ['reel', 'story']
    },
    news: {
        presenter: 'ana',
        category: 'engagement',
        description: 'Noticias y actualizaciones de última hora',
        format: ['story']
    },

    // 📊 CARLOS - Contenido Analítico y Datos (stats, analysis, carousels técnicos)
    stats: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Estadísticas y análisis de datos',
        format: ['carousel', 'reel']
    },
    analysis: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Análisis profundo de equipos y tendencias',
        format: ['carousel', 'reel']
    },
    team_analysis: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Análisis detallado por equipo',
        format: ['carousel']
    },
    data_insights: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Insights basados en datos y métricas',
        format: ['carousel']
    },
    weekly_roundup: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Resumen semanal con estadísticas',
        format: ['carousel', 'reel']
    },
    top_performers: {
        presenter: 'carlos',
        category: 'analytical',
        description: 'Top 10 mejores/peores de la jornada',
        format: ['carousel']
    },

    // 🔄 ALTERNANTE - Contenido que puede hacer cualquiera (según distribución)
    daily_insights: {
        presenter: 'auto',
        category: 'flexible',
        description: 'Insights diarios generales',
        format: ['story', 'reel']
    },
    fantasy_tips: {
        presenter: 'auto',
        category: 'flexible',
        description: 'Consejos fantasy generales',
        format: ['story']
    }
};

class PresenterScheduler {
    constructor() {
        this.assignments = CONTENT_TYPE_ASSIGNMENTS;
        this.distribution = DEFAULT_DISTRIBUTION;
        this.history = { ana: 0, carlos: 0 }; // Tracking histórico de asignaciones
        this.loadHistory();
    }

    /**
     * Cargar historial de asignaciones desde archivo JSON
     */
    loadHistory() {
        try {
            if (fs.existsSync(ASSIGNMENTS_FILE_PATH)) {
                const data = fs.readFileSync(ASSIGNMENTS_FILE_PATH, 'utf8');
                const parsed = JSON.parse(data);
                this.history = parsed.history || { ana: 0, carlos: 0 };
                if (parsed.distribution) {
                    this.distribution = parsed.distribution;
                }
                logger.info('[PresenterScheduler] ✅ Historial cargado desde archivo');
            } else {
                logger.info('[PresenterScheduler] ℹ️  No existe historial, iniciando tracking...');
                this.saveHistory();
            }
        } catch (error) {
            logger.error('[PresenterScheduler] ❌ Error cargando historial:', error);
            this.history = { ana: 0, carlos: 0 };
        }
    }

    /**
     * Guardar historial de asignaciones en archivo JSON
     */
    saveHistory() {
        try {
            const data = {
                version: '2.0',
                updated_at: new Date().toISOString(),
                distribution: this.distribution,
                history: this.history,
                assignments: this.assignments,
                metadata: {
                    total_assignments: this.history.ana + this.history.carlos,
                    presenters: ['ana', 'carlos'],
                    content_types: Object.keys(this.assignments).length
                }
            };

            // Crear directorio data/ si no existe
            const dataDir = path.dirname(ASSIGNMENTS_FILE_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(ASSIGNMENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
            logger.info('[PresenterScheduler] ✅ Historial guardado en archivo');
        } catch (error) {
            logger.error('[PresenterScheduler] ❌ Error guardando historial:', error);
            throw error;
        }
    }

    /**
     * 🎯 MÉTODO PRINCIPAL: Asignar presentador basado en tipo de contenido
     *
     * Este es el método que el calendario general debe llamar cuando tenga un contenido pendiente.
     *
     * @param {string} contentType - Tipo de contenido (chollos, stats, tips, etc.)
     * @param {object} options - Opciones adicionales { format, topic, forcePresenter }
     * @returns {object} - { presenter, contentType, assignment_rule, tracked }
     */
    assignPresenter(contentType, options = {}) {
        try {
            logger.info(`[PresenterScheduler] 🎯 Asignando presentador para: ${contentType}`);

            // Normalizar contentType (lowercase, sin espacios)
            const normalizedType = contentType.toLowerCase().replace(/\s+/g, '_');

            // 1. Buscar regla de asignación para este tipo de contenido
            let assignment = this.assignments[normalizedType];

            if (!assignment) {
                logger.warn(
                    `[PresenterScheduler] ⚠️  Tipo de contenido no encontrado: ${normalizedType}. Usando auto-assignment.`
                );
                // Tipo no reconocido -> asignar automáticamente según distribución
                assignment = {
                    presenter: 'auto',
                    category: 'unknown',
                    description: `Contenido no categorizado: ${contentType}`
                };
            }

            // 2. Determinar presentador
            let assignedPresenter;

            if (options.forcePresenter) {
                // Override manual (para casos especiales)
                assignedPresenter = options.forcePresenter;
                logger.info(`[PresenterScheduler] 🔧 Presentador forzado: ${assignedPresenter}`);
            } else if (assignment.presenter === 'auto') {
                // Asignación automática según distribución actual
                assignedPresenter = this.getBalancedPresenter();
                logger.info(`[PresenterScheduler] 🔄 Asignación automática: ${assignedPresenter}`);
            } else {
                // Asignación fija según reglas
                assignedPresenter = assignment.presenter;
                logger.info(`[PresenterScheduler] ✅ Asignación por regla: ${assignedPresenter}`);
            }

            // 3. Registrar en historial
            this.history[assignedPresenter]++;
            this.saveHistory();

            const result = {
                presenter: assignedPresenter,
                contentType: normalizedType,
                category: assignment.category,
                description: assignment.description || '',
                assignment_rule: assignment.presenter, // 'ana', 'carlos', o 'auto'
                tracked: true,
                history: this.history
            };

            logger.info(
                `[PresenterScheduler] 📊 Asignado: ${assignedPresenter} | Historial: Ana ${this.history.ana} / Carlos ${this.history.carlos}`
            );

            return result;
        } catch (error) {
            logger.error('[PresenterScheduler] ❌ Error asignando presentador:', error);
            throw error;
        }
    }

    /**
     * Obtener presentador balanceado según distribución objetivo
     * Usado para tipos de contenido con presenter: 'auto'
     */
    getBalancedPresenter() {
        const totalAssignments = this.history.ana + this.history.carlos;

        // Si no hay historial, empezar con Ana
        if (totalAssignments === 0) {
            return 'ana';
        }

        // Calcular ratio actual
        const currentAnaRatio = this.history.ana / totalAssignments;
        const targetAnaRatio = this.distribution.ana;

        // Si Ana está por debajo de su objetivo, asignar Ana
        if (currentAnaRatio < targetAnaRatio) {
            return 'ana';
        }

        return 'carlos';
    }

    /**
     * Obtener todas las reglas de asignación
     */
    getAssignmentRules() {
        return {
            rules: this.assignments,
            distribution: this.distribution,
            history: this.history,
            stats: this.calculateDistributionStats()
        };
    }

    /**
     * Obtener asignaciones agrupadas por categoría
     */
    getAssignmentsByCategory() {
        const byCategory = {
            engagement: [], // Ana
            analytical: [], // Carlos
            flexible: [] // Auto
        };

        Object.entries(this.assignments).forEach(([type, assignment]) => {
            const category = assignment.category || 'flexible';
            byCategory[category].push({
                contentType: type,
                presenter: assignment.presenter,
                description: assignment.description,
                format: assignment.format
            });
        });

        return byCategory;
    }

    /**
     * Obtener asignaciones agrupadas por presentador
     */
    getAssignmentsByPresenter() {
        const byPresenter = {
            ana: [],
            carlos: [],
            auto: []
        };

        Object.entries(this.assignments).forEach(([type, assignment]) => {
            const presenter = assignment.presenter || 'auto';
            byPresenter[presenter].push({
                contentType: type,
                category: assignment.category,
                description: assignment.description,
                format: assignment.format
            });
        });

        return byPresenter;
    }

    /**
     * Actualizar regla de asignación de un tipo de contenido
     */
    updateAssignment(contentType, newPresenter, options = {}) {
        try {
            const normalizedType = contentType.toLowerCase().replace(/\s+/g, '_');

            if (!this.assignments[normalizedType]) {
                throw new Error(`Tipo de contenido no encontrado: ${normalizedType}`);
            }

            if (!['ana', 'carlos', 'auto'].includes(newPresenter)) {
                throw new Error(
                    `Presentador inválido: ${newPresenter}. Debe ser 'ana', 'carlos' o 'auto'`
                );
            }

            // Actualizar presentador
            this.assignments[normalizedType].presenter = newPresenter;

            // Actualizar descripción si se proporciona
            if (options.description) {
                this.assignments[normalizedType].description = options.description;
            }

            this.saveHistory();

            logger.info(
                `[PresenterScheduler] ✅ Actualizada regla: ${normalizedType} → ${newPresenter}`
            );

            return {
                success: true,
                contentType: normalizedType,
                newPresenter,
                assignment: this.assignments[normalizedType]
            };
        } catch (error) {
            logger.error('[PresenterScheduler] ❌ Error actualizando asignación:', error);
            throw error;
        }
    }

    /**
     * Calcular estadísticas de distribución histórica
     */
    calculateDistributionStats() {
        const totalAssignments = this.history.ana + this.history.carlos;

        if (totalAssignments === 0) {
            return {
                total_assignments: 0,
                by_presenter: { ana: 0, carlos: 0 },
                percentages: { ana: '0%', carlos: '0%' },
                vs_target: { ana: '0%', carlos: '0%' },
                status: 'No data'
            };
        }

        const anaPercentage = (this.history.ana / totalAssignments) * 100;
        const carlosPercentage = (this.history.carlos / totalAssignments) * 100;

        const targetAnaPercentage = this.distribution.ana * 100;
        const targetCarlosPercentage = this.distribution.carlos * 100;

        const anaDiff = anaPercentage - targetAnaPercentage;
        const carlosDiff = carlosPercentage - targetCarlosPercentage;

        return {
            total_assignments: totalAssignments,
            by_presenter: { ...this.history },
            percentages: {
                ana: `${anaPercentage.toFixed(1)}%`,
                carlos: `${carlosPercentage.toFixed(1)}%`
            },
            target: {
                ana: `${targetAnaPercentage.toFixed(1)}%`,
                carlos: `${targetCarlosPercentage.toFixed(1)}%`
            },
            vs_target: {
                ana: `${(anaDiff >= 0 ? '+' : '') + anaDiff.toFixed(1)}%`,
                carlos: `${(carlosDiff >= 0 ? '+' : '') + carlosDiff.toFixed(1)}%`
            },
            status:
                Math.abs(anaDiff) <= 5
                    ? 'Balanced ✅'
                    : anaDiff > 0
                      ? 'Ana over-represented ⚠️'
                      : 'Carlos over-represented ⚠️'
        };
    }

    /**
     * Obtener resumen completo del sistema
     */
    getSummary() {
        return {
            distribution_target: this.distribution,
            history: this.history,
            stats: this.calculateDistributionStats(),
            assignments_by_category: this.getAssignmentsByCategory(),
            assignments_by_presenter: this.getAssignmentsByPresenter(),
            total_content_types: Object.keys(this.assignments).length
        };
    }

    /**
     * Resetear historial de asignaciones (útil para nueva temporada)
     */
    resetHistory() {
        this.history = { ana: 0, carlos: 0 };
        this.saveHistory();
        logger.info('[PresenterScheduler] 🔄 Historial reseteado');

        return {
            success: true,
            message: 'Historial reseteado correctamente',
            history: this.history
        };
    }

    /**
     * Actualizar distribución objetivo
     */
    updateDistribution(newDistribution) {
        try {
            // Validar que la suma sea 1.0
            const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);

            if (Math.abs(total - 1.0) > 0.01) {
                throw new Error(`La suma de distribuciones debe ser 1.0 (actual: ${total})`);
            }

            this.distribution = newDistribution;
            this.saveHistory();

            logger.info(
                `[PresenterScheduler] ✅ Distribución actualizada: Ana ${(newDistribution.ana * 100).toFixed(0)}% / Carlos ${(newDistribution.carlos * 100).toFixed(0)}%`
            );

            return {
                success: true,
                distribution: this.distribution,
                stats: this.calculateDistributionStats()
            };
        } catch (error) {
            logger.error('[PresenterScheduler] ❌ Error actualizando distribución:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new PresenterScheduler();
