# 🏗️ Arquitectura Dual Frontend - Fantasy La Liga Pro

**Fecha**: 30 de Septiembre de 2025 **Versión**: 1.0 **Estado**: ✅ Implementado
y Funcionando

---

## 📊 Resumen Ejecutivo

El proyecto Fantasy La Liga Pro utiliza una **arquitectura dual frontend** con
dos aplicaciones web separadas que consumen el mismo backend API:

1. **Frontend Público** (Next.js) - Para usuarios finales
2. **Dashboard Interno** (Alpine.js) - Para validación y desarrollo

Esta separación permite optimizar cada frontend para su propósito específico sin
comprometer el otro.

---

## 🎯 1. FRONTEND PÚBLICO (Usuarios Finales)

### 📍 Ubicación

```
/Users/fran/Desktop/CURSOR/Fantasy la liga/frontend-public/
```

### 🚀 URL de Acceso

```
http://localhost:3002
```

### 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.5.4
- **Lenguaje**: TypeScript 5.9.2
- **Estilos**: Tailwind CSS 3.4.1
- **UI**: Componentes personalizados + shadcn/ui ready
- **React**: 19.1.1

### 🎯 Objetivo Principal

**Servir a millones de usuarios provenientes de redes sociales con una
experiencia profesional, rápida y atractiva.**

### 👥 Audiencia

- Usuarios de Instagram/TikTok/YouTube
- Jugadores de La Liga Fantasy
- Fans de fútbol español
- Usuarios buscando análisis y chollos

### ✨ Características Principales

#### **1. Landing Page Profesional**

- Header rojo corporativo con logo real
- Hero section con CTAs claros
- Sección destacada "Mejora tu Once con IA"
- 6 propuestas de valor con iconos
- Stats banner (600+ jugadores, 75K requests/día)
- Footer completo con links

#### **2. SEO Optimizado**

- Metadata completa en layout
- SSR (Server-Side Rendering) para performance
- URLs amigables
- Open Graph tags configurados

#### **3. Performance Optimizado**

- Next.js Image optimization
- Code splitting automático
- Static Generation donde posible
- CDN-ready para deploy en Vercel

#### **4. Diseño Responsive**

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid adaptativo (1-2-3 columnas según dispositivo)

#### **5. Colores de Marca**

```javascript
brand: {
  red: '#E11D48',      // Header y CTAs principales
  green: '#4CAF50',    // Sección "Mejora tu Once"
  orange: '#F7931E',   // Acentos y badges
}
```

### 📱 Páginas Planificadas

- ✅ `/` - Landing page (completada)
- ⏳ `/chollos` - Chollos de la jornada
- ⏳ `/analisis` - Análisis de jugadores
- ⏳ `/predicciones` - Predicciones IA
- ⏳ `/blog` - Contenido educativo
- ⏳ `/mejora-tu-once` - Herramienta interactiva

### 🔗 Integración con Backend

```javascript
// next.config.js - API Rewrites
rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3000/api/:path*', // Backend Express
    },
  ];
}
```

### 📦 Comandos

```bash
cd frontend-public/

# Desarrollo
npm run dev          # Puerto 3002

# Producción
npm run build        # Build optimizado
npm start            # Servidor producción

# Calidad
npm run lint         # ESLint
```

### 🚀 Deploy

- **Plataforma recomendada**: Vercel (optimizado para Next.js)
- **Dominio planeado**: laligafantasyspain.com
- **CDN**: Automático con Vercel
- **SSL**: Automático con Vercel

---

## 🔧 2. DASHBOARD INTERNO (Validación y Desarrollo)

### 📍 Ubicación

```
/Users/fran/Desktop/CURSOR/Fantasy la liga/frontend/
```

### 🚀 URL de Acceso

```
http://localhost:3000
```

### 🛠️ Stack Tecnológico

- **Framework**: Alpine.js 3.x (CDN)
- **Estilos**: Tailwind CSS (CDN)
- **JavaScript**: Vanilla ES6+
- **Charts**: Chart.js (CDN)
- **No build process**: Archivos servidos directamente

### 🎯 Objetivo Principal

**Herramienta interna para desarrollo, validación de APIs, testing de
integraciones y debugging del sistema.**

### 👥 Audiencia

