# API Usage Guidelines - Fantasy La Liga Pro

Guías profesionales para el uso correcto y eficiente de todas las APIs externas
en el proyecto.

## 📋 APIs Utilizadas

1. **API-Sports** - Datos de La Liga (Principal)
2. **VEO3 (KIE.ai)** - Generación de videos con IA
3. **Bunny.net Stream** - Hosting de videos
4. **AEMET** - Datos meteorológicos España
5. **OpenAI GPT-5 Mini** - Generación de contenido IA
6. **Supabase** - Base de datos PostgreSQL

---

## 🏆 API-Sports / API-Football

### Configuration

```javascript
// backend/config/constants.js
API_SPORTS: {
  BASE_URL: 'https://v3.football.api-sports.io',
  LA_LIGA_ID: 140,
  SEASON_2025_26: 2025,
  PLAN: 'Ultra',
  RATE_LIMIT: 75000, // requests/día
}
```

### Rate Limiting - CRÍTICO ⚠️

**Plan Ultra**: 75,000 requests/día = 52 requests/minuto

```javascript
// ✅ CORRECTO: Rate limiting implementado
class ApiFootballClient {
    constructor() {
        this.rateLimitDelay = 1000; // 1 segundo entre llamadas
        this.lastRequestTime = 0;
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }
}
```

### Endpoints Principales

```javascript
// Jornada actual
GET /fixtures/rounds?league=140&season=2025&current=true

// Jugadores
GET /players?league=140&season=2025&page=1

// Fixtures
GET /fixtures?league=140&season=2025&status=FT

// Estadísticas de jugador en fixture
GET /fixtures/players?fixture={fixtureId}

// Equipos
GET /teams?league=140&season=2025
```

### Best Practices

1. **SIEMPRE usar temporada 2025** para 2025-26
2. **Cache agresivo** - datos cambian poco
3. **Batch requests** cuando sea posible
4. **Error handling** robusto con fallbacks
5. **Logging detallado** de cada request

```javascript
// ✅ CORRECTO: Uso profesional
async function getPlayerData(playerId) {
    await this.waitForRateLimit();

    try {
        logger.info('🔄 API-Sports request', {
            endpoint: '/players',
            playerId
        });

        const response = await axios.get(`${this.baseURL}/players`, {
            headers: { 'x-apisports-key': this.apiKey },
            params: {
                id: playerId,
                season: 2025 // ⚠️ SIEMPRE 2025 para temporada 2025-26
            },
            timeout: 10000
        });

        logger.info('✅ API-Sports response', {
            results: response.data.results
        });

        return {
            success: true,
            data: response.data.response
        };
    } catch (error) {
        logger.error('❌ API-Sports error', {
            playerId,
            error: error.message,
            status: error.response?.status
        });

        return {
            success: false,
            error: error.message
        };
    }
}
```

### Costos y Límites

- **Plan**: Ultra - $29/mes
- **Requests**: 75,000/día
- **Velocidad**: ~52 req/min máximo
- **Monitoreo**: Endpoint `/status` para verificar límites

---

## 🎬 VEO3 (KIE.ai) - Video Generation

### Configuration

```bash
# .env
KIE_AI_API_KEY=your_api_key
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_MAX_DURATION=8
VEO3_DEFAULT_ASPECT=9:16
```

### Rate Limiting ⚠️

- **10 requests/minuto** (API KIE.ai)
- **Delay mínimo**: 6000ms entre requests
- **Max concurrent**: 3 videos simultáneos

```javascript
// ✅ CORRECTO: Rate limiting VEO3
const VEO3_REQUEST_DELAY = 6000; // 6 segundos

await this.waitForRateLimit(VEO3_REQUEST_DELAY);
```

### Costos

- **Video 8s**: $0.30
- **Daily limit**: $50.00
- **Monthly limit**: $500.00

### Character Consistency - CRÍTICO

**Ana SIEMPRE con mismo seed y imagen:**

```javascript
// ❌ NUNCA CAMBIAR ESTOS VALORES
const ANA_CHARACTER_SEED = 30001;
const ANA_IMAGE_URL =
    'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg';

// ✅ OBLIGATORIO en todos los prompts
const prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}"`;
```

### Best Practices

1. **Seed fijo**: NUNCA cambiar el seed de Ana (30001)
2. **Imagen fija**: Usar siempre la misma imagen de referencia
3. **Español de España**: SIEMPRE incluir "(not Mexican Spanish)" en prompts
4. **Prompts cortos**: Máximo 500 caracteres
5. **FFmpeg necesario**: Para concatenación y overlays

---

## 📹 Bunny.net Stream

### Configuration

```bash
BUNNY_STREAM_API_KEY=your_api_key
BUNNY_STREAM_LIBRARY_ID=your_library_id
BUNNY_STREAM_CDN_URL=https://vz-xxxxx.b-cdn.net
```

### Costos

- **Storage**: $0.005/GB/mes
- **Streaming**: $0.005/GB de tráfico
- **Plan mínimo**: $1/mes pay-as-you-go

### Upload Process

```javascript
// ✅ CORRECTO: Upload con metadata
const result = await bunnyStream.uploadVideo(videoPath, {
    title: 'Chollo: Pedri a 8.5M',
    collection: 'chollos',
    tags: ['chollo', 'pedri', 'barcelona']
});
```

### Best Practices

1. **Tags consistentes**: Usar sistema de tags definido
2. **Collections**: Organizar por tipo de contenido
3. **Retention**: Política de retención de videos antiguos
4. **Backup local**: Mantener copia de videos críticos

---

## 🌤️ AEMET - Meteorología España

### Configuration

```bash
AEMET_API_KEY=your_api_key_here
```

### API Gratuita

- **Costo**: GRATIS
- **Límites**: Generosos para uso normal
- **Datos**: Oficiales Agencia Estatal Meteorología

### Endpoints

```javascript
// Municipios
GET / api / maestro / municipios;

