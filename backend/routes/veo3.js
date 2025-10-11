const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Importar servicios VEO3
const VEO3Client = require('../services/veo3/veo3Client');
const PromptBuilder = require('../services/veo3/promptBuilder');
const PlayerCardsOverlay = require('../services/veo3/playerCardsOverlay');
const VideoConcatenator = require('../services/veo3/videoConcatenator');
const ViralVideoBuilder = require('../services/veo3/viralVideoBuilder');
const ThreeSegmentGenerator = require('../services/veo3/threeSegmentGenerator'); // ✅ NUEVO
const {
    validateAndPrepare,
    updatePlayerSuccessRate
} = require('../utils/playerDictionaryValidator');

// Instanciar servicios
const veo3Client = new VEO3Client();
const promptBuilder = new PromptBuilder();
const playerCards = new PlayerCardsOverlay();
const concatenator = new VideoConcatenator();
const viralBuilder = new ViralVideoBuilder();
const multiSegmentGenerator = new ThreeSegmentGenerator(); // ✅ NUEVO

/**
 * @route GET /api/veo3/test
 * @desc Test de conectividad VEO3
 */
router.get('/test', async (req, res) => {
    try {
        logger.info('[VEO3 Routes] Test de conectividad iniciado...');

        const connected = await veo3Client.testConnection();

        if (connected) {
            res.json({
                success: true,
                message: 'VEO3 API conectada exitosamente',
                timestamp: new Date().toISOString(),
                config: {
                    model: process.env.VEO3_DEFAULT_MODEL,
                    aspect: process.env.VEO3_DEFAULT_ASPECT,
                    maxDuration: process.env.VEO3_MAX_DURATION,
                    anaImageConfigured: !!process.env.ANA_IMAGE_URL
                }
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'No se pudo conectar con VEO3 API',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('[VEO3 Routes] Error en test:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno en test VEO3',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/generate-ana
 * @desc Generar video de Ana Real
 */
router.post('/generate-ana', async (req, res) => {
    try {
        const { type, playerName, price, content, options = {} } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de video requerido (chollo, analysis, prediction, custom)'
            });
        }

        logger.info(`[VEO3 Routes] Generando video Ana tipo: ${type}`);

        let prompt;
        const videoData = { type };

        // ✅ VALIDACIÓN PROGRESIVA DE DICCIONARIO
        // Si el video es de un jugador específico, validar/completar diccionario
        let dictionaryData = null;
        if (playerName && req.body.team) {
            logger.info(
                `[VEO3 Routes] 📋 Validando diccionario para "${playerName}" del "${req.body.team}"...`
            );

            dictionaryData = await validateAndPrepare(playerName, req.body.team);

            logger.info(`[VEO3 Routes] ✅ Diccionario validado:`);
            logger.info(
                `  - Referencias seguras: ${dictionaryData.player.safeReferences.join(', ')}`
            );
            logger.info(
                `  - Tasa de éxito: ${(dictionaryData.player.testedSuccessRate * 100).toFixed(1)}%`
            );
        }

        // Generar prompt según el tipo
        switch (type) {
            case 'chollo':
                if (!playerName || !price) {
                    return res.status(400).json({
                        success: false,
                        message: 'playerName y price requeridos para tipo chollo'
                    });
                }
                // Pasar estadísticas y datos completos al prompt builder
                const cholloOptions = {
                    ...options,
                    stats: req.body.stats || {},
                    ratio: req.body.ratio,
                    team: req.body.team || playerName.split(' ').pop(), // fallback
                    dictionaryData // ✅ Pasar datos del diccionario al prompt builder
                };
                prompt = promptBuilder.buildCholloPrompt(playerName, price, cholloOptions);
                videoData.player = playerName;
                videoData.price = price;
                break;

            case 'analysis':
                if (!playerName || !price) {
                    return res.status(400).json({
                        success: false,
                        message: 'playerName y price requeridos para tipo analysis'
                    });
                }
                prompt = promptBuilder.buildAnalysisPrompt(playerName, price, {}, options);
                videoData.player = playerName;
                videoData.price = price;
                break;

            case 'prediction':
                if (!content) {
                    return res.status(400).json({
                        success: false,
                        message: 'content requerido para tipo prediction'
                    });
                }
                const gameweek = options.gameweek || 5;
                prompt = promptBuilder.buildPredictionPrompt(gameweek, content, options);
                videoData.content = content;
                videoData.gameweek = gameweek;
                break;

            case 'intro':
                prompt = promptBuilder.buildIntroPrompt(options);
                break;

            case 'outro':
                prompt = promptBuilder.buildOutroPrompt(options);
                break;

            case 'custom':
                if (!content) {
                    return res.status(400).json({
                        success: false,
                        message: 'content (prompt) requerido para tipo custom'
                    });
                }
                prompt = content;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message:
                        'Tipo no válido. Usar: chollo, analysis, prediction, intro, outro, custom'
                });
        }

        // Validar prompt
        const validation = promptBuilder.validatePrompt(prompt);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Prompt inválido',
                errors: validation.errors
            });
        }

        // Generar video
        const video = await veo3Client.generateCompleteVideo(prompt, options.veo3Options);

        // ✅ ACTUALIZAR TASA DE ÉXITO EN DICCIONARIO
        // Si se generó exitosamente un video de jugador, actualizar estadísticas
        if (playerName && dictionaryData) {
            const success = video && video.taskId; // Video generado correctamente
            await updatePlayerSuccessRate(playerName, success);

            if (success) {
                logger.info(`[VEO3 Routes] ✅ Actualizada tasa de éxito para "${playerName}"`);
            }
        }

        res.json({
            success: true,
            message: 'Video Ana generado exitosamente',
            data: {
                ...videoData,
                video: {
                    taskId: video.taskId,
                    url: video.url,
                    duration: video.duration,
                    cost: video.cost,
                    generatedAt: video.generatedAt
                },
                prompt: {
                    text: prompt,
                    length: prompt.length,
                    validation: validation.warnings
                },
                dictionary: dictionaryData
                    ? {
                          playerInDictionary: true,
                          successRate: `${(dictionaryData.player.testedSuccessRate * 100).toFixed(1)}%`,
                          totalVideos: dictionaryData.player.totalVideos
                      }
                    : null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error generando video Ana:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando video Ana',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * ⭐ NUEVO: @route POST /api/veo3/generate-multi-segment
 * @desc Generar video multi-segmento (2-4 segmentos según preset)
 * Soporta: breaking_news (2seg/16s), prediccion_standard (3seg/24s), chollo_viral (4seg/32s)
 */
router.post('/generate-multi-segment', async (req, res) => {
    try {
        const {
            contentType = 'chollo',
            playerData,
            preset = 'chollo_viral',
            options = {}
        } = req.body;

        // Validar datos requeridos
        if (!playerData || !playerData.name) {
            return res.status(400).json({
                success: false,
                message: 'playerData con name requerido'
            });
        }

        logger.info(
            `[VEO3 Routes] Generando video multi-segmento: ${contentType}, preset: ${preset}`
        );

        // ✅ Validación diccionario
        let dictionaryData = null;
        if (playerData.name && playerData.team) {
            logger.info(`[VEO3 Routes] 📋 Validando diccionario para "${playerData.name}"...`);
            dictionaryData = await validateAndPrepare(playerData.name, playerData.team);
        }

        // Datos contextuales para el script (NO diálogos hardcodeados)
        // Los diálogos se generan en unifiedScriptGenerator.js
        const viralData = {
            gameweek: 'jornada 5', // Contexto temporal
            xgIncrease: '30' // Datos opcionales para análisis
            // ⚠️ NO incluir diálogos aquí - se generan en unifiedScriptGenerator
        };

        // Generar estructura de segmentos
        const structure = multiSegmentGenerator.generateThreeSegments(
            contentType,
            playerData,
            viralData,
            {
                preset,
                ...options
            }
        );

        logger.info(
            `[VEO3 Routes] Estructura generada: ${structure.segmentCount} segmentos, ${structure.totalDuration}s total`
        );

        // 🔧 GENERACIÓN SECUENCIAL CON PERSISTENCIA
        // Crear directorio de sesión para guardar segmentos
        const sessionId = Date.now();
        const sessionDir = path.join(
            __dirname,
            '../../output/veo3/sessions',
            `session_${sessionId}`
        );
        await fs.promises.mkdir(sessionDir, { recursive: true });

        const progressFile = path.join(sessionDir, 'progress.json');
        logger.info(`[VEO3 Routes] 📁 Sesión creada: ${sessionDir}`);

        // Generar cada segmento con VEO3 SECUENCIALMENTE
        const generatedSegments = [];
        const anaImageIndex = structure.metadata.anaImageIndex;

        for (let i = 0; i < structure.generationOrder.length; i++) {
            const order = structure.generationOrder[i];
            const segment = structure.segments[order.segment];
            const segmentNum = i + 1;

            logger.info(
                `[VEO3 Routes] 📹 Generando segmento ${segmentNum}/${structure.segmentCount}: ${order.segment}...`
            );

            try {
                const veo3Options = {
                    ...segment.veo3Config,
                    imageIndex: anaImageIndex // ✅ Imagen fija para TODOS
                };

                // Generar segmento
                const videoResult = await veo3Client.generateCompleteVideo(
                    segment.prompt,
                    veo3Options
                );

                // ✅ DESCARGAR Y GUARDAR INMEDIATAMENTE
                logger.info(`[VEO3 Routes] 💾 Descargando segmento ${segmentNum} desde VEO3...`);
                const response = await axios.get(videoResult.url, { responseType: 'arraybuffer' });

                const segmentFilename = `segment_${segmentNum}_${videoResult.taskId}.mp4`;
                const localPath = path.join(sessionDir, segmentFilename);
                await fs.promises.writeFile(localPath, response.data);

                const segmentData = {
                    index: i,
                    role: segment.role,
                    taskId: videoResult.taskId,
                    veo3Url: videoResult.url,
                    localPath: localPath,
                    filename: segmentFilename,
                    duration: segment.duration,
                    dialogue: segment.dialogue,
                    generatedAt: new Date().toISOString(),
                    size: response.data.length
                };

                generatedSegments.push(segmentData);

                // Persistir progreso inmediatamente
                const progressData = {
                    sessionId,
                    sessionDir,
                    segmentsCompleted: segmentNum,
                    segmentsTotal: structure.segmentCount,
                    playerName: playerData.name || 'unknown',
                    contentType,
                    preset,
                    segments: generatedSegments,
                    lastUpdate: new Date().toISOString()
                };

                await fs.promises.writeFile(progressFile, JSON.stringify(progressData, null, 2));

                logger.info(
                    `[VEO3 Routes] ✅ Segmento ${segmentNum} guardado: ${localPath} (${(response.data.length / 1024 / 1024).toFixed(2)} MB)`
                );

                // 🔧 DELAY entre segmentos (DESPUÉS de guardar)
                if (segmentNum < structure.segmentCount) {
                    const delaySeconds = 60; // Aumentado a 60s para evitar límite carga acumulada VEO3
                    logger.info(
                        `[VEO3 Routes] ⏱️  Esperando ${delaySeconds}s antes del siguiente segmento...`
                    );
                    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
                }
            } catch (error) {
                logger.error(`[VEO3 Routes] ❌ Error en segmento ${segmentNum}:`, error.message);

                // Guardar estado de error
                const errorData = {
                    sessionId,
                    sessionDir,
                    segmentsCompleted: generatedSegments.length,
                    segmentsTotal: structure.segmentCount,
                    playerName: playerData.name || 'unknown',
                    contentType,
                    preset,
                    segments: generatedSegments,
                    error: {
                        segmentIndex: i,
                        segmentNumber: segmentNum,
                        segmentRole: segment.role,
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    },
                    lastUpdate: new Date().toISOString()
                };

                await fs.promises.writeFile(progressFile, JSON.stringify(errorData, null, 2));

                logger.error(`[VEO3 Routes] 💾 Estado de error guardado en: ${progressFile}`);
                logger.error(
                    `[VEO3 Routes] ✅ Segmentos exitosos antes del error: ${generatedSegments.length}/${structure.segmentCount}`
                );

                throw new Error(
                    `Fallo en segmento ${segmentNum}/${structure.segmentCount}: ${error.message}`
                );
            }
        }

        logger.info(
            `[VEO3 Routes] 🎉 Todos los segmentos generados exitosamente: ${generatedSegments.length}/${structure.segmentCount}`
        );

        // ✅ Actualizar diccionario
        if (playerData.name && dictionaryData) {
            const success = generatedSegments.length === structure.segmentCount;
            await updatePlayerSuccessRate(playerData.name, success);
        }

        // 🎬 CONCATENAR VIDEOS (si hay múltiples segmentos)
        // Ahora usamos los archivos locales ya descargados
        let finalVideoUrl = null;
        let concatenatedVideo = null;

        if (generatedSegments.length > 1) {
            logger.info(
                `[VEO3 Routes] 🔗 Concatenando ${generatedSegments.length} segmentos desde archivos locales...`
            );

            try {
                const VideoConcatenator = require('../services/veo3/videoConcatenator');
                const concatenator = new VideoConcatenator();

                // ✅ Usar paths locales YA descargados (no necesitamos descargar de nuevo)
                const localPaths = generatedSegments.map(seg => seg.localPath);

                logger.info(`[VEO3 Routes] 📂 Segmentos locales listos para concatenar:`);
                localPaths.forEach((path, idx) => {
                    logger.info(`[VEO3 Routes]    ${idx + 1}. ${path}`);
                });

                // Concatenar videos desde archivos locales (+ logo outro automático)
                const outputPath = await concatenator.concatenateVideos(localPaths, {
                    transition: { enabled: false }, // Sin transiciones
                    audio: { fadeInOut: false },
                    outro: { enabled: true } // ✅ Agregar logo blanco FLP al final
                });

                // Leer video concatenado y usar ruta estática correcta
                finalVideoUrl = `http://localhost:3000/output/veo3/${path.basename(outputPath)}`;

                // Guardar metadata del video concatenado
                concatenatedVideo = {
                    videoId: `concat_${sessionId}`,
                    title: `${playerData.name}_${contentType}_${preset}`,
                    duration: structure.totalDuration,
                    sessionId: sessionId,
                    sessionDir: sessionDir,
                    outputPath: outputPath
                };

                // Actualizar progress con video final
                const finalProgress = {
                    sessionId,
                    sessionDir,
                    segmentsCompleted: generatedSegments.length,
                    segmentsTotal: structure.segmentCount,
                    playerName: playerData.name || 'unknown',
                    contentType,
                    preset,
                    segments: generatedSegments,
                    concatenatedVideo: concatenatedVideo,
                    finalVideoUrl: finalVideoUrl,
                    completedAt: new Date().toISOString()
                };

                await fs.promises.writeFile(progressFile, JSON.stringify(finalProgress, null, 2));

                logger.info(`[VEO3 Routes] ✅ Videos concatenados: ${finalVideoUrl}`);
                logger.info(`[VEO3 Routes] 📄 Progreso final guardado: ${progressFile}`);
            } catch (error) {
                logger.error(`[VEO3 Routes] ❌ Error concatenando:`, error.message);
                // Fallback: usar primer segmento local
                finalVideoUrl = `http://localhost:3000/output/veo3/sessions/session_${sessionId}/${generatedSegments[0]?.filename}`;
                logger.warn(`[VEO3 Routes] ⚠️ Usando segmento 1 como fallback: ${finalVideoUrl}`);
            }
        } else {
            // Solo un segmento - usar archivo local
            finalVideoUrl = `http://localhost:3000/output/veo3/sessions/session_${sessionId}/${generatedSegments[0]?.filename}`;
            logger.info(`[VEO3 Routes] ✅ Video único disponible: ${finalVideoUrl}`);
        }

        res.json({
            success: true,
            message: `Video multi-segmento ${contentType} generado exitosamente`,
            data: {
                contentType,
                preset,
                segmentCount: structure.segmentCount,
                totalDuration: structure.totalDuration,
                anaImageIndex,
                segments: generatedSegments,
                concatenatedVideo: concatenatedVideo
                    ? {
                          url: finalVideoUrl,
                          videoId: concatenatedVideo.videoId,
                          duration: structure.totalDuration,
                          title: concatenatedVideo.title
                      }
                    : null,
                finalVideoUrl, // ✅ URL del video final (concatenado o primer segmento)
                playerData: {
                    name: playerData.name,
                    team: playerData.team,
                    price: playerData.price
                },
                structure,
                dictionary: dictionaryData
                    ? {
                          playerInDictionary: true,
                          successRate: `${(dictionaryData.player.testedSuccessRate * 100).toFixed(1)}%`,
                          totalVideos: dictionaryData.player.totalVideos
                      }
                    : null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error generando video multi-segmento:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando video multi-segmento',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/veo3/status/:taskId
 * @desc Obtener estado de generación de video
 */
router.get('/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'taskId requerido'
            });
        }

        logger.info(`[VEO3 Routes] Consultando estado de ${taskId}`);

        const status = await veo3Client.getStatus(taskId);

        res.json({
            success: true,
            data: {
                taskId,
                status: status.data?.successFlag,
                statusText:
                    status.data?.successFlag === 0
                        ? 'processing'
                        : status.data?.successFlag === 1
                          ? 'completed'
                          : 'failed',
                result: status.data?.response,
                error: status.data?.errorMessage
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error obteniendo estado:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estado del video',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/veo3/video-info/:taskId
 * @desc Obtener información del video sin descargar (evita dependencias externas)
 */
router.get('/video-info/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        logger.info(`[VEO3 Routes] Obteniendo información de video para taskId: ${taskId}`);

        // Obtener solo el estado sin intentar descargar
        const status = await veo3Client.getStatus(taskId);

        if (!status.data?.response) {
            return res.status(404).json({
                success: false,
                message: 'Video no disponible o aún en procesamiento'
            });
        }

        // Devolver información sin URLs externas problemáticas
        res.json({
            success: true,
            data: {
                taskId,
                status: status.data?.successFlag,
                statusText:
                    status.data?.successFlag === 0
                        ? 'processing'
                        : status.data?.successFlag === 1
                          ? 'completed'
                          : 'failed',
                info: {
                    resolution: status.data.response.resolution || 'desconocida',
                    hasAudio: status.data.response.hasAudioList?.[0] || false,
                    seed: status.data.response.seeds?.[0] || 'desconocido'
                },
                message: 'Video completado - usar sistema de generación local para nuevos videos'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error obteniendo información del video:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo información del video',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/add-player-card
 * @desc Agregar tarjeta de jugador a video
 */
router.post('/add-player-card', async (req, res) => {
    try {
        const { videoPath, playerData, options = {} } = req.body;

        if (!videoPath || !playerData) {
            return res.status(400).json({
                success: false,
                message: 'videoPath y playerData requeridos'
            });
        }

        if (!playerData.name) {
            return res.status(400).json({
                success: false,
                message: 'playerData.name requerido'
            });
        }

        logger.info(`[VEO3 Routes] Agregando tarjeta de ${playerData.name} al video`);

        const resultPath = await playerCards.addPlayerCardOverlay(videoPath, playerData, options);

        res.json({
            success: true,
            message: 'Player card agregada exitosamente',
            data: {
                inputVideo: videoPath,
                outputVideo: resultPath,
                playerData
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error agregando player card:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error agregando player card',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/concatenate
 * @desc Concatenar múltiples videos
 */
router.post('/concatenate', async (req, res) => {
    try {
        const { videoPaths, options = {} } = req.body;

        if (!videoPaths || !Array.isArray(videoPaths) || videoPaths.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren al menos 2 videoPaths'
            });
        }

        logger.info(`[VEO3 Routes] Concatenando ${videoPaths.length} videos`);

        const resultPath = await concatenator.concatenateVideos(videoPaths, options);

        res.json({
            success: true,
            message: 'Videos concatenados exitosamente',
            data: {
                inputVideos: videoPaths,
                outputVideo: resultPath,
                segmentsCount: videoPaths.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error concatenando videos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error concatenando videos',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/generate-long-video
 * @desc Generar video largo con múltiples segmentos automáticamente
 */
router.post('/generate-long-video', async (req, res) => {
    try {
        const { theme, segmentCount = 3, options = {} } = req.body;

        if (!theme) {
            return res.status(400).json({
                success: false,
                message: 'theme requerido (chollos, analysis, predictions, jornada)'
            });
        }

        logger.info(
            `[VEO3 Routes] Generando video largo tema "${theme}" con ${segmentCount} segmentos`
        );

        // Generar prompts basados en el tema
        const prompts = [];

        switch (theme.toLowerCase()) {
            case 'chollos':
                const players = ['Pedri', 'Bellingham', 'Lewandowski'];
                const prices = [8.5, 10.2, 9.5];
                for (let i = 0; i < Math.min(segmentCount, players.length); i++) {
                    prompts.push(promptBuilder.buildCholloPrompt(players[i], prices[i]));
                }
                break;

            case 'analysis':
                const analysisPlayers = ['Vinicius', 'Gavi', 'Morata'];
                const analysisPrices = [11.5, 7.0, 8.0];
                for (let i = 0; i < Math.min(segmentCount, analysisPlayers.length); i++) {
                    prompts.push(
                        promptBuilder.buildAnalysisPrompt(analysisPlayers[i], analysisPrices[i])
                    );
                }
                break;

            case 'jornada':
                prompts.push(
                    promptBuilder.buildIntroPrompt({
                        dialogue: '¡Hola Misters! Bienvenidos al análisis completo de la jornada.'
                    })
                );
                prompts.push(promptBuilder.buildCholloPrompt('Pedri', 8.5));
                prompts.push(
                    promptBuilder.buildOutroPrompt({
                        dialogue: '¡Hasta la próxima! No olvidéis estos chollos.'
                    })
                );
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Tema no válido. Usar: chollos, analysis, predictions, jornada'
                });
        }

        const resultPath = await concatenator.createLongVideoFromPrompts(
            prompts,
            veo3Client,
            options
        );

        res.json({
            success: true,
            message: `Video largo "${theme}" generado exitosamente`,
            data: {
                theme,
                segmentsRequested: segmentCount,
                segmentsGenerated: prompts.length,
                outputVideo: resultPath
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error generando video largo:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando video largo',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/test-minimal-prompt
 * @desc Test con prompt MINIMALISTA para máxima fidelidad a imagen
 */
router.post('/test-minimal-prompt', async (req, res) => {
    try {
        const { dialogue } = req.body;

        if (!dialogue) {
            return res.status(400).json({
                success: false,
                message: 'dialogue requerido'
            });
        }

        logger.info(`[VEO3 Routes] Test minimal prompt para máxima consistencia Ana`);

        // Prompt ULTRA-MINIMALISTA que fuerza usar la imagen exacta
        const minimalPrompt = `The person in the reference image speaking in Spanish: "${dialogue}". Exact appearance from reference image.`;

        logger.info(`[VEO3 Routes] Usando prompt minimal: ${minimalPrompt}`);

        const video = await veo3Client.generateVideo(minimalPrompt, {
            duration: 8,
            aspectRatio: '9:16'
        });

        res.json({
            success: true,
            message: 'Video minimal generado exitosamente',
            data: {
                video: {
                    taskId: video.data.taskId,
                    prompt: minimalPrompt
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error en test minimal:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error en test minimal',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/veo3/config
 * @desc Obtener configuración actual VEO3
 */
router.get('/config', (req, res) => {
    try {
        const config = {
            veo3: {
                model: process.env.VEO3_DEFAULT_MODEL || 'veo3_fast',
                maxDuration: process.env.VEO3_MAX_DURATION || '8',
                aspectRatio: process.env.VEO3_DEFAULT_ASPECT || '9:16',
                watermark: process.env.VEO3_WATERMARK || 'Fantasy La Liga Pro'
            },
            ana: {
                imageConfigured: !!process.env.ANA_IMAGE_URL,
                characterSeed: process.env.ANA_CHARACTER_SEED || '30001'
            },
            paths: {
                outputDir: process.env.VEO3_OUTPUT_DIR || './output/veo3',
                tempDir: process.env.VEO3_TEMP_DIR || './temp/veo3',
                logsDir: process.env.VEO3_LOGS_DIR || './logs/veo3'
            },
            performance: {
                maxConcurrent: process.env.VEO3_MAX_CONCURRENT || '3',
                requestDelay: process.env.VEO3_REQUEST_DELAY || '6000',
                timeout: process.env.VEO3_TIMEOUT || '300000'
            },
            costs: {
                costPerVideo: process.env.VEO3_COST_PER_VIDEO || '0.30',
                dailyLimit: process.env.VEO3_DAILY_LIMIT || '50.00',
                monthlyLimit: process.env.VEO3_MONTHLY_LIMIT || '500.00'
            }
        };

        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error obteniendo configuración:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo configuración',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/complete-workflow
 * @desc FLUJO COMPLETO: API → Guión → VEO3 → Descarga → Verificación → URL Local
 */
router.post('/complete-workflow', async (req, res) => {
    try {
        const { dataType, apiData, options = {} } = req.body;

        if (!dataType || !apiData) {
            return res.status(400).json({
                success: false,
                message:
                    'dataType y apiData requeridos. Ejemplo: dataType="chollos", apiData={players: [...]}'
            });
        }

        logger.info(`[VEO3 Routes] ⚡ FLUJO COMPLETO iniciado - Tipo: ${dataType}`);

        // PASO 1: Generar guiones basados en datos de API
        const scripts = [];
        const metadata = {
            dataType,
            originalApiData: apiData,
            timestamp: new Date().toISOString(),
            segments: []
        };

        switch (dataType.toLowerCase()) {
            case 'chollos':
                if (!apiData.players || !Array.isArray(apiData.players)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Para tipo "chollos" se requiere apiData.players array'
                    });
                }

                logger.info(
                    `[VEO3 Routes] 📝 Generando guiones para ${apiData.players.length} chollos`
                );

                // Crear scripts personalizados para cada chollo
                for (let i = 0; i < apiData.players.length; i++) {
                    const player = apiData.players[i];
                    const script = {
                        id: `chollo_${i + 1}`,
                        player: player.name,
                        price: player.price,
                        dialogue:
                            i === 0
                                ? `¡Misters! Los chollos de hoy: ${player.name} del ${player.team} a ${player.price}€ rating ${player.rating}. ¡Oportunidad de oro!`
                                : i === apiData.players.length - 1
                                  ? `Para terminar, ${player.name} completa nuestros chollos de hoy. Estos ${apiData.players.length} jugadores pueden transformar vuestros equipos.`
                                  : `Continuamos con ${player.name}. A ${player.price}€ es una ganga espectacular. Los números son matemática pura!`,
                        prompt: `The person in the reference image speaking in Spanish: "SCRIPT_PLACEHOLDER". Exact appearance from reference image.`
                    };
                    scripts.push(script);
                    metadata.segments.push({
                        type: 'chollo',
                        player: player.name,
                        price: player.price,
                        team: player.team
                    });
                }
                break;

            case 'bargains':
                // Alias para chollos
                return res.status(400).json({
                    success: false,
                    message: 'Usar dataType="chollos" en lugar de "bargains"'
                });

            case 'jornada':
                if (!apiData.gameweek || !apiData.highlights) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Para tipo "jornada" se requiere apiData.gameweek y apiData.highlights'
                    });
                }

                scripts.push({
                    id: 'jornada_intro',
                    dialogue: `¡Hola Misters! Análisis completo jornada ${apiData.gameweek}. Datos oficiales API-Sports.`,
                    prompt: `The person in the reference image speaking in Spanish: "SCRIPT_PLACEHOLDER". Exact appearance from reference image.`
                });

                if (apiData.highlights.chollos) {
                    scripts.push({
                        id: 'jornada_chollos',
                        dialogue: `Los chollos destacados: ${apiData.highlights.chollos.map(p => `${p.name} a ${p.price}€`).join(', ')}. ¡Matemática pura!`,
                        prompt: `The person in the reference image speaking in Spanish: "SCRIPT_PLACEHOLDER". Exact appearance from reference image.`
                    });
                }

                scripts.push({
                    id: 'jornada_outro',
                    dialogue: `¡Hasta la próxima jornada! Recordad: Fantasy La Liga es ciencia de datos.`,
                    prompt: `The person in the reference image speaking in Spanish: "SCRIPT_PLACEHOLDER". Exact appearance from reference image.`
                });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'dataType no válido. Usar: chollos, jornada'
                });
        }

        logger.info(`[VEO3 Routes] ✅ ${scripts.length} guiones generados`);

        // PASO 2: Generar videos VEO3 con VideoManager integrado
        logger.info(`[VEO3 Routes] 🎬 Iniciando generación de ${scripts.length} videos VEO3`);

        const videoResults = [];
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const finalPrompt = script.prompt.replace('SCRIPT_PLACEHOLDER', script.dialogue);

            logger.info(
                `[VEO3 Routes] 🎥 Generando video ${i + 1}/${scripts.length}: ${script.id}`
            );

            try {
                // CRÍTICO: Usar generateCompleteVideo que ya integra VideoManager
                const video = await veo3Client.generateCompleteVideo(finalPrompt, {
                    duration: options.duration || 8,
                    aspectRatio: options.aspectRatio || '9:16',
                    ...options.veo3Options
                });

                videoResults.push({
                    ...script,
                    video: video,
                    status: 'completed'
                });

                logger.info(`[VEO3 Routes] ✅ Video ${i + 1} completado: ${video.url}`);
            } catch (error) {
                logger.error(`[VEO3 Routes] ❌ Error video ${i + 1}:`, error.message);
                videoResults.push({
                    ...script,
                    video: null,
                    status: 'failed',
                    error: error.message
                });
            }

            // Delay entre videos para evitar rate limiting
            if (i < scripts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // PASO 3: Concatenar videos si hay múltiples
        let finalVideoUrl = null;
        let concatenatedVideo = null;

        if (videoResults.filter(v => v.status === 'completed').length > 1) {
            logger.info(`[VEO3 Routes] 🔗 Concatenando videos...`);

            try {
                const videoIds = videoResults
                    .filter(v => v.status === 'completed' && v.video?.videoId)
                    .map(v => v.video.videoId);

                if (videoIds.length > 1) {
                    const videoManager = require('../services/videoManager');
                    concatenatedVideo = await videoManager.concatenateVideos(videoIds, {
                        title: `${dataType}_${new Date().toISOString().slice(0, 10)}`,
                        description: `Video concatenado: ${dataType} con datos API-Sports`,
                        apiData: apiData,
                        segments: metadata.segments
                    });

                    finalVideoUrl = concatenatedVideo.publicUrl;
                    logger.info(`[VEO3 Routes] ✅ Videos concatenados: ${finalVideoUrl}`);
                } else {
                    // Solo un video exitoso
                    finalVideoUrl = videoResults.find(v => v.status === 'completed')?.video?.url;
                }
            } catch (error) {
                logger.error(`[VEO3 Routes] ❌ Error concatenando:`, error.message);
                // Fallback: usar primer video exitoso
                finalVideoUrl = videoResults.find(v => v.status === 'completed')?.video?.url;
            }
        } else {
            // Solo un video o un video exitoso
            finalVideoUrl = videoResults.find(v => v.status === 'completed')?.video?.url;
        }

        // PASO 4: Verificación final
        const verification = {
            scriptsGenerated: scripts.length,
            videosAttempted: videoResults.length,
            videosCompleted: videoResults.filter(v => v.status === 'completed').length,
            videosFailed: videoResults.filter(v => v.status === 'failed').length,
            concatenated: !!concatenatedVideo,
            finalVideoAvailable: !!finalVideoUrl,
            apiDataIntegrity: JSON.stringify(apiData) === JSON.stringify(metadata.originalApiData)
        };

        logger.info(`[VEO3 Routes] ✅ FLUJO COMPLETO terminado - Video final: ${finalVideoUrl}`);

        // RESPUESTA FINAL
        res.json({
            success: true,
            message: 'Flujo completo ejecutado exitosamente',
            data: {
                workflow: {
                    step1_scripts: scripts,
                    step2_videos: videoResults,
                    step3_concatenation: concatenatedVideo,
                    step4_verification: verification
                },
                finalResult: {
                    videoUrl: finalVideoUrl,
                    isLocal: finalVideoUrl?.includes('localhost'),
                    canValidate: true,
                    dataMatches: verification.apiDataIntegrity
                },
                metadata: metadata,
                performance: {
                    totalVideos: videoResults.length,
                    successRate: `${Math.round((verification.videosCompleted / verification.videosAttempted) * 100)}%`,
                    processingTime: `${Date.now() - new Date(metadata.timestamp).getTime()}ms`
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] ❌ Error en flujo completo:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error en flujo completo',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/veo3/health
 * @desc Health check completo del sistema VEO3
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            veo3Api: false,
            anaImageUrl: false,
            directories: {
                output: false,
                temp: false,
                logs: false
            },
            environment: {
                apiKey: !!process.env.KIE_AI_API_KEY,
                anaImageUrl: !!process.env.ANA_IMAGE_URL,
                model: !!process.env.VEO3_DEFAULT_MODEL
            }
        };

        // Test API VEO3
        try {
            health.veo3Api = await veo3Client.testConnection();
        } catch (error) {
            logger.error('[VEO3 Routes] Health check API falló:', error.message);
        }

        // Test Ana Image URL
        if (process.env.ANA_IMAGE_URL) {
            try {
                const axios = require('axios');
                const response = await axios.head(process.env.ANA_IMAGE_URL);
                health.anaImageUrl = response.status === 200;
            } catch (error) {
                logger.error('[VEO3 Routes] Health check Ana image falló:', error.message);
            }
        }

        // Test directorios
        const fs = require('fs');
        health.directories.output = fs.existsSync(process.env.VEO3_OUTPUT_DIR || './output/veo3');
        health.directories.temp = fs.existsSync(process.env.VEO3_TEMP_DIR || './temp/veo3');
        health.directories.logs = fs.existsSync(process.env.VEO3_LOGS_DIR || './logs/veo3');

        const allHealthy =
            health.veo3Api &&
            health.anaImageUrl &&
            Object.values(health.directories).every(d => d) &&
            Object.values(health.environment).every(e => e);

        res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            message: allHealthy ? 'Sistema VEO3 saludable' : 'Problemas detectados en sistema VEO3',
            data: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error en health check:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error en health check',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/veo3/generate-viral
 * @desc Generar video viral completo (Hook → Desarrollo → CTA) para Instagram
 */
router.post('/generate-viral', async (req, res) => {
    try {
        logger.info('[VEO3 Routes] Generando video viral...');

        const { playerName, price, ratio, team, stats } = req.body;

        // Validar datos requeridos
        if (!playerName || !price || !ratio || !team) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: playerName, price, ratio, team'
            });
        }

        // Generar video viral completo
        const result = await viralBuilder.generateViralVideo({
            playerName,
            price,
            ratio,
            team,
            stats: stats || {}
        });

        // Generar caption para Instagram
        const caption = viralBuilder.generateInstagramCaption({
            playerName,
            price,
            ratio,
            team
        });

        res.json({
            success: true,
            message: 'Video viral generado exitosamente',
            video: result,
            caption,
            instagram: {
                ready: true,
                format: '9:16 (Stories/Reels)',
                duration: result.duration,
                segments: result.segments
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error generando video viral:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando video viral',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/veo3/dictionary/stats
 * @desc Obtener estadísticas del diccionario de jugadores
 */
router.get('/dictionary/stats', async (req, res) => {
    try {
        const { getDictionaryStats } = require('../utils/playerDictionaryValidator');

        logger.info('[VEO3 Routes] Consultando estadísticas del diccionario...');

        const stats = await getDictionaryStats();

        res.json({
            success: true,
            message: 'Estadísticas del diccionario obtenidas',
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error obteniendo estadísticas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas del diccionario',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * ✅ NUEVO (10 Oct 2025): @route POST /api/veo3/generate-with-nano-banana
 * @desc Flujo completo validado: UnifiedScriptGenerator → Nano Banana → VEO3 → Concatenación
 *
 * Este endpoint implementa el flujo APROBADO:
 * 1. UnifiedScriptGenerator genera guión profesional dividido en 3 segmentos (hook, development, cta)
 * 2. Nano Banana genera 3 imágenes contextualizadas basadas en cada segmento del guión
 * 3. VEO3 genera 3 videos usando cada imagen contextualizada como referencia
 * 4. VideoConcatenator concatena los 3 videos + logo outro
 *
 * FIXES INTEGRADOS:
 * - enableTranslation=false (evita audio en inglés)
 * - Signed URLs de Supabase (24h expiration)
 * - Imágenes contextualizadas con emociones y cinematografía del guión
 */
router.post('/generate-with-nano-banana', async (req, res) => {
    try {
        const {
            contentType = 'chollo',
            playerData,
            viralData = {},
            preset = 'chollo_viral',
            options = {}
        } = req.body;

        // Validar datos requeridos
        if (!playerData || !playerData.name) {
            return res.status(400).json({
                success: false,
                message: 'playerData con name requerido'
            });
        }

        logger.info(
            `[VEO3 Routes] 🎨 Generando video con Nano Banana: ${contentType}, preset: ${preset}`
        );

        const startTime = Date.now();
        const sessionId = `nanoBanana_${Date.now()}`;

        // ✅ PASO 1: Validar diccionario
        let dictionaryData = null;
        if (playerData.name && playerData.team) {
            logger.info(
                `[VEO3 Routes] 📋 Validando diccionario para "${playerData.name}" del "${playerData.team}"...`
            );
            dictionaryData = await validateAndPrepare(playerData.name, playerData.team);
            logger.info(
                `[VEO3 Routes] ✅ Diccionario validado - Tasa éxito: ${(dictionaryData.player.testedSuccessRate * 100).toFixed(1)}%`
            );
        }

        // ✅ PASO 2: Generar estructura de guión con UnifiedScriptGenerator
        logger.info(`[VEO3 Routes] 📝 Generando guión profesional con UnifiedScriptGenerator...`);

        const structure = multiSegmentGenerator.generateThreeSegments(
            contentType,
            playerData,
            viralData,
            {
                preset,
                ...options
            }
        );

        logger.info(
            `[VEO3 Routes] ✅ Guión generado: ${structure.segmentCount} segmentos, ${structure.totalDuration}s total`
        );

        // ✅ FIX (10 Oct 2025 21:00): structure.segments usa keys "intro", "middle", "outro" (NO hook/development/cta)
        logger.info(
            `[VEO3 Routes] 🔍 DEBUG - structure.segments keys: ${Object.keys(structure.segments).join(', ')}`
        );

        // Extraer array de 3 segmentos (intro, middle, outro) y agregar cinematography
        const CinematicProgressionSystem = require('../services/veo3/cinematicProgressionSystem');
        const cinematicSystem = new CinematicProgressionSystem();

        // Generar progresión cinematográfica para contexto
        const cinematicProgression = cinematicSystem.getFullProgression(contentType, [
            'curiosidad',
            'autoridad',
            'urgencia'
        ]);

        const scriptSegments = [
            { ...structure.segments.intro, cinematography: cinematicProgression[0].shot },
            { ...structure.segments.middle, cinematography: cinematicProgression[1].shot },
            { ...structure.segments.outro, cinematography: cinematicProgression[2].shot }
        ];

        // ✅ DEBUG: Verificar que los 3 segmentos existen con cinematography
        logger.info(`[VEO3 Routes] 🔍 DEBUG - scriptSegments.length: ${scriptSegments.length}`);
        scriptSegments.forEach((seg, idx) => {
            logger.info(
                `[VEO3 Routes] 🔍 DEBUG - Segmento ${idx}: ${seg ? `role=${seg.role}, shot=${seg.cinematography?.name}` : 'UNDEFINED'}`
            );
        });

        // ✅ PASO 3: Generar imágenes Nano Banana BASADAS EN el guión
        logger.info(
            `[VEO3 Routes] 🖼️  Generando 3 imágenes Nano Banana contextualizadas del guión...`
        );

        const nanoBananaVeo3Integrator = require('../services/veo3/nanoBananaVeo3Integrator');

        const imagesResult = await nanoBananaVeo3Integrator.generateImagesFromScript(
            scriptSegments,
            options
        );

        logger.info(
            `[VEO3 Routes] ✅ ${imagesResult.images.length} imágenes contextualizadas generadas (costo: $${imagesResult.metadata.cost_usd.toFixed(3)})`
        );

        // ✅ PASO 4: Generar videos VEO3 usando imágenes como referencia
        logger.info(
            `[VEO3 Routes] 🎬 Generando 3 segmentos de video con VEO3 usando imágenes contextualizadas...`
        );

        // Crear directorio de sesión
        const sessionDir = path.join(
            __dirname,
            '../../output/veo3/sessions',
            `session_${sessionId}`
        );
        await fs.promises.mkdir(sessionDir, { recursive: true });

        const progressFile = path.join(sessionDir, 'progress.json');
        logger.info(`[VEO3 Routes] 📁 Sesión creada: ${sessionDir}`);

        const generatedSegments = [];
        const anaImageIndex = structure.metadata.anaImageIndex;

        for (let i = 0; i < scriptSegments.length; i++) {
            const segment = scriptSegments[i];
            const image = imagesResult.images[i];
            const segmentNum = i + 1;

            logger.info(
                `[VEO3 Routes] 📹 Generando segmento ${segmentNum}/3: ${segment.role} (${image.shot})...`
            );

            try {
                // ✅ ACTUALIZADO (11 Oct 2025): Usar prompt MEJORADO tipo Playground para Nano Banana → VEO3
                // Basado en prompts exitosos del playground que incluyen:
                // - Duración explícita (8 seconds)
                // - Acción física progresiva
                // - Tono emocional específico
                // - Dirección de actuación (like a TV commentator)
                const nanoBananaPrompt = promptBuilder.buildEnhancedNanoBananaPrompt(
                    segment.dialogue,
                    segment.emotion,
                    image.shot,
                    { duration: segment.duration || 8 }
                );

                logger.info(
                    `[VEO3 Routes] 🎬 Prompt Enhanced Nano Banana (${segment.role}): ${nanoBananaPrompt.length} chars`
                );
                logger.info(`[VEO3 Routes]    Emotion: ${segment.emotion}, Shot: ${image.shot}`);

                const veo3Options = {
                    imageUrl: image.supabaseUrl, // ✅ Signed URL de Supabase (24h)
                    model: options.veo3Model || 'veo3_fast',
                    aspectRatio: '9:16',
                    duration: segment.duration || 8, // ✅ ACTUALIZADO: 7s → 8s
                    enableTranslation: false, // ✅ FIX: evitar audio en inglés
                    enableFallback: true
                };

                // Generar segmento con prompt simplificado
                const videoResult = await veo3Client.generateCompleteVideo(
                    nanoBananaPrompt,
                    veo3Options
                );

                // ✅ DESCARGAR Y GUARDAR INMEDIATAMENTE
                logger.info(`[VEO3 Routes] 💾 Descargando segmento ${segmentNum} desde VEO3...`);
                const response = await axios.get(videoResult.url, { responseType: 'arraybuffer' });

                const segmentFilename = `segment_${segmentNum}_${videoResult.taskId}.mp4`;
                const localPath = path.join(sessionDir, segmentFilename);
                await fs.promises.writeFile(localPath, response.data);

                const segmentData = {
                    index: i,
                    role: segment.role,
                    shot: image.shot,
                    emotion: segment.emotion,
                    taskId: videoResult.taskId,
                    veo3Url: videoResult.url,
                    localPath: localPath,
                    filename: segmentFilename,
                    duration: segment.duration,
                    dialogue: segment.dialogue,
                    imageContext: {
                        supabaseUrl: image.supabaseUrl,
                        visualContext: image.visualContext,
                        emotion: image.emotion
                    },
                    generatedAt: new Date().toISOString(),
                    size: response.data.length
                };

                generatedSegments.push(segmentData);

                // Persistir progreso inmediatamente
                const progressData = {
                    sessionId,
                    sessionDir,
                    segmentsCompleted: segmentNum,
                    segmentsTotal: 3,
                    playerName: playerData.name || 'unknown',
                    contentType,
                    preset,
                    workflow: 'nano-banana-contextual',
                    segments: generatedSegments,
                    lastUpdate: new Date().toISOString()
                };

                await fs.promises.writeFile(progressFile, JSON.stringify(progressData, null, 2));

                logger.info(
                    `[VEO3 Routes] ✅ Segmento ${segmentNum} guardado: ${localPath} (${(response.data.length / 1024 / 1024).toFixed(2)} MB)`
                );

                // 🔧 DELAY entre segmentos (excepto el último)
                // ✅ ACTUALIZADO (11 Oct 2025 - Fix #5): 30s → 90s para mayor seguridad
                // Permite que VEO3 complete la generación sin presión de rate limiting
                if (segmentNum < 3) {
                    const delaySeconds = 90; // Cooling period extendido para seguridad
                    logger.info(
                        `[VEO3 Routes] ⏱️  Esperando ${delaySeconds}s antes del siguiente segmento (enfriamiento seguro)...`
                    );
                    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
                }
            } catch (error) {
                logger.error(`[VEO3 Routes] ❌ Error en segmento ${segmentNum}:`, error.message);

                // Guardar estado de error
                const errorData = {
                    sessionId,
                    sessionDir,
                    segmentsCompleted: generatedSegments.length,
                    segmentsTotal: 3,
                    playerName: playerData.name || 'unknown',
                    contentType,
                    preset,
                    workflow: 'nano-banana-contextual',
                    segments: generatedSegments,
                    error: {
                        segmentIndex: i,
                        segmentNumber: segmentNum,
                        segmentRole: segment.role,
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    },
                    lastUpdate: new Date().toISOString()
                };

                await fs.promises.writeFile(progressFile, JSON.stringify(errorData, null, 2));

                logger.error(`[VEO3 Routes] 💾 Estado de error guardado en: ${progressFile}`);
                logger.error(
                    `[VEO3 Routes] ✅ Segmentos exitosos antes del error: ${generatedSegments.length}/3`
                );

                throw new Error(`Fallo en segmento ${segmentNum}/3: ${error.message}`);
            }
        }

        logger.info(
            `[VEO3 Routes] 🎉 Todos los segmentos generados exitosamente: ${generatedSegments.length}/3`
        );

        // ✅ PASO 5: CONCATENAR VIDEOS con logo outro
        logger.info(`[VEO3 Routes] 🔗 Concatenando 3 segmentos + logo outro...`);

        let finalVideoUrl = null;
        let concatenatedVideo = null;

        try {
            const VideoConcatenator = require('../services/veo3/videoConcatenator');
            const concatenator = new VideoConcatenator();

            const localPaths = generatedSegments.map(seg => seg.localPath);

            logger.info(`[VEO3 Routes] 📂 Segmentos locales listos para concatenar:`);
            localPaths.forEach((path, idx) => {
                logger.info(`[VEO3 Routes]    ${idx + 1}. ${path}`);
            });

            // Concatenar videos desde archivos locales (+ logo outro automático)
            const outputPath = await concatenator.concatenateVideos(localPaths, {
                transition: { enabled: false }, // Sin transiciones
                audio: { fadeInOut: false },
                outro: {
                    enabled: true, // ✅ Agregar logo blanco FLP al final
                    freezeFrame: {
                        enabled: true,
                        duration: 0.8
                    }
                }
            });

            // URL del video final
            finalVideoUrl = `http://localhost:3000/output/veo3/${path.basename(outputPath)}`;

            // Metadata del video concatenado
            concatenatedVideo = {
                videoId: `concat_${sessionId}`,
                title: `${playerData.name}_${contentType}_nano_banana`,
                duration: structure.totalDuration,
                sessionId: sessionId,
                sessionDir: sessionDir,
                outputPath: outputPath,
                workflow: 'nano-banana-contextual'
            };

            // Actualizar progress con video final
            const finalProgress = {
                sessionId,
                sessionDir,
                segmentsCompleted: generatedSegments.length,
                segmentsTotal: 3,
                playerName: playerData.name || 'unknown',
                contentType,
                preset,
                workflow: 'nano-banana-contextual',
                segments: generatedSegments,
                concatenatedVideo: concatenatedVideo,
                finalVideoUrl: finalVideoUrl,
                completedAt: new Date().toISOString()
            };

            await fs.promises.writeFile(progressFile, JSON.stringify(finalProgress, null, 2));

            logger.info(`[VEO3 Routes] ✅ Videos concatenados: ${finalVideoUrl}`);
            logger.info(`[VEO3 Routes] 📄 Progreso final guardado: ${progressFile}`);
        } catch (error) {
            logger.error(`[VEO3 Routes] ❌ Error concatenando:`, error.message);
            // Fallback: usar primer segmento local
            finalVideoUrl = `http://localhost:3000/output/veo3/sessions/session_${sessionId}/${generatedSegments[0]?.filename}`;
            logger.warn(`[VEO3 Routes] ⚠️ Usando segmento 1 como fallback: ${finalVideoUrl}`);
        }

        // ✅ Actualizar diccionario
        if (playerData.name && dictionaryData) {
            const success = generatedSegments.length === 3;
            await updatePlayerSuccessRate(playerData.name, success);

            if (success) {
                logger.info(`[VEO3 Routes] ✅ Actualizada tasa de éxito para "${playerData.name}"`);
            }
        }

        // RESUMEN FINAL
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const veo3Cost = 0.3 * 3; // VEO3: $0.30 × 3 segmentos
        const totalCost = veo3Cost + imagesResult.metadata.cost_usd; // VEO3 + Nano Banana

        logger.info(`[VEO3 Routes] ✅ FLUJO COMPLETO NANO BANANA finalizado en ${totalDuration}s`);
        logger.info(
            `[VEO3 Routes] 💰 Costo total: $${totalCost.toFixed(3)} (VEO3: $${veo3Cost.toFixed(3)}, Nano Banana: $${imagesResult.metadata.cost_usd.toFixed(3)})`
        );

        res.json({
            success: true,
            message: `Video con Nano Banana (${contentType}) generado exitosamente`,
            data: {
                workflow: 'nano-banana-contextual',
                contentType,
                preset,
                segmentCount: 3,
                totalDuration: structure.totalDuration,
                // PASO 1: Diccionario
                dictionary: dictionaryData
                    ? {
                          playerInDictionary: true,
                          successRate: `${(dictionaryData.player.testedSuccessRate * 100).toFixed(1)}%`,
                          totalVideos: dictionaryData.player.totalVideos
                      }
                    : null,
                // PASO 2: Guión
                script: {
                    segments: scriptSegments.map(seg => ({
                        role: seg.role,
                        emotion: seg.emotion,
                        dialogue: seg.dialogue,
                        duration: seg.duration,
                        shot: seg.cinematography?.name || 'medium' // ✅ FIX: cinematography.name (no .shot)
                    })),
                    totalDuration: structure.totalDuration
                },
                // PASO 3: Imágenes Nano Banana
                nanoBananaImages: imagesResult.images.map(img => ({
                    role: img.role,
                    shot: img.shot,
                    emotion: img.emotion,
                    supabaseUrl: img.supabaseUrl,
                    visualContext: img.visualContext
                })),
                nanoBananaCost: imagesResult.metadata.cost_usd,
                // PASO 4: Videos VEO3
                segments: generatedSegments,
                // PASO 5: Video final
                concatenatedVideo: concatenatedVideo
                    ? {
                          url: finalVideoUrl,
                          videoId: concatenatedVideo.videoId,
                          duration: structure.totalDuration,
                          title: concatenatedVideo.title,
                          sessionDir: sessionDir
                      }
                    : null,
                finalVideoUrl,
                playerData: {
                    name: playerData.name,
                    team: playerData.team,
                    price: playerData.price
                },
                // Costos
                costs: {
                    nanoBanana: imagesResult.metadata.cost_usd,
                    veo3: veo3Cost,
                    total: totalCost
                },
                // Performance
                performance: {
                    totalDuration: parseFloat(totalDuration),
                    successRate: '100%',
                    sessionId
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[VEO3 Routes] Error generando video con Nano Banana:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando video con Nano Banana',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
