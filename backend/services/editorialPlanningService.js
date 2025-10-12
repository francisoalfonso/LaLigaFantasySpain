/**
 * Editorial Planning Service
 *
 * Sistema integrado de planificación editorial que combina:
 * 1. Planificación manual de contenidos
 * 2. Activadores automáticos desde competitive intelligence
 * 3. Asignación automática de presentadores
 * 4. Tracking de estado y progreso
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const presenterScheduler = require('./presenterScheduler');
const CompetitiveIntelligenceAgent = require('./competitiveIntelligenceAgent');

const PLANNING_FILE_PATH = path.join(__dirname, '../../data/editorial-planning.json');

class EditorialPlanningService {
    constructor() {
        this.planning = {
            scheduled: [], // Contenidos planificados manualmente
            triggers: [], // Activadores desde competencia
            in_production: [], // Contenidos en producción
            published: [] // Contenidos publicados
        };

        this.competitiveAgent = null; // Se inicializa bajo demanda
        this.loadPlanning();
    }

    /**
     * Cargar planning desde archivo JSON
     */
    loadPlanning() {
        try {
            if (fs.existsSync(PLANNING_FILE_PATH)) {
                const data = fs.readFileSync(PLANNING_FILE_PATH, 'utf8');
                const parsed = JSON.parse(data);
                this.planning = parsed.planning || {
                    scheduled: [],
                    triggers: [],
                    in_production: [],
                    published: []
                };
                logger.info('[EditorialPlanning] ✅ Planning cargado desde archivo');
            } else {
                logger.info('[EditorialPlanning] ℹ️  No existe planning, iniciando nuevo...');
                this.savePlanning();
            }
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error cargando planning:', error);
            this.planning = { scheduled: [], triggers: [], in_production: [], published: [] };
        }
    }

    /**
     * Guardar planning en archivo JSON
     */
    savePlanning() {
        try {
            const data = {
                version: '1.0',
                updated_at: new Date().toISOString(),
                planning: this.planning,
                metadata: {
                    total_scheduled: this.planning.scheduled.length,
                    total_triggers: this.planning.triggers.length,
                    total_in_production: this.planning.in_production.length,
                    total_published: this.planning.published.length
                }
            };

            const dataDir = path.dirname(PLANNING_FILE_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(PLANNING_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
            logger.info('[EditorialPlanning] ✅ Planning guardado en archivo');
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error guardando planning:', error);
            throw error;
        }
    }

    /**
     * 🎯 AÑADIR CONTENIDO MANUAL AL PLANNING
     *
     * El usuario planifica manualmente un contenido.
     * El sistema asigna automáticamente el presentador según la tipología.
     *
     * @param {object} content - { contentType, topic, platform, scheduledDate, priority }
     * @returns {object} - Contenido planificado con presentador asignado
     */
    async scheduleContent(content) {
        try {
            const { contentType, topic, platform, scheduledDate, priority = 'normal' } = content;

            if (!contentType || !topic) {
                throw new Error('Se requieren contentType y topic');
            }

            logger.info(
                `[EditorialPlanning] 📅 Planificando contenido: ${contentType} - "${topic}"`
            );

            // 1. Asignar presentador automáticamente
            const assignment = presenterScheduler.assignPresenter(contentType, { topic });

            // 2. Crear item de planning
            const planningItem = {
                id: this.generateItemId(),
                source: 'manual',
                contentType,
                topic,
                platform: platform || 'instagram',
                presenter: assignment.presenter,
                assignment_category: assignment.category,
                scheduledDate: scheduledDate || this.suggestNextAvailableSlot(),
                priority,
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 3. Añadir a planning
            this.planning.scheduled.push(planningItem);
            this.savePlanning();

            logger.info(
                `[EditorialPlanning] ✅ Contenido planificado: ${planningItem.id} | ${assignment.presenter} | ${scheduledDate}`
            );

            return {
                success: true,
                item: planningItem,
                message: `Contenido planificado para ${assignment.presenter}`
            };
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error planificando contenido:', error);
            throw error;
        }
    }

    /**
     * 🚨 ACTIVAR TRIGGER DESDE COMPETENCIA
     *
     * El competitive intelligence agent detectó contenido viral.
     * Este método lo convierte en un trigger de contenido reactivo.
     *
     * @param {object} trigger - Trigger desde competitive intelligence
     * @returns {object} - Trigger añadido al planning
     */
    async activateTrigger(trigger) {
        try {
            logger.info(
                `[EditorialPlanning] 🚨 Activando trigger: ${trigger.type} | ${trigger.priority}`
            );

            // 1. Determinar tipo de contenido desde el trigger
            const contentType = this.mapTriggerToContentType(trigger);

            // 2. Asignar presentador
            const assignment = presenterScheduler.assignPresenter(contentType, {
                topic: trigger.suggested_response || trigger.topic?.name
            });

            // 3. Crear item de trigger
            const triggerItem = {
                id: this.generateItemId(),
                source: 'trigger_competitive',
                trigger_type: trigger.type,
                contentType,
                topic: trigger.suggested_response || trigger.topic?.name || 'Respuesta viral',
                platform: trigger.platform || 'instagram',
                presenter: assignment.presenter,
                assignment_category: assignment.category,
                priority: trigger.priority,
                deadline: trigger.deadline || this.calculateUrgentDeadline(),
                viralScore: trigger.trigger_content?.viralScore || 0,
                status: 'trigger_pending',
                original_trigger: trigger,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 4. Añadir a triggers
            this.planning.triggers.push(triggerItem);
            this.savePlanning();

            logger.info(
                `[EditorialPlanning] ✅ Trigger activado: ${triggerItem.id} | ${assignment.presenter} | Deadline: ${trigger.deadline}`
            );

            return {
                success: true,
                trigger: triggerItem,
                message: `Trigger activado para ${assignment.presenter}`
            };
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error activando trigger:', error);
            throw error;
        }
    }

    /**
     * 📊 OBTENER PLANNING COMPLETO
     *
     * Dashboard integrado con todo el contenido:
     * - Scheduled (planificado manualmente)
     * - Triggers (activadores competencia)
     * - In Production (en producción)
     * - Published (publicado)
     */
    getFullPlanning() {
        return {
            planning: this.planning,
            stats: {
                scheduled: this.planning.scheduled.length,
                triggers: this.planning.triggers.length,
                in_production: this.planning.in_production.length,
                published: this.planning.published.length,
                total:
                    this.planning.scheduled.length +
                    this.planning.triggers.length +
                    this.planning.in_production.length
            },
            presenter_distribution: this.getPresenterDistribution(),
            upcoming_deadlines: this.getUpcomingDeadlines()
        };
    }

    /**
     * Obtener distribución de presentadores en el planning
     */
    getPresenterDistribution() {
        const allContent = [
            ...this.planning.scheduled,
            ...this.planning.triggers,
            ...this.planning.in_production
        ];

        const distribution = { ana: 0, carlos: 0, total: allContent.length };

        allContent.forEach(item => {
            if (item.presenter === 'ana') {
                distribution.ana++;
            }
            if (item.presenter === 'carlos') {
                distribution.carlos++;
            }
        });

        return {
            ...distribution,
            ana_percentage:
                allContent.length > 0
                    ? `${((distribution.ana / allContent.length) * 100).toFixed(1)}%`
                    : '0%',
            carlos_percentage:
                allContent.length > 0
                    ? `${((distribution.carlos / allContent.length) * 100).toFixed(1)}%`
                    : '0%'
        };
    }

    /**
     * Obtener próximos deadlines urgentes
     */
    getUpcomingDeadlines() {
        const allContent = [
            ...this.planning.scheduled,
            ...this.planning.triggers,
            ...this.planning.in_production
        ];

        return allContent
            .filter(item => item.deadline || item.scheduledDate)
            .map(item => ({
                id: item.id,
                topic: item.topic,
                presenter: item.presenter,
                deadline: item.deadline || item.scheduledDate,
                priority: item.priority,
                source: item.source
            }))
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 10);
    }

    /**
     * Mover contenido de scheduled → in_production
     */
    async moveToProduction(itemId) {
        try {
            const index = this.planning.scheduled.findIndex(item => item.id === itemId);

            if (index === -1) {
                // Buscar en triggers
                const triggerIndex = this.planning.triggers.findIndex(item => item.id === itemId);
                if (triggerIndex === -1) {
                    throw new Error(`Item ${itemId} no encontrado`);
                }

                const item = this.planning.triggers.splice(triggerIndex, 1)[0];
                item.status = 'in_production';
                item.updatedAt = new Date().toISOString();
                this.planning.in_production.push(item);
            } else {
                const item = this.planning.scheduled.splice(index, 1)[0];
                item.status = 'in_production';
                item.updatedAt = new Date().toISOString();
                this.planning.in_production.push(item);
            }

            this.savePlanning();

            logger.info(`[EditorialPlanning] ✅ Item ${itemId} movido a producción`);

            return { success: true, message: 'Item movido a producción' };
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error moviendo a producción:', error);
            throw error;
        }
    }

    /**
     * Mover contenido de in_production → published
     */
    async markAsPublished(itemId, publishData = {}) {
        try {
            const index = this.planning.in_production.findIndex(item => item.id === itemId);

            if (index === -1) {
                throw new Error(`Item ${itemId} no encontrado en producción`);
            }

            const item = this.planning.in_production.splice(index, 1)[0];
            item.status = 'published';
            item.publishedAt = publishData.publishedAt || new Date().toISOString();
            item.publishData = publishData;
            item.updatedAt = new Date().toISOString();

            this.planning.published.push(item);
            this.savePlanning();

            logger.info(`[EditorialPlanning] ✅ Item ${itemId} marcado como publicado`);

            return { success: true, message: 'Item marcado como publicado' };
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error marcando como publicado:', error);
            throw error;
        }
    }

    /**
     * Eliminar item del planning
     */
    async deleteItem(itemId) {
        try {
            const collections = ['scheduled', 'triggers', 'in_production'];

            for (const collection of collections) {
                const index = this.planning[collection].findIndex(item => item.id === itemId);
                if (index !== -1) {
                    this.planning[collection].splice(index, 1);
                    this.savePlanning();
                    logger.info(`[EditorialPlanning] ✅ Item ${itemId} eliminado de ${collection}`);
                    return { success: true, message: `Item eliminado de ${collection}` };
                }
            }

            throw new Error(`Item ${itemId} no encontrado`);
        } catch (error) {
            logger.error('[EditorialPlanning] ❌ Error eliminando item:', error);
            throw error;
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Mapear trigger de competencia a tipo de contenido
     */
    mapTriggerToContentType(trigger) {
        const triggerTypeMap = {
            viral_response: 'tips',
            trending_topic: 'analysis',
            gol_espectacular: 'player_spotlight',
            polémica_arbitral: 'analysis',
            fichaje_rumor: 'news',
            lesión_estrella: 'news',
            récord_estadístico: 'stats'
        };

        return triggerTypeMap[trigger.type] || 'daily_insights';
    }

    /**
     * Generar ID único para items
     */
    generateItemId() {
        return `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Sugerir próximo slot disponible
     */
    suggestNextAvailableSlot() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        return tomorrow.toISOString();
    }

    /**
     * Calcular deadline urgente para triggers
     */
    calculateUrgentDeadline() {
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 3); // 3 horas para contenido viral
        return deadline.toISOString();
    }

    /**
     * Iniciar monitoreo de competencia (opcional)
     */
    async startCompetitiveMonitoring() {
        if (!this.competitiveAgent) {
            this.competitiveAgent = new CompetitiveIntelligenceAgent();
        }

        await this.competitiveAgent.startMonitoring();

        logger.info('[EditorialPlanning] 🔍 Monitoreo de competencia iniciado');

        return {
            success: true,
            message: 'Monitoreo de competencia iniciado'
        };
    }

    /**
     * Parar monitoreo de competencia
     */
    stopCompetitiveMonitoring() {
        if (this.competitiveAgent) {
            this.competitiveAgent.stopMonitoring();
        }

        logger.info('[EditorialPlanning] ⏹️ Monitoreo de competencia detenido');

        return {
            success: true,
            message: 'Monitoreo de competencia detenido'
        };
    }
}

// Export singleton instance
module.exports = new EditorialPlanningService();
