/**
 * YouTube Viral Channels Search
 *
 * Busca canales con:
 * - Millones de visitas
 * - Menos de 100K suscriptores
 * - Alto ratio visitas/suscriptores (indica canal nuevo viral)
 *
 * Uso:
 * node scripts/youtube-viral-channels-search.js
 */

const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Buscar canales virales en nicho específico
 */
async function searchViralChannels(options = {}) {
    const {
        keyword = 'fantasy la liga',
        maxResults = 50,
        publishedAfter = null, // ISO 8601 date
        minViews = 1000000, // 1M visitas mínimo
        maxSubscribers = 100000, // 100K subs máximo
        minRatio = 10 // Ratio mínimo visitas/suscriptores
    } = options;

    console.log('🔍 Buscando canales virales en YouTube...\n');
    console.log('📋 Criterios:');
    console.log(`   - Keyword: "${keyword}"`);
    console.log(`   - Visitas mínimas: ${minViews.toLocaleString()}`);
    console.log(`   - Suscriptores máximos: ${maxSubscribers.toLocaleString()}`);
    console.log(`   - Ratio mínimo: ${minRatio}x`);
    if (publishedAfter) {
        console.log(`   - Creados después de: ${publishedAfter}`);
    }
    console.log('');

    try {
        // Paso 1: Buscar canales por keyword
        const searchParams = {
            key: YOUTUBE_API_KEY,
            part: 'snippet',
            type: 'channel',
            q: keyword,
            maxResults: maxResults,
            order: 'viewCount', // Ordenar por más vistas
        };

        if (publishedAfter) {
            searchParams.publishedAfter = publishedAfter;
        }

        console.log('📡 Paso 1: Buscando canales...');
        const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
            params: searchParams
        });

        const channels = searchResponse.data.items || [];
        console.log(`✅ Encontrados ${channels.length} canales\n`);

        if (channels.length === 0) {
            console.log('❌ No se encontraron canales con ese keyword');
            return [];
        }

        // Paso 2: Obtener estadísticas detalladas de cada canal
        const channelIds = channels.map(c => c.id.channelId).join(',');

        console.log('📊 Paso 2: Obteniendo estadísticas...');
        const statsResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
            params: {
                key: YOUTUBE_API_KEY,
                part: 'snippet,statistics,contentDetails',
                id: channelIds
            }
        });

        const channelsWithStats = statsResponse.data.items || [];

        // Paso 3: Filtrar y calcular ratios
        console.log('🔧 Paso 3: Filtrando y calculando ratios...\n');

        const viralChannels = channelsWithStats
            .map(channel => {
                const stats = channel.statistics;
                const snippet = channel.snippet;

                const viewCount = parseInt(stats.viewCount || 0);
                const subscriberCount = parseInt(stats.subscriberCount || 0);
                const videoCount = parseInt(stats.videoCount || 0);

                // Calcular ratio visitas/suscriptores
                const ratio = subscriberCount > 0 ? viewCount / subscriberCount : 0;

                // Calcular días desde creación (aproximado)
                const createdAt = new Date(snippet.publishedAt);
                const now = new Date();
                const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

                return {
                    channelId: channel.id,
                    title: snippet.title,
                    description: snippet.description,
                    customUrl: snippet.customUrl || 'N/A',
                    publishedAt: snippet.publishedAt,
                    daysOld: daysOld,
                    monthsOld: Math.floor(daysOld / 30),
                    thumbnails: snippet.thumbnails,
                    viewCount: viewCount,
                    subscriberCount: subscriberCount,
                    videoCount: videoCount,
                    ratio: ratio.toFixed(2),
                    url: `https://youtube.com/channel/${channel.id}`
                };
            })
            .filter(channel => {
                // Aplicar filtros
                const meetsViews = channel.viewCount >= minViews;
                const meetsSubs = channel.subscriberCount <= maxSubscribers;
                const meetsRatio = channel.ratio >= minRatio;

                return meetsViews && meetsSubs && meetsRatio;
            })
            .sort((a, b) => b.ratio - a.ratio); // Ordenar por ratio descendente

        return viralChannels;

    } catch (error) {
        console.error('❌ Error en búsqueda:', error.message);
        if (error.response) {
            console.error('Detalles:', error.response.data);
        }
        throw error;
    }
}

/**
 * Mostrar resultados
 */
