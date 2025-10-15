#!/usr/bin/env node

/**
 * Obtener transcripción de un outlier desde Supabase
 */

const { supabaseAdmin } = require('../backend/config/supabase');

async function getTranscription(videoId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('youtube_outliers')
            .select('title, transcription, content_analysis, mentioned_players')
            .eq('video_id', videoId)
            .single();

        if (error) {
            throw error;
        }

        console.log('\n='.repeat(80));
        console.log(`📺 VIDEO: ${data.title}`);
        console.log('='.repeat(80));
        console.log('\n📝 TRANSCRIPCIÓN COMPLETA:\n');
        console.log(data.transcription);
        console.log(`\n${'='.repeat(80)}`);
        console.log('🎯 TARGET PLAYER:', data.content_analysis?.target_player || 'N/A');
        console.log('👥 JUGADORES MENCIONADOS:', data.mentioned_players?.join(', ') || 'N/A');
        console.log(`${'='.repeat(80)}\n`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const videoId = process.argv[2] || '-rgSwypNvtw';
getTranscription(videoId);
