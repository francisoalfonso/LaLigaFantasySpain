// Script para importar videos VEO3 existentes al sistema de persistencia
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function importVideo(videoData) {
    try {
        console.log(`📦 Importando video: ${videoData.notes}`);

        const response = await axios.post(`${BASE_URL}/api/instagram/versions/save`, videoData);

        if (response.data.success) {
            console.log(`✅ Video importado: ${response.data.data.id}`);
            return response.data.data;
        } else {
            console.error(`❌ Error: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error importando video:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Importando videos VEO3 existentes...\n');

    // Video 1: 30 sept - SIN transiciones frame-to-frame
    const video1 = {
        version: 1,
        timestamp: '2025-09-30T15:03:00.000Z',
        playerData: {
            playerName: 'Dani Carvajal',
            team: 'Real Madrid',
            price: 5.0,
            ratio: 3.37,
            stats: {
                goals: 1,
                assists: 2,
                games: 5,
                rating: 7.2,
                position: 'Defensa'
            }
        },
        previewData: {
            video: {
                path: './output/veo3/viral/ana-viral-carvajal-1759244590195.mp4',
                url: '/output/veo3/viral/ana-viral-carvajal-1759244590195.mp4',
                duration: '~24s',
                segments: 3,
                structure: 'Hook → Desarrollo → CTA'
            },
            instagram: {
                caption: '🚨 VIDEO 30 SEPT - SIN Frame-to-Frame 🚨\n\nDani Carvajal - Real Madrid\n💰 €5M (Ratio 3.37x)\n\n⚠️ Versión ANTERIOR al fix de transiciones\n\n#FantasyLaLiga #Chollos #RealMadrid',
                captionLength: 150,
                hashtags: ['#FantasyLaLiga', '#Chollos', '#RealMadrid'],
                format: '9:16 vertical'
            },
            metadata: {
                playerName: 'Dani Carvajal',
                generatedAt: '2025-09-30T15:03:00.000Z',
                segments: [
                    { type: 'hook', dialogue: 'Video generado SIN transiciones frame-to-frame (versión 30 sept)' },
                    { type: 'development', dialogue: 'Este video usa el sistema anterior de transiciones' },
                    { type: 'cta', dialogue: 'Compara con la versión del 2 de octubre para ver la diferencia' }
                ]
            }
        },
        segments: [
            { type: 'hook', dialogue: 'Video generado SIN transiciones frame-to-frame (versión 30 sept)' },
            { type: 'development', dialogue: 'Este video usa el sistema anterior de transiciones' },
            { type: 'cta', dialogue: 'Compara con la versión del 2 de octubre para ver la diferencia' }
        ],
        videoUrl: '/output/veo3/viral/ana-viral-carvajal-1759244590195.mp4',
        caption: '🚨 VIDEO 30 SEPT - SIN Frame-to-Frame 🚨\n\nDani Carvajal - Real Madrid\n💰 €5M (Ratio 3.37x)\n\n⚠️ Versión ANTERIOR al fix de transiciones\n\n#FantasyLaLiga #Chollos #RealMadrid',
        notes: '📹 Video 30 sept (5.2MB) - SIN transiciones frame-to-frame. Sistema anterior de concatenación.',
        viralScore: 75,
        isRealVideo: true
    };

    // Video 2: 2 oct - CON transiciones frame-to-frame
    const video2 = {
        version: 2,
        timestamp: '2025-10-02T00:12:00.000Z',
        playerData: {
            playerName: 'Dani Carvajal',
            team: 'Real Madrid',
            price: 5.0,
            ratio: 3.37,
            stats: {
                goals: 1,
                assists: 2,
                games: 5,
                rating: 7.2,
                position: 'Defensa'
            }
        },
        previewData: {
            video: {
                path: './output/veo3/viral/ana-viral-dani-carvajal-1759356740.mp4',
                url: '/output/veo3/viral/ana-viral-dani-carvajal-1759356740.mp4',
                duration: '~24s',
                segments: 3,
                structure: 'Hook → Desarrollo → CTA'
            },
            instagram: {
                caption: '🔥 VIDEO 2 OCT - CON Frame-to-Frame ✨\n\nDani Carvajal - Real Madrid\n💰 €5M (Ratio 3.37x)\n\n✅ Versión MEJORADA con transiciones invisibles\n\n#FantasyLaLiga #Chollos #RealMadrid',
                captionLength: 160,
                hashtags: ['#FantasyLaLiga', '#Chollos', '#RealMadrid'],
                format: '9:16 vertical'
            },
            metadata: {
                playerName: 'Dani Carvajal',
                generatedAt: '2025-10-02T00:12:00.000Z',
                segments: [
                    { type: 'hook', dialogue: 'Video generado CON transiciones frame-to-frame (versión 2 oct)' },
                    { type: 'development', dialogue: 'Este video usa transiciones invisibles entre segmentos' },
                    { type: 'cta', dialogue: 'Transiciones perfectas sin discontinuidad visual' }
                ]
            }
        },
        segments: [
            { type: 'hook', dialogue: 'Video generado CON transiciones frame-to-frame (versión 2 oct)' },
            { type: 'development', dialogue: 'Este video usa transiciones invisibles entre segmentos' },
            { type: 'cta', dialogue: 'Transiciones perfectas sin discontinuidad visual' }
        ],
        videoUrl: '/output/veo3/viral/ana-viral-dani-carvajal-1759356740.mp4',
        caption: '🔥 VIDEO 2 OCT - CON Frame-to-Frame ✨\n\nDani Carvajal - Real Madrid\n💰 €5M (Ratio 3.37x)\n\n✅ Versión MEJORADA con transiciones invisibles\n\n#FantasyLaLiga #Chollos #RealMadrid',
        notes: '🎬 Video 2 oct (5.5MB) - CON transiciones frame-to-frame. Continuidad visual perfecta entre segmentos.',
        viralScore: 88,
        isRealVideo: true
    };

    const result1 = await importVideo(video1);
    console.log('');
    const result2 = await importVideo(video2);

    console.log('\n✅ Importación completada!');
    console.log('📊 Videos importados:', result1 && result2 ? 2 : (result1 || result2 ? 1 : 0));
}

main().catch(console.error);
