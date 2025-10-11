/**
 * E2E COMPLETO: Chollo Dinámico → Video Viral Instagram
 *
 * Flujo completo desde identificación de chollo hasta video final con:
 * - Datos dinámicos del endpoint /api/bargains/top
 * - Registro automático en diccionario (si no existe)
 * - Generación de guiones con terminología futbolística
 * - Imágenes Nano Banana contextualizadas
 * - Videos VEO3 con progresión cinematográfica
 * - Enhancements: Black flashes (70ms) + Player card + Subtítulos virales
 *
 * Uso:
 *   node scripts/veo3/test-e2e-complete-chollo-viral.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

console.log('\\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🎬 E2E COMPLETO - Chollo Dinámico → Video Viral Instagram                  ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\\n');

console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\\n`);

async function main() {
    const startTime = Date.now();

    try {
        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 0: IDENTIFICAR CHOLLO TOP
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 0: IDENTIFICANDO CHOLLO TOP');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        console.log('📊 Llamando a /api/bargains/top...');
        const bargainsResponse = await axios.get(`${BASE_URL}/api/bargains/top`, {
            timeout: 60000 // 60s para API-Sports
        });

        if (!bargainsResponse.data.success || bargainsResponse.data.bargains.length === 0) {
            throw new Error('No se encontraron chollos');
        }

        const topBargain = bargainsResponse.data.bargains[0];
        console.log(`\\n✅ CHOLLO IDENTIFICADO: ${topBargain.name}`);
        console.log(`   Equipo: ${topBargain.team}`);
        console.log(`   Posición: ${topBargain.position}`);
        console.log(`   Precio: €${topBargain.price}M`);
        console.log(`   Rating: ${topBargain.rating}`);
        console.log(`   Puntos Fantasy: ${topBargain.fantasyPoints}`);
        console.log(`   Ratio Valor: ${topBargain.valueRatio.toFixed(2)}\\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 1: VERIFICAR Y ACTUALIZAR DICCIONARIO
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 1: VERIFICANDO DICCIONARIO DE JUGADORES');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const dictionaryPath = path.join(__dirname, '../../data/player-dictionary.json');
        let dictionary = {};

        if (fs.existsSync(dictionaryPath)) {
            dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'));
            console.log(`📖 Diccionario cargado: ${Object.keys(dictionary).length} jugadores`);
        } else {
            console.log('📖 Diccionario no existe, se creará uno nuevo');
        }

        const playerKey = topBargain.name.toLowerCase().replace(/\s+/g, '_');

        if (!dictionary[playerKey]) {
            console.log(`\\n⚠️  ${topBargain.name} NO está en el diccionario`);
            console.log('📝 Creando entrada automática...\\n');

            // Crear entrada base (el script puede enriquecerse manualmente después)
            dictionary[playerKey] = {
                name: topBargain.name,
                team: topBargain.team,
                position: topBargain.position,
                nicknames: [
                    topBargain.name.split(' ')[0], // Primer nombre
                    topBargain.name.split(' ').pop() // Apellido
                ],
                references: [
                    `el ${topBargain.position.toLowerCase()}`,
                    `el jugador del ${topBargain.team}`,
                    'el futbolista',
                    'este crack'
                ],
                context: {
                    style: 'versatile defender' // Genérico, puede enriquecerse
                },
                addedAt: new Date().toISOString(),
                source: 'auto-generated from bargain analyzer'
            };

            fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2), 'utf-8');
            console.log(`✅ Entrada creada para \${topBargain.name}`);
            console.log(
                '   Se puede enriquecer manualmente con apodos y referencias específicas\\n'
            );
        } else {
            console.log(`✅ \${topBargain.name} ya está en el diccionario\\n`);
        }

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 2: PREPARAR DATOS PARA GENERACIÓN
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 2: PREPARANDO WORKFLOW NANO BANANA → VEO3');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const workflowPayload = {
            playerName: topBargain.name,
            contentType: 'chollo',
            preset: 'chollo_viral',
            playerData: {
                name: topBargain.name,
                team: topBargain.team,
                position: topBargain.position,
                price: topBargain.price,
                rating: topBargain.rating,
                stats: {
                    goals: topBargain.goals || 0,
                    assists: topBargain.assists || 0,
                    rating: topBargain.rating
                },
                fantasyPoints: topBargain.fantasyPoints,
                valueRatio: topBargain.valueRatio
            }
        };

        console.log('📦 Payload preparado:');
        console.log(JSON.stringify(workflowPayload, null, 2));
        console.log('');

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 3: GENERAR VIDEO COMPLETO (Nano Banana → VEO3 → Concatenación)
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3: GENERANDO VIDEO COMPLETO (3 SEGMENTOS)');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const phase3Start = Date.now();

        const videoResponse = await axios.post(
            `\${BASE_URL}/api/veo3/generate-phased-video`,
            workflowPayload,
            {
                timeout: 600000 // 10 minutos para generación completa
            }
        );

        const phase3Duration = ((Date.now() - phase3Start) / 1000).toFixed(1);

        if (!videoResponse.data.success) {
            throw new Error(`Generación falló: \${videoResponse.data.message}`);
        }

        const sessionId = videoResponse.data.data.sessionId;
        const concatenatedVideo = videoResponse.data.data.concatenatedVideo;

        console.log(`\\n✅ FASE 3 COMPLETADA en \${phase3Duration}s`);
        console.log(`📹 Video concatenado: \${concatenatedVideo.url}\\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 4: AÑADIR ENHANCEMENTS (Black Flashes + Player Card + Subtítulos)
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 4: AÑADIENDO ENHANCEMENTS AL VIDEO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const phase4Start = Date.now();

        const enhancementsResponse = await axios.post(
            `\${BASE_URL}/api/veo3/add-enhancements`,
            {
                sessionId: sessionId,
                playerData: {
                    name: topBargain.name,
                    stats: {
                        goals: topBargain.goals || 0,
                        assists: topBargain.assists || 0,
                        rating: topBargain.rating
                    }
                },
                enhancements: {
                    blackFlashes: true, // 70ms entre segmentos
                    playerCard: true, // Overlay 3-6s
                    viralSubtitles: true // Karaoke style
                }
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        const phase4Duration = ((Date.now() - phase4Start) / 1000).toFixed(1);

        if (!enhancementsResponse.data.success) {
            throw new Error(`Enhancements fallaron: \${enhancementsResponse.data.message}`);
        }

        console.log(`\\n✅ FASE 4 COMPLETADA en \${phase4Duration}s\\n`);

        const finalData = enhancementsResponse.data.data;
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        // ════════════════════════════════════════════════════════════════════════════════
        // RESUMEN FINAL
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '\\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ E2E COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        console.log('📊 RESUMEN:\\n');

        console.log('🎯 CHOLLO:');
        console.log(`   Jugador:                  \${topBargain.name}`);
        console.log(`   Equipo:                   \${topBargain.team}`);
        console.log(`   Posición:                 \${topBargain.position}`);
        console.log(`   Precio:                   €\${topBargain.price}M`);
        console.log(`   Ratio Valor:              \${topBargain.valueRatio.toFixed(2)}\\n`);

        console.log('⏱️  TIEMPOS:');
        console.log(`   FASE 3 (Video):           \${phase3Duration}s`);
        console.log(`   FASE 4 (Enhancements):    \${phase4Duration}s`);
        console.log(`   TOTAL:                    \${totalDuration}s\\n`);

        console.log('🎨 ENHANCEMENTS:');
        console.log(
            `   Aplicadas:                \${finalData.enhancements.successful.length}/\${finalData.enhancements.total}`
        );
        if (finalData.enhancements.successful.length > 0) {
            finalData.enhancements.successful.forEach((enh, idx) => {
                console.log(`   \${idx + 1}. \${enh.type}`);
            });
        }
        console.log('');

        console.log('📹 VIDEO FINAL:');
        console.log(`   URL: \${finalData.enhancedVideo.url}`);
        console.log(`   Base: \${finalData.enhancedVideo.baseVideo}`);
        console.log(`   Session ID: \${sessionId}\\n`);

        console.log('📂 ARCHIVOS:');
        console.log(`   Diccionario: data/player-dictionary.json`);
        console.log(`   Session: output/veo3/sessions/session_\${sessionId}/\\n`);

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Ver video en: \${finalData.enhancedVideo.url}`);
        console.log(`   2. Validar black flashes (70ms entre segmentos)`);
        console.log(`   3. Validar player card (segundos 3-6, top-right)`);
        console.log(`   4. Validar subtítulos virales (karaoke style)`);
        console.log(`   5. Si hay términos futbolísticos específicos de \${topBargain.name}:`);
        console.log(`      → Editar data/player-dictionary.json manualmente`);
        console.log(`      → Añadir apodos, referencias, contexto específico`);
        console.log(`   6. Publicar en Instagram/TikTok\\n`);

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\\n❌ ERROR EN E2E:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.code === 'ECONNABORTED') {
            console.error('\\n💡 TIMEOUT - Posibles causas:');
            console.error('   - API-Sports tardó mucho en responder');
            console.error('   - Nano Banana API está lenta');
            console.error('   - VEO3 generación tardó más de lo esperado');
        }

        console.error('\\n📁 Para debug, revisa:');
        console.error('   - logs/veo3/');
        console.error('   - output/veo3/sessions/');

        process.exit(1);
    }
}

main();