function displayResults(channels) {
    if (channels.length === 0) {
        console.log('❌ No se encontraron canales que cumplan los criterios\n');
        console.log('💡 Sugerencias:');
        console.log('   - Aumentar maxSubscribers');
        console.log('   - Reducir minViews');
        console.log('   - Reducir minRatio');
        console.log('   - Cambiar keyword de búsqueda');
        return;
    }

    console.log(`\n🎉 ENCONTRADOS ${channels.length} CANALES VIRALES\n`);
    console.log('═'.repeat(100));

    channels.forEach((channel, index) => {
        console.log(`\n${index + 1}. ${channel.title}`);
        console.log(`   🔗 URL: ${channel.url}`);
        console.log(`   👥 Suscriptores: ${channel.subscriberCount.toLocaleString()}`);
        console.log(`   👀 Visitas totales: ${channel.viewCount.toLocaleString()}`);
        console.log(`   🎬 Videos: ${channel.videoCount}`);
        console.log(`   📊 Ratio visitas/subs: ${channel.ratio}x`);
        console.log(`   📅 Creado: ${new Date(channel.publishedAt).toLocaleDateString('es-ES')}`);
        console.log(`   ⏰ Antigüedad: ${channel.monthsOld} meses (${channel.daysOld} días)`);

        if (channel.description) {
            const shortDesc = channel.description.substring(0, 100);
            console.log(`   📝 Descripción: ${shortDesc}${channel.description.length > 100 ? '...' : ''}`);
        }
    });

    console.log('\n' + '═'.repeat(100));
    console.log('\n📊 RESUMEN ESTADÍSTICO\n');

    const avgRatio = (channels.reduce((sum, c) => sum + parseFloat(c.ratio), 0) / channels.length).toFixed(2);
    const avgSubs = Math.floor(channels.reduce((sum, c) => sum + c.subscriberCount, 0) / channels.length);
    const avgViews = Math.floor(channels.reduce((sum, c) => sum + c.viewCount, 0) / channels.length);
    const avgMonths = Math.floor(channels.reduce((sum, c) => sum + c.monthsOld, 0) / channels.length);

    console.log(`Ratio promedio: ${avgRatio}x`);
    console.log(`Suscriptores promedio: ${avgSubs.toLocaleString()}`);
    console.log(`Visitas promedio: ${avgViews.toLocaleString()}`);
    console.log(`Antigüedad promedio: ${avgMonths} meses`);

    console.log('\n🎯 TOP 3 POR RATIO (Más viral):');
    channels.slice(0, 3).forEach((channel, index) => {
        console.log(`   ${index + 1}. ${channel.title} (${channel.ratio}x)`);
    });

    console.log('\n🆕 TOP 3 MÁS RECIENTES:');
    const recentChannels = [...channels].sort((a, b) => a.monthsOld - b.monthsOld);
    recentChannels.slice(0, 3).forEach((channel, index) => {
        console.log(`   ${index + 1}. ${channel.title} (${channel.monthsOld} meses, ${channel.ratio}x ratio)`);
    });
}

/**
 * Main execution
 */
async function main() {
    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY no encontrada en .env');
        console.log('\n💡 Configura tu API key:');
        console.log('   1. Ve a https://console.cloud.google.com/');
        console.log('   2. Crea un proyecto o usa uno existente');
        console.log('   3. Habilita YouTube Data API v3');
        console.log('   4. Crea credenciales (API Key)');
        console.log('   5. Agrega YOUTUBE_API_KEY=tu_key a .env');
        process.exit(1);
    }

    // Configuración de búsqueda
    const searchConfig = {
        keyword: 'fantasy la liga',
        maxResults: 50, // YouTube API max 50 por request
        minViews: 1000000, // 1M visitas mínimo
        maxSubscribers: 100000, // 100K subs máximo
        minRatio: 10, // Ratio 10x mínimo (indica viralidad)
        // publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Últimos 3 meses
    };

    console.log('🎬 YouTube Viral Channels Search\n');
    console.log('⚠️  NOTA: La API de YouTube no permite filtrar por fecha de creación exacta.');
    console.log('    Usamos ratio visitas/suscriptores como proxy de "canal nuevo viral".\n');

    try {
        const startTime = Date.now();

        const viralChannels = await searchViralChannels(searchConfig);

        displayResults(viralChannels);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏱️  Tiempo de ejecución: ${duration}s`);

        // Guardar resultados en JSON
        const fs = require('fs');
        const outputPath = './output/youtube-viral-channels.json';

        const outputDir = './output';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify({
            searchConfig,
            timestamp: new Date().toISOString(),
            totalFound: viralChannels.length,
            channels: viralChannels
        }, null, 2));

        console.log(`\n💾 Resultados guardados en: ${outputPath}`);

    } catch (error) {
        console.error('\n💥 Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main();
