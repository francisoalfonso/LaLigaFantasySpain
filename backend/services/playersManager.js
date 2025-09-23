// Gestor de Jugadores con Cache Optimizado
// Maneja carga, filtrado y cache de todos los jugadores de La Liga

const ApiFootballClient = require('./apiFootball');
const PlayersCache = require('./playersCache');

class PlayersManager {
  constructor() {
    this.apiClient = new ApiFootballClient();
    this.cache = new PlayersCache();

    console.log('⚽ PlayersManager inicializado');
  }

  // Obtener todos los jugadores con cache inteligente
  async getAllPlayers(useCache = true) {
    if (useCache) {
      // Intentar obtener del cache primero
      const cachedPlayers = this.cache.getAllPlayersList();
      if (cachedPlayers) {
        return {
          success: true,
          data: cachedPlayers,
          cached: true,
          totalPlayers: cachedPlayers.length
        };
      }
    }

    // Si no hay cache o está desactivado, obtener de API
    console.log('📡 Obteniendo jugadores desde API (cache miss)...');

    try {
      const result = await this.apiClient.getAllLaLigaPlayers();

      if (result.success) {
        // Guardar en cache
        this.cache.setAllPlayersList(result.data);

        return {
          success: true,
          data: result.data,
          cached: false,
          totalPlayers: result.data.length,
          totalPages: result.totalPages
        };
      } else {
        return {
          success: false,
          error: result.error,
          cached: false
        };
      }
    } catch (error) {
      console.error('❌ Error obteniendo jugadores:', error.message);
      return {
        success: false,
        error: error.message,
        cached: false
      };
    }
  }

  // Filtrar jugadores con cache por filtros
  async getFilteredPlayers(filters = {}) {
    const cacheKey = this.cache.generateCacheKey(filters);

    // Intentar obtener del cache de filtros
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        cached: true
      };
    }

    // Obtener todos los jugadores (posiblemente del cache)
    const allPlayersResult = await this.getAllPlayers();
    if (!allPlayersResult.success) {
      return allPlayersResult;
    }

    // Aplicar filtros
    const filteredPlayers = this.applyFilters(allPlayersResult.data, filters);

    const result = {
      success: true,
      data: filteredPlayers,
      cached: false,
      totalPlayers: filteredPlayers.length,
      filters: filters,
      sourceCache: allPlayersResult.cached
    };

    // Guardar resultado filtrado en cache
    this.cache.set(cacheKey, result);

    return result;
  }

  // Aplicar filtros a la lista de jugadores
  applyFilters(players, filters) {
    let filtered = [...players];

    // Filtro por posición
    if (filters.position) {
      filtered = filtered.filter(p => p.games?.position === filters.position);
    }

    // Filtro por equipo
    if (filters.team) {
      filtered = filtered.filter(p => p.team?.id == filters.team);
    }

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(p => {
        switch (filters.status) {
          case 'available':
            return !p.player?.injured && (p.games?.minutes || 0) > 0;
          case 'injured':
            return p.player?.injured;
          case 'no-minutes':
            return !p.player?.injured && (p.games?.minutes || 0) === 0;
          default:
            return true;
        }
      });
    }

    // Filtro de búsqueda
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.player?.name?.toLowerCase().includes(query) ||
        p.team?.name?.toLowerCase().includes(query)
      );
    }

    // Ordenación
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.player?.name || '').localeCompare(b.player?.name || '');
        case 'team':
          return (a.team?.name || '').localeCompare(b.team?.name || '');
        case 'position':
          return (a.games?.position || '').localeCompare(b.games?.position || '');
        case 'rating':
          return (parseFloat(b.games?.rating) || 0) - (parseFloat(a.games?.rating) || 0);
        case 'goals':
          return (b.goals?.total || 0) - (a.goals?.total || 0);
        case 'minutes':
          return (b.games?.minutes || 0) - (a.games?.minutes || 0);
        case 'age':
          return (a.player?.age || 0) - (b.player?.age || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }

  // Obtener jugador individual con cache
  async getPlayerDetails(playerId) {
    // Intentar cache primero
    const cached = this.cache.getPlayerDetails(playerId);
    if (cached) {
      return {
        ...cached,
        cached: true
      };
    }

    // Obtener de API
    try {
      const result = await this.apiClient.getPlayerDetails(playerId);

      if (result.success) {
        // Guardar en cache
        this.cache.setPlayerDetails(playerId, result);

        return {
          ...result,
          cached: false
        };
      }

      return result;
    } catch (error) {
      console.error(`❌ Error obteniendo detalles del jugador ${playerId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener estadísticas del cache
  getCacheStats() {
    return this.cache.getStats();
  }

  // Invalidar cache
  invalidateCache(pattern = 'all') {
    return this.cache.invalidate(pattern);
  }

  // Limpiar cache
  clearCache() {
    this.cache.clear();
  }

  // Verificar si necesita refresco
  needsRefresh() {
    return this.cache.needsRefresh();
  }

  // Precalentar cache
  async warmupCache() {
    await this.cache.warmup(this.apiClient);
  }

  // Forzar actualización desde API
  async forceRefresh() {
    console.log('🔄 Forzando actualización de jugadores desde API...');
    this.cache.invalidate('all');
    return await this.getAllPlayers(false);
  }
}

module.exports = PlayersManager;