- Equipo de desarrollo
- QA y testing
- Análisis técnico
- Validación de datos

### ✨ Características Principales

#### **1. Testing de APIs**

Endpoints de validación para cada integración:

```bash
# API-Sports
http://localhost:3000/api/laliga/test

# VEO3 (KIE.ai)
http://localhost:3000/api/veo3/health
http://localhost:3000/api/veo3/config

# Bunny.net Stream
http://localhost:3000/api/bunny-stream/test

# AEMET (Meteorología)
http://localhost:3000/api/weather/test

# Supabase Database
http://localhost:3000/api/database/test

# OpenAI GPT-5 Mini
http://localhost:3000/api/content-ai/test

# Evolution System
http://localhost:3000/api/evolution/test
```

#### **2. Páginas de Validación**

##### **index.html** - Dashboard Principal

- Overview general del sistema
- Links a todas las herramientas
- Estado de APIs

##### **bargains.html** - Sistema de Chollos

- **Objetivo**: Validar algoritmo BargainAnalyzer
- **Funcionalidad**:
    - Filtros por posición (GK, DEF, MID, FWD)
    - Filtros por precio y ratio valor
    - Visualización de análisis detallado
    - Testing de recomendaciones
- **API**: `/api/bargains/top`, `/api/bargains/position/:pos`

##### **player-detail.html** - Evolución de Jugadores

- **Objetivo**: Validar datos reales de evolución
- **Funcionalidad**:
    - Gráficos Chart.js de evolución precio/puntos
    - Verificación jornada actual (debe ser 7, NO 38)
    - Validación datos API-Sports reales
- **API**: `/api/evolution/player/:id`
- **⚠️ CRÍTICO**: Actualmente muestra datos reales después del fix V2.0

##### **lineups-live.html** - Alineaciones en Vivo

- **Objetivo**: Visualizar alineaciones de equipos
- **Funcionalidad**:
    - Grid posicional de jugadores
    - Datos en tiempo real
    - Rating y estadísticas
- **API**: `/api/laliga/laliga/players`, `/api/fixtures`

##### **ai-generator.html** - Generador de Contenido IA

- **Objetivo**: Testing de OpenAI GPT-5 Mini
- **Funcionalidad**:
    - Generación de análisis de jugadores
    - Predicciones de jornada
    - Posts para redes sociales
    - Monitoring de costos ($0.29/mes)
- **API**: `/api/content-ai/test`

##### **players-agenda.html** - Calendario de Jugadores

- **Objetivo**: Visualización de fixtures y análisis
- **Funcionalidad**:
    - Calendario interactivo
    - Dificultad de rivales
    - Fixture congestion
- **API**: `/api/fixtures`, `/api/predictions`

##### **content-strategy-matrix.html** - Matriz de Contenido

- **Objetivo**: Planificación de estrategia de contenido
- **Funcionalidad**:
    - Matriz de tipos de contenido
    - Asignación de reporteros virtuales
    - Calendario editorial

##### **content-staging.html** - Staging de Contenido

- **Objetivo**: Preview y aprobación de contenido pre-publicación
- **Funcionalidad**:
    - Visualización de contenido generado
    - Aprobación/rechazo
    - Edición antes de publicar

#### **3. Validación de Integraciones**

##### **VEO3 Testing**

```bash
# Health check sistema VEO3
curl http://localhost:3000/api/veo3/health

# Ver configuración Ana Real
curl http://localhost:3000/api/veo3/config

# Test generación video
npm run veo3:test-ana
```

##### **Database Testing**

```bash
# Test conexión Supabase
npm run db:test:quick

# Test completo estructura
npm run db:test

# Inicializar schema
npm run db:init
```

##### **API-Sports Testing**

```bash
# Test básico conectividad
curl http://localhost:3000/api/laliga/test

# Obtener jugadores temporada 2025-26
curl http://localhost:3000/api/laliga/laliga/players

# Test calculadora Fantasy
curl -X POST http://localhost:3000/api/laliga/laliga/fantasy-points \
  -H "Content-Type: application/json" \
  -d '{"stats": {...}}'
```

#### **4. Debugging Tools**

##### **Debug Routes** (`backend/routes/debug.js`)

- Logs en tiempo real
- Inspección de cache
- Estado de rate limiting
- Monitoring de requests API

