#!/usr/bin/env node
/**
 * Monitor silencioso que solo notifica cuando el video demo está completado
 */

const fs = require('fs');
const logger = require('../../../../../../../utils/logger');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output/veo3/demo');
const CHECK_INTERVAL = 30000; // 30 segundos

logger.info('🔍 Monitoreando generación del video demo...');
logger.info('⏳ Te avisaré cuando esté completado.\n');

let lastCheck = Date.now();
let checksCount = 0;

const monitor = setInterval(() => {
    checksCount++;
    const elapsed = Math.floor((Date.now() - lastCheck) / 1000 / 60);

    // Verificar si existe el video final
    if (fs.existsSync(OUTPUT_DIR)) {
        const files = fs.readdirSync(OUTPUT_DIR);
        const finalVideo = files.find(f => f.includes('pedri_chollo_demo') && f.endsWith('.mp4'));

        if (finalVideo) {
            logger.info('\n' + '='.repeat(80));
            logger.info('✅ ¡VIDEO DEMO COMPLETADO!');
            logger.info('='.repeat(80));
            logger.info(`📁 Archivo: ${finalVideo}`);
            logger.info(`📂 Ubicación: ${OUTPUT_DIR}`);
            logger.info(`\n🎬 Próximo paso: Validar el video en:`);
            logger.info(`   ${path.join(OUTPUT_DIR, finalVideo)}`);
            logger.info(`\n🌐 O ver en: http://localhost:3000/demo-3segments.html`);
            logger.info('');
            clearInterval(monitor);
            process.exit(0);
        }
    }

    // Notificación periódica cada 5 minutos
    if (checksCount % 10 === 0) {
        logger.info(`⏳ Aún generando... (${Math.floor(checksCount * 30 / 60)} minutos transcurridos)`);
    }

}, CHECK_INTERVAL);

// Timeout después de 30 minutos
setTimeout(() => {
    logger.info('\n⚠️  Timeout: Han pasado 30 minutos. Verifica manualmente el estado.');
    clearInterval(monitor);
    process.exit(1);
}, 30 * 60 * 1000);