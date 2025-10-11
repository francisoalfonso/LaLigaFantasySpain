/**
 * Script para continuar generación de segmentos individuales de una sesión existente
 *
 * Uso:
 *   node scripts/veo3/continue-session-segment.js <sessionId> <segmentNumber>
 *
 * Ejemplo:
 *   node scripts/veo3/continue-session-segment.js session_nanoBanana_1760180721221 2
 *
 * Este script:
 * 1. Lee el progress.json de la sesión
 * 2. Genera el segmento específico solicitado
 * 3. Actualiza el progress.json
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = process.argv[2];
const SEGMENT_NUMBER = parseInt(process.argv[3]);

if (!SESSION_ID || !SEGMENT_NUMBER) {
    console.error('❌ Uso: node continue-session-segment.js <sessionId> <segmentNumber>');
    console.error(
        '   Ejemplo: node continue-session-segment.js session_nanoBanana_1760180721221 2'
    );
    process.exit(1);
}

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🔄 Continuando Sesión - Generación Segmento Individual                     ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`📋 Session ID: ${SESSION_ID}`);
console.log(`🎬 Segmento: ${SEGMENT_NUMBER}`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

async function main() {
    try {
        // 1. Leer progress.json
        const sessionDir = path.join(process.cwd(), 'output/veo3/sessions', SESSION_ID);

        const progressPath = path.join(sessionDir, 'progress.json');

        if (!fs.existsSync(progressPath)) {
            throw new Error(`❌ No se encontró progress.json en ${sessionDir}`);
        }

        const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

        console.log('✅ Sesión encontrada:');
        console.log(`   - Player: ${progress.playerName}`);
        console.log(`   - Content: ${progress.contentType}`);
        console.log(`   - Preset: ${progress.preset}`);
        console.log(`   - Completados: ${progress.segmentsCompleted}/${progress.segmentsTotal}\n`);

        if (SEGMENT_NUMBER < 1 || SEGMENT_NUMBER > progress.segmentsTotal) {
            throw new Error(
                `❌ Número de segmento inválido. Debe estar entre 1 y ${progress.segmentsTotal}`
            );
        }

        // Verificar si el segmento ya existe
        const existingSegment = progress.segments.find(s => s.index === SEGMENT_NUMBER - 1);
        if (existingSegment) {
            console.log(`⚠️  El segmento ${SEGMENT_NUMBER} ya existe:`);
            console.log(`   - Task ID: ${existingSegment.taskId}`);
            console.log(`   - File: ${existingSegment.filename}`);
            const continuar = await new Promise(resolve => {
                process.stdout.write('   ¿Regenerar? (y/n): ');
                process.stdin.once('data', data => {
                    resolve(data.toString().trim().toLowerCase() === 'y');
                });
            });
            if (!continuar) {
                console.log('❌ Cancelado por el usuario');
                process.exit(0);
            }
        }

        // 2. Llamar al endpoint para generar el segmento específico
        console.log(`\n🎬 Generando segmento ${SEGMENT_NUMBER}...`);
        console.log('⏱️  Tiempo estimado: 2-3 minutos\n');

        const startTime = Date.now();

        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-single-segment`,
            {
                sessionId: SESSION_ID,
                segmentIndex: SEGMENT_NUMBER - 1 // 0-indexed
            },
            {
                timeout: 600000 // 10 minutos
            }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (response.data.success) {
            console.log(`\n✅ Segmento ${SEGMENT_NUMBER} generado exitosamente`);
            console.log(`⏱️  Duración: ${duration}s`);
            console.log(`📹 Task ID: ${response.data.segment.taskId}`);
            console.log(`📁 File: ${response.data.segment.filename}`);
            console.log(`💬 Diálogo: "${response.data.segment.dialogue}"`);
            console.log(`🎥 Shot: ${response.data.segment.shot}`);

            console.log(
                '\n════════════════════════════════════════════════════════════════════════════════\n'
            );
            console.log('✅ SEGMENTO COMPLETADO');
            console.log('\n📊 Estado de la sesión:');
            console.log(
                `   - Completados: ${response.data.session.segmentsCompleted}/${response.data.session.segmentsTotal}`
            );
            console.log(
                `   - Progreso: ${Math.round((response.data.session.segmentsCompleted / response.data.session.segmentsTotal) * 100)}%`
            );

            if (response.data.session.segmentsCompleted === response.data.session.segmentsTotal) {
                console.log('\n🎉 ¡TODOS LOS SEGMENTOS COMPLETADOS!');
                console.log('📋 Próximos pasos:');
                console.log('   1. Concatenar segmentos');
                console.log('   2. Añadir subtítulos virales');
                console.log('   3. Añadir card del jugador');
                console.log('   4. Renderizar video final');
            } else {
                const nextSegment = SEGMENT_NUMBER + 1;
                if (nextSegment <= progress.segmentsTotal) {
                    console.log(`\n💡 Para generar el siguiente segmento:`);
                    console.log(
                        `   node scripts/veo3/continue-session-segment.js ${SESSION_ID} ${nextSegment}`
                    );
                }
            }
        } else {
            throw new Error(response.data.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

main();
