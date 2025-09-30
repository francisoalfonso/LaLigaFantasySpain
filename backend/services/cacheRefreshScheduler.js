const logger = require('../utils/logger');

// Planificador Inteligente de Actualización de Caché para Chollos Fantasy

class CacheRefreshScheduler {
  constructor(bargainAnalyzer) {
    this.bargainAnalyzer = bargainAnalyzer;
    this.isRefreshing = false;

    // Configuración de frecuencias (en minutos)
    this.schedules = {
      // Durante jornada de La Liga (viernes 20:00 - lunes 23:59)
      MATCHDAY_ACTIVE: 120,      // 2 horas

      // Entre jornadas (martes - jueves)
      BETWEEN_MATCHDAYS: 720,    // 12 horas

      // Temporada baja / descansos
      LOW_SEASON: 1440,          // 24 horas

      // Actualización nocturna automática
      NIGHTLY_REFRESH: 360       // 6 horas (durante madrugada)
    };

    logger.info('📅 CacheRefreshScheduler inicializado - Gestión automática de actualización');
  }

  // Determinar el contexto actual de La Liga
  getCurrentContext() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, etc.
    const hour = now.getHours();

    // Jornada activa: Viernes 20:00 - Lunes 23:59
    if (
      (dayOfWeek === 5 && hour >= 20) || // Viernes desde 20:00
      dayOfWeek === 6 ||                  // Todo el sábado
      dayOfWeek === 0 ||                  // Todo el domingo
      (dayOfWeek === 1 && hour < 24)     // Lunes hasta 23:59
    ) {
      return 'MATCHDAY_ACTIVE';
    }

    // Horario nocturno (02:00 - 06:00) - Actualización silenciosa
    if (hour >= 2 && hour <= 6) {
      return 'NIGHTLY_REFRESH';
    }

    // Entre jornadas (martes - viernes 19:59)
    return 'BETWEEN_MATCHDAYS';
  }

  // Obtener frecuencia recomendada según contexto
  getRefreshInterval() {
    const context = this.getCurrentContext();
    const interval = this.schedules[context];

    logger.info(`⏰ Contexto actual: ${context} - Próxima actualización en ${interval} minutos`);
    return interval;
  }

  // Iniciar actualización automática
  startAutoRefresh() {
    // Cancelar intervalos previos
    this.stopAutoRefresh();

    const scheduleNext = () => {
      const intervalMinutes = this.getRefreshInterval();
      const intervalMs = intervalMinutes * 60 * 1000;

      this.refreshTimer = setTimeout(async () => {
        await this.performRefresh();
        scheduleNext(); // Reprogramar según nuevo contexto
      }, intervalMs);

      const nextUpdate = new Date(Date.now() + intervalMs);
      logger.info(`⏲️  Próxima actualización automática: ${nextUpdate.toLocaleString('es-ES')}`);
    };

    scheduleNext();
    logger.info('🔄 Actualización automática de caché iniciada');
  }

  // Detener actualización automática
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('⏹️ Actualización automática detenida');
    }
  }

  // Realizar actualización de caché
  async performRefresh() {
    if (this.isRefreshing) {
      logger.info('⚠️ Actualización ya en progreso, omitiendo...');
      return;
    }

    try {
      this.isRefreshing = true;
      const context = this.getCurrentContext();

      logger.info(`🔄 Iniciando actualización automática de caché (contexto: ${context})...`);

      // Limpiar caché actual para forzar actualización
      this.bargainAnalyzer.cache.clear();

      // Precalentar con consultas comunes
      await this.warmupCache();

      logger.info('✅ Actualización automática completada');

    } catch (error) {
      logger.error('❌ Error en actualización automática:', error.message);
    } finally {
      this.isRefreshing = false;
    }
  }

  // Precalentar caché con consultas frecuentes
  async warmupCache() {
    logger.info('🔥 Precalentando caché con consultas comunes...');

    const commonQueries = [
      { limit: 20 },                    // Query por defecto frontend
      { limit: 10, position: 'FWD' },  // Delanteros
      { limit: 10, position: 'MID' },  // Centrocampistas
      { limit: 10, position: 'DEF' },  // Defensas
      { limit: 5, position: 'GK' },    // Porteros
      { limit: 15, maxPrice: 8.0 },    // Chollos baratos
    ];

    for (const query of commonQueries) {
      try {
        await this.bargainAnalyzer.identifyBargains(query.limit || 20, query);
        logger.info(`💾 Precargado: ${JSON.stringify(query)}`);

        // Rate limiting para no saturar API
        await this.sleep(1000);

      } catch (error) {
        logger.info(`⚠️ Error precargando ${JSON.stringify(query)}:`, error.message);
      }
    }

    logger.info('🔥 Precalentamiento completado');
  }

  // Actualización manual forzada
  async forceRefresh() {
    logger.info('🚀 Actualización manual forzada iniciada...');
    await this.performRefresh();
  }

  // Obtener estadísticas del scheduler
  getStats() {
    const context = this.getCurrentContext();
    const nextInterval = this.getRefreshInterval();

    return {
      isActive: !!this.refreshTimer,
      isRefreshing: this.isRefreshing,
      currentContext: context,
      nextRefreshInMinutes: nextInterval,
      nextRefreshTime: this.refreshTimer ?
        new Date(Date.now() + nextInterval * 60 * 1000).toISOString() : null
    };
  }

  // Utilidad para pausas
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configurar horarios personalizados (para testing)
  setCustomSchedule(schedules) {
    this.schedules = { ...this.schedules, ...schedules };
    logger.info('⚙️ Horarios personalizados configurados:', schedules);
  }
}

module.exports = CacheRefreshScheduler;