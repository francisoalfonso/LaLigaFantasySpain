const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const ApiFootballClient = require('../services/apiFootball');

// Cliente API Football
const apiFootball = new ApiFootballClient();

// Endpoint para debug de coordenadas
router.get('/grid/:fixture_id', async (req, res) => {
  try {
    const fixture_id = req.params.fixture_id;
    logger.info(`🔍 [DEBUG] Obteniendo alineaciones para fixture ${fixture_id}`);

    const result = await apiFootball.getFixtureLineups(fixture_id);

    if (result.success && result.data) {
      // Procesar datos para análisis debug
      const debugData = {
        fixture_id: fixture_id,
        teams_count: result.data.length,
        teams: []
      };

      result.data.forEach(teamData => {
        const teamInfo = {
          team: {
            id: teamData.team.id,
            name: teamData.team.name,
            formation: teamData.formation
          },
          players: [],
          grid_analysis: {
            all_grids: [],
            rows: new Set(),
            cols: new Set(),
            unique_coordinates: new Set()
          }
        };

        // Procesar jugadores titulares
        teamData.startXI.forEach(playerData => {
          const player = playerData.player;
          const grid = player.grid;

          if (grid && grid.includes(':')) {
            const [rowStr, colStr] = grid.split(':');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);

            teamInfo.players.push({
              id: player.id,
              name: player.name,
              number: player.number,
              position: player.pos,
              grid: grid,
              row: row,
              col: col
            });

            teamInfo.grid_analysis.all_grids.push(grid);
            teamInfo.grid_analysis.rows.add(row);
            teamInfo.grid_analysis.cols.add(col);
            teamInfo.grid_analysis.unique_coordinates.add(`${row}:${col}`);
          }
        });

        // Convertir Sets a arrays para JSON
        teamInfo.grid_analysis.rows = Array.from(teamInfo.grid_analysis.rows).sort((a, b) => a - b);
        teamInfo.grid_analysis.cols = Array.from(teamInfo.grid_analysis.cols).sort((a, b) => a - b);
        teamInfo.grid_analysis.unique_coordinates = Array.from(teamInfo.grid_analysis.unique_coordinates);

        debugData.teams.push(teamInfo);
      });

      logger.info('✅ [DEBUG] Datos procesados correctamente');
      logger.info('📊 [DEBUG] Resumen:', {
        teams: debugData.teams.map(t => ({
          name: t.team.name,
          formation: t.team.formation,
          players_count: t.players.length,
          row_range: `${Math.min(...t.grid_analysis.rows)}-${Math.max(...t.grid_analysis.rows)}`,
          col_range: `${Math.min(...t.grid_analysis.cols)}-${Math.max(...t.grid_analysis.cols)}`
        }))
      });

      res.json({
        success: true,
        debug_data: debugData,
        raw_api_data: result.data
      });

    } else {
      logger.info('❌ [DEBUG] No se encontraron alineaciones');
      res.status(404).json({
        success: false,
        error: result.error || 'No se encontraron alineaciones',
        fixture_id: fixture_id
      });
    }

  } catch (error) {
    logger.error('❌ [DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fixture_id: req.params.fixture_id
    });
  }
});

// Endpoint para mostrar matriz en consola
router.get('/matrix/:fixture_id', async (req, res) => {
  try {
    const fixture_id = req.params.fixture_id;
    const result = await apiFootball.getFixtureLineups(fixture_id);

    if (result.success && result.data) {
      logger.info('\n🔍 ===== ANÁLISIS MATRIZ COORDENADAS API-SPORTS =====');

      result.data.forEach(teamData => {
        const teamName = teamData.team.name;
        const formation = teamData.formation;

        logger.info(`\n🏆 EQUIPO: ${teamName} (${formation})`);
        logger.info('=' .repeat(50));

        // Crear matriz
        const matrix = {};
        let maxRow = 0;
        let maxCol = 0;

        teamData.startXI.forEach(playerData => {
          const player = playerData.player;
          const grid = player.grid;

          if (grid && grid.includes(':')) {
            const [rowStr, colStr] = grid.split(':');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);

            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, col);

            if (!matrix[row]) matrix[row] = {};
            matrix[row][col] = `${player.number}.${player.name.split(' ')[0]}`;

            logger.info(`📍 ${player.name} (#${player.number}) -> Grid: ${grid} (Fila: ${row}, Col: ${col})`);
          }
        });

        // Mostrar matriz
        logger.info(`\n📊 MATRIZ ${maxRow}x${maxCol}:`);
        logger.info('─'.repeat(70));

        // Header de columnas
        let header = '   ';
        for (let col = 1; col <= maxCol; col++) {
          header += `Col${col}`.padEnd(12);
        }
        logger.info(header);
        logger.info('─'.repeat(70));

        // Filas de la matriz
        for (let row = 1; row <= maxRow; row++) {
          let rowStr = `F${row} `;
          for (let col = 1; col <= maxCol; col++) {
            const cell = (matrix[row] && matrix[row][col]) ? matrix[row][col] : '---';
            rowStr += cell.padEnd(12);
          }
          logger.info(rowStr);
        }

        logger.info('─'.repeat(70));
      });

      logger.info('\n✅ Análisis completado');

      res.json({
        success: true,
        message: 'Matriz mostrada en consola del servidor',
        fixture_id: fixture_id
      });

    } else {
      res.status(404).json({
        success: false,
        error: 'No se encontraron alineaciones'
      });
    }

  } catch (error) {
    logger.error('❌ Error en matriz debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;