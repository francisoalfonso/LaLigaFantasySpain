const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.supabase' });

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_ANON_KEY);

async function listEstudioImages() {
    try {
        console.log('🔍 Listando imágenes en flp/estudio...\n');

        const { data, error } = await supabase.storage.from('flp').list('estudio', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log('⚠️  No se encontraron imágenes en flp/estudio');
            return;
        }

        console.log(`✅ Encontradas ${data.length} imágenes:\n`);

        data.forEach((file, index) => {
            const sizeInMB = (file.metadata?.size / 1024 / 1024).toFixed(2);
            const url = `https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/estudio/${file.name}`;
            console.log(`${index + 1}. ${file.name} (${sizeInMB} MB)`);
            console.log(`   URL: ${url}\n`);
        });
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

listEstudioImages();
