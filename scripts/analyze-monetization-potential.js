/**
 * Análisis de Potencial de Monetización - YouTube Shorts
 *
 * Analiza los 136 canales virales encontrados y calcula:
 * - RPM estimado por nicho
 * - Ingresos mensuales actuales (si están monetizados)
 * - Potencial de crecimiento
 * - Mejores oportunidades de replicación
 */

const fs = require('fs');

// RPM (Revenue Per Mille) por nicho en YouTube Shorts 2025
// Fuente: Análisis de mercado YouTube Partner Program
const NICHE_RPM = {
    // Alto CPM (nichos premium)
    'AI': { min: 2, max: 5, avg: 3.5, sustainability: 'HIGH' },
    'inteligencia artificial': { min: 2, max: 5, avg: 3.5, sustainability: 'HIGH' },
    'tecnologia': { min: 1.5, max: 4, avg: 2.5, sustainability: 'HIGH' },
    'robot': { min: 1.5, max: 4, avg: 2.5, sustainability: 'HIGH' },

    // Medio-Alto CPM
    'documentary': { min: 2, max: 4, avg: 3, sustainability: 'HIGH' },
    'documentales': { min: 2, max: 4, avg: 3, sustainability: 'HIGH' },
    'historia': { min: 1.5, max: 3.5, avg: 2.5, sustainability: 'MEDIUM' },
    'history': { min: 1.5, max: 3.5, avg: 2.5, sustainability: 'MEDIUM' },
    'ciencia': { min: 1.5, max: 3, avg: 2.2, sustainability: 'HIGH' },
    'experimentos': { min: 1.2, max: 2.8, avg: 2, sustainability: 'MEDIUM' },

    // Medio CPM
    'motivation': { min: 1, max: 3, avg: 2, sustainability: 'MEDIUM' },
    'motivacion': { min: 1, max: 3, avg: 2, sustainability: 'MEDIUM' },
    'fitness': { min: 1, max: 2.5, avg: 1.7, sustainability: 'MEDIUM' },
    'datos curiosos': { min: 0.8, max: 2, avg: 1.4, sustainability: 'MEDIUM' },
    'facts': { min: 0.8, max: 2, avg: 1.4, sustainability: 'MEDIUM' },

    // Medio-Bajo CPM (alto volumen)
    'gaming': { min: 0.5, max: 1.5, avg: 1, sustainability: 'HIGH' },
    'minecraft': { min: 0.5, max: 1.2, avg: 0.8, sustainability: 'HIGH' },
    'fortnite': { min: 0.5, max: 1.2, avg: 0.8, sustainability: 'MEDIUM' },
    'roblox': { min: 0.4, max: 1, avg: 0.7, sustainability: 'MEDIUM' },

    // Deportes
    'futbol': { min: 0.5, max: 2, avg: 1.2, sustainability: 'HIGH' },
    'basketball': { min: 0.6, max: 2.2, avg: 1.4, sustainability: 'MEDIUM' },
    'nba': { min: 0.6, max: 2.2, avg: 1.4, sustainability: 'MEDIUM' },
    'ufc': { min: 0.8, max: 2.5, avg: 1.6, sustainability: 'HIGH' },
    'boxeo': { min: 0.8, max: 2.5, avg: 1.6, sustainability: 'HIGH' },

    // Entretenimiento general (bajo CPM, alto volumen)
    'viral': { min: 0.3, max: 1, avg: 0.6, sustainability: 'LOW' },
    'challenge': { min: 0.4, max: 1.2, avg: 0.8, sustainability: 'LOW' },
    'memes': { min: 0.3, max: 0.9, avg: 0.6, sustainability: 'LOW' },
    'reacciones': { min: 0.4, max: 1.1, avg: 0.7, sustainability: 'LOW' },
    'reactions': { min: 0.4, max: 1.1, avg: 0.7, sustainability: 'LOW' },

    // Animales & Naturaleza
    'cute animals': { min: 0.5, max: 1.5, avg: 1, sustainability: 'MEDIUM' },
    'pets': { min: 0.5, max: 1.5, avg: 1, sustainability: 'MEDIUM' },
    'animal rescue': { min: 0.6, max: 1.8, avg: 1.2, sustainability: 'MEDIUM' },
    'dinosaurios': { min: 0.8, max: 2, avg: 1.4, sustainability: 'LOW' },
    'dinosaur': { min: 0.8, max: 2, avg: 1.4, sustainability: 'LOW' },

    // Comida
    'recetas': { min: 0.8, max: 2.2, avg: 1.5, sustainability: 'HIGH' },
    'food': { min: 0.8, max: 2.2, avg: 1.5, sustainability: 'HIGH' },
    'cocina': { min: 0.8, max: 2.2, avg: 1.5, sustainability: 'HIGH' },

    // Música
    'musica': { min: 0.4, max: 1, avg: 0.7, sustainability: 'MEDIUM' },
    'music': { min: 0.4, max: 1, avg: 0.7, sustainability: 'MEDIUM' },
    'remix': { min: 0.3, max: 0.9, avg: 0.6, sustainability: 'LOW' },

    // Default
    'default': { min: 0.4, max: 1.2, avg: 0.8, sustainability: 'LOW' }
};

