/**
 * Script para re-normalizar nombres de jugadores en videos ya procesados
 *
 * Toma los jugadores con nombres "sucios" (de transcripción Whisper)
 * y los normaliza con los nombres correctos de La Liga usando PlayersManager
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load BOTH .env files: API_FOOTBALL_KEY from .env, Supabase from .env.supabase
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const playerNameNormalizer = require('../backend/services/contentAnalysis/playerNameNormalizer');

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function renormalizeVideos() {
    console.log('🔄 Iniciando re-normalización de jugadores en videos procesados...\n');

    try {
        // 1. Obtener videos completados con análisis
        const { data: videos, error } = await supabase
            .from('competitive_videos')
            .select('id, video_id, title, analysis')
            .eq('processing_status', 'completed')
            .not('analysis', 'is', null);

        if (error) {
            console.error('❌ Error obteniendo videos:', error.message);
            process.exit(1);
        }

        if (!videos || videos.length === 0) {
            console.log('ℹ️  No hay videos con análisis para re-normalizar');
            process.exit(0);
        }

        console.log(`📊 Videos a re-normalizar: ${videos.length}\n`);

        let updated = 0;
        let failed = 0;

        // 2. Para cada video, normalizar jugadores
        for (const video of videos) {
            try {
                console.log(`🎬 Procesando: ${video.title.substring(0, 60)}...`);

                // Verificar si tiene jugadores
                if (
                    !video.analysis.players ||
                    !Array.isArray(video.analysis.players) ||
                    video.analysis.players.length === 0
                ) {
                    console.log('   ⚠️  Sin jugadores, saltando...\n');
                    continue;
                }

                console.log(`   👥 Jugadores originales: ${video.analysis.players.length}`);
                video.analysis.players.forEach(p => {
                    const name = p.name || p;
                    console.log(`      - ${name} (${p.position || 'N/A'})`);
                });

                // Normalizar jugadores
                const normalizedPlayers = await playerNameNormalizer.normalizePlayers(
                    video.analysis.players
                );

                // Contar correcciones
                const corrected = normalizedPlayers.filter(
                    p => p.playerId !== null && p.name !== p.originalName
                ).length;

                console.log(
                    `\n   ✅ Jugadores normalizados: ${corrected}/${normalizedPlayers.length} corregidos`
                );
                normalizedPlayers.slice(0, 5).forEach(p => {
                    if (p.originalName !== p.name) {
                        console.log(
                            `      ✓ "${p.originalName}" → "${p.name}" (${p.team}) [${(p.confidence * 100).toFixed(0)}%]`
                        );
                    }
                });

                // Actualizar análisis en BD
                const updatedAnalysis = {
                    ...video.analysis,
                    players: normalizedPlayers,
                    players_normalized: true,
                    normalized_at: new Date().toISOString()
                };

                const { error: updateError } = await supabase
                    .from('competitive_videos')
                    .update({ analysis: updatedAnalysis })
                    .eq('id', video.id);

                if (updateError) {
                    console.error(`   ❌ Error actualizando: ${updateError.message}`);
                    failed++;
                } else {
                    console.log('   💾 Guardado en BD\n');
                    updated++;
                }
            } catch (videoError) {
                console.error(`   ❌ Error procesando video: ${videoError.message}\n`);
                failed++;
            }
        }

        // 3. Resumen
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 RESUMEN DE RE-NORMALIZACIÓN');
        console.log('='.repeat(60));
        console.log(`✅ Videos actualizados: ${updated}`);
        console.log(`❌ Errores: ${failed}`);
        console.log(`📝 Total procesados: ${videos.length}`);
        console.log('='.repeat(60));
    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
renormalizeVideos()
    .then(() => {
        console.log('\n✅ Re-normalización completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
