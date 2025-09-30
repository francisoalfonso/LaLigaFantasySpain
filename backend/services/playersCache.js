const logger = require('../utils/logger');

// Sistema de Caché para Jugadores de La Liga
// Optimizado para cargas masivas de datos de jugadores

class PlayersCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 60 * 60 * 1000; // 1 hora en milisegundos (más tiempo que chollos)
    this.maxSize = 50; // Menos entradas pero más grandes

    // Cache específico para lista completa de jugadores
    this.playersListCache = null;
    this.playersListTimestamp = null;
    this.PLAYERS_LIST_TTL = 120 * 60 * 1000; // 2 horas para lista completa

    // Limpieza automática cada 30 minutos
    setInterval(() => this.cleanup(), 30 * 60 * 1000);

    logger.info('⚽ PlayersCache inicializado - TTL: 1h, Players List TTL: 2h');
  }

  // Generar clave para filtros de jugadores
  generateCacheKey(filters = {}) {
    const { position, team, status, search, sortBy } = filters;
    return `players_filter_${position || 'all'}_${team || 'all'}_${status || 'all'}_${(search || '').toLowerCase()}_${sortBy || 'name'}`;
  }

  // Cache específico para lista completa de jugadores
  getAllPlayersList() {
    if (!this.playersListCache || !this.playersListTimestamp) {
      logger.info('🔍 Players List Cache MISS: No data');
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - this.playersListTimestamp > this.PLAYERS_LIST_TTL) {
      logger.info(`⏰ Players List Cache EXPIRED (${Math.round((Date.now() - this.playersListTimestamp) / 1000 / 60)}min ago)`);
      this.playersListCache = null;
      this.playersListTimestamp = null;
      return null;
    }

    const ageMinutes = Math.round((Date.now() - this.playersListTimestamp) / 1000 / 60);
    logger.info(`✅ Players List Cache HIT: ${this.playersListCache.length} players (${ageMinutes}min ago)`);
    return this.playersListCache;
  }

  // Guardar lista completa de jugadores
  setAllPlayersList(players) {
    this.playersListCache = players;
    this.playersListTimestamp = Date.now();
    logger.info(`💾 Players List Cache SET: ${players.length} players cached`);
  }

  // Obtener datos del caché normal
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      logger.info(`🔍 Cache MISS: ${key}`);
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - cached.timestamp > this.TTL) {
      logger.info(`⏰ Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      return null;
    }

    const ageMinutes = Math.round((Date.now() - cached.timestamp) / 1000 / 60);
    logger.info(`✅ Cache HIT: ${key} (${ageMinutes}min ago)`);
    return cached.data;
  }

  // Guardar datos en caché normal
  set(key, data) {
    // Si el caché está lleno, eliminar el más antiguo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      logger.info(`🧹 Cache evicted oldest: ${oldestKey}`);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    logger.info(`💾 Cache SET: ${key} (${this.cache.size}/${this.maxSize})`);
  }

  // Cache para jugadores individuales (detalles completos)
  getPlayerDetails(playerId) {
    const key = `player_details_${playerId}`;
    return this.get(key);
  }

  setPlayerDetails(playerId, details) {
    const key = `player_details_${playerId}`;
    this.set(key, details);
  }

  // Limpiar entradas expiradas
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Limpiar cache normal
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // Verificar cache de lista de jugadores
    if (this.playersListTimestamp && now - this.playersListTimestamp > this.PLAYERS_LIST_TTL) {
      this.playersListCache = null;
      this.playersListTimestamp = null;
      cleaned++;
      logger.info('🧹 Players List Cache expired and cleared');
    }

    if (cleaned > 0) {
      logger.info(`🧹 PlayersCache cleanup: ${cleaned} expired entries removed`);
    }
  }

  // Invalidar caché específico
  invalidate(pattern) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      logger.info(`🗑️ Cache invalidated: ${key}`);
    });

    // Invalidar lista de jugadores si es necesario
    if (pattern === 'players' || pattern === 'all') {
      this.playersListCache = null;
      this.playersListTimestamp = null;
      logger.info('🗑️ Players List Cache invalidated');
    }

    return keysToDelete.length;
  }

  // Estadísticas del caché
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    const stats = {
      filterCache: {
        size: this.cache.size,
        maxSize: this.maxSize,
        ttlMinutes: this.TTL / 1000 / 60
      },
      playersListCache: {
        cached: !!this.playersListCache,
        playersCount: this.playersListCache ? this.playersListCache.length : 0,
        ageMinutes: this.playersListTimestamp ? Math.round((now - this.playersListTimestamp) / 1000 / 60) : null,
        ttlMinutes: this.PLAYERS_LIST_TTL / 1000 / 60
      }
    };

    if (entries.length > 0) {
      stats.filterCache.oldestEntry = Math.min(...entries.map(e => e.timestamp));
      stats.filterCache.newestEntry = Math.max(...entries.map(e => e.timestamp));
      stats.filterCache.averageAgeMinutes = Math.round(entries.reduce((sum, e) => sum + (now - e.timestamp), 0) / entries.length / 1000 / 60);
    }

    return stats;
  }

  // Limpiar todo el caché
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.playersListCache = null;
    this.playersListTimestamp = null;
    logger.info(`🧽 PlayersCache cleared: ${size} filter entries + players list removed`);
  }

  // Precalentar caché con consultas comunes
  async warmup(apiClient) {
    logger.info('🔥 Warming up PlayersCache...');

    try {
      // Precargar lista completa de jugadores si no existe
      if (!this.getAllPlayersList()) {
        logger.info('📋 Precargando lista completa de jugadores...');
        const result = await apiClient.getAllLaLigaPlayers();
        if (result.success) {
          this.setAllPlayersList(result.data);
          logger.info(`✅ Lista de jugadores precargada: ${result.data.length} jugadores`);
        }
      }

      logger.info('✅ PlayersCache warmup completed');
    } catch (error) {
      logger.info(`⚠️ PlayersCache warmup failed:`, error.message);
    }
  }

  // Verificar si necesita refresco
  needsRefresh() {
    return !this.getAllPlayersList();
  }
}

module.exports = PlayersCache;