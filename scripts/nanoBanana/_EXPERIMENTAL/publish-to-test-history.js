#!/usr/bin/env node

/**
 * Publicar videos de Nano Banana → VEO3 al sistema de Test History
 *
 * Este script:
 * 1. Copia los 3 videos a data/instagram-versions/_active_testing/
 * 2. Crea el archivo JSON de versión con metadata
 * 3. Actualiza el contador de tests
 * 4. Los videos aparecerán en http://localhost:3000/test-history.html
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SESSION_ID = 'veo3_nano_1760097786221'; // Sesión de los videos generados
const TEST_NUMBER = 49; // Test #49
const PLAYER_NAME = 'Pere Milla'; // Ejemplo (se puede cambiar)

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
    console.log(`\n${colors.blue}╔${'═'.repeat(70)}╗${colors.reset}`);
    console.log(
        `${colors.blue}║  📤 Publicar Test #${TEST_NUMBER} → Test History${' '.repeat(43)}║${colors.reset}`
    );
    console.log(`${colors.blue}╚${'═'.repeat(70)}╝${colors.reset}\n`);

    try {
        // 1. Buscar videos de la sesión
        const sessionDir = path.join(process.cwd(), 'output', 'veo3', 'sessions', SESSION_ID);

        if (!fs.existsSync(sessionDir)) {
            throw new Error(`Sesión no encontrada: ${SESSION_ID}`);
        }

        const videos = fs
            .readdirSync(sessionDir)
            .filter(f => f.endsWith('.mp4') && f.startsWith('seg'))
            .sort();

        if (videos.length < 3) {
            throw new Error(`Se necesitan 3 videos, solo se encontraron ${videos.length}`);
        }

        log('📂', `Sesión encontrada: ${SESSION_ID}`, colors.cyan);
        log('📹', `Videos encontrados: ${videos.length}`, colors.green);
        videos.forEach((v, i) => console.log(`   ${i + 1}. ${v}`));

        // 2. Crear directorio de testing activo
        const activeTestingDir = path.join(
            process.cwd(),
            'data',
            'instagram-versions',
            '_active_testing'
        );

        if (!fs.existsSync(activeTestingDir)) {
            fs.mkdirSync(activeTestingDir, { recursive: true });
        }

        // 3. Copiar videos con nombres estandarizados
        const timestamp = Date.now();
        const playerSlug = PLAYER_NAME.toLowerCase().replace(/\s+/g, '-');
        const versionId = `${playerSlug}-v${timestamp}`;

        log('', '', colors.reset);
        log('📋', `Version ID: ${versionId}`, colors.cyan);
        log('📋', `Test Number: #${TEST_NUMBER}`, colors.cyan);
        log('', '', colors.reset);
        log('📤', 'Copiando videos a carpeta de testing...', colors.yellow);

        const copiedVideos = [];
        for (let i = 0; i < 3; i++) {
            const sourceVideo = path.join(sessionDir, videos[i]);
            const destFilename = `test-${TEST_NUMBER}-seg${i + 1}-${timestamp}.mp4`;
            const destPath = path.join(activeTestingDir, destFilename);

            fs.copyFileSync(sourceVideo, destPath);
            copiedVideos.push(destFilename);

            log('✅', `Segmento ${i + 1} copiado: ${destFilename}`, colors.green);
        }

        // 4. Crear archivo de versión JSON
        const versionData = {
            id: versionId,
            version: 1,
            timestamp: new Date().toISOString(),
            playerData: {
                playerName: PLAYER_NAME,
                team: 'Elche',
                price: 6.0,
                stats: {
                    goals: 2,
                    assists: 1,
                    matchesPlayed: 3
                },
                ratio: 1.5
            },
            testMetadata: {
                testDate: new Date().toISOString(),
                testNumber: TEST_NUMBER,
                fixesApplied: [
                    'nano-banana-image-refs',
                    'supabase-storage',
                    'veo3-with-initial-frames'
                ],
                testPurpose:
                    'Test Nano Banana → Supabase → VEO3 (3 imágenes como referencias iniciales)',
                feedback: {
                    whatWorks: [
                        // Usuario rellenará esto al revisar
                    ],
                    whatFails: [
                        // Usuario rellenará esto al revisar
                    ],
                    severity: {
                        critical: 0,
                        major: 0,
                        minor: 0
                    },
                    reviewedBy: 'Pendiente',
                    reviewDate: null,
                    reviewNotes: 'Test generado automáticamente. Pendiente de revisión manual.'
                },
                checklist: {
                    imagenAnaFija: null,
                    sinTransicionesCamara: null,
                    audioSinCortes: null,
                    vozConsistente: null,
                    pronunciacionCorrecta: null,
                    logoOutro: false, // No concatenado aún
                    duracionCorrecta: null,
                    hookSegundo3: null,
                    ctaClaro: null
                },
                qualityScore: {
                    videoQuality: null,
                    audioQuality: null,
                    viralPotential: null,
                    technicalScore: null,
                    overallScore: null
                },
                improvements: [
                    'Uso de Nano Banana para generar 3 imágenes Ana consistentes',
                    'Imágenes almacenadas en Supabase Storage (URLs persistentes)',
                    'VEO3 usa imágenes como referencias iniciales',
                    'Progresión cinematográfica: Wide → Medium → Close-up'
                ],
                issues: [
                    'Concatenación con freeze frame + logo falló (error FFmpeg)',
                    'Necesita validación de identidad visual de Ana entre segmentos',
                    'Nano Banana API inestable (fallos ocasionales)'
                ]
            },
            veo3Config: {
                anaImageUrl: null, // Imágenes desde Nano Banana (3 diferentes)
                seed: 30001,
                enhanced: false,
                modelVersion: 'veo3_fast',
                segmentCount: 3,
                totalDuration: null, // Pendiente concatenación
                nanoBananaConfig: {
                    model: 'google/nano-banana-edit',
                    seed: 12500,
                    promptStrength: 0.75,
                    imageSize: '9:16',
                    supabaseUrls: [
                        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg1-wide-1760097275312.png',
                        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg2-medium-1760097276265.png',
                        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg3-close-up-1760097277647.png'
                    ]
                }
            },
            videoFiles: {
                seg1: copiedVideos[0],
                seg2: copiedVideos[1],
                seg3: copiedVideos[2],
                concatenated: null // Pendiente concatenación exitosa
            },
            caption: `🔥 ${PLAYER_NAME} - ¡El chollo que TODOS están esperando!\n\n💰 Precio: 6.0M | ⚡ Ratio: 1.5\n\n🎯 Test #${TEST_NUMBER}: Nano Banana → VEO3\n\n#FantasyLaLiga #Chollos #${PLAYER_NAME.replace(/\s+/g, '')}`,
            viralScore: null,
            isRealVideo: true,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'claude-code',
                status: 'testing'
            },
            notes: `
Test #${TEST_NUMBER}: Integración Nano Banana → VEO3

FLUJO:
1. Nano Banana genera 3 imágenes Ana (Wide, Medium, Close-up)
2. Imágenes se suben a Supabase Storage
3. VEO3 usa las imágenes como referencias iniciales
4. Se generan 3 segmentos de video independientes

OBJETIVO:
- Validar si Nano Banana genera imágenes consistentes de Ana
- Verificar si VEO3 respeta las referencias de Supabase
- Comparar con sistema anterior (frame-to-frame extraction)

PENDIENTE:
- Concatenar los 3 segmentos (error FFmpeg actual)
- Añadir logo outro
- Aplicar subtítulos virales
            `.trim()
        };

        const versionFilePath = path.join(
            process.cwd(),
            'data',
            'instagram-versions',
            `${versionId}.json`
        );

        fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf-8');

        log('', '', colors.reset);
        log('✅', `Archivo de versión creado: ${versionId}.json`, colors.green);

        // 5. Actualizar contador de tests
        const counterPath = path.join(
            process.cwd(),
            'data',
            'instagram-versions',
            '_TEST_COUNTER.json'
        );

        const counterData = JSON.parse(fs.readFileSync(counterPath, 'utf-8'));
        counterData.lastTestNumber = TEST_NUMBER;
        counterData.currentTest = counterData.currentTest + 1;
        counterData.lastUpdated = new Date().toISOString();

        counterData.history.push({
            testNumber: TEST_NUMBER,
            date: new Date().toISOString(),
            player: PLAYER_NAME,
            purpose: 'Test Nano Banana → Supabase → VEO3',
            fixes: ['nano-banana-image-refs', 'supabase-storage', 'veo3-with-initial-frames']
        });

        fs.writeFileSync(counterPath, JSON.stringify(counterData, null, 2), 'utf-8');

        log('✅', 'Contador de tests actualizado', colors.green);

        // Resumen final
        console.log(`\n${colors.green}${'='.repeat(72)}${colors.reset}`);
        console.log(
            `${colors.green}  ✅ TEST #${TEST_NUMBER} PUBLICADO EXITOSAMENTE${colors.reset}`
        );
        console.log(`${colors.green}${'='.repeat(72)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 RESUMEN:${colors.reset}`);
        console.log(`   • Test Number: #${TEST_NUMBER}`);
        console.log(`   • Version ID: ${versionId}`);
        console.log(`   • Videos copiados: 3`);
        console.log(`   • Ubicación: data/instagram-versions/_active_testing/`);
        console.log(`   • Metadata: ${versionId}.json`);

        console.log(`\n${colors.cyan}🌐 ACCESO WEB:${colors.reset}`);
        console.log(`   • Test History: http://localhost:3000/test-history.html`);
        console.log(`   • Instagram Preview: http://localhost:3000/instagram-viral-preview.html`);

        console.log(`\n${colors.yellow}📝 PRÓXIMO PASO:${colors.reset}`);
        console.log(`   1. Abrir http://localhost:3000/test-history.html`);
        console.log(`   2. Revisar Test #${TEST_NUMBER} en la lista`);
        console.log(`   3. Ver videos individuales`);
        console.log(`   4. Dejar feedback sobre qué funciona y qué falla`);
        console.log(`   5. Asignar scores de calidad\n`);
    } catch (error) {
        console.error(`\n${colors.yellow}❌ ERROR:${colors.reset}`);
        console.error(`   ${error.message}`);
        if (error.stack) {
            console.error(`\n${colors.yellow}Stack:${colors.reset}`);
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
