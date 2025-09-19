// Cliente para API de SportMonks
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { SPORTMONKS, LEAGUE_IDS, SEASON_IDS } = require('../config/constants');

class SportMonksClient {
  constructor() {
    this.apiKey = process.env.SPORTMONKS_API_KEY;
    this.baseURL = SPORTMONKS.BASE_URL;
    this.rateLimit = SPORTMONKS.RATE_LIMIT;
    this.lastRequest = 0;

    // Configurar axios con headers por defecto
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });
  }

  // Control de rate limiting
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.rateLimit) {
      const waitTime = this.rateLimit - timeSinceLastRequest;
      console.log(`⏳ Esperando ${waitTime}ms por rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest = Date.now();
  }

  // Guardar respuesta de ejemplo en data-samples
  async saveDataSample(endpoint, data) {
    try {
      const sampleDir = path.join(__dirname, '../../data-samples');
      await fs.mkdir(sampleDir, { recursive: true });

      const filename = `${endpoint.replace(/\//g, '_')}_sample.json`;
      const filepath = path.join(sampleDir, filename);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Muestra guardada: ${filename}`);
    } catch (error) {
      console.error('Error guardando muestra:', error.message);
    }
  }

  // Método base para hacer peticiones
  async makeRequest(endpoint, params = {}) {
    try {
      await this.waitForRateLimit();

      console.log(`🔄 Petición a: ${endpoint}`);

      const response = await this.client.get(endpoint, { params });

      // Guardar muestra de datos
      await this.saveDataSample(endpoint, {
        endpoint,
        params,
        data: response.data,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error en ${endpoint}:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  // Obtener información de ligas disponibles
  async getLeagues() {
    try {
      const response = await this.makeRequest('/leagues');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo ligas:', error);
      return [];
    }
  }

  // Obtener equipos de una liga
  async getTeams(leagueId = LEAGUE_IDS.LA_LIGA) {
    try {
      const response = await this.makeRequest(`/teams/seasons/${SEASON_IDS.LA_LIGA_2024_25}`, {
        include: 'squad.player'
      });
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo equipos:', error);
      return [];
    }
  }

  // Obtener partidos de una fecha específica
  async getMatchesByDate(date, leagueId = LEAGUE_IDS.LA_LIGA) {
    try {
      const response = await this.makeRequest('/fixtures/date/' + date, {
        include: SPORTMONKS.INCLUDES.join(','),
        'filter[league_id]': leagueId
      });
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      return [];
    }
  }

  // Obtener partidos en vivo
  async getLiveMatches(leagueId = LEAGUE_IDS.LA_LIGA) {
    try {
      const response = await this.makeRequest('/livescores/inplay', {
        include: SPORTMONKS.INCLUDES.join(','),
        'filter[league_id]': leagueId
      });
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo partidos en vivo:', error);
      return [];
    }
  }

  // Obtener estadísticas detalladas de un jugador
  async getPlayerStats(playerId, seasonId = SEASON_IDS.LA_LIGA_2024_25) {
    try {
      const response = await this.makeRequest(`/players/${playerId}`, {
        include: 'statistics.details,position'
      });
      return response.data || null;
    } catch (error) {
      console.error('Error obteniendo estadísticas del jugador:', error);
      return null;
    }
  }

  // Obtener fixture específico con todas las estadísticas
  async getFixtureDetails(fixtureId) {
    try {
      const response = await this.makeRequest(`/fixtures/${fixtureId}`, {
        include: 'statistics.details,lineups.details.player,events.player,participants'
      });
      return response.data || null;
    } catch (error) {
      console.error('Error obteniendo detalles del fixture:', error);
      return null;
    }
  }

  // Método de prueba de conexión
  async testConnection() {
    try {
      console.log('🧪 Probando conexión con SportMonks...');

      // Probar con las ligas disponibles en plan gratuito
      const leagues = await this.getLeagues();

      if (leagues && leagues.length > 0) {
        console.log(`✅ Conexión exitosa! ${leagues.length} ligas disponibles`);
        console.log('Primeras 3 ligas:', leagues.slice(0, 3).map(l => l.name));
        return { success: true, leagues: leagues.length };
      } else {
        console.log('⚠️ Conexión exitosa pero sin datos');
        return { success: true, leagues: 0 };
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SportMonksClient;