// Predicción por municipio
GET / api / prediccion / especifica / municipio / diaria / { municipioId };
```

### Best Practices

1. **Cache 1 hora**: Datos meteorológicos cambian lentamente
2. **Municipios**: Usar IDs de municipios correctos para estadios
3. **Fallback**: Datos genéricos si API no disponible

---

## 🤖 OpenAI GPT-5 Mini

### Configuration

```bash
OPENAI_API_KEY=your_openai_api_key
```

### Costos

- **Input**: $0.25/1M tokens
- **Output**: $2.00/1M tokens
- **Estimado**: $0.29/mes para uso proyecto
- **Cache discount**: 90% en contenido repetitivo

### Rate Limiting

```javascript
const GPT5_RATE_LIMIT = 100; // ms entre requests
await this.waitForRateLimit(GPT5_RATE_LIMIT);
```

### Best Practices

1. **Temperatura 0.7**: Balance creatividad/consistencia
2. **Max tokens**: Limitar para controlar costos
3. **System prompts**: Definir contexto Fantasy La Liga
4. **Cache leverage**: Reutilizar contexto común

---

## 🗄️ Supabase PostgreSQL

### Configuration

```bash
# .env.supabase
SUPABASE_PROJECT_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### Connection Pooling

```javascript
// ✅ CORRECTO: Connection pool
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: { persistSession: false },
        db: {
            schema: 'public'
        }
    }
);
```

### Best Practices

1. **Service role key**: Solo en backend, NUNCA en frontend
2. **Anon key**: Para operaciones públicas
3. **RLS**: Row Level Security habilitado
4. **Índices**: Optimizar queries frecuentes
5. **Migrations**: Usar sistema de migraciones

---

## 🚨 Reglas Generales APIs

### 1. Rate Limiting OBLIGATORIO

```javascript
// Todos los clientes DEBEN implementar rate limiting
class ApiClient {
    constructor(rateLimitDelay) {
        this.rateLimitDelay = rateLimitDelay;
        this.lastRequestTime = 0;
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve =>
                setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
            );
        }

        this.lastRequestTime = Date.now();
    }
}
```

### 2. Error Handling Robusto

```javascript
// ✅ CORRECTO: 3 capas de error handling
async function apiRequest(endpoint, params) {
    try {
        // 1. Rate limiting
        await this.waitForRateLimit();

        // 2. Request con timeout
        const response = await axios.get(endpoint, {
            params,
            timeout: 10000
        });

        // 3. Validación de respuesta
        if (!response.data) {
            throw new Error('Empty response');
        }

        return { success: true, data: response.data };
    } catch (error) {
        // 4. Logging detallado
        logger.error('API request failed', {
            endpoint,
            params,
            error: error.message
        });

        // 5. Fallback o re-throw
        return { success: false, error: error.message };
    }
}
```

### 3. Logging Detallado

```javascript
// ✅ SIEMPRE loggear:
// - Request iniciado (info)
// - Parámetros de request (debug)
// - Respuesta exitosa (info)
// - Errores (error)
// - Rate limiting (debug)

logger.info('API request initiated', { api: 'API-Sports', endpoint, params });
logger.debug('Rate limit delay applied', { delay: delayMs });
logger.info('API response received', { results: data.length });
logger.error('API request failed', { error: error.message, endpoint });
```

### 4. Cache Strategy

```javascript
// APIs que DEBEN cachearse:
// - API-Sports jugadores: 2 horas
// - API-Sports equipos: 24 horas
// - API-Sports fixtures completados: Permanente
// - AEMET municipios: 24 horas
// - AEMET predicción: 1 hora
// - Bunny.net videos: No cachear (CDN ya lo hace)

const CACHE_TTL = {
    players: 2 * 60 * 60 * 1000, // 2 horas
    teams: 24 * 60 * 60 * 1000, // 24 horas
    fixtures: Infinity, // Permanente
    weather: 60 * 60 * 1000 // 1 hora
};
```

### 5. Monitoring y Alertas

```javascript
// Monitorear:
// - Rate limit usage (diario)
// - Error rate (>5% alerta)
// - Response time (>5s alerta)
// - Costos acumulados

const metrics = {
    requestsToday: 0,
    errorsToday: 0,
    avgResponseTime: 0,
    costToday: 0
};

// Log metrics cada hora
setInterval(
    () => {
        logger.info('API metrics', metrics);
    },
    60 * 60 * 1000
);
```

---

## 📊 Priorización de APIs

### Tier 1: Críticas (100% uptime requerido)

- API-Sports (datos principales)
- Supabase (base de datos)

### Tier 2: Importantes (fallbacks disponibles)

- VEO3 (manual upload si falla)
- Bunny.net (local storage temporal)

### Tier 3: Opcionales (nice-to-have)

- AEMET (datos genéricos si falla)
- OpenAI (contenido pre-generado)

---

**Siguiendo estas guías, el uso de APIs será eficiente, confiable y
profesional.** 🎯
