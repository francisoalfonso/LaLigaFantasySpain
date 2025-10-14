/**
 * Test E2E: Outlier Viral → Video VEO3 → YouTube Upload
 *
 * FLUJO COMPLETO:
 * 1. Obtener outlier más reciente sin procesar (status='detected')
 * 2. Generar guión optimizado con OutlierScriptGenerator
 * 3. Generar video VEO3 (3-Phase System)
 * 4. Añadir enhancements (subtítulos virales)
 * 5. Generar thumbnail automático
 * 6. Subir a YouTube con metadata optimizada
 * 7. Asignar a playlist "Outliers Virales"
 * 8. Marcar outlier como 'responded' en DB
 *
 * USAGE:
 * node scripts/veo3/test-e2e-outlier-to-youtube.js
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
 * Obtener el outlier top sin procesar
 */
async function getTopUnprocessedOutlier() {
    console.log('\n📊 [1/8] Obteniendo outlier sin procesar...\n');

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
 * Marcar outlier como 'analyzing'
 */
async function markOutlierAsAnalyzing(videoId) {
    const { error } = await supabase
        .from('youtube_outliers')
        .update({ processing_status: 'analyzing' })
        .eq('video_id', videoId);

    if (error) {
        console.warn(`⚠️ No se pudo actualizar status a 'analyzing': ${error.message}`);
    }
}

/**
 * Generar script desde outlier
 */
async function generateScript(outlier) {
    console.log('\n📝 [2/8] Generando script desde outlier...\n');

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
    console.log('\n🎬 [3/8] FASE 1: Preparando sesión VEO3...\n');

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
    console.log(`   - Script generado: ✅`);
    console.log(`   - Imágenes Nano Banana: ${response.data.nanoBananaImages?.length || 0}\n`);

    return sessionId;
}

/**
 * Fase 2: Generar 3 segmentos en paralelo
 */
async function generateSegments(sessionId) {
    console.log('\n🎥 [4/8] FASE 2: Generando 3 segmentos VEO3...\n');

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
    console.log('\n🎞️ [5/8] FASE 3: Finalizando video...\n');

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
    console.log('\n✨ [6/8] Añadiendo subtítulos virales...\n');

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
 * Subir a YouTube
 */
async function uploadToYouTube(videoPath, outlier, sessionId) {
    console.log('\n📤 [7/8] Subiendo a YouTube...\n');

    // Generar título optimizado
    const title = `¡Este video está ROMPIENDO YouTube! 🔥 ${outlier.channel_name}`;

    // Generar descripción
    const description = `Acabo de descubrir un video que está rompiendo el algoritmo de YouTube.

"${outlier.title.substring(0, 100)}..." del canal ${outlier.channel_name} lleva ${outlier.views.toLocaleString()} visualizaciones en tiempo récord.

En este video analizo:
✅ Por qué está funcionando tan bien
✅ Qué estrategias virales están usando
✅ Cómo podemos aplicarlo a nuestro contenido de Fantasy

💬 ¿Qué opinas de este outlier? Déjamelo en comentarios.

🔔 Suscríbete para más análisis de outliers virales.

#FantasyLaLiga #YouTubeOutliers #ContentStrategy`;

    const response = await axios.post(
        `${BASE_URL}/api/youtube/upload`,
        {
            videoPath,
            title,
            description,
            tags: [
                'Fantasy La Liga',
                'Outliers YouTube',
                'Estrategia viral',
                'Análisis de contenido',
                outlier.channel_name
            ],
            platform: PLATFORM,
            sessionId, // Para generar thumbnail
            autoGenerateThumbnail: true,
            autoAssignPlaylists: true,
            playlistCategory: 'outliers' // Crear/asignar a playlist "Outliers"
        },
        { timeout: 300000 } // 5 minutos para upload
    );

    if (!response.data.success) {
        throw new Error('Error subiendo a YouTube: ' + response.data.error);
    }

    console.log('✅ Video publicado en YouTube:');
    console.log(`   - Video ID: ${response.data.videoId}`);
    console.log(`   - URL: ${response.data.url}`);
    console.log(`   - Thumbnail: ${response.data.thumbnail?.uploaded ? '✅' : '❌'}`);
    console.log(`   - Playlist: ${response.data.playlists?.assigned ? '✅' : '❌'}\n`);

    return response.data;
}

/**
 * Marcar outlier como 'responded'
 */
async function markOutlierAsResponded(videoId, youtubeResponse) {
    console.log('\n✅ [8/8] Marcando outlier como respondido...\n');

    const { error } = await supabase
        .from('youtube_outliers')
        .update({
            processing_status: 'responded',
            response_video_id: youtubeResponse.videoId,
            response_url: youtubeResponse.url,
            responded_at: new Date().toISOString()
        })
        .eq('video_id', videoId);

    if (error) {
        throw new Error(`Error actualizando outlier: ${error.message}`);
    }

    console.log('✅ Outlier marcado como respondido en DB\n');
}

/**
 * FLUJO PRINCIPAL
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 TEST E2E: Outlier Viral → Video VEO3 → YouTube');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📍 Plataforma: ${PLATFORM.toUpperCase()}`);
    console.log(`👤 Presentador: ${PRESENTER}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const startTime = Date.now();

    try {
        // 1. Obtener outlier sin procesar
        const outlier = await getTopUnprocessedOutlier();
        await markOutlierAsAnalyzing(outlier.video_id);

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

        // 7. Subir a YouTube
        const youtubeResponse = await uploadToYouTube(enhancedVideoPath, outlier, sessionId);

        // 8. Marcar como respondido
        await markOutlierAsResponded(outlier.video_id, youtubeResponse);

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 FLUJO E2E COMPLETADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`⏱️  Tiempo total: ${totalTime} minutos`);
        console.log(`🎥 Video ID: ${youtubeResponse.videoId}`);
        console.log(`🔗 URL: ${youtubeResponse.url}`);
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN FLUJO E2E:\n');
        console.error(error.message);
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

// Ejecutar
main();