##### **Winston Logging**

```bash
# Ver logs en tiempo real
tail -f logs/combined.log
tail -f logs/error.log
```

### 📦 Comandos

```bash
# Desde raíz del proyecto
npm run dev          # Puerto 3000 (backend + frontend servido)

# Testing específico
npm test             # Test routes
npm run db:test      # Test database
npm run veo3:test-all  # Test VEO3 completo
```

### 🔒 Seguridad

- **No expuesto públicamente**: Solo localhost
- **No necesita SSL**: Desarrollo local
- **API keys protegidas**: En archivos .env locales

---

## 🔄 3. BACKEND API (Compartido)

### 📍 Ubicación

```
/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/
```

### 🚀 URL de Acceso

```
http://localhost:3000
```

### 🛠️ Stack Tecnológico

- **Framework**: Express.js 4.18.2
- **Runtime**: Node.js 16+
- **Database**: Supabase PostgreSQL
- **Logging**: Winston con rotación diaria
- **Validation**: Joi
- **Documentation**: Swagger (preparado)

### 🎯 Objetivo

**API centralizada que sirve datos a ambos frontends y gestiona todas las
integraciones externas.**

### 📡 APIs Externas Integradas

#### **1. API-Sports** (Plan Ultra)

- **Uso**: Datos reales La Liga 2025-26
- **Límite**: 75,000 requests/día
- **Costo**: $29/mes
- **Endpoints**: Jugadores, equipos, fixtures, estadísticas

#### **2. VEO3 (KIE.ai)**

- **Uso**: Generación videos avatares AI
- **Costo**: $0.30/video (8 segundos)
- **Character**: Ana Martínez (seed 30001 fijo)
- **Rate Limit**: 10 requests/minuto

#### **3. Bunny.net Stream**

- **Uso**: Hosting videos + CDN global
- **Costo**: $0.005/GB storage + streaming
- **Features**: Upload, CRUD, analytics

#### **4. AEMET OpenData**

- **Uso**: Meteorología estadios España
- **Costo**: Gratis
- **Features**: Clima por coordenadas GPS

#### **5. OpenAI GPT-5 Mini**

- **Uso**: Generación contenido IA
- **Costo**: $0.29/mes estimado
- **Features**: Análisis jugadores, predicciones, posts

#### **6. Supabase PostgreSQL**

- **Uso**: Base de datos principal
- **Features**: Teams, players, matches, stats, content_plans

### 📂 Estructura Backend

```
backend/
├── server.js              # Servidor Express principal
├── routes/
│   ├── apiFootball.js     # API-Sports endpoints
│   ├── veo3.js            # VEO3 video generation
│   ├── bargains.js        # Sistema de chollos
│   ├── evolution.js       # Evolución valor jugadores
│   ├── predictions.js     # Predicciones IA
│   ├── contentAI.js       # Generación contenido
│   ├── imageGenerator.js  # Imágenes dinámicas
│   ├── instagram.js       # Publicación automática
│   └── test.js            # Testing endpoints
├── services/
│   ├── apiFootball.js     # Cliente API-Sports
│   ├── veo3/
│   │   ├── veo3Client.js
│   │   ├── promptBuilder.js
│   │   └── videoConcatenator.js
│   ├── bargainAnalyzer.js
│   ├── fantasyEvolution.js  # V2.0 - Datos reales
│   ├── predictorValor.js
│   └── playersManager.js
├── middleware/
│   ├── rateLimiter.js
│   └── validation.js
└── config/
    ├── constants.js
    └── veo3/
        └── anaCharacter.js
```

### 🔐 Rate Limiting Configurado

```javascript
// General API
100 requests / 15 minutos

// API-Sports (proteger límite 75K/día)
30 requests / minuto

// VEO3 (proteger límite 10/min)
10 requests / minuto

// Operaciones pesadas
10 requests / minuto
```

---

