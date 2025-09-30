const logger = require('../utils/logger');

// Sistema de Caché para Análisis de Chollos Fantasy
// Reduce tiempo de carga de 9+ segundos a <1 segundo para requests repetidos

class BargainCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 30 * 60 * 1000; // 30 minutos en milisegundos
    this.maxSize = 100; // Máximo 100 entradas en caché

    // Limpieza automática cada 10 minutos
    setInterval(() => this.cleanup(), 10 * 60 * 1000);

    logger.info('🚀 BargainCache inicializado - TTL: 30min, MaxSize: 100');
  }

  // Generar clave única basada en parámetros
  generateCacheKey(params) {
    const { limit, maxPrice, position, minRatio, sortBy } = params;
    return `bargains_${limit || 20}_${maxPrice || 'all'}_${position || 'all'}_${minRatio || 'all'}_${sortBy || 'valueRatio'}`;
  }

  // Obtener datos del caché
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

    logger.info(`✅ Cache HIT: ${key} (${Math.round((Date.now() - cached.timestamp) / 1000)}s ago)`);
    return cached.data;
  }

  // Guardar datos en caché
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

  // Limpiar entradas expiradas
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
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

    return keysToDelete.length;
  }

  // Estadísticas del caché
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null,
      averageAge: entries.length > 0 ?
        Math.round(entries.reduce((sum, e) => sum + (now - e.timestamp), 0) / entries.length / 1000) : 0,
      ttlSeconds: this.TTL / 1000
    };
  }

  // Limpiar todo el caché
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`🧽 Cache cleared: ${size} entries removed`);
  }

  // Precalentar caché con consultas comunes
  async warmup(bargainAnalyzer) {
    logger.info('🔥 Warming up cache with common queries...');

    const commonQueries = [
      { limit: 20 }, // Query por defecto
      { limit: 10, position: 'FWD' }, // Delanteros top
      { limit: 10, position: 'MID' }, // Centrocampistas top
      { limit: 10, position: 'DEF' }, // Defensas top
      { limit: 5, position: 'GK' },   // Porteros top
    ];

    for (const query of commonQueries) {
      try {
        const key = this.generateCacheKey(query);
        if (!this.get(key)) {
          const result = await bargainAnalyzer.identifyBargains(query.limit);
          if (result.success) {
            this.set(key, result);
          }
        }
      } catch (error) {
        logger.info(`⚠️ Warmup failed for query:`, query, error.message);
      }
    }

    logger.info('✅ Cache warmup completed');
  }
}

module.exports = BargainCache;