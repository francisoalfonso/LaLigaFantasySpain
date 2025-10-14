/**
 * Script para limpiar outliers irrelevantes de la base de datos
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanOutliers() {
    console.log('🧹 Limpiando outliers irrelevantes...\n');

    // Canales a eliminar (NBA, Premier League, contenido no relevante)
    const irrelevantChannels = [
        'SF-Editzz',                          // Superman/DCU
        'Fantasy Gaming Hub',                 // FIFA 16
        'The 6th Man - Shorts',               // NBA
        'ManuVera',                           // Fortnite
        'Golden Goal Fantasy Football',       // FPL (Premier League)
        'The Fantasy Birds',                  // NBA
        'Insight Fantasy Sports',             // NBA
        '𝐌𝐢𝐬𝐭𝐞𝐫 𝐅𝐚𝐧𝐭𝐚𝐬𝐲 𝐑𝐞𝐥𝐚𝐱💤🌙',    // Cocina italiana
        'Mandy Martino'                       // Podcast no relacionado
    ];

    try {
        // Contar total antes
        const { count: beforeCount } = await supabase
            .from('youtube_outliers')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Total outliers antes: ${beforeCount}\n`);

        // 1. Eliminar por canal irrelevante
        const { error: channelError } = await supabase
            .from('youtube_outliers')
            .delete()
            .in('channel_name', irrelevantChannels);

        if (channelError) {
            console.error('❌ Error eliminando por canal:', channelError);
            process.exit(1);
        }

        // 2. Eliminar canales pequeños (<500 suscriptores)
        const { error: subsError } = await supabase
            .from('youtube_outliers')
            .delete()
            .lt('channel_subscribers', 500);

        if (subsError) {
            console.error('❌ Error eliminando por suscriptores:', subsError);
            process.exit(1);
        }

        // Contar después
        const { count: afterCount } = await supabase
            .from('youtube_outliers')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ Outliers eliminados: ${beforeCount - afterCount}`);
        console.log(`📊 Total outliers después: ${afterCount}\n`);

        // Mostrar outliers restantes
        const { data: remaining } = await supabase
            .from('youtube_outliers')
            .select('channel_name, title, priority, outlier_score')
            .order('outlier_score', { ascending: false })
            .limit(10);

        console.log('📋 Top 10 outliers restantes:\n');
        remaining.forEach((o, i) => {
            console.log(`${i + 1}. [${o.priority}] ${o.channel_name} - ${o.title.substring(0, 60)}...`);
            console.log(`   Score: ${o.outlier_score}\n`);
        });

    } catch (err) {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    }
}

cleanOutliers().then(() => {
    console.log('✅ Limpieza completada');
    process.exit(0);
});
