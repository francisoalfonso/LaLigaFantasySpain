#!/usr/bin/env node

/**
 * Script para verificar target_player de un outlier en Supabase
 */

const { supabaseAdmin } = require('../backend/config/supabase');

async function checkTargetPlayer(videoId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('youtube_outliers')
            .select('video_id, title, content_analysis, mentioned_players, transcription')
            .eq('video_id', videoId)
            .single();

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (!data) {
            console.error('❌ Video no encontrado:', videoId);
            return;
        }

        console.log('\n📺 VIDEO:', data.title);
        console.log(
            '\n🎯 TARGET PLAYER:',
            data.content_analysis?.target_player || 'NO IDENTIFICADO'
        );
        console.log('\n👥 JUGADORES MENCIONADOS:');
        (data.mentioned_players || []).forEach((player, i) => {
            console.log(`   ${i + 1}. ${player}`);
        });

        console.log('\n📝 TRANSCRIPCIÓN (primeras 500 chars):');
        console.log(`${data.transcription?.substring(0, 500)}...\n`);

        if (data.content_analysis) {
            console.log('📊 CONTENT ANALYSIS:');
            console.log(`   - Thesis: ${data.content_analysis.thesis || 'N/A'}`);
            console.log(`   - Target Player: ${data.content_analysis.target_player || 'N/A'}`);
            console.log(
                `   - Players Mentioned: ${(data.content_analysis.players_mentioned || []).length}`
            );
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

const videoId = process.argv[2] || '-rgSwypNvtw';
checkTargetPlayer(videoId);
