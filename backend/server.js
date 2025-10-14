// Servidor Express principal para Dashboard Fantasy La Liga
require('dotenv').config(); // Cargar .env principal
require('dotenv').config({ path: '.env.supabase' }); // Cargar .env.supabase
require('dotenv').config({ path: '.env.n8n' }); // Cargar .env.n8n

// Validar variables de entorno ANTES de inicializar cualquier servicio
const { validateAllEnv } = require('./config/envValidator');
try {
    validateAllEnv();
} catch (error) {
    // NOTA: console.error aquí es correcto - error ANTES de inicializar logger
    console.error('💥 Error fatal: Configuración inválida');
    console.error(error.message);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const {
    generalLimiter,
    heavyOperationsLimiter,
    apiSportsLimiter,
    imageGenerationLimiter,
    veo3Limiter,
    adaptiveRateLimiter
} = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Importar rutas
const testRoutes = require('./routes/test');
const apiFootballRoutes = require('./routes/apiFootball');
const n8nMcpRoutes = require('./routes/n8nMcp');
const n8nVersionsRoutes = require('./routes/n8nVersions');
const weatherRoutes = require('./routes/weather');
const databaseRoutes = require('./routes/database');
const dataSyncRoutes = require('./routes/dataSync');
const contentGeneratorRoutes = require('./routes/contentGenerator');
const fixturesRoutes = require('./routes/fixtures');
const debugRoutes = require('./routes/debug');
const bargainsRoutes = require('./routes/bargains');
const predictionsRoutes = require('./routes/predictions');
const contentAIRoutes = require('./routes/contentAI');
const evolutionRoutes = require('./routes/evolution');
const instagramRoutes = require('./routes/instagram');
const imageGeneratorRoutes = require('./routes/imageGenerator');
const veo3Routes = require('./routes/veo3');
const videosRoutes = require('./routes/videos');
const contentPreviewRoutes = require('./routes/contentPreview');
const youtubeShortsRoutes = require('./routes/youtubeShorts');
const youtubeRoutes = require('./routes/youtube');
const carouselsRoutes = require('./routes/carousels');
const testHistoryRoutes = require('./routes/testHistory');
const nanoBananaRoutes = require('./routes/nanoBanana');
const presentersRoutes = require('./routes/presenters');
const editorialPlanningRoutes = require('./routes/editorialPlanning');

// ✨ NEW: Competitive YouTube Analyzer Routes
const contentAnalysisRoutes = require('./routes/contentAnalysis');
const competitiveChannelsRoutes = require('./routes/competitiveChannels');
const outlierRoutes = require('./routes/outliers');
const outlierTestRoutes = require('./routes/outliers-test');

// ✨ NEW: Automation System
const videoOrchestrator = require('./services/videoOrchestrator');
const recommendationEngine = require('./services/contentAnalysis/recommendationEngine');
const tempCleaner = require('./services/contentAnalysis/tempCleaner');
const outlierScheduler = require('./services/contentAnalysis/outlierDetectorScheduler');

// Configuración
const { SERVER } = require('./config/constants');

const app = express();
const PORT = SERVER.PORT;
const HOST = SERVER.HOST;

// Middlewares de seguridad
app.use(
    helmet({
        contentSecurityPolicy: false // Deshabilitado para desarrollo
    })
);

// Middleware de logging
app.use(morgan('combined'));

// CORS configurado para desarrollo
app.use(
    cors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true
    })
);

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting general para toda la API
// Aplica a todos los endpoints excepto /health y /api/info
// adaptiveRateLimiter desactiva rate limiting si DISABLE_RATE_LIMIT=true en desarrollo
app.use('/api/', adaptiveRateLimiter(generalLimiter));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir imágenes generadas
app.use('/generated/images', express.static(path.join(__dirname, 'generated/images')));
app.use('/assets/images', express.static(path.join(__dirname, 'assets/images')));

// Servir videos VEO3 generados
app.use('/output/veo3', express.static(path.join(__dirname, '../output/veo3')));

// Servir carpeta data (para test history videos)
app.use('/data', express.static(path.join(__dirname, '../data')));

// Middleware para logging de peticiones
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Swagger UI - Documentación API interactiva
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Fantasy La Liga API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
        customfavIcon: '/favicon.ico'
    })
);

// Swagger JSON spec
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Rutas de la API con rate limiting específico

// Endpoints públicos sin rate limiting adicional
app.use('/api/test', testRoutes);
app.use('/api/debug', debugRoutes);

// API-Sports endpoints - rate limiting específico (75 req/min)
app.use('/api/laliga', apiSportsLimiter, apiFootballRoutes);
app.use('/api/fixtures', apiSportsLimiter, fixturesRoutes);
app.use('/api/bargains', apiSportsLimiter, bargainsRoutes);
app.use('/api/predictions', apiSportsLimiter, predictionsRoutes);
app.use('/api/evolution', apiSportsLimiter, evolutionRoutes);

// Endpoints de operaciones pesadas (10 req/hora)
app.use('/api/sync', heavyOperationsLimiter, dataSyncRoutes);
app.use('/api/content', heavyOperationsLimiter, contentGeneratorRoutes);
app.use('/api/ai', heavyOperationsLimiter, contentAIRoutes);

// Generación de imágenes (30 req/15min)
app.use('/api/images', imageGenerationLimiter, imageGeneratorRoutes);

// Nano Banana - generación de imágenes Ana (30 req/15min)
app.use('/api/nano-banana', imageGenerationLimiter, nanoBananaRoutes);

// VEO3 - muy restrictivo (5 req/hora)
app.use('/api/veo3', veo3Limiter, veo3Routes);

// YouTube Shorts - restrictivo similar a VEO3 (genera videos)
app.use('/api/youtube-shorts', veo3Limiter, youtubeShortsRoutes);

// YouTube API - para publicar videos (rate limiting general, no genera)
app.use('/api/youtube', generalLimiter, youtubeRoutes);

// Otros endpoints con rate limiting general
app.use('/api/n8n-mcp', n8nMcpRoutes);
app.use('/api/n8n-versions', n8nVersionsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/content-preview', contentPreviewRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/carousels', carouselsRoutes);
app.use('/api/test-history', testHistoryRoutes);
app.use('/api/presenters', presentersRoutes);
app.use('/api/planning', generalLimiter, editorialPlanningRoutes);

// ✨ NEW: Competitive YouTube Analyzer
// Content Analysis - operaciones pesadas (transcripción + análisis AI)
app.use('/api/content-analysis', heavyOperationsLimiter, contentAnalysisRoutes);
// Channel Management - rate limiting general (CRUD ligero)
app.use('/api/competitive', generalLimiter, competitiveChannelsRoutes);
// Outlier Detection - operaciones pesadas (búsqueda en YouTube)
app.use('/api/outliers', heavyOperationsLimiter, outlierRoutes);
// Outlier Testing - sin rate limiting (solo para desarrollo)
app.use('/api/outliers', outlierTestRoutes);

// Ruta principal - dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Ruta para vista de alineaciones en tiempo real
app.get('/lineups-live', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/lineups-live.html'));
});

// Ruta para debug de grid de coordenadas
app.get('/grid-debug', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/grid-debug.html'));
});

// Ruta para chollos de la jornada
app.get('/bargains', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/bargains.html'));
});

// Ruta para vista detallada de jugador
app.get('/player/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/player-detail.html'));
});

// Ruta para agenda de jugadores
app.get('/players', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/players-agenda.html'));
});

// Ruta alternativa para agenda de jugadores
app.get('/players-agenda', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/players-agenda.html'));
});

// Ruta para matriz de planificación de contenido
app.get('/content-strategy-matrix', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-strategy-matrix.html'));
});

// Ruta alternativa más corta
app.get('/content-matrix', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-strategy-matrix.html'));
});

// Ruta para staging/validación de contenido
app.get('/content-staging', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-staging.html'));
});

// Ruta alternativa más corta
app.get('/staging', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-staging.html'));
});

// Ruta para dashboard de videos
app.get('/video-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/video-dashboard.html'));
});

// Ruta alternativa más corta
app.get('/videos', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/video-dashboard.html'));
});

// Ruta para pipeline de contenido viral (nuevo)
app.get('/content-pipeline', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-pipeline.html'));
});

// Ruta alternativa más corta
app.get('/pipeline', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/content-pipeline.html'));
});

// Ruta para preview de videos virales Instagram
app.get('/instagram-viral-preview', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/instagram-viral-preview.html'));
});

// Ruta alternativa más corta
app.get('/viral-preview', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/instagram-viral-preview.html'));
});

// Ruta para gestión de canales competitivos (nuevo)
app.get('/competitive-channels', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/competitive-channels.html'));
});

// Ruta alternativa más corta
app.get('/competitive', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/competitive-channels.html'));
});

// Ruta para dashboard de inteligencia competitiva
app.get('/competitive-intelligence-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/competitive-intelligence-dashboard.html'));
});

// Ruta alternativa más corta
app.get('/intel', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/competitive-intelligence-dashboard.html'));
});

// Ruta para planning editorial
app.get('/editorial-planning', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/editorial-planning.html'));
});

// Ruta alternativa más corta
app.get('/planning', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/editorial-planning.html'));
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del servidor
 *     description: Verifica que el servidor está funcionando correctamente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: OK
 *               timestamp: '2025-09-30T12:00:00.000Z'
 *               environment: development
 *               version: '1.0.0'
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: require('../package.json').version
    });
});

// Ruta para información de la API
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Fantasy La Liga Dashboard API',
        version: require('../package.json').version,
        description: 'API para datos reales La Liga con API-Sports',
        endpoints: {
            health: '/health',
            test: '/api/test/*',
            laliga: '/api/laliga/*',
            bargains: '/api/bargains/*',
            n8n_mcp: '/api/n8n-mcp/*',
            weather: '/api/weather/*',
            database: '/api/database/*',
            sync: '/api/sync/*'
        },
        api_sports_configured: !!process.env.API_FOOTBALL_KEY,
        plan: 'Ultra - 75,000 requests/día'
    });
});

