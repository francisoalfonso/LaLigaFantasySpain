#!/usr/bin/env node

/**
 * Script de sincronización de fotos de jugadores
 *
 * Descarga TODAS las fotos de jugadores de La Liga desde API-Sports
 * y las almacena localmente en /data/player-photos/
 *
 * Ejecución: npm run sync:player-photos
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../backend/utils/logger');

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = 'https://v3.football.api-sports.io';
const PHOTOS_DIR = path.join(__dirname, '../data/player-photos');
const SEASON = 2025;
const LEAGUE_ID = 140; // La Liga

// Asegurar que existe el directorio
if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

/**
 * Obtener todos los equipos de La Liga
 */
async function getLaLigaTeams() {
    try {
        logger.info('[SyncPhotos] Obteniendo equipos de La Liga...');

        const response = await axios.get(`${API_BASE_URL}/teams`, {
            headers: { 'x-apisports-key': API_FOOTBALL_KEY },
            params: { league: LEAGUE_ID, season: SEASON }
        });

        const teams = response.data.response.map(t => ({
            id: t.team.id,
            name: t.team.name
        }));

        logger.info(`[SyncPhotos] ✅ ${teams.length} equipos encontrados`);
        return teams;

    } catch (error) {
        logger.error(`[SyncPhotos] Error obteniendo equipos: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener jugadores de un equipo
 */
async function getTeamPlayers(teamId, teamName) {
    try {
        logger.info(`[SyncPhotos] Obteniendo jugadores de ${teamName}...`);

        const response = await axios.get(`${API_BASE_URL}/players`, {
            headers: { 'x-apisports-key': API_FOOTBALL_KEY },
            params: {
                team: teamId,
                season: SEASON,
                league: LEAGUE_ID
            }
        });

        const players = response.data.response
            .filter(p => p.player && p.player.photo)
            .map(p => ({
                id: p.player.id,
                name: p.player.name,
                photoUrl: p.player.photo,
                team: teamName
            }));

        logger.info(`[SyncPhotos] ✅ ${players.length} jugadores con foto en ${teamName}`);
        return players;

    } catch (error) {
        logger.error(`[SyncPhotos] Error obteniendo jugadores de ${teamName}: ${error.message}`);
        return [];
    }
}

/**
 * Descargar foto de jugador
 */
async function downloadPlayerPhoto(player) {
    try {
        const photoPath = path.join(PHOTOS_DIR, `${player.id}.jpg`);

        // Si ya existe, skip
        if (fs.existsSync(photoPath)) {
            logger.info(`[SyncPhotos] ⏭️  ${player.name} - Foto ya existe`);
            return { success: true, cached: true, path: photoPath };
        }

        // Descargar foto
        const response = await axios.get(player.photoUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        fs.writeFileSync(photoPath, response.data);
        logger.info(`[SyncPhotos] ✅ ${player.name} - Foto descargada`);

        return { success: true, cached: false, path: photoPath };

    } catch (error) {
        logger.error(`[SyncPhotos] ❌ ${player.name} - Error descargando foto: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Delay entre requests (respetar rate limit)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main
 */
async function main() {
    console.log('\n🖼️  SINCRONIZACIÓN DE FOTOS DE JUGADORES\n');
    console.log('════════════════════════════════════════════════════════════════════\n');

    const stats = {
        teams: 0,
        players: 0,
        photosDownloaded: 0,
        photosCached: 0,
        errors: 0
    };

    try {
        // 1. Obtener equipos
        const teams = await getLaLigaTeams();
        stats.teams = teams.length;

        console.log(`\n📋 ${teams.length} equipos encontrados\n`);

        // 2. Por cada equipo, obtener jugadores y descargar fotos
        for (const team of teams) {
            await delay(1000); // Rate limiting: 1 request/segundo

            const players = await getTeamPlayers(team.id, team.name);
            stats.players += players.length;

            // Descargar fotos (con delay)
            for (const player of players) {
                await delay(500); // Rate limiting: 2 fotos/segundo

                const result = await downloadPlayerPhoto(player);

                if (result.success) {
                    if (result.cached) {
                        stats.photosCached++;
                    } else {
                        stats.photosDownloaded++;
                    }
                } else {
                    stats.errors++;
                }
            }

            console.log(`\n✅ ${team.name} completado (${players.length} jugadores)\n`);
        }

        // 3. Resumen
        console.log('\n════════════════════════════════════════════════════════════════════');
        console.log('\n📊 RESUMEN DE SINCRONIZACIÓN\n');
        console.log(`   Equipos procesados:     ${stats.teams}`);
        console.log(`   Jugadores encontrados:  ${stats.players}`);
        console.log(`   Fotos descargadas:      ${stats.photosDownloaded}`);
        console.log(`   Fotos en caché:         ${stats.photosCached}`);
        console.log(`   Errores:                ${stats.errors}`);
        console.log(`\n   Total fotos locales:    ${stats.photosDownloaded + stats.photosCached}`);
        console.log('\n════════════════════════════════════════════════════════════════════\n');

        console.log(`✅ Fotos almacenadas en: ${PHOTOS_DIR}\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

main();