/**
 * Calcular RPM promedio para un canal basado en sus nichos
 */
function calculateChannelRPM(channel) {
    if (!channel.keywords || channel.keywords.length === 0) {
        return NICHE_RPM['default'].avg;
    }

    let totalRPM = 0;
    let count = 0;

    for (const keyword of channel.keywords) {
        const nicheData = NICHE_RPM[keyword.toLowerCase()] || NICHE_RPM['default'];
        totalRPM += nicheData.avg;
        count++;
    }

    return count > 0 ? totalRPM / count : NICHE_RPM['default'].avg;
}

/**
 * Estimar ingresos mensuales actuales
 */
function estimateMonthlyRevenue(channel, rpm) {
    // Calcular visitas mensuales estimadas
    const daysActive = channel.daysOld || 1;
    const avgDailyViews = channel.viewCount / daysActive;
    const monthlyViews = avgDailyViews * 30;

    // Revenue = (Visitas / 1000) * RPM
    const monthlyRevenue = (monthlyViews / 1000) * rpm;

    return {
        monthlyViews: Math.floor(monthlyViews),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        annualRevenue: (monthlyRevenue * 12).toFixed(2)
    };
}

/**
 * Calcular score de sostenibilidad
 */
function calculateSustainabilityScore(channel) {
    let score = 0;

    // Factor 1: Diversidad de nichos (max 25 puntos)
    const uniqueKeywords = new Set(channel.keywords.map(k => k.toLowerCase()));
    score += Math.min(uniqueKeywords.size * 5, 25);

    // Factor 2: Sostenibilidad de nichos (max 30 puntos)
    const sustainabilityScores = {
        'HIGH': 30,
        'MEDIUM': 20,
        'LOW': 10
    };

    let avgSustainability = 0;
    let sustainCount = 0;
    for (const keyword of channel.keywords) {
        const nicheData = NICHE_RPM[keyword.toLowerCase()] || NICHE_RPM['default'];
        avgSustainability += sustainabilityScores[nicheData.sustainability] || 10;
        sustainCount++;
    }
    score += sustainCount > 0 ? avgSustainability / sustainCount : 10;

    // Factor 3: Consistencia de publicación (max 25 puntos)
    const videosPerDay = channel.videoCount / channel.daysOld;
    if (videosPerDay >= 2) score += 25;
    else if (videosPerDay >= 1) score += 20;
    else if (videosPerDay >= 0.5) score += 15;
    else score += 10;

    // Factor 4: Eficiencia (max 20 puntos)
    const efficiency = channel.avgViewsPerVideo;
    if (efficiency >= 500000) score += 20;
    else if (efficiency >= 250000) score += 15;
    else if (efficiency >= 100000) score += 10;
    else score += 5;

    return Math.min(score, 100);
}

/**
 * Determinar si canal es 100% Shorts
 */
function isShortsFocused(channel) {
    // Heurística: Si tiene muchos videos (>30) y alto avgViewsPerVideo, probablemente es Shorts
    const highVideoCount = channel.videoCount >= 30;
    const highAvgViews = channel.avgViewsPerVideo >= 50000;
    const recentChannel = channel.monthsOld <= 3;

    return highVideoCount && highAvgViews && recentChannel;
}

/**
 * Análisis principal
 */
