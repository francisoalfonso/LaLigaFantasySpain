/**
 * Monitor TEST #47 - Frame-to-Frame con Carvajal
 *
 * Monitorea generación y documenta automáticamente:
 * - Progreso de cada segmento
 * - Tiempos de generación
 * - Frames extraídos
 * - Video final
 * - JSON de versión para historial
 */

const fs = require('fs').promises;
const path = require('path');

const SESSION_DIR = path.join(__dirname, '../../output/veo3/sessions');
const VERSIONS_DIR = path.join(__dirname, '../../data/instagram-versions');
const TEST_COUNTER_PATH = path.join(VERSIONS_DIR, '_TEST_COUNTER.json');

async function monitorTest47() {
    console.log('🔍 MONITOR TEST #47 - Frame-to-Frame Carvajal\n');
    console.log('⏱️  Inicio monitoreo:', new Date().toLocaleString('es-ES'));
    console.log('📁 Buscando nueva sesión en:', SESSION_DIR);
    console.log('');

    const startTime = Date.now();
    let lastSessionCount = 0;
    let sessionFound = false;
    let sessionData = null;

    // Monitorear cada 10 segundos
    const interval = setInterval(async () => {
        try {
            const sessions = await fs.readdir(SESSION_DIR);
            const sessionDirs = sessions.filter(s => s.startsWith('session_'));

            if (sessionDirs.length > lastSessionCount) {
                // Nueva sesión detectada
                const latestSession = sessionDirs.sort().reverse()[0];
                const sessionPath = path.join(SESSION_DIR, latestSession);
                const progressPath = path.join(sessionPath, 'progress.json');

                try {
                    const progress = JSON.parse(await fs.readFile(progressPath, 'utf8'));

                    // Verificar si es Carvajal
                    if (progress.playerName === 'Dani Carvajal') {
                        sessionFound = true;
                        sessionData = {
                            sessionId: progress.sessionId,
                            sessionDir: sessionPath,
                            playerName: progress.playerName,
                            startedAt: new Date()
                        };

                        console.log('✅ SESIÓN TEST #47 DETECTADA');
                        console.log('   ID:', progress.sessionId);
                        console.log('   Jugador:', progress.playerName);
                        console.log('   Tipo:', progress.contentType);
                        console.log('');
                    }
                } catch (err) {
                    // progress.json aún no existe
                }

                lastSessionCount = sessionDirs.length;
            }

            // Si sesión encontrada, monitorear progreso
            if (sessionFound && sessionData) {
                const progressPath = path.join(sessionData.sessionDir, 'progress.json');

                try {
                    const progress = JSON.parse(await fs.readFile(progressPath, 'utf8'));

                    const completed = progress.segmentsCompleted || 0;
                    const total = progress.segmentsTotal || 3;
                    const elapsedMin = Math.floor((Date.now() - startTime) / 60000);

                    console.log(`📊 PROGRESO: ${completed}/${total} segmentos | ⏱️  ${elapsedMin} min`);

                    // Mostrar segmentos completados
                    if (progress.segments) {
                        progress.segments.forEach((seg, i) => {
                            if (seg.localPath) {
                                const size = (seg.size / 1024 / 1024).toFixed(1);
                                console.log(`   ✅ Segmento ${i + 1}: ${size}MB - ${seg.dialogue?.substring(0, 40)}...`);
                            }
                        });
                    }

                    // Video completado
                    if (progress.concatenatedVideo) {
                        clearInterval(interval);

                        const totalTime = Math.floor((Date.now() - startTime) / 60000);

                        console.log('\n🎉 ¡VIDEO COMPLETADO!\n');
                        console.log('📊 RESUMEN GENERACIÓN:');
                        console.log('   ⏱️  Tiempo total:', totalTime, 'minutos');
                        console.log('   📹 Segmentos:', progress.segmentsCompleted);
                        console.log('   📁 Video:', progress.concatenatedVideo.outputPath);
                        console.log('   🔗 URL:', progress.finalVideoUrl);
                        console.log('');

                        // DOCUMENTAR EN HISTORIAL
                        await documentTest47(progress, totalTime);
                    }

                } catch (err) {
                    // Error leyendo progress
                }
            }

        } catch (error) {
            console.error('Error monitoreando:', error.message);
        }
    }, 10000); // Cada 10 segundos

    // Timeout 25 minutos
    setTimeout(() => {
        clearInterval(interval);
        if (!sessionFound) {
            console.log('⏰ Timeout: No se detectó sesión de Carvajal en 25 minutos');
        }
    }, 25 * 60 * 1000);
}

/**
 * Documentar TEST #47 en historial de versiones
 */
