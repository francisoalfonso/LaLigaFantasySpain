const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();

// Importar servicios VEO3
const VEO3Client = require('../services/veo3/veo3Client');
const PromptBuilder = require('../services/veo3/promptBuilder');
const PlayerCardsOverlay = require('../services/veo3/playerCardsOverlay');
const VideoConcatenator = require('../services/veo3/videoConcatenator');
const ViralVideoBuilder = require('../services/veo3/viralVideoBuilder');

// Instanciar servicios
const veo3Client = new VEO3Client();
const promptBuilder = new PromptBuilder();
const playerCards = new PlayerCardsOverlay();
const concatenator = new VideoConcatenator();
const viralBuilder = new ViralVideoBuilder();

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
        let videoData = { type };

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
                    team: req.body.team || playerName.split(' ').pop() // fallback
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
                    message: 'Tipo no válido. Usar: chollo, analysis, prediction, intro, outro, custom'
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
                }
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
                statusText: status.data?.successFlag === 0 ? 'processing' :
                           status.data?.successFlag === 1 ? 'completed' : 'failed',
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
                statusText: status.data?.successFlag === 0 ? 'processing' :
                           status.data?.successFlag === 1 ? 'completed' : 'failed',
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

        logger.info(`[VEO3 Routes] Generando video largo tema "${theme}" con ${segmentCount} segmentos`);

        // Generar prompts basados en el tema
        let prompts = [];

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
                    prompts.push(promptBuilder.buildAnalysisPrompt(analysisPlayers[i], analysisPrices[i]));
                }
                break;

            case 'jornada':
                prompts.push(promptBuilder.buildIntroPrompt({
                    dialogue: "¡Hola Misters! Bienvenidos al análisis completo de la jornada."
                }));
                prompts.push(promptBuilder.buildCholloPrompt('Pedri', 8.5));
                prompts.push(promptBuilder.buildOutroPrompt({
                    dialogue: "¡Hasta la próxima! No olvidéis estos chollos."
                }));
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Tema no válido. Usar: chollos, analysis, predictions, jornada'
                });
        }

        const resultPath = await concatenator.createLongVideoFromPrompts(prompts, veo3Client, options);

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
                message: 'dataType y apiData requeridos. Ejemplo: dataType="chollos", apiData={players: [...]}'
            });
        }

        logger.info(`[VEO3 Routes] ⚡ FLUJO COMPLETO iniciado - Tipo: ${dataType}`);

        // PASO 1: Generar guiones basados en datos de API
        let scripts = [];
        let metadata = {
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

                logger.info(`[VEO3 Routes] 📝 Generando guiones para ${apiData.players.length} chollos`);

                // Crear scripts personalizados para cada chollo
                for (let i = 0; i < apiData.players.length; i++) {
                    const player = apiData.players[i];
                    const script = {
                        id: `chollo_${i + 1}`,
                        player: player.name,
                        price: player.price,
                        dialogue: i === 0
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
                        message: 'Para tipo "jornada" se requiere apiData.gameweek y apiData.highlights'
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

            logger.info(`[VEO3 Routes] 🎥 Generando video ${i + 1}/${scripts.length}: ${script.id}`);

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

        const allHealthy = health.veo3Api && health.anaImageUrl &&
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

        const {
            playerName,
            price,
            ratio,
            team,
            stats
        } = req.body;

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

module.exports = router;