// Manejo de errores 404 - debe ir después de todas las rutas
app.use(notFoundHandler);

// Manejo global de errores - debe ir al final
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
    // Banner de inicio con logger estructurado
    const banner = [
        '',
        '🚀 ===================================',
        '🏆 Fantasy La Liga Dashboard Server',
        '🚀 ===================================',
        `🌐 Servidor: http://${HOST}:${PORT}`,
        `📊 Dashboard: http://${HOST}:${PORT}`,
        `🔧 API Info: http://${HOST}:${PORT}/api/info`,
        `❤️  Health: http://${HOST}:${PORT}/health`,
        '🚀 ===================================',
        ''
    ].join('\n');

    logger.info(banner);

    logger.info('Servidor Fantasy La Liga iniciado', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        rateLimiting: 'enabled',
        endpoints: {
            general: '100 req/15min',
            apiSports: '75 req/min',
            heavy: '10 req/hora',
            veo3: '5 req/hora',
            images: '30 req/15min'
        }
    });
});

// ✅ FIX: Aumentar timeout del servidor para rutas VEO3 de larga duración
// Videos VEO3 tardan ~4-6 minutos, default Node.js es 2 minutos
server.timeout = 900000; // 15 minutos (igual que timeout del cliente E2E)
server.keepAliveTimeout = 905000; // 15 min + 5s margen
server.headersTimeout = 910000; // Debe ser > keepAliveTimeout

logger.info('⏱️  Timeouts del servidor configurados para VEO3', {
    timeout: '15 minutos',
    keepAlive: '15 min + 5s',
    headers: '15 min + 10s'
});

// ============================================================================
// 🎬 SISTEMA DE AUTOMATIZACIÓN CENTRALIZADO
// ============================================================================

// Iniciar TempCleaner para limpiar archivos temporales de videos
(async () => {
    try {
        await tempCleaner.start();
        logger.info('🧹 TempCleaner iniciado - Limpieza automática cada 1h');
    } catch (error) {
        logger.error('❌ Error iniciando TempCleaner', {
            error: error.message
        });
    }
})();

// Iniciar OutlierScheduler para detectar videos virales automáticamente
(async () => {
    try {
        await outlierScheduler.start();
        const stats = outlierScheduler.getStats();
        logger.info('🔍 OutlierScheduler iniciado - Detección automática de outliers virales', {
            interval: `${stats.config.intervalHours}h`,
            searchHoursBack: stats.config.searchHoursBack,
            maxResultsPerKeyword: stats.config.maxResultsPerKeyword,
            nextRun: stats.nextRunAt
        });
    } catch (error) {
        logger.error('❌ Error iniciando OutlierScheduler', {
            error: error.message
        });
    }
})();

// Iniciar VideoOrchestrator para procesar cola automáticamente
(async () => {
    try {
        await videoOrchestrator.start();
        logger.info('🎬 VideoOrchestrator iniciado - Procesando cola cada 10s', {
            providers: ['veo3', 'openai', 'instagram'],
            rateLimits: {
                veo3: { maxConcurrent: 2, minInterval: '10s' },
                openai: { maxConcurrent: 5, minInterval: '1s' },
                instagram: { maxConcurrent: 3, minInterval: '5s' }
            }
        });
    } catch (error) {
        logger.error('❌ Error iniciando VideoOrchestrator', {
            error: error.message
        });
    }
})();

// Generar recomendaciones automáticamente cada hora
const RECOMMENDATION_INTERVAL = 60 * 60 * 1000; // 1 hora

setInterval(async () => {
    try {
        logger.info('🎯 Generando recomendaciones automáticas desde análisis competitivo...');
        const recommendations = await recommendationEngine.generateRecommendations({
            lookbackDays: 7
        });
        logger.info('✅ Recomendaciones generadas automáticamente', {
            count: recommendations.length,
            nextRun: new Date(Date.now() + RECOMMENDATION_INTERVAL).toISOString()
        });
    } catch (error) {
        logger.error('❌ Error generando recomendaciones automáticas', {
            error: error.message
        });
    }
}, RECOMMENDATION_INTERVAL);

logger.info('⏰ Cron de recomendaciones configurado', {
    interval: '1 hora',
    lookbackDays: 7
});

// ============================================================================

// Manejo graceful de cierre
process.on('SIGTERM', () => {
    logger.info('🛑 Señal SIGTERM recibida - Cerrando servidor gracefully...');
    videoOrchestrator.stop();
    tempCleaner.stop();
    outlierScheduler.stop();
    server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('🛑 Señal SIGINT recibida - Cerrando servidor gracefully...');
    videoOrchestrator.stop();
    tempCleaner.stop();
    outlierScheduler.stop();
    server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;
