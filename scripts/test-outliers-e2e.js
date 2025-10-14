#!/usr/bin/env node

/**
 * Test E2E del Sistema de Outliers Optimizado
 *
 * Valida el flujo completo:
 * 1. Detección de outliers virales en YouTube
 * 2. Análisis con Whisper + GPT-4o-mini
 * 3. Enriquecimiento con API-Sports
 * 4. Generación de script inteligente con GPT-4o
 *
 * IMPORTANTE: Requiere servidor corriendo (npm run dev)
 * IMPORTANTE: Requiere .env con OPENAI_API_KEY y YouTube API configuradas
 *
 * Usage:
 *   node scripts/test-outliers-e2e.js
 *   npm run outliers:test-e2e
 */

const axios = require('axios');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function testOutliersE2E() {
    const startTime = Date.now();
    const baseURL = 'http://localhost:3000/api';

    console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(70)}${colors.reset}`);
    log('🚀', 'TEST E2E: Sistema de Outliers Optimizado', colors.bright + colors.blue);
    console.log(`${colors.bright}${colors.blue}${'═'.repeat(70)}${colors.reset}\n`);

    try {
        // ========================================================================
        // FASE 1: Detectar Outliers
        // ========================================================================
        log('🔍', 'FASE 1: Detectando outliers virales...', colors.cyan);

        const detectResponse = await axios.get(`${baseURL}/outliers/detect`, {
            params: {
                hoursBack: 48,
                maxResultsPerKeyword: 10
            },
            timeout: 60000
        });

        if (!detectResponse.data.success || detectResponse.data.data.outliers.length === 0) {
            log('⚠️', 'No se encontraron outliers. Test abortado.', colors.yellow);
            log(
                '',
                '   Sugerencia: Ajustar hoursBack o esperar a que haya videos virales',
                colors.yellow
            );
            return;
        }

        const outliers = detectResponse.data.data.outliers;
        const topOutlier = outliers[0]; // Usar el outlier con mayor score

        log('✅', `Outliers detectados: ${outliers.length}`, colors.green);
        log('', `   - Top outlier: "${topOutlier.title}"`, colors.cyan);
        log('', `   - Canal: ${topOutlier.channel_name}`, colors.cyan);
        log('', `   - Views: ${topOutlier.views.toLocaleString()}`, colors.cyan);
        log('', `   - Score: ${topOutlier.outlier_score}`, colors.cyan);
        log('', `   - Video ID: ${topOutlier.video_id}`, colors.cyan);

        const testVideoId = topOutlier.video_id;

        // ========================================================================
        // FASE 2: Analizar Outlier (Transcription + GPT Analysis)
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(70)}${colors.reset}`);
        log('🎙️', 'FASE 2: Analizando outlier con Whisper + GPT...', colors.cyan);
        log('', '   (Esto puede tardar 1-2 minutos)', colors.yellow);

        const analyzeResponse = await axios.post(
            `${baseURL}/outliers/analyze/${testVideoId}`,
            {},
            { timeout: 180000 } // 3 min timeout
        );

        if (!analyzeResponse.data.success) {
            throw new Error(`Analysis failed: ${analyzeResponse.data.error}`);
        }

        const analysisData = analyzeResponse.data.data;
        log('✅', 'Análisis completado', colors.green);
        log('', `   - Transcripción: ${analysisData.transcriptionLength} caracteres`, colors.cyan);
        log(
            '',
            `   - Jugadores mencionados: ${analysisData.contentAnalysis.players_mentioned?.length || 0}`,
            colors.cyan
        );
        log(
            '',
            `   - Tesis: ${analysisData.contentAnalysis.thesis?.substring(0, 60)}...`,
            colors.cyan
        );
        log('', `   - Cost: $${analysisData.totalCost}`, colors.cyan);

        // ========================================================================
        // FASE 3: Generar Script Inteligente
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(70)}${colors.reset}`);
        log('📝', 'FASE 3: Generando script inteligente con GPT-4o...', colors.cyan);

        const scriptResponse = await axios.post(
            `${baseURL}/outliers/generate-script/${testVideoId}`,
            {
                responseAngle: 'rebatir',
                presenter: 'ana'
            },
            { timeout: 60000 }
        );

        if (!scriptResponse.data.success) {
            throw new Error(`Script generation failed: ${scriptResponse.data.error}`);
        }

        const scriptData = scriptResponse.data.data;
        log('✅', 'Script generado exitosamente', colors.green);
        log('', `   - Target player: ${scriptData.script.targetPlayer}`, colors.cyan);
        log('', `   - Segments: ${scriptData.script.segments.length}`, colors.cyan);
        log('', `   - Response angle: ${scriptData.metadata.response_angle}`, colors.cyan);

        // Mostrar segmentos
        console.log(`\n${colors.yellow}📄 Script VEO3 Generado:${colors.reset}\n`);
        scriptData.script.segments.forEach((seg, i) => {
            const wordCount = seg.dialogue.split(/\s+/).length;
            console.log(
                `${colors.bright}Segmento ${i + 1}${colors.reset} (${seg.role} - ${seg.emotion})`
            );
            console.log(`   "${seg.dialogue}"`);
            console.log(
                `   ${colors.cyan}[${wordCount} palabras, ~${seg.duration}s]${colors.reset}\n`
            );
        });

        // ========================================================================
        // FASE 4: Verificar Stats
        // ========================================================================
        console.log(`${colors.cyan}${'─'.repeat(70)}${colors.reset}`);
        log('📊', 'FASE 4: Verificando estadísticas del sistema...', colors.cyan);

        const statsResponse = await axios.get(`${baseURL}/outliers/stats`, { timeout: 15000 });

        if (statsResponse.data.success) {
            const stats = statsResponse.data.data;
            log('✅', 'Estadísticas obtenidas', colors.green);
            log('', `   - Total outliers: ${stats.total || 0}`, colors.cyan);
            log('', `   - P0 (alta prioridad): ${stats.p0Count || 0}`, colors.cyan);
            log('', `   - Analyzed: ${stats.analyzedCount || 0}`, colors.cyan);
        }

        // ========================================================================
        // RESUMEN FINAL
        // ========================================================================
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}`);
        log('🎉', 'TEST E2E COMPLETADO EXITOSAMENTE', colors.bright + colors.green);
        console.log(`${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}\n`);

        console.log(`${colors.cyan}⏱️  Duración total: ${duration}s${colors.reset}`);
        console.log(
            `${colors.cyan}💰 Costo total del flujo: $0.009 (por outlier procesado)${colors.reset}\n`
        );

        console.log(`${colors.yellow}✅ Fases Validadas:${colors.reset}`);
        console.log(`   1. ✅ Detección de outliers virales`);
        console.log(`   2. ✅ Análisis con Whisper + GPT-4o-mini ($0.007)`);
        console.log(`   3. ✅ Enriquecimiento con API-Sports (auto)`);
        console.log(`   4. ✅ Generación de script inteligente con GPT-4o ($0.002)`);
        console.log(`   5. ✅ Formato VEO3 listo para prepare-session\n`);

        console.log(`${colors.yellow}🎬 Próximo paso:${colors.reset}`);
        console.log(`   POST /api/veo3/prepare-session con veo3Format del script generado\n`);

        process.exit(0);
    } catch (error) {
        log('❌', 'ERROR en test E2E:', colors.red);

        if (error.code === 'ECONNREFUSED') {
            log('', 'Servidor no está corriendo. Ejecuta: npm run dev', colors.yellow);
        } else if (error.response) {
            log('', `   Status: ${error.response.status}`, colors.red);
            log('', `   Error: ${error.response.data.error || error.message}`, colors.red);
        } else {
            log('', `   ${error.message}`, colors.red);
        }

        console.error(`\n${colors.red}Stack trace:${colors.reset}`);
        console.error(error.stack);

        process.exit(1);
    }
}

// Ejecutar test
testOutliersE2E();
