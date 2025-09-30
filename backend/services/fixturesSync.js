// =================================================
// SERVICIO SINCRONIZACIÓN FIXTURES LA LIGA
// =================================================
// Sincroniza partidos actuales de La Liga con base de datos local

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const ApiFootballClient = require('./apiFootball');

class FixturesSync {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    );
    this.apiFootball = new ApiFootballClient();
    this.processed = 0;
    this.errors = [];
  }

  // Sincronizar fixtures del día actual
  async syncTodayFixtures() {
    try {
      const today = new Date().toISOString().split('T')[0];
      logger.info(`🔄 Sincronizando fixtures de La Liga para: ${today}`);

      // Obtener fixtures de API-Sports
      const fixturesResult = await this.apiFootball.getLaLigaFixtures(today, today);

      if (!fixturesResult.success) {
        throw new Error(`Error API-Sports: ${fixturesResult.error}`);
      }

      const fixtures = fixturesResult.data;
      logger.info(`📅 ${fixtures.length} partidos encontrados para hoy`);

      if (fixtures.length === 0) {
        return {
          success: true,
          message: 'No hay partidos programados para hoy',
          synced: 0,
          errors: []
        };
      }

      // Procesar cada fixture
      for (const fixture of fixtures) {
        try {
          await this.syncSingleFixture(fixture);
          this.processed++;
        } catch (error) {
          logger.error(`Error procesando fixture ${fixture.id}: ${error.message}`);
          this.errors.push({
            fixture_id: fixture.id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Sincronización completada. ${this.processed} fixtures procesados`,
        synced: this.processed,
        errors: this.errors,
        total: fixtures.length
      };

    } catch (error) {
      logger.error('Error en sincronización de fixtures:', error.message);
      return {
        success: false,
        error: error.message,
        synced: this.processed,
        errors: this.errors
      };
    }
  }

  // Sincronizar fixtures de un rango de fechas
  async syncFixturesRange(from_date, to_date) {
    try {
      logger.info(`🔄 Sincronizando fixtures de La Liga desde ${from_date} hasta ${to_date}`);

      const fixturesResult = await this.apiFootball.getLaLigaFixtures(from_date, to_date);

      if (!fixturesResult.success) {
        throw new Error(`Error API-Sports: ${fixturesResult.error}`);
      }

      const fixtures = fixturesResult.data;
      logger.info(`📅 ${fixtures.length} partidos encontrados en el rango`);

      // Procesar cada fixture
      for (const fixture of fixtures) {
        try {
          await this.syncSingleFixture(fixture);
          this.processed++;
        } catch (error) {
          logger.error(`Error procesando fixture ${fixture.id}: ${error.message}`);
          this.errors.push({
            fixture_id: fixture.id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Sincronización completada. ${this.processed} fixtures procesados`,
        synced: this.processed,
        errors: this.errors,
        total: fixtures.length
      };

    } catch (error) {
      logger.error('Error en sincronización de fixtures:', error.message);
      return {
        success: false,
        error: error.message,
        synced: this.processed,
        errors: this.errors
      };
    }
  }

  // Sincronizar un fixture individual
  async syncSingleFixture(fixture) {
    try {
      // Verificar si el fixture ya existe
      const { data: existingFixture } = await this.supabase
        .from('fixtures')
        .select('*')
        .eq('api_fixture_id', fixture.id)
        .single();

      const fixtureData = {
        api_fixture_id: fixture.id,
        date: fixture.date,
        timezone: fixture.timezone,
        timestamp: fixture.timestamp,
        status_long: fixture.status.long,
        status_short: fixture.status.short,
        status_elapsed: fixture.status.elapsed,
        round: fixture.league.round,
        home_team_id: fixture.teams.home.id,
        home_team_name: fixture.teams.home.name,
        home_team_logo: fixture.teams.home.logo,
        away_team_id: fixture.teams.away.id,
        away_team_name: fixture.teams.away.name,
        away_team_logo: fixture.teams.away.logo,
        venue_id: fixture.fixture.venue?.id,
        venue_name: fixture.fixture.venue?.name,
        venue_city: fixture.fixture.venue?.city,
        referee: fixture.fixture.referee,
        goals_home: fixture.goals.home,
        goals_away: fixture.goals.away,
        score_halftime_home: fixture.score.halftime?.home,
        score_halftime_away: fixture.score.halftime?.away,
        score_fulltime_home: fixture.score.fulltime?.home,
        score_fulltime_away: fixture.score.fulltime?.away,
        updated_at: new Date().toISOString()
      };

      if (existingFixture) {
        // Actualizar fixture existente
        const { error } = await this.supabase
          .from('fixtures')
          .update(fixtureData)
          .eq('api_fixture_id', fixture.id);

        if (error) throw error;
        logger.info(`📝 Fixture ${fixture.id} actualizado: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      } else {
        // Crear nuevo fixture
        fixtureData.created_at = new Date().toISOString();

        const { error } = await this.supabase
          .from('fixtures')
          .insert([fixtureData]);

        if (error) throw error;
        logger.info(`✅ Fixture ${fixture.id} creado: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      }

      // Sincronizar alineaciones si están disponibles
      await this.syncFixtureLineups(fixture.id);

    } catch (error) {
      throw new Error(`Error sincronizando fixture ${fixture.id}: ${error.message}`);
    }
  }

  // Sincronizar alineaciones de un fixture
  async syncFixtureLineups(fixture_id) {
    try {
      const lineupsResult = await this.apiFootball.getFixtureLineups(fixture_id);

      if (!lineupsResult.success) {
        logger.info(`⚠️ No hay alineaciones disponibles para fixture ${fixture_id}`);
        return;
      }

      const lineups = lineupsResult.data;

      for (const teamLineup of lineups) {
        // Guardar alineación del equipo
        const lineupData = {
          fixture_api_id: fixture_id,
          team_id: teamLineup.team.id,
          team_name: teamLineup.team.name,
          formation: teamLineup.formation,
          coach_id: teamLineup.coach?.id,
          coach_name: teamLineup.coach?.name,
          updated_at: new Date().toISOString()
        };

        // Verificar si ya existe la alineación
        const { data: existingLineup } = await this.supabase
          .from('lineups')
          .select('*')
          .eq('fixture_api_id', fixture_id)
          .eq('team_id', teamLineup.team.id)
          .single();

        if (existingLineup) {
          await this.supabase
            .from('lineups')
            .update(lineupData)
            .eq('fixture_api_id', fixture_id)
            .eq('team_id', teamLineup.team.id);
        } else {
          lineupData.created_at = new Date().toISOString();
          await this.supabase
            .from('lineups')
            .insert([lineupData]);
        }

        // Sincronizar jugadores titulares
        await this.syncLineupPlayers(fixture_id, teamLineup.team.id, teamLineup.startXI, 'starter');

        // Sincronizar suplentes
        await this.syncLineupPlayers(fixture_id, teamLineup.team.id, teamLineup.substitutes, 'substitute');
      }

      logger.info(`⚽ Alineaciones sincronizadas para fixture ${fixture_id}`);

    } catch (error) {
      logger.error(`Error sincronizando alineaciones para fixture ${fixture_id}: ${error.message}`);
    }
  }

  // Sincronizar jugadores de una alineación
  async syncLineupPlayers(fixture_id, team_id, players, player_type) {
    try {
      // Limpiar jugadores existentes de este tipo
      await this.supabase
        .from('lineup_players')
        .delete()
        .eq('fixture_api_id', fixture_id)
        .eq('team_id', team_id)
        .eq('player_type', player_type);

      // Insertar jugadores actualizados
      const playersData = players.map(playerData => ({
        fixture_api_id: fixture_id,
        team_id: team_id,
        player_id: playerData.player.id,
        player_name: playerData.player.name,
        player_number: playerData.player.number,
        player_position: playerData.player.pos,
        player_grid: playerData.player.grid,
        player_type: player_type,
        created_at: new Date().toISOString()
      }));

      if (playersData.length > 0) {
        const { error } = await this.supabase
          .from('lineup_players')
          .insert(playersData);

        if (error) throw error;
      }

    } catch (error) {
      logger.error(`Error sincronizando jugadores ${player_type} para fixture ${fixture_id}: ${error.message}`);
    }
  }

  // Obtener fixtures desde base de datos local
  async getLocalFixtures(date = null) {
    try {
      let query = this.supabase
        .from('fixtures')
        .select(`
          *,
          lineups!lineups_fixture_api_id_fkey (
            *,
            lineup_players!lineup_players_fixture_api_id_fkey (*)
          )
        `)
        .order('date', { ascending: true });

      if (date) {
        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;
        query = query.gte('date', startOfDay).lte('date', endOfDay);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  // Obtener estadísticas de sincronización
  async getSyncStats() {
    try {
      const { data: totalFixtures, error: fixturesError } = await this.supabase
        .from('fixtures')
        .select('id', { count: 'exact' });

      const { data: totalLineups, error: lineupsError } = await this.supabase
        .from('lineups')
        .select('id', { count: 'exact' });

      const { data: totalPlayers, error: playersError } = await this.supabase
        .from('lineup_players')
        .select('id', { count: 'exact' });

      if (fixturesError || lineupsError || playersError) {
        throw new Error('Error obteniendo estadísticas');
      }

      return {
        success: true,
        stats: {
          total_fixtures: totalFixtures?.length || 0,
          total_lineups: totalLineups?.length || 0,
          total_lineup_players: totalPlayers?.length || 0,
          last_sync: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FixturesSync;