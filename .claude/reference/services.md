# Services Backend - Fantasy La Liga Pro

## 🏗️ Estructura de Servicios

### Core Services
```
backend/services/
├── veo3/                    # Sistema VEO3
│   ├── viralVideoBuilder.js    # Constructor videos virales
│   ├── promptBuilder.js         # Builder prompts optimizados
│   ├── frameExtractor.js       # Extracción frames
│   └── videoConcatenator.js    # Concatenación segmentos
├── apiSports/              # API-Sports La Liga
│   ├── apiFootballClient.js    # Cliente principal
│   ├── playerService.js        # Servicio jugadores
│   └── fixtureService.js       # Servicio partidos
├── instagram/              # Contenido Instagram
│   ├── viralContentService.js  # Servicio contenido viral
│   ├── previewService.js       # Servicio preview
│   └── versioningService.js    # Servicio versionado
└── fantasy/                # Sistema Fantasy
    ├── evolutionService.js     # Servicio evolución
    ├── pointsCalculator.js    # Calculadora puntos
    └── bargainAnalyzer.js      # Analizador chollos
```

## 🎬 VEO3 Services

### viralVideoBuilder.js
**Propósito**: Constructor principal de videos virales con Ana

**Métodos principales**:
```javascript
async generateViralVideo(playerData, contentType)
async buildVideoSegments(playerData, segments)
async concatenateSegments(segments)
```

**Configuración crítica**:
- Seed Ana: 30001 (NUNCA cambiar)
- Timeout: 120s inicial, 45s status
- Rate limit: 6000ms entre requests

### promptBuilder.js
**Propósito**: Construcción de prompts optimizados para VEO3

**Métodos principales**:
```javascript
buildPrompt(dialogue, segmentType)
optimizePlayerReference(playerName)  // Líneas 325-359
validatePromptLength(prompt)
```

**Reglas críticas**:
- Máximo 80 palabras por prompt
- Patrón: [Sujeto] + [Acción] + [Preservación]
- Referencias genéricas: "el jugador" (NO nombres)

### frameExtractor.js
**Propósito**: Extracción de frames para continuidad visual

**Métodos principales**:
```javascript
extractLastFrame(videoPath)
saveFrameAsImage(frame, outputPath)
```

## 🏆 API-Sports Services

### apiFootballClient.js
**Propósito**: Cliente principal para API-Sports

**Métodos principales**:
```javascript
async makeRequest(endpoint, params)
async waitForRateLimit()
async getPlayerData(playerId, season = 2025)
async getTeamData(teamId, season = 2025)
```

**Configuración**:
- Rate limit: 1000ms entre requests
- Timeout: 10000ms
- Temporada: SIEMPRE 2025

### playerService.js
**Propósito**: Servicio específico para jugadores

**Métodos principales**:
```javascript
async getPlayerStats(playerId, season = 2025)
async getPlayerFixtures(playerId, season = 2025)
async calculateFantasyPoints(stats, position)
```

## 📱 Instagram Services

### viralContentService.js
**Propósito**: Servicio de contenido viral para Instagram

**Métodos principales**:
```javascript
async generateViralContent(playerData, contentType)
async calculateViralScore(content)
async validateContent(content)
```

**Criterios viral score** (11 criterios, 0-100 puntos):
1. Hook impactante (15 pts)
2. Datos específicos (15 pts)
3. Urgencia temporal (10 pts)
4. Comparación precio (10 pts)
5. Estadísticas recientes (10 pts)
6. Emociones (10 pts)
7. Call-to-action claro (10 pts)
8. Longitud óptima (5 pts)
9. Hashtags relevantes (5 pts)
10. Timing publicación (5 pts)
11. Engagement potencial (5 pts)

### previewService.js
**Propósito**: Servicio de preview Instagram

**Métodos principales**:
```javascript
async generatePreview(playerData, contentType)
async createMockup(content)
async validatePreview(preview)
```

### versioningService.js
**Propósito**: Sistema de versionado de contenido

**Métodos principales**:
```javascript
async saveVersion(versionData)
async loadVersions(playerId)
async compareVersions(version1, version2)
```

## ⚽ Fantasy Services

### evolutionService.js
**Propósito**: Servicio de evolución de jugadores

**Métodos principales**:
```javascript
async generatePlayerEvolution(playerId)
async calculateValueTrend(stats)
async predictFutureValue(currentValue, trend)
```

### pointsCalculator.js
**Propósito**: Calculadora de puntos Fantasy

**Métodos principales**:
```javascript
calculateFantasyPoints(stats, position)
calculatePositionMultiplier(position)
calculateBonusPoints(stats)
```

**Puntos por posición**:
- GK: Gol = 10 pts, Asistencia = 3 pts
- DEF: Gol = 6 pts, Asistencia = 3 pts  
- MID: Gol = 5 pts, Asistencia = 3 pts
- FWD: Gol = 4 pts, Asistencia = 3 pts

### bargainAnalyzer.js
**Propósito**: Analizador de chollos (jugadores infravalorados)

**Métodos principales**:
```javascript
async analyzeBargain(playerId)
async calculateROI(playerData)
async compareToMarket(playerData)
```

## 🔧 Utility Services

### logger.js
**Propósito**: Sistema de logging con Winston

**Configuración**:
```javascript
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/server.log' }),
        new winston.transports.Console()
    ]
});
```

### rateLimiter.js
**Propósito**: Sistema de rate limiting

**Configuraciones**:
```javascript
const rateLimiters = {
    heavyOperations: 10000,  // 10s
    apiSports: 1000,        // 1s
    veo3: 6000,             // 6s
    openai: 100             // 100ms
};
```

## 📊 Service Dependencies

### VEO3 Dependencies
- **viralVideoBuilder** → promptBuilder, frameExtractor, videoConcatenator
- **promptBuilder** → logger, constants
- **frameExtractor** → ffmpeg, logger

### API-Sports Dependencies  
- **apiFootballClient** → axios, logger, rateLimiter
- **playerService** → apiFootballClient, pointsCalculator
- **fixtureService** → apiFootballClient, logger

### Instagram Dependencies
- **viralContentService** → logger, constants
- **previewService** → viralContentService, logger
- **versioningService** → supabase, logger

## 🔍 Service Patterns

### Error Handling Pattern
```javascript
async serviceMethod(params) {
    try {
        // Validación input
        if (!params) throw new Error('Invalid parameters');
        
        // Operación principal
        const result = await this.performOperation(params);
        
        // Logging éxito
        logger.info('Operation successful', { params, result });
        
        return result;
    } catch (error) {
        // Logging error
        logger.error('Operation failed', { 
            params, 
            error: error.message 
        });
        
        // Re-throw o fallback
        throw error;
    }
}
```

### Rate Limiting Pattern
```javascript
async apiRequest(endpoint, params) {
    // Rate limiting
    await this.waitForRateLimit();
    
    // Request
    const response = await axios.get(endpoint, { params });
    
    // Validación respuesta
    if (!response.data) throw new Error('Empty response');
    
    return response.data;
}
```

---

**Total servicios**: 15+
**Servicios críticos**: 8 (VEO3, API-Sports, Instagram)
**Última actualización**: 2025-10-09





