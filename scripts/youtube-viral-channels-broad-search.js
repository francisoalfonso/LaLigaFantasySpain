/**
 * YouTube Viral Channels - Búsqueda Amplia
 *
 * Busca canales virales recientes en CUALQUIER nicho:
 * - Millones de visitas
 * - Menos de 100K suscriptores
 * - Creados recientemente (últimos 3-6 meses)
 *
 * Usa múltiples estrategias de búsqueda para maximizar resultados
 */

const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Estrategia: Buscar videos virales recientes y obtener sus canales
 */
async function findViralChannelsFromVideos(options = {}) {
    const {
        publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 meses
        maxResults = 50,
        minViewsPerVideo = 100000 // 100K visitas por video
    } = options;

    console.log('🎬 Estrategia: Buscar canales a través de videos virales\n');

    // Keywords trending en España 2025
    const trendingKeywords = [
        'viral',
        'tendencia',
        'shorts',
        'challenge',
        'tutorial',
        'datos',
        'estadísticas',
        'análisis'
    ];

    const channelsMap = new Map();

    for (const keyword of trendingKeywords) {
        try {
            console.log(`📡 Buscando videos con "${keyword}"...`);

            const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
                params: {
                    key: YOUTUBE_API_KEY,
                    part: 'snippet',
                    type: 'video',
                    q: keyword,
                    publishedAfter: publishedAfter,
                    maxResults: maxResults,
                    order: 'viewCount',
                    relevanceLanguage: 'es',
                    regionCode: 'ES'
                }
            });

            const videos = searchResponse.data.items || [];

            // Obtener estadísticas de videos
            if (videos.length > 0) {
                const videoIds = videos.map(v => v.id.videoId).join(',');

                const statsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
                    params: {
                        key: YOUTUBE_API_KEY,
                        part: 'statistics,snippet',
                        id: videoIds
                    }
                });

                const videosWithStats = statsResponse.data.items || [];

                // Extraer canales únicos
                videosWithStats.forEach(video => {
                    const viewCount = parseInt(video.statistics.viewCount || 0);

                    if (viewCount >= minViewsPerVideo) {
                        const channelId = video.snippet.channelId;
                        const channelTitle = video.snippet.channelTitle;

                        if (!channelsMap.has(channelId)) {
                            channelsMap.set(channelId, {
                                channelId,
                                channelTitle,
                                bestVideoViews: viewCount,
                                bestVideoTitle: video.snippet.title
                            });
                        } else {
                            // Actualizar mejor video si este tiene más vistas
                            const existing = channelsMap.get(channelId);
                            if (viewCount > existing.bestVideoViews) {
                                existing.bestVideoViews = viewCount;
                                existing.bestVideoTitle = video.snippet.title;
                            }
                        }
                    }
                });
            }

            console.log(`   ✅ ${videos.length} videos encontrados`);

            // Rate limiting (evitar quota exceeded)
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`   ❌ Error con keyword "${keyword}":`, error.message);
        }
    }

    console.log(`\n✅ Total canales únicos encontrados: ${channelsMap.size}\n`);

    return Array.from(channelsMap.values());
}

/**
 * Obtener estadísticas completas de canales
 */
async function getChannelStatistics(channelIds) {
    const BATCH_SIZE = 50; // YouTube API max 50 IDs por request
    const allChannels = [];

    console.log('📊 Obteniendo estadísticas de canales...\n');

    for (let i = 0; i < channelIds.length; i += BATCH_SIZE) {
        const batch = channelIds.slice(i, i + BATCH_SIZE);
        const idsString = batch.map(c => c.channelId).join(',');

        try {
            const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
                params: {
                    key: YOUTUBE_API_KEY,
                    part: 'snippet,statistics,contentDetails',
                    id: idsString
                }
            });

            const channels = response.data.items || [];

            channels.forEach(channel => {
                const stats = channel.statistics;
                const snippet = channel.snippet;

                const viewCount = parseInt(stats.viewCount || 0);
                const subscriberCount = parseInt(stats.subscriberCount || 0);
                const videoCount = parseInt(stats.videoCount || 0);

                // Calcular antigüedad
                const createdAt = new Date(snippet.publishedAt);
                const now = new Date();
                const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                const monthsOld = Math.floor(daysOld / 30);

                // Encontrar info del mejor video
                const channelInfo = batch.find(c => c.channelId === channel.id);

                allChannels.push({
                    channelId: channel.id,
                    title: snippet.title,
                    description: snippet.description,
                    customUrl: snippet.customUrl || 'N/A',
                    publishedAt: snippet.publishedAt,
                    createdAt: createdAt,
                    daysOld: daysOld,
                    monthsOld: monthsOld,
                    viewCount: viewCount,
                    subscriberCount: subscriberCount,
                    videoCount: videoCount,
                    ratio: subscriberCount > 0 ? (viewCount / subscriberCount).toFixed(2) : 0,
                    avgViewsPerVideo: videoCount > 0 ? Math.floor(viewCount / videoCount) : 0,
                    bestVideoViews: channelInfo?.bestVideoViews || 0,
                    bestVideoTitle: channelInfo?.bestVideoTitle || '',
                    url: `https://youtube.com/channel/${channel.id}`
                });
            });

            console.log(`   Procesados ${allChannels.length}/${channelIds.length} canales`);

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error('   ❌ Error obteniendo stats:', error.message);
        }
    }

    return allChannels;
}

