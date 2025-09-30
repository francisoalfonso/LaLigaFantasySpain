#!/usr/bin/env node
/**
 * Generar video demo completo de Pedri con sistema 3-segmentos
 * Ana Intro → Stats Card → Ana Outro
 */

require('dotenv').config();
const ThreeSegmentGenerator = require('../../backend/services/veo3/threeSegmentGenerator');
const logger = require('../../../../../../../utils/logger');
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const path = require('path');
const fs = require('fs');

logger.info('='.repeat(80));
logger.info('🎬 GENERACIÓN VIDEO DEMO PEDRI - Sistema 3-Segmentos');
logger.info('='.repeat(80));

// Datos de Pedri
const pedriData = {
    name: 'Pedri',
    team: 'Barcelona',
    teamLogo: 'https://media.api-sports.io/football/teams/529.png',
    photo: 'https://media.api-sports.io/football/players/276.png',
    position: 'MID',
    price: 8.5,
    goals: 2,
    assists: 3,
    rating: 7.8,
    minutes: 450,
    games: 5,
    valueRatio: 1.35,
    probability: 78
};

// Estructura viral optimizada
const viralData = {
    hook: '¿Listos para un secreto del Barcelona?',
    contexto: 'Mientras todos miran a los caros delanteros...',
    inflexion: 'Pedri a 8.5 euros tiene datos increíbles.',
    resolucion: '¡Setenta y ocho por ciento de probabilidad de dar puntos esta jornada!',
    moraleja: 'Los chollos de centrocampistas están donde nadie mira.',
    cta: '¡Fichalo ahora antes de que suba de precio!'
};

