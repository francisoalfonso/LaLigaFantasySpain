/**
 * YouTube Viral Channels - MEGA BÚSQUEDA
 *
 * Amplía la búsqueda a MÚLTIPLES nichos trending:
 * - Animales, dinosaurios, ciencia
 * - Gaming, tecnología, AI
 * - Comida, viajes, lifestyle
 * - Música, baile, entretenimiento
 *
 * Objetivo: Encontrar 50+ canales virales recientes (<3 meses)
 */

const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// MEGA lista de keywords trending 2025
const TRENDING_KEYWORDS = [
    // Animales & Naturaleza (muy viral)
    'dinosaurios', 'dinosaur', 'tiburon', 'shark', 'leon', 'tiger',
    'cocodrilo', 'snake', 'animales salvajes', 'animal rescue',
    'animales graciosos', 'cute animals', 'pets',

    // Ciencia & Tecnología
    'inteligencia artificial', 'AI', 'robot', 'tecnologia',
    'ciencia', 'experimentos', 'datos curiosos', 'facts',

    // Gaming (explosivo)
    'minecraft', 'fortnite', 'gta', 'roblox', 'free fire',
    'gaming', 'gameplay', 'speedrun',

    // Comida (siempre viral)
    'recetas', 'comida', 'food', 'cocina', 'chef',
    'street food', 'mukbang', 'recipe',

    // Entretenimiento
    'peliculas', 'series', 'trailer', 'marvel', 'dc',
    'anime', 'reacciones', 'reactions', 'memes',

    // Música & Baile
    'musica', 'music', 'remix', 'dance', 'baile',
    'challenge', 'tiktok', 'viral dance',

    // Deportes (no solo fútbol)
    'futbol', 'basketball', 'nba', 'ufc', 'boxeo',
    'deportes extremos', 'parkour', 'gimnasia',

    // Lifestyle & Viajes
    'viajes', 'travel', 'aventura', 'luxury', 'lujo',
    'motivacion', 'motivation', 'fitness',

    // Historia & Cultura
    'historia', 'history', 'misterios', 'leyendas',
    'mitologia', 'documentales', 'documentary',

    // Trending General
    'viral', 'tendencia', 'shorts', 'fyp', 'trending',
    'tutorial', 'como hacer', 'howto', 'tips', 'trucos'
];

console.log(`🎬 MEGA BÚSQUEDA - ${TRENDING_KEYWORDS.length} keywords diferentes\n`);

/**
 * Buscar canales virales con múltiples keywords
 */
async function megaSearch(options = {}) {
    const {
        publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxResultsPerKeyword = 50,
        minViewsPerVideo = 100000
    } = options;

    const channelsMap = new Map();
    let totalVideosScanned = 0;
    let requestCount = 0;

    console.log('🔍 Iniciando MEGA búsqueda...\n');
    console.log(`📅 Buscando videos publicados después de: ${new Date(publishedAfter).toLocaleDateString('es-ES')}`);
    console.log(`🎬 Mínimo ${minViewsPerVideo.toLocaleString()} visitas por video\n`);

    for (let i = 0; i < TRENDING_KEYWORDS.length; i++) {
        const keyword = TRENDING_KEYWORDS[i];
        const progress = `[${i + 1}/${TRENDING_KEYWORDS.length}]`;

        try {
            process.stdout.write(`${progress} 📡 "${keyword}"... `);

            const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
                params: {
                    key: YOUTUBE_API_KEY,
                    part: 'snippet',
                    type: 'video',
                    q: keyword,
                    publishedAfter: publishedAfter,
                    maxResults: maxResultsPerKeyword,
                    order: 'viewCount',
                    videoDuration: 'short', // Solo Shorts y videos cortos
                    regionCode: 'ES'
                }
            });

            requestCount++;
            const videos = searchResponse.data.items || [];
            totalVideosScanned += videos.length;

            if (videos.length > 0) {
                const videoIds = videos.map(v => v.id.videoId).join(',');

                const statsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
                    params: {
                        key: YOUTUBE_API_KEY,
                        part: 'statistics,snippet',
                        id: videoIds
                    }
                });

                requestCount++;
                const videosWithStats = statsResponse.data.items || [];

                let viralCount = 0;
                videosWithStats.forEach(video => {
                    const viewCount = parseInt(video.statistics.viewCount || 0);

                    if (viewCount >= minViewsPerVideo) {
                        viralCount++;
                        const channelId = video.snippet.channelId;
                        const channelTitle = video.snippet.channelTitle;

                        if (!channelsMap.has(channelId)) {
                            channelsMap.set(channelId, {
                                channelId,
                                channelTitle,
                                bestVideoViews: viewCount,
                                bestVideoTitle: video.snippet.title,
                                totalViralVideos: 1,
                                keywords: [keyword]
                            });
                        } else {
                            const existing = channelsMap.get(channelId);
                            existing.totalViralVideos++;
                            if (!existing.keywords.includes(keyword)) {
                                existing.keywords.push(keyword);
                            }
                            if (viewCount > existing.bestVideoViews) {
                                existing.bestVideoViews = viewCount;
                                existing.bestVideoTitle = video.snippet.title;
                            }
                        }
                    }
                });

                console.log(`✅ ${viralCount} virales | Total canales: ${channelsMap.size}`);
            } else {
                console.log('⚠️  0 resultados');
            }

            // Rate limiting agresivo (evitar quota exceeded)
            await new Promise(resolve => setTimeout(resolve, 150));

        } catch (error) {
            if (error.response?.status === 403) {
                console.log(`\n\n❌ CUOTA EXCEDIDA después de ${requestCount} requests`);
                console.log(`✅ Canales únicos encontrados hasta ahora: ${channelsMap.size}`);
                break;
            }
            console.log(`❌ Error: ${error.message}`);
        }
    }

    console.log(`\n📊 Scan completo:`);
    console.log(`   - Videos analizados: ${totalVideosScanned.toLocaleString()}`);
    console.log(`   - API requests: ${requestCount}`);
    console.log(`   - Canales únicos: ${channelsMap.size}`);

    return Array.from(channelsMap.values());
}

