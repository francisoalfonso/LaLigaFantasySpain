/**
 * Verificar que las transcripciones se están guardando completas en BD
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTranscription() {
    console.log('🔍 Verificando transcripciones en BD...\n');

    try {
        const { data, error } = await supabase
            .from('competitive_videos')
            .select('video_id, title, transcription, analysis')
            .eq('processing_status', 'completed')
            .limit(1)
            .single();

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        console.log('📹 Video:', data.video_id);
        console.log('📝 Título:', data.title);
        console.log('');

        console.log('✅ TRANSCRIPTION object:');
        console.log('   - Tiene texto:', !!data.transcription?.text);
        console.log('   - Longitud:', data.transcription?.text?.length || 0, 'caracteres');
        console.log('   - Duración:', data.transcription?.duration, 'segundos');
        console.log('   - Idioma:', data.transcription?.language);
        console.log('   - Procesado:', data.transcription?.processed_at);
        console.log('');

        if (data.transcription?.text) {
            console.log('📄 Primeros 500 caracteres de la transcripción:');
            console.log('─'.repeat(60));
            console.log(data.transcription.text.substring(0, 500));
            console.log('─'.repeat(60));
            console.log('');

            // Contar palabras aproximadas
            const words = data.transcription.text.split(/\s+/).length;
            console.log('📊 Estadísticas:');
            console.log('   - Palabras aprox:', words);
            console.log('   - Caracteres:', data.transcription.text.length);
            console.log(
                '   - Palabras por minuto:',
                Math.round(words / (data.transcription.duration / 60))
            );
        } else {
            console.log('❌ No hay texto de transcripción guardado');
        }

        console.log('');
        console.log('✅ ANALYSIS object:');
        console.log('   - Tiene analysis:', !!data.analysis);
        console.log('   - Jugadores:', data.analysis?.players?.length || 0);
        console.log('   - Claims:', data.analysis?.claims?.length || 0);
        console.log('   - Keywords:', data.analysis?.keywords?.length || 0);
    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

checkTranscription()
    .then(() => {
        console.log('\n✅ Verificación completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