async function generateDemoVideo() {
    try {
        // Paso 1: Generar estructura 3-segmentos
        logger.info('\n📋 PASO 1: Generando estructura 3-segmentos');
        logger.info('-'.repeat(80));

        const generator = new ThreeSegmentGenerator();
        const structure = generator.generateThreeSegments(
            'chollo',
            pedriData,
            viralData,
            {
                preset: 'chollo_standard',
                statsStyle: 'fantasy_premium',
                emphasizeStats: ['price', 'goals', 'valueRatio', 'probability'],
                useViralStructure: true
            }
        );

        logger.info(`✅ Estructura generada: ${structure.totalDuration}s total`);
        logger.info(`   Intro: ${structure.segments.intro.duration}s`);
        logger.info(`   Stats: ${structure.segments.stats.duration}s`);
        logger.info(`   Outro: ${structure.segments.outro.duration}s`);

        // Paso 2: Validar estructura
        logger.info('\n✅ PASO 2: Validando estructura');
        logger.info('-'.repeat(80));

        const validation = generator.validateStructure(structure);
        if (!validation.valid) {
            logger.error('❌ Estructura no válida:', validation.errors);
            process.exit(1);
        }
        logger.info('✅ Validación pasada');
        if (validation.warnings.length > 0) {
            logger.info('⚠️  Warnings:', validation.warnings.join(', '));
        }

        // Paso 3: Obtener instrucciones de generación
        logger.info('\n🎬 PASO 3: Preparando instrucciones VEO3');
        logger.info('-'.repeat(80));

        const instructions = generator.getGenerationInstructions(structure);
        logger.info(`✅ ${instructions.length} segmentos listos para VEO3`);

        // Paso 4: Generar videos con VEO3
        logger.info('\n🎥 PASO 4: Generando videos con VEO3');
        logger.info('-'.repeat(80));

        const client = new VEO3Client();
        const videoTasks = [];
        const outputDir = path.join(__dirname, '../../output/veo3/demo');

        // Crear directorio si no existe
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generar cada segmento
        for (let i = 0; i < instructions.length; i++) {
            const instruction = instructions[i];
            logger.info(`\n[${i + 1}/3] Generando segmento: ${instruction.name} (${instruction.duration}s)`);
            logger.info(`Prompt: ${instruction.prompt.substring(0, 100)}...`);

            try {
                const result = await client.generateVideo(instruction.prompt, {
                    duration: instruction.duration,
                    aspectRatio: instruction.aspectRatio,
                    seed: instruction.seed,
                    imageUrl: instruction.imageUrl
                });

                logger.info(`✅ Task ID: ${result.taskId}`);
                videoTasks.push({
                    name: instruction.name,
                    taskId: result.taskId,
                    duration: instruction.duration
                });
            } catch (error) {
                logger.error(`❌ Error generando ${instruction.name}:`, error.message);
                throw error;
            }
        }

        // Paso 5: Monitorear progreso
        logger.info('\n⏳ PASO 5: Monitoreando progreso de generación');
        logger.info('-'.repeat(80));
        logger.info('Esto puede tardar 4-6 minutos por segmento (~15 minutos total)');

        const completedVideos = [];
        const maxRetries = 100; // 100 intentos × 10s = ~16 minutos max
        let retries = 0;

        while (completedVideos.length < videoTasks.length && retries < maxRetries) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10s

            for (const task of videoTasks) {
                if (completedVideos.find(v => v.name === task.name)) {
                    continue; // Ya completado
                }

                try {
                    const status = await client.getTaskStatus(task.taskId);

                    if (status.state === 'SUCCEEDED') {
                        logger.info(`✅ ${task.name} completado!`);
                        logger.info(`   Video URL: ${status.videoUrl}`);

                        // Descargar video
                        const videoPath = path.join(outputDir, `${task.name}_pedri.mp4`);
                        await client.downloadVideo(status.videoUrl, videoPath);
                        logger.info(`   Descargado: ${videoPath}`);

                        completedVideos.push({
                            name: task.name,
                            path: videoPath,
                            url: status.videoUrl
                        });
                    } else if (status.state === 'FAILED') {
                        logger.error(`❌ ${task.name} falló: ${status.error || 'Unknown error'}`);
                        throw new Error(`Video generation failed for ${task.name}`);
                    } else {
                        // En progreso
                        logger.info(`⏳ ${task.name}: ${status.state} (${status.progress || 0}%)`);
                    }
                } catch (error) {
                    logger.error(`Error checking status for ${task.name}:`, error.message);
                }
            }
        }

        if (completedVideos.length < 3) {
            logger.error('❌ No se completaron todos los videos a tiempo');
            process.exit(1);
        }

        // Paso 6: Concatenar videos
        logger.info('\n🎞️  PASO 6: Concatenando videos');
        logger.info('-'.repeat(80));

        const concatenator = new VideoConcatenator();
        const videoPaths = completedVideos
            .sort((a, b) => {
                const order = { intro: 0, stats: 1, outro: 2 };
                return order[a.name] - order[b.name];
            })
            .map(v => v.path);

        const finalOutputPath = path.join(outputDir, `pedri_chollo_demo_${Date.now()}.mp4`);

        logger.info('Videos a concatenar:');
        videoPaths.forEach((p, i) => logger.info(`  ${i + 1}. ${path.basename(p)}`));

        await concatenator.concatenateVideos(videoPaths, {
            outputPath: finalOutputPath,
            transition: 'crossfade',
            transitionDuration: 0.5
        });

        logger.info(`✅ Video final generado: ${finalOutputPath}`);

        // Resumen final
        logger.info('\n' + '='.repeat(80));
        logger.info('✅ VIDEO DEMO COMPLETADO');
        logger.info('='.repeat(80));
        logger.info(`📁 Archivo: ${path.basename(finalOutputPath)}`);
        logger.info(`📂 Ubicación: ${finalOutputPath}`);
        logger.info(`⏱️  Duración: ${structure.totalDuration}s`);
        logger.info(`📊 Formato: 9:16 (Instagram/TikTok)`);
        logger.info(`\n🎬 Estructura:`);
        logger.info(`   1. Ana Intro (${structure.segments.intro.duration}s): "${structure.segments.intro.dialogue.substring(0, 50)}..."`);
        logger.info(`   2. Stats Card (${structure.segments.stats.duration}s): Gráficos impactantes Pedri`);
        logger.info(`   3. Ana Outro (${structure.segments.outro.duration}s): "${structure.segments.outro.dialogue.substring(0, 50)}..."`);
        logger.info(`\n📝 SIGUIENTE PASO: Subir a Bunny.net y crear página demo`);
        logger.info(`   Comando: node scripts/bunny/upload-demo-video.js "${finalOutputPath}"\n`);

        return {
            success: true,
            videoPath: finalOutputPath,
            structure,
            completedVideos
        };

    } catch (error) {
        logger.error('\n❌ ERROR:', error.message);
        logger.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    generateDemoVideo().then(result => {
        logger.info('\n✅ Script completado exitosamente');
        process.exit(0);
    }).catch(error => {
        logger.error('\n❌ Script falló:', error.message);
        process.exit(1);
    });
}

module.exports = generateDemoVideo;