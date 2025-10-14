/**
 * Test Simplificado: Outlier → Video VEO3 (SIN upload a YouTube)
 *
 * FLUJO:
 * 1. Obtener outlier de prueba
 * 2. Generar guión con OutlierScriptGenerator
 * 3. Generar video VEO3 (3 segmentos con Carlos)
 * 4. Añadir enhancements
 * 5. ✅ Video final listo para revisión (NO se sube a YouTube)
 *
 * USAGE:
 * node scripts/veo3/test-outlier-to-video-only.js
 */

require('dotenv').config({ path: '.env.supabase' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3000';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración
const PLATFORM = 'youtube'; // 'youtube' | 'instagram'
const PRESENTER = 'Carlos'; // 'Carlos' | 'Ana'

/**
 * Obtener el outlier de prueba
 */
async function getTestOutlier() {
    console.log('\n📊 [1/6] Obteniendo outlier de prueba...\n');

    const { data, error } = await supabase
        .from('youtube_outliers')
        .select('*')
        .eq('processing_status', 'detected')
        .order('outlier_score', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        throw new Error(`Error obteniendo outlier: ${error.message}`);
    }

    if (!data) {
        throw new Error('No hay outliers pendientes de procesar');
    }

    console.log('✅ Outlier encontrado:');
    console.log(`   - Video ID: ${data.video_id}`);
    console.log(`   - Título: ${data.title.substring(0, 60)}...`);
    console.log(`   - Canal: ${data.channel_name}`);
    console.log(`   - Score: ${data.outlier_score}`);
    console.log(`   - Priority: ${data.priority}`);
    console.log(`   - Views: ${data.views.toLocaleString()}`);
    console.log(`   - Likes: ${data.likes.toLocaleString()}\n`);

    return data;
}

/**
 * Generar script desde outlier
 */
async function generateScript(outlier) {
    console.log('\n📝 [2/6] Generando script desde outlier...\n');

    const response = await axios.post(
        `${BASE_URL}/api/veo3/generate-script-from-outlier`,
        {
            outlierData: outlier,
            options: {
                platform: PLATFORM,
                presenter: PRESENTER
            }
        },
        { timeout: 30000 }
    );

    if (!response.data.success) {
        throw new Error('Error generando script: ' + response.data.error);
    }

    const script = response.data.script;
    console.log('✅ Script generado:');
    console.log(`   - Segmentos: ${script.segments.length}`);
    console.log(`   - Palabras totales: ${script.metadata.totalWords}`);
    console.log(`   - Plataforma: ${script.metadata.platform.toUpperCase()}`);
    console.log(`   - Cohesión: ${script.validation.score}/100\n`);

    // Mostrar diálogos
    script.segments.forEach((seg, i) => {
        console.log(`   Segmento ${i + 1} (${seg.duration}s):`);
        console.log(`   "${seg.dialogue}"\n`);
    });

    return script;
}

/**
 * Fase 1: Preparar sesión VEO3
 */
async function prepareVEO3Session(script) {
    console.log('\n🎬 [3/6] FASE 1: Preparando sesión VEO3 con Carlos...\n');

    const response = await axios.post(
        `${BASE_URL}/api/veo3/prepare-session`,
        {
            customScript: script,
            presenter: PRESENTER.toLowerCase() // 'carlos' o 'ana'
        },
        { timeout: 300000 } // 5 minutos (Nano Banana tarda ~2-3 min + descarga/upload)
    );

    if (!response.data.success) {
        throw new Error('Error en prepare-session: ' + response.data.error);
    }

    const sessionId = response.data.sessionId;
    console.log(`✅ Sesión preparada: ${sessionId}\n`);
    console.log(`   - Script adaptado para Carlos: ✅`);
    console.log(`   - Imágenes Nano Banana: ${response.data.nanoBananaImages?.length || 0}\n`);

    return sessionId;
}

/**
 * Fase 2: Generar 3 segmentos en paralelo
 */
async function generateSegments(sessionId) {
    console.log('\n🎥 [4/6] FASE 2: Generando 3 segmentos VEO3 con Carlos...\n');
    console.log('⏱️  Esto puede tomar 12-15 minutos (3 segmentos en paralelo)\n');

    const segmentPromises = [0, 1, 2].map(async segmentIndex => {
        console.log(`   Iniciando segmento ${segmentIndex}...`);

        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-segment`,
            { sessionId, segmentIndex },
            { timeout: 300000 } // 5 minutos
        );

        if (!response.data.success) {
            throw new Error(`Error en segmento ${segmentIndex}: ${response.data.error}`);
        }

        console.log(`   ✅ Segmento ${segmentIndex} generado (${response.data.duration}s)\n`);
        return response.data;
    });

    await Promise.all(segmentPromises);

    console.log('✅ Los 3 segmentos están listos\n');
}

/**
 * Fase 3: Finalizar video
 */
async function finalizeVideo(sessionId) {
    console.log('\n🎞️ [5/6] FASE 3: Finalizando video...\n');

    const response = await axios.post(
        `${BASE_URL}/api/veo3/finalize-session`,
        { sessionId },
        { timeout: 120000 } // 2 minutos
    );

    if (!response.data.success) {
        throw new Error('Error en finalize-session: ' + response.data.error);
    }

    console.log('✅ Video finalizado:');
    console.log(`   - Duración: ${response.data.metadata.totalDuration}s`);
    console.log(`   - Path: ${response.data.finalVideoPath}\n`);

    return response.data.finalVideoPath;
}

/**
 * Añadir enhancements (subtítulos virales)
 */
async function addEnhancements(sessionId) {
    console.log('\n✨ [6/6] Añadiendo subtítulos virales...\n');

    const response = await axios.post(
        `${BASE_URL}/api/veo3/add-enhancements`,
        {
            sessionId,
            enhancements: {
                blackFlashes: true,
                playerCard: false, // Outliers no tienen player card
                viralSubtitles: true
            }
        },
        { timeout: 120000 }
    );

    if (!response.data.success) {
        throw new Error('Error añadiendo enhancements: ' + response.data.error);
    }

    console.log('✅ Enhancements añadidos:');
    console.log(`   - Subtítulos: ${response.data.subtitlesAdded ? '✅' : '❌'}`);
    console.log(`   - Black flashes: ${response.data.blackFlashesAdded ? '✅' : '❌'}`);
    console.log(`   - Path final: ${response.data.enhancedVideoPath}\n`);

    return response.data.enhancedVideoPath;
}

/**
 * FLUJO PRINCIPAL
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 TEST: Outlier → Video con Carlos (SIN upload)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📍 Plataforma: ${PLATFORM.toUpperCase()}`);
    console.log(`👤 Presentador: ${PRESENTER}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const startTime = Date.now();

    try {
        // 1. Obtener outlier
        const outlier = await getTestOutlier();

        // 2. Generar script
        const script = await generateScript(outlier);

        // 3. FASE 1: Preparar sesión
        const sessionId = await prepareVEO3Session(script);

        // 4. FASE 2: Generar segmentos
        await generateSegments(sessionId);

        // 5. FASE 3: Finalizar video
        const finalVideoPath = await finalizeVideo(sessionId);

        // 6. Añadir enhancements
        const enhancedVideoPath = await addEnhancements(sessionId);

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 VIDEO GENERADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`⏱️  Tiempo total: ${totalTime} minutos`);
        console.log(`🎥 Video final: ${enhancedVideoPath}`);
        console.log(`📂 Session ID: ${sessionId}`);
        console.log('\n🎬 El video está listo para que Carlos lo revise.');
        console.log('   NO se ha subido a YouTube.');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN FLUJO:\n');
        console.error(error.message);
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

// Ejecutar
main();
