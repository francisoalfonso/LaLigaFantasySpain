#!/usr/bin/env node

/**
 * TEST RESTAURADO - Sistema Test #47 con mejoras
 *
 * Restaura el sistema validado del 4 de octubre:
 * ✅ Endpoint: /api/veo3/generate-multi-segment
 * ✅ Generador: ThreeSegmentGenerator
 * ✅ Scripts: UnifiedScriptGenerator (con conversión números)
 * ✅ Preset: chollo_quick (2×7s = 14s)
 * ✅ Imagen Ana: Supabase Storage (mejora nueva)
 * ✅ Subtítulos virales: Automáticos
 * ✅ Logo outro: Automático
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    log('\n' + '═'.repeat(70), 'cyan');
    log(`  ${title}`, 'bright');
    log('═'.repeat(70), 'cyan');
}

async function main() {
    log('\n🔄 TEST RESTAURADO - Sistema validado Test #47 + Mejoras', 'bright');
    log('═'.repeat(70), 'cyan');

    const startTime = Date.now();

    section('📋 CONFIGURACIÓN DEL TEST');

    // Datos del jugador de prueba
    const playerData = {
        name: 'Lamine Yamal',
        team: 'Barcelona',
        price: 7.2,
        valueRatio: 1.45,
        position: 'FWD',
        stats: {
            games: 6,
            minutes: 480,
            goals: 3,
            assists: 2,
            rating: 7.9
        }
    };

    const testConfig = {
        contentType: 'chollo',
        playerData: playerData,
        preset: 'chollo_quick',  // ✅ NUEVO: 2×7s = 14s total
        options: {
            useViralStructure: true,  // ✅ Usar UnifiedScriptGenerator
            anaImageIndex: 0  // ✅ Imagen fija (Supabase)
        }
    };

    log('   Jugador: ' + playerData.name, 'cyan');
    log('   Equipo: ' + playerData.team, 'cyan');
    log('   Precio: ' + playerData.price + 'M', 'cyan');
    log('   Ratio: ' + playerData.valueRatio + 'x', 'cyan');
    log('   Preset: chollo_quick (2 segmentos × 7s = 14s)', 'yellow');
    log('   Endpoint: /api/veo3/generate-multi-segment', 'yellow');

    section('🎬 PASO 1: Generando video con sistema restaurado');

    log('📤 Enviando request a /api/veo3/generate-multi-segment...', 'yellow');
    log('   ⏱️  Tiempo estimado: 6-8 minutos (2 segmentos)', 'cyan');

    try {
        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-multi-segment`,
            testConfig,
            {
                timeout: 900000 // 15 minutos
            }
        );

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

        if (response.data.success) {
            section('✅ VIDEO GENERADO EXITOSAMENTE');

            log(`\n⏱️  Tiempo total: ${duration} minutos`, 'green');

            const video = response.data.concatenatedVideo;
            const sessionId = response.data.sessionId;

            log(`📹 Session ID: ${sessionId}`, 'cyan');
            log(`📹 Duración video: ${video?.duration || 'N/A'}s`, 'cyan');
            log(`🎞️  Segmentos: ${response.data.segmentsCompleted}/${response.data.segmentsTotal}`, 'cyan');
            log(`📁 Archivo: ${video?.outputPath || 'N/A'}`, 'cyan');
            log(`🌐 URL: ${response.data.finalVideoUrl || 'N/A'}`, 'cyan');

            section('📋 VALIDACIONES CRÍTICAS');

            log('\n✅ ESPERADO (basado en Test #47 + mejoras):', 'green');
            log('   1. ✅ Ana imagen consistente (Supabase)', 'cyan');
            log('   2. ✅ Números en texto español ("siete punto dos", NO "7.2")', 'cyan');
            log('   3. ✅ Script coherente (UnifiedScriptGenerator)', 'cyan');
            log('   4. ✅ Duración correcta (~14-16s sin logo, ~16-18s con logo)', 'cyan');
            log('   5. ✅ Logo Fantasy La Liga al final', 'cyan');
            log('   6. ✅ Subtítulos virales automáticos', 'cyan');
            log('   7. ⏳ Acento español de España (NO mexicano)', 'yellow');
            log('   8. ⏳ Transiciones suaves (frame-to-frame)', 'yellow');

            section('📊 DATOS GENERADOS');

            if (response.data.segments && response.data.segments.length > 0) {
                log('\nDiálogos generados:', 'yellow');
                response.data.segments.forEach((seg, idx) => {
                    log(`\n   Segmento ${idx + 1} (${seg.role}):', 'cyan');
                    log(`   "${seg.dialogue}"`, 'white');
                    log(`   Duración: ${seg.duration}s`, 'cyan');
                });
            }

            section('🎯 PRÓXIMOS PASOS');

            log('\n1. Abre el video:', 'cyan');
            log(`   open "${video?.outputPath}"`, 'yellow');

            log('\n2. Verifica TODOS los puntos críticos:', 'cyan');
            log('   □ Ana consistente en ambos segmentos', 'yellow');
            log('   □ Números en texto ("siete punto dos millones")', 'yellow');
            log('   □ Script coherente y narrativa fluida', 'yellow');
            log('   □ Duración total ~14-16s', 'yellow');
            log('   □ Logo al final', 'yellow');
            log('   □ Subtítulos virales visibles', 'yellow');
            log('   □ Acento español de España', 'yellow');
            log('   □ Sin saltos bruscos entre segmentos', 'yellow');

            log('\n3. Compara con Test #47:', 'cyan');
            log('   ✅ Mejora: Imagen Ana desde Supabase', 'green');
            log('   ✅ Mejora: Preset optimizado (14s vs 24s)', 'green');
            log('   ✅ Conservado: UnifiedScriptGenerator', 'green');
            log('   ✅ Conservado: Logo outro automático', 'green');
            log('   ✅ Conservado: Subtítulos virales', 'green');

            log('\n4. Reporta los resultados:', 'cyan');
            log('   ✅ Todo OK → Aprobar como sistema principal', 'green');
            log('   ⚠️  Mejoras menores → Iterar', 'yellow');
            log('   ❌ Problemas críticos → Ajustar configuración', 'red');

            // Abrir video automáticamente
            const { exec } = require('child_process');
            if (video?.outputPath) {
                exec(`open "${video.outputPath}"`);
                log('\n✅ Video abierto automáticamente\n', 'green');
            }

        } else {
            log('\n❌ Error en generación:', 'red');
            log(JSON.stringify(response.data, null, 2), 'red');
        }

    } catch (error) {
        log('\n❌ ERROR FATAL:', 'red');

        if (error.response?.data) {
            log(JSON.stringify(error.response.data, null, 2), 'red');
        } else {
            log(error.message, 'red');
            if (error.code === 'ECONNREFUSED') {
                log('\n⚠️  SERVIDOR NO RESPONDE', 'yellow');
                log('Verifica que el servidor esté corriendo:', 'cyan');
                log('   npm run dev', 'yellow');
            }
        }

        process.exit(1);
    }
}

main();