function analyzeMonetization() {
    // Leer datos
    const data = JSON.parse(fs.readFileSync('./output/youtube-viral-channels-mega.json', 'utf8'));
    const channels = data.channels;

    console.log('💰 ANÁLISIS DE POTENCIAL DE MONETIZACIÓN - YouTube Shorts\n');
    console.log(`📊 Analizando ${channels.length} canales virales...\n`);

    // Analizar cada canal
    const analyzed = channels.map(channel => {
        const rpm = calculateChannelRPM(channel);
        const revenue = estimateMonthlyRevenue(channel, rpm);
        const sustainability = calculateSustainabilityScore(channel);
        const shortsFocused = isShortsFocused(channel);

        return {
            ...channel,
            rpm,
            ...revenue,
            sustainabilityScore: sustainability,
            shortsFocused,
            monetizationScore: (parseFloat(revenue.monthlyRevenue) + sustainability) / 2
        };
    });

    // Filtrar solo canales enfocados en Shorts
    const shortsChannels = analyzed.filter(c => c.shortsFocused);

    console.log(`🎬 Canales 100% Shorts detectados: ${shortsChannels.length}/${channels.length}\n`);

    // Ordenar por potencial de monetización
    const topByRevenue = [...shortsChannels].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 20);
    const topBySustainability = [...shortsChannels].sort((a, b) => b.sustainabilityScore - a.sustainabilityScore).slice(0, 20);
    const topByMonetization = [...shortsChannels].sort((a, b) => b.monetizationScore - a.monetizationScore).slice(0, 20);

    // REPORTE: TOP 10 POR INGRESOS MENSUALES
    console.log('═'.repeat(140));
    console.log('\n🏆 TOP 10 CANALES POR INGRESOS MENSUALES ESTIMADOS (100% Shorts)\n');
    console.log('═'.repeat(140));

    topByRevenue.slice(0, 10).forEach((channel, i) => {
        console.log(`\n${i + 1}. ${channel.title}`);
        console.log(`   🔗 ${channel.url}`);
        console.log(`   ⏰ Antigüedad: ${channel.daysOld} días (${channel.monthsOld} meses)`);
        console.log(`   👥 ${channel.subscriberCount.toLocaleString()} suscriptores | 👀 ${channel.viewCount.toLocaleString()} visitas totales`);
        console.log(`   🎬 ${channel.videoCount} videos (${(channel.videoCount / channel.daysOld).toFixed(1)} videos/día)`);
        console.log(`   📊 Promedio: ${channel.avgViewsPerVideo.toLocaleString()} visitas/video`);
        console.log(`   💰 RPM estimado: $${channel.rpm.toFixed(2)}`);
        console.log(`   📈 Visitas mensuales: ${channel.monthlyViews.toLocaleString()}`);
        console.log(`   💵 Ingresos mensuales: $${parseFloat(channel.monthlyRevenue).toLocaleString()} USD`);
        console.log(`   💎 Ingresos anuales: $${parseFloat(channel.annualRevenue).toLocaleString()} USD`);
        console.log(`   🎯 Score sostenibilidad: ${channel.sustainabilityScore.toFixed(0)}/100`);
        console.log(`   🏷️  Nichos: ${channel.keywords.slice(0, 5).join(', ')}`);
    });

    // REPORTE: TOP 10 POR SOSTENIBILIDAD
    console.log('\n' + '═'.repeat(140));
    console.log('\n🌱 TOP 10 CANALES POR SOSTENIBILIDAD A LARGO PLAZO\n');
    console.log('═'.repeat(140));

    topBySustainability.slice(0, 10).forEach((channel, i) => {
        console.log(`\n${i + 1}. ${channel.title}`);
        console.log(`   🎯 Score sostenibilidad: ${channel.sustainabilityScore.toFixed(0)}/100`);
        console.log(`   💵 Ingresos mensuales: $${parseFloat(channel.monthlyRevenue).toLocaleString()}`);
        console.log(`   📊 ${channel.videoCount} videos en ${channel.daysOld} días (${(channel.videoCount / channel.daysOld).toFixed(1)}/día)`);
        console.log(`   🏷️  Nichos: ${channel.keywords.slice(0, 5).join(', ')}`);
        console.log(`   🔗 ${channel.url}`);
    });

    // REPORTE: MEJOR BALANCE (Monetización + Sostenibilidad)
    console.log('\n' + '═'.repeat(140));
    console.log('\n⭐ TOP 10 MEJOR BALANCE (Ingresos + Sostenibilidad)\n');
    console.log('═'.repeat(140));

    topByMonetization.slice(0, 10).forEach((channel, i) => {
        console.log(`\n${i + 1}. ${channel.title}`);
        console.log(`   💰 Score monetización: ${channel.monetizationScore.toFixed(0)}`);
        console.log(`   💵 Ingresos mensuales: $${parseFloat(channel.monthlyRevenue).toLocaleString()}`);
        console.log(`   🎯 Sostenibilidad: ${channel.sustainabilityScore.toFixed(0)}/100`);
        console.log(`   ⏰ ${channel.daysOld} días | 🎬 ${channel.videoCount} videos | 📊 ${channel.avgViewsPerVideo.toLocaleString()} avg`);
        console.log(`   🏷️  Nichos: ${channel.keywords.slice(0, 5).join(', ')}`);
        console.log(`   🔗 ${channel.url}`);
    });

    // ANÁLISIS AGREGADO POR NICHO
    console.log('\n' + '═'.repeat(140));
    console.log('\n📊 ANÁLISIS POR NICHO (Solo canales Shorts)\n');
    console.log('═'.repeat(140));

    const nicheStats = {};
    shortsChannels.forEach(channel => {
        channel.keywords.forEach(keyword => {
            if (!nicheStats[keyword]) {
                nicheStats[keyword] = {
                    channelCount: 0,
                    totalRevenue: 0,
                    avgSustainability: 0,
                    channels: []
                };
            }
            nicheStats[keyword].channelCount++;
            nicheStats[keyword].totalRevenue += parseFloat(channel.monthlyRevenue);
            nicheStats[keyword].avgSustainability += channel.sustainabilityScore;
            nicheStats[keyword].channels.push(channel.title);
        });
    });

    const topNiches = Object.entries(nicheStats)
        .map(([keyword, stats]) => ({
            keyword,
            channelCount: stats.channelCount,
            avgRevenue: (stats.totalRevenue / stats.channelCount).toFixed(2),
            totalRevenue: stats.totalRevenue.toFixed(2),
            avgSustainability: (stats.avgSustainability / stats.channelCount).toFixed(0),
            topChannel: stats.channels[0]
        }))
        .sort((a, b) => b.avgRevenue - a.avgRevenue)
        .slice(0, 15);

    topNiches.forEach((niche, i) => {
        console.log(`\n${i + 1}. "${niche.keyword}"`);
        console.log(`   📺 Canales: ${niche.channelCount}`);
        console.log(`   💵 Ingreso promedio/canal: $${parseFloat(niche.avgRevenue).toLocaleString()}/mes`);
        console.log(`   💰 Ingresos totales nicho: $${parseFloat(niche.totalRevenue).toLocaleString()}/mes`);
        console.log(`   🎯 Sostenibilidad promedio: ${niche.avgSustainability}/100`);
    });

    // RESUMEN EJECUTIVO
    console.log('\n' + '═'.repeat(140));
    console.log('\n📈 RESUMEN EJECUTIVO\n');
    console.log('═'.repeat(140));

    const avgMonthlyRevenue = (shortsChannels.reduce((sum, c) => sum + parseFloat(c.monthlyRevenue), 0) / shortsChannels.length).toFixed(2);
    const avgSustainability = (shortsChannels.reduce((sum, c) => sum + c.sustainabilityScore, 0) / shortsChannels.length).toFixed(0);
    const totalRevenue = shortsChannels.reduce((sum, c) => sum + parseFloat(c.monthlyRevenue), 0).toFixed(2);

    console.log(`\n📊 Total canales analizados (Shorts): ${shortsChannels.length}`);
    console.log(`💵 Ingreso mensual promedio: $${parseFloat(avgMonthlyRevenue).toLocaleString()}`);
    console.log(`🎯 Sostenibilidad promedio: ${avgSustainability}/100`);
    console.log(`💰 Ingresos totales combinados: $${parseFloat(totalRevenue).toLocaleString()}/mes`);
    console.log(`📈 Ingreso anual combinado: $${(parseFloat(totalRevenue) * 12).toLocaleString()}`);

    console.log(`\n🏆 Canal más rentable: ${topByRevenue[0].title}`);
    console.log(`   💵 $${parseFloat(topByRevenue[0].monthlyRevenue).toLocaleString()}/mes ($${parseFloat(topByRevenue[0].annualRevenue).toLocaleString()}/año)`);

    console.log(`\n🌱 Canal más sostenible: ${topBySustainability[0].title}`);
    console.log(`   🎯 Score: ${topBySustainability[0].sustainabilityScore.toFixed(0)}/100`);

    console.log(`\n⭐ Mejor balance: ${topByMonetization[0].title}`);
    console.log(`   💰 Score: ${topByMonetization[0].monetizationScore.toFixed(0)}`);

    // Guardar análisis completo
    const outputPath = './output/monetization-analysis.json';
    fs.writeFileSync(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalChannels: shortsChannels.length,
            avgMonthlyRevenue: parseFloat(avgMonthlyRevenue),
            avgSustainability: parseFloat(avgSustainability),
            totalMonthlyRevenue: parseFloat(totalRevenue)
        },
        topByRevenue: topByRevenue.slice(0, 20),
        topBySustainability: topBySustainability.slice(0, 20),
        topByMonetization: topByMonetization.slice(0, 20),
        nicheAnalysis: topNiches,
        allChannels: analyzed
    }, null, 2));

    console.log(`\n\n💾 Análisis completo guardado en: ${outputPath}`);
}

// Ejecutar
try {
    analyzeMonetization();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