/**
 * Obtener estadísticas completas
 */
async function getChannelStatistics(channelInfos) {
    const BATCH_SIZE = 50;
    const allChannels = [];

    console.log(`\n📊 Obteniendo estadísticas de ${channelInfos.length} canales...\n`);

    for (let i = 0; i < channelInfos.length; i += BATCH_SIZE) {
        const batch = channelInfos.slice(i, i + BATCH_SIZE);
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

                const createdAt = new Date(snippet.publishedAt);
                const now = new Date();
                const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                const monthsOld = Math.floor(daysOld / 30);

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
                    totalViralVideos: channelInfo?.totalViralVideos || 0,
                    keywords: channelInfo?.keywords || [],
                    url: `https://youtube.com/channel/${channel.id}`
                });
            });

            const percentage = ((i + batch.length) / channelInfos.length * 100).toFixed(0);
            console.log(`   [${percentage}%] ${allChannels.length}/${channelInfos.length} procesados`);

            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`   ❌ Error en batch: ${error.message}`);
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
        maxMonthsOld = 3,
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
            // Ordenar por: más recientes primero, luego por más videos virales
            if (a.monthsOld !== b.monthsOld) {
                return a.monthsOld - b.monthsOld;
            }
            return b.totalViralVideos - a.totalViralVideos;
        });
}

/**
 * Análisis por nicho
 */
function analyzeByNiche(channels) {
    const nicheMap = new Map();

    channels.forEach(channel => {
        channel.keywords.forEach(keyword => {
            if (!nicheMap.has(keyword)) {
                nicheMap.set(keyword, []);
            }
            nicheMap.get(keyword).push(channel);
        });
    });

    // Top 10 nichos más virales
    const topNiches = Array.from(nicheMap.entries())
        .map(([keyword, channels]) => ({
            keyword,
            channelCount: channels.length,
            avgRatio: (channels.reduce((sum, c) => sum + parseFloat(c.ratio), 0) / channels.length).toFixed(2),
            totalViews: channels.reduce((sum, c) => sum + c.viewCount, 0)
        }))
        .sort((a, b) => b.channelCount - a.channelCount)
        .slice(0, 10);

    return topNiches;
}

/**
 * Display mejorado
 */
