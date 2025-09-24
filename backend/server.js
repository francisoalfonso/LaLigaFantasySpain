// Servidor Express principal para Dashboard Fantasy La Liga
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importar rutas
const testRoutes = require('./routes/test');
const apiFootballRoutes = require('./routes/apiFootball');
const n8nMcpRoutes = require('./routes/n8nMcp');
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
// const instagramRoutes = require('./routes/instagram'); // Temporalmente deshabilitado por error sintáctico
const imageGeneratorRoutes = require('./routes/imageGenerator');

// Configuración
const { SERVER } = require('./config/constants');

const app = express();
const PORT = SERVER.PORT;
const HOST = SERVER.HOST;

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
}));

// Middleware de logging
app.use(morgan('combined'));

// CORS configurado para desarrollo
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir imágenes generadas
app.use('/generated/images', express.static(path.join(__dirname, 'generated/images')));
app.use('/assets/images', express.static(path.join(__dirname, 'assets/images')));

// Middleware para logging de peticiones
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de la API
app.use('/api/test', testRoutes);
app.use('/api/laliga', apiFootballRoutes);
app.use('/api/n8n-mcp', n8nMcpRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/sync', dataSyncRoutes);
app.use('/api/content', contentGeneratorRoutes);
app.use('/api/fixtures', fixturesRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/bargains', bargainsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/ai', contentAIRoutes);
app.use('/api/evolution', evolutionRoutes);
// app.use('/api/instagram', instagramRoutes); // Temporalmente deshabilitado
app.use('/api/images', imageGeneratorRoutes);

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

// Ruta de salud del servidor
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

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('💥 Error del servidor:', error);

  res.status(error.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log('🚀 ===================================');
  console.log('🏆 Fantasy La Liga Dashboard Server');
  console.log('🚀 ===================================');
  console.log(`🌐 Servidor corriendo en: http://${HOST}:${PORT}`);
  console.log(`📊 Dashboard disponible en: http://${HOST}:${PORT}`);
  console.log(`🔧 API Info: http://${HOST}:${PORT}/api/info`);
  console.log(`❤️ Health check: http://${HOST}:${PORT}/health`);
  console.log('🚀 ===================================');

  // Verificar configuración
  if (!process.env.API_FOOTBALL_KEY) {
    console.log('⚠️ ADVERTENCIA: API_FOOTBALL_KEY no configurada');
  } else {
    console.log('✅ API-Sports Key configurada');
    console.log('🏆 Plan Ultra activo - La Liga datos reales');
  }
});

// Manejo graceful de cierre
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

module.exports = app;