/**
 * Filtrar canales virales
 */
function filterViralChannels(channels, criteria) {
    const {
        minViews = 1000000,
        maxSubscribers = 100000,
        maxMonthsOld = 6,
        minRatio = 10
    } = criteria;

    return channels
        .filter(channel => {
            const meetsViews = channel.viewCount >= minViews;
            const meetsSubs = channel.subscriberCount <= maxSubscribers && channel.subscriberCount > 0;
            const meetsAge = channel.monthsOld <= maxMonthsOld;
            const meetsRatio = channel.ratio >= minRatio;

            return meetsViews && meetsSubs && meetsAge && meetsRatio;
        })
        .sort((a, b) => {
            // Ordenar por: primero más recientes, luego por ratio
            if (a.monthsOld !== b.monthsOld) {
                return a.monthsOld - b.monthsOld;
            }
            return b.ratio - a.ratio;
        });
}

/**
 * Mostrar resultados mejorados
 */
function displayResults(channels, criteria) {
    if (channels.length === 0) {
        console.log('\n❌ No se encontraron canales que cumplan TODOS los criterios:\n');
        console.log(`   ✅ Visitas mínimas: ${criteria.minViews.toLocaleString()}`);
        console.log(`   ✅ Suscriptores máximos: ${criteria.maxSubscribers.toLocaleString()}`);
        console.log(`   ✅ Antigüedad máxima: ${criteria.maxMonthsOld} meses`);
        console.log(`   ✅ Ratio mínimo: ${criteria.minRatio}x`);
        console.log('\n💡 Esto es NORMAL. Canales nuevos con millones de visitas son extremadamente raros.');
        console.log('   La mayoría de canales virales tardan 6-12 meses en acumular esas vistas.');
        return;
    }

    console.log(`\n🎉 ENCONTRADOS ${channels.length} CANALES VIRALES RECIENTES\n`);
    console.log('═'.repeat(120));

    channels.forEach((channel, index) => {
        console.log(`\n${index + 1}. ${channel.title}`);
        console.log(`   🔗 URL: ${channel.url}`);
        console.log(`   👥 Suscriptores: ${channel.subscriberCount.toLocaleString()}`);
        console.log(`   👀 Visitas totales: ${channel.viewCount.toLocaleString()}`);
        console.log(`   🎬 Videos: ${channel.videoCount} (promedio ${channel.avgViewsPerVideo.toLocaleString()} visitas/video)`);
        console.log(`   📊 Ratio visitas/subs: ${channel.ratio}x`);
        console.log(`   📅 Creado: ${channel.createdAt.toLocaleDateString('es-ES')}`);
        console.log(`   ⏰ Antigüedad: ${channel.monthsOld} meses (${channel.daysOld} días)`);
        console.log(`   🔥 Mejor video: ${channel.bestVideoViews.toLocaleString()} visitas`);
        console.log(`      "${channel.bestVideoTitle.substring(0, 80)}${channel.bestVideoTitle.length > 80 ? '...' : ''}"`);

        if (channel.description) {
            const shortDesc = channel.description.substring(0, 100);
            console.log(`   📝 ${shortDesc}${channel.description.length > 100 ? '...' : ''}`);
        }
    });

    console.log('\n' + '═'.repeat(120));
}

/**
 * Main
 */
async function main() {
    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY no encontrada');
        process.exit(1);
    }

    console.log('🎬 YouTube Viral Channels - Búsqueda Amplia (Todos los nichos)\n');
    console.log('🔍 Buscando canales virales creados en los últimos 3 meses...\n');

    const criteria = {
        minViews: 1000000, // 1M visitas
        maxSubscribers: 100000, // 100K subs
        maxMonthsOld: 3, // 3 meses
        minRatio: 10 // Ratio 10x
    };

    try {
        const startTime = Date.now();

        // Paso 1: Encontrar canales a través de videos virales
        const uniqueChannels = await findViralChannelsFromVideos({
            publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            maxResults: 50,
            minViewsPerVideo: 100000
        });

        if (uniqueChannels.length === 0) {
            console.log('❌ No se encontraron videos virales recientes');
            process.exit(0);
        }

        // Paso 2: Obtener estadísticas completas
        const channelsWithStats = await getChannelStatistics(uniqueChannels);

        // Paso 3: Filtrar canales virales
        console.log('\n🔧 Filtrando canales virales...\n');
        const viralChannels = filterViralChannels(channelsWithStats, criteria);

        // Mostrar resultados
        displayResults(viralChannels, criteria);

        // Guardar
        const fs = require('fs');
        const outputPath = './output/youtube-viral-channels-broad.json';

        fs.writeFileSync(outputPath, JSON.stringify({
            criteria,
            timestamp: new Date().toISOString(),
            totalScanned: channelsWithStats.length,
            totalViral: viralChannels.length,
            channels: viralChannels
        }, null, 2));

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏱️  Tiempo: ${duration}s`);
        console.log(`💾 Guardado en: ${outputPath}`);

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        process.exit(1);
    }
}

main();