function displayResults(channels, criteria) {
    if (channels.length === 0) {
        console.log('\n❌ No se encontraron canales con TODOS los criterios');
        return;
    }

    console.log(`\n\n🎉 ENCONTRADOS ${channels.length} CANALES VIRALES RECIENTES\n`);
    console.log('═'.repeat(130));

    channels.forEach((channel, index) => {
        console.log(`\n${index + 1}. ${channel.title}`);
        console.log(`   🔗 ${channel.url}`);
        console.log(`   👥 Suscriptores: ${channel.subscriberCount.toLocaleString()} | 👀 Visitas: ${channel.viewCount.toLocaleString()}`);
        console.log(`   🎬 Videos: ${channel.videoCount} (${channel.totalViralVideos} virales) | Promedio: ${channel.avgViewsPerVideo.toLocaleString()}/video`);
        console.log(`   📊 Ratio: ${channel.ratio}x | ⏰ Antigüedad: ${channel.monthsOld} meses (${channel.daysOld} días)`);
        console.log(`   🔥 Mejor video: ${channel.bestVideoViews.toLocaleString()} visitas`);
        console.log(`      "${channel.bestVideoTitle.substring(0, 90)}${channel.bestVideoTitle.length > 90 ? '...' : ''}"`);
        console.log(`   🏷️  Nichos: ${channel.keywords.slice(0, 5).join(', ')}${channel.keywords.length > 5 ? '...' : ''}`);
    });

    console.log('\n' + '═'.repeat(130));

    // Análisis por nicho
    console.log('\n📊 TOP 10 NICHOS MÁS VIRALES:\n');
    const topNiches = analyzeByNiche(channels);
    topNiches.forEach((niche, i) => {
        console.log(`   ${i + 1}. "${niche.keyword}": ${niche.channelCount} canales | Ratio avg: ${niche.avgRatio}x | ${(niche.totalViews / 1000000).toFixed(1)}M visitas totales`);
    });

    // Top performers
    console.log('\n🏆 TOP 5 POR RATIO (Más viral):\n');
    const topByRatio = [...channels].sort((a, b) => b.ratio - a.ratio).slice(0, 5);
    topByRatio.forEach((ch, i) => {
        console.log(`   ${i + 1}. ${ch.title} - ${ch.ratio}x (${ch.monthsOld} meses)`);
    });

    console.log('\n🆕 TOP 5 MÁS RECIENTES:\n');
    const topByAge = [...channels].sort((a, b) => a.daysOld - b.daysOld).slice(0, 5);
    topByAge.forEach((ch, i) => {
        console.log(`   ${i + 1}. ${ch.title} - ${ch.daysOld} días (${ch.ratio}x ratio, ${ch.subscriberCount.toLocaleString()} subs)`);
    });
}

/**
 * Main
 */
async function main() {
    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY no encontrada');
        process.exit(1);
    }

    const criteria = {
        minViews: 1000000, // 1M visitas
        maxSubscribers: 100000, // 100K subs
        maxMonthsOld: 3, // 3 meses
        minRatio: 10 // 10x ratio
    };

    console.log('⚠️  NOTA: Búsqueda amplia puede consumir cuota YouTube API rápidamente\n');

    try {
        const startTime = Date.now();

        // Paso 1: Mega búsqueda
        const uniqueChannels = await megaSearch({
            publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            maxResultsPerKeyword: 50,
            minViewsPerVideo: 100000
        });

        if (uniqueChannels.length === 0) {
            console.log('❌ No se encontraron canales');
            process.exit(0);
        }

        // Paso 2: Estadísticas completas
        const channelsWithStats = await getChannelStatistics(uniqueChannels);

        // Paso 3: Filtrar virales
        console.log('\n🔧 Filtrando canales virales...\n');
        const viralChannels = filterViralChannels(channelsWithStats, criteria);

        // Mostrar resultados
        displayResults(viralChannels, criteria);

        // Guardar
        const fs = require('fs');
        const outputPath = './output/youtube-viral-channels-mega.json';

        fs.writeFileSync(outputPath, JSON.stringify({
            criteria,
            timestamp: new Date().toISOString(),
            totalScanned: channelsWithStats.length,
            totalViral: viralChannels.length,
            channels: viralChannels,
            stats: {
                avgRatio: (viralChannels.reduce((sum, c) => sum + parseFloat(c.ratio), 0) / viralChannels.length).toFixed(2),
                avgAge: Math.floor(viralChannels.reduce((sum, c) => sum + c.monthsOld, 0) / viralChannels.length),
                avgSubs: Math.floor(viralChannels.reduce((sum, c) => sum + c.subscriberCount, 0) / viralChannels.length),
                avgViews: Math.floor(viralChannels.reduce((sum, c) => sum + c.viewCount, 0) / viralChannels.length)
            }
        }, null, 2));

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏱️  Tiempo total: ${duration}s`);
        console.log(`💾 Resultados guardados en: ${outputPath}`);

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        process.exit(1);
    }
}

main();