async function documentTest47(progress, totalTimeMin) {
    console.log('📝 DOCUMENTANDO TEST #47 en historial...\n');

    try {
        // Leer contador de tests
        const counter = JSON.parse(await fs.readFile(TEST_COUNTER_PATH, 'utf8'));
        const testNumber = counter.lastTestNumber + 1;

        const versionData = {
            id: `dani-carvajal-v${progress.sessionId}`,
            version: testNumber,
            timestamp: new Date().toISOString(),

            playerData: {
                playerName: 'Dani Carvajal',
                team: 'Real Madrid',
                position: 'DEF',
                price: 5.5,
                stats: {
                    games: 6,
                    goals: 1,
                    assists: 0,
                    rating: '7.12'
                },
                valueRatio: 1.23
            },

            testMetadata: {
                testDate: new Date().toISOString(),
                testNumber: testNumber,
                fixesApplied: [
                    'imagen-ana-fija',
                    'sin-transiciones-camara',
                    'frame-to-frame-continuity'
                ],
                testPurpose: 'TEST #47 POST-FIXES + FRAME-TO-FRAME - Validar continuidad visual perfecta',

                generationDetails: {
                    totalTimeMinutes: totalTimeMin,
                    segmentsGenerated: progress.segmentsCompleted,
                    frameExtractionUsed: true,
                    segments: progress.segments?.map(s => ({
                        role: s.role,
                        dialogue: s.dialogue,
                        duration: s.duration,
                        size: s.size
                    }))
                },

                feedback: {
                    whatWorks: [],
                    whatFails: [],
                    severity: { critical: 0, major: 0, minor: 0 },
                    reviewedBy: 'Pendiente',
                    reviewDate: new Date().toISOString(),
                    reviewNotes: 'TEST #47 - Primer test con frame-to-frame. Comparar continuidad visual con TEST #46.'
                },

                checklist: {
                    imagenAnaFija: true,
                    sinTransicionesCamara: true,
                    audioSinCortes: null,
                    vozConsistente: null,
                    pronunciacionCorrecta: null,
                    logoOutro: null,
                    duracionCorrecta: null,
                    hookSegundo3: null,
                    ctaClaro: null,
                    continuidadFrameToFrame: null  // ← NUEVO
                },

                qualityScore: {
                    videoQuality: null,
                    audioQuality: null,
                    viralPotential: null,
                    technicalScore: null,
                    overallScore: null,
                    frameContinuity: null  // ← NUEVO
                },

                comparisonWith: 'pere-milla-v1759519477099',
                improvements: [
                    '✅ Frame-to-frame implementado',
                    '✅ Imagen Ana fija (ana-estudio-pelo-suelto.jpg)',
                    '✅ Sin transiciones de cámara'
                ],
                issues: []
            },

            veo3Config: {
                anaImageUrl: 'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-estudio-pelo-suelto.jpg',
                seed: 30001,
                enhanced: false,
                modelVersion: 'veo3_fast',
                segmentCount: 3,
                totalDuration: 24,
                frameToFrameEnabled: true  // ← NUEVO
            },

            videoUrl: progress.finalVideoUrl,
            caption: `🔥 TEST #47 - Frame-to-Frame\n\nDani Carvajal a 5.5M 💰\nRatio: 1.23x\n1 gol en 6 partidos\n\n✨ NUEVO: Continuidad visual perfecta\n\n#FantasyLaLiga #Carvajal #RealMadrid`,
            notes: `🎯 TEST #47 - FRAME-TO-FRAME ACTIVADO\n✅ Imagen Ana fija\n✅ Sin transiciones cámara\n✨ Continuidad visual mediante último frame\n⏱️  Tiempo generación: ${totalTimeMin} min`,
            viralScore: 0,
            isRealVideo: true,

            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'system',
                status: 'testing'
            }
        };

        // Guardar versión
        const versionPath = path.join(VERSIONS_DIR, '_active_testing', `dani-carvajal-v${progress.sessionId}.json`);
        await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2));

        console.log('✅ Versión documentada:', versionPath);

        // Actualizar contador
        counter.lastTestNumber = testNumber;
        counter.history.push({
            testNumber: testNumber,
            date: new Date().toISOString(),
            player: 'Dani Carvajal',
            purpose: 'Frame-to-frame + fixes post-baseline',
            fixes: ['imagen-ana-fija', 'sin-transiciones-camara', 'frame-to-frame-continuity']
        });
        counter.nextTest = {
            testNumber: testNumber + 1,
            expectedDate: new Date(Date.now() + 86400000).toISOString(),
            player: 'TBD',
            purpose: 'Siguiente test'
        };

        await fs.writeFile(TEST_COUNTER_PATH, JSON.stringify(counter, null, 2));
        console.log('✅ Contador actualizado: TEST #47 registrado');

        console.log('\n📊 TEST #47 COMPLETAMENTE DOCUMENTADO');
        console.log('   🔗 Ver en: http://localhost:3000/test-history.html');

    } catch (error) {
        console.error('❌ Error documentando:', error.message);
    }
}

// Ejecutar monitor
if (require.main === module) {
    monitorTest47().catch(console.error);
}

module.exports = monitorTest47;