## 📊 4. Flujo de Datos

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────┐
│   USUARIOS FINALES (Millones)          │
│   Instagram • TikTok • YouTube          │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   FRONTEND PÚBLICO (Next.js)            │
│   http://localhost:3002                 │
│   • Landing page profesional            │
│   • SEO optimizado                      │
│   • Performance óptimo                  │
│   • Dark mode ready                     │
└─────────────────┬───────────────────────┘
                  │
                  │ /api/* (rewrites)
                  ↓
┌─────────────────────────────────────────┐
│   BACKEND API EXPRESS                   │
│   http://localhost:3000                 │
│                                         │
│   • Rate limiting multi-tier            │
│   • Winston logging                     │
│   • Joi validation                      │
│   • Error handling robusto              │
└─────┬───────────────────────────────────┘
      │                     ↑
      │                     │ Testing/Debug
      │                     │
      ↓                     │
┌─────────────────────────────────────────┐
│   APIs EXTERNAS                         │
│   • API-Sports (75K/día)                │
│   • VEO3 ($0.30/video)                  │
│   • Bunny.net Stream                    │
│   • AEMET (gratis)                      │
│   • OpenAI GPT-5 Mini                   │
│   • Supabase PostgreSQL                 │
└─────────────────────────────────────────┘
      ↑
      │ Validación y Testing
      │
┌─────────────────────────────────────────┐
│   DASHBOARD INTERNO (Alpine.js)         │
│   http://localhost:3000                 │
│   • Testing de APIs                     │
│   • Validación de datos                 │
│   • Debugging tools                     │
│   • Content staging                     │
└─────────────────────────────────────────┘
      ↑
      │
┌─────────────────────────────────────────┐
│   EQUIPO DE DESARROLLO                  │
│   • Developers                          │
│   • QA                                  │
│   • Content creators                    │
└─────────────────────────────────────────┘
```

---

## 🚀 5. Casos de Uso

### Caso de Uso 1: Usuario Final Busca Chollos

```
Usuario en Instagram ve post de Ana
    ↓
Hace clic en link bio
    ↓
Aterriza en http://localhost:3002 (Frontend Público)
    ↓
Ve landing page profesional con "Mejora tu Once"
    ↓
Hace clic en "Explorar Análisis"
    ↓
Frontend Next.js hace request a /api/bargains/top
    ↓
Backend Express consulta BargainAnalyzer
    ↓
BargainAnalyzer consulta API-Sports (rate limited)
    ↓
Procesa datos y calcula ratio valor
    ↓
Devuelve JSON con chollos
    ↓
Frontend renderiza con SSR para SEO
    ↓
Usuario ve lista de jugadores baratos con alto potencial
```

### Caso de Uso 2: Developer Valida Nueva Feature

```
Developer implementa nuevo endpoint
    ↓
Agrega test endpoint en backend/routes/test.js
    ↓
Abre http://localhost:3000/bargains.html (Dashboard Interno)
    ↓
Hace clic en "Test Nueva Feature"
    ↓
Dashboard Alpine.js hace fetch a /api/test/nueva-feature
    ↓
Backend procesa y devuelve datos de validación
    ↓
Dashboard muestra resultados en tabla
    ↓
Developer verifica logs con Winston
    ↓
Si todo OK, implementa en Frontend Público
```

### Caso de Uso 3: Sistema Genera Contenido Automático

```
Cron job se ejecuta cada mañana
    ↓
Llama a /api/content-ai/daily-analysis
    ↓
Backend obtiene datos de API-Sports
    ↓
Procesa con BargainAnalyzer
    ↓
Genera texto con OpenAI GPT-5 Mini
    ↓
Crea video con VEO3 (Ana Martínez)
    ↓
Sube a Bunny.net Stream
    ↓
Programa publicación en Instagram
    ↓
Content creator revisa en content-staging.html
    ↓
Aprueba o edita antes de publicar
    ↓
Sistema publica automáticamente
```

---

## 📋 6. Checklist de Desarrollo

### Frontend Público ✅

- [x] Estructura Next.js creada
- [x] Tailwind CSS configurado
- [x] Landing page implementada
- [x] Logo real integrado
- [x] Header rojo corporativo
- [x] Sección "Mejora tu Once" destacada
- [x] 6 propuestas de valor
- [x] Footer completo
- [x] SEO metadata
- [x] Responsive design
- [ ] Páginas adicionales (chollos, análisis, etc.)
- [ ] Dark mode con next-themes
- [ ] Componentes base (Button, Card, Badge)
- [ ] Integración real con API backend
- [ ] Deploy en Vercel

### Dashboard Interno ✅

- [x] bargains.html funcionando
- [x] player-detail.html con gráficos
- [x] lineups-live.html
- [x] ai-generator.html
- [x] Testing endpoints para todas las APIs
- [x] Validación Evolution System (V2.0 con datos reales)
- [x] Debug routes implementadas
- [ ] Content staging workflow completo
- [ ] Monitoring dashboard de costos APIs

### Backend API ✅

- [x] Express.js configurado
- [x] Rate limiting multi-tier
- [x] Winston logging
- [x] Joi validation
- [x] 6 APIs integradas
- [x] BargainAnalyzer funcionando
- [x] FantasyEvolution V2.0 (datos reales)
- [x] VEO3 sistema completo
- [x] Database schema Supabase
- [ ] Swagger documentation
- [ ] CI/CD pipeline
- [ ] Monitoring y alertas

---

## 🎯 7. Próximos Pasos

### Semana 1-2

1. ✅ Completar landing page Frontend Público
2. ⏳ Implementar dark mode con next-themes
3. ⏳ Crear componentes base UI (Button, Card, Badge)
4. ⏳ Conectar Frontend Público con API real

### Semana 3-4

1. ⏳ Crear página /chollos con datos reales
2. ⏳ Implementar "Mejora tu Once" interactivo
3. ⏳ Testing E2E con Playwright
4. ⏳ Deploy beta en Vercel

### Mes 2

1. ⏳ Páginas adicionales (análisis, predicciones)
2. ⏳ Sistema de autenticación usuarios
3. ⏳ Dashboard personal de usuario
4. ⏳ Integración completa Instagram API

### Mes 3+

1. ⏳ Contenido automatizado diario
2. ⏳ Sistema de suscripciones premium
3. ⏳ API pública para terceros
4. ⏳ Expansión a otras ligas

---

## 📚 8. Documentación Relacionada

### Documentos Core

- `CLAUDE.md` - Guía principal del proyecto
- `FRONTEND_MODERNIZATION.md` - Plan modernización frontend
- `DESIGN_SYSTEM.md` - Sistema de diseño completo
- `UI_COMPONENTS.md` - Catálogo de componentes

### Documentos Técnicos

- `CONTRIBUTING.md` - Guía de contribución
- `CODE_STYLE.md` - Estándares de código
- `API_GUIDELINES.md` - Uso de APIs externas
- `CONTENT_GUIDELINES.md` - Creación de contenido

### Documentos Backend

- `backend/services/veo3/README.md` - Sistema VEO3
- `docs/N8N_WORKFLOWS_ARCHITECTURE.md` - Workflows n8n
- `NEXT_TASK.md` - Tareas prioritarias

---

## ✅ Verificación de Arquitectura

**Antes de proceder con desarrollo, verificar:**

- [x] ✅ Frontend Público: http://localhost:3002 funcionando
- [x] ✅ Dashboard Interno: http://localhost:3000 funcionando
- [x] ✅ Backend API: http://localhost:3000/api/info respondiendo
- [x] ✅ Rate limiting configurado correctamente
- [x] ✅ Winston logs generándose
- [x] ✅ Database Supabase conectada
- [x] ✅ API-Sports funcionando (75K/día disponible)
- [x] ✅ VEO3 configurado (Ana seed 30001)
- [x] ✅ Logo real integrado en Frontend Público
- [x] ✅ Colores brand configurados en Tailwind

---

## 🎯 Conclusión

La **arquitectura dual frontend** permite:

1. **Frontend Público optimizado** para usuarios finales con SEO, performance y
   UX profesional
2. **Dashboard Interno flexible** para validación rápida sin afectar producción
3. **Backend API centralizado** que sirve a ambos frontends de forma eficiente
4. **Separación de concerns** clara entre producción y desarrollo
5. **Escalabilidad** independiente de cada componente

Esta arquitectura está **lista para escalar a millones de usuarios** manteniendo
herramientas de desarrollo profesionales.

---

**Fecha de Creación**: 30 de Septiembre de 2025 **Autor**: Claude Code + Equipo
Fantasy La Liga Pro **Versión**: 1.0 **Estado**: ✅ **IMPLEMENTADO Y
DOCUMENTADO**
