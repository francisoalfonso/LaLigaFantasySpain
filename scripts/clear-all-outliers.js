/**
 * Script para eliminar TODOS los outliers de la base de datos
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllOutliers() {
    console.log('🗑️  Eliminando TODOS los outliers...\n');

    try {
        // Contar total antes
        const { count: beforeCount } = await supabase
            .from('youtube_outliers')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Total outliers antes: ${beforeCount}\n`);

        if (beforeCount === 0) {
            console.log('✅ La tabla ya está vacía');
            process.exit(0);
        }

        // Eliminar TODOS
        const { error } = await supabase
            .from('youtube_outliers')
            .delete()
            .neq('video_id', ''); // Condición que siempre es true para eliminar todos

        if (error) {
            console.error('❌ Error:', error);
            process.exit(1);
        }

        // Verificar que está vacía
        const { count: afterCount } = await supabase
            .from('youtube_outliers')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ Outliers eliminados: ${beforeCount}`);
        console.log(`📊 Total outliers después: ${afterCount}\n`);

        if (afterCount === 0) {
            console.log('✅ Tabla limpia. Lista para nueva búsqueda optimizada.\n');
        }

    } catch (err) {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    }
}

clearAllOutliers().then(() => {
    console.log('✅ Limpieza completada');
    process.exit(0);
});
