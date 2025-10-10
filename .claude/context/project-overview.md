# Project Overview - Fantasy La Liga Pro

## 🎯 ¿Qué es Fantasy La Liga Pro?

**Fantasy La Liga Pro** es una plataforma avanzada de análisis y contenido para Fantasy Football de La Liga española, especializada en identificar "chollos" (jugadores infravalorados) y generar contenido viral para redes sociales.

## 🚀 Características Principales

### 1. Sistema de Análisis de Chollos
- **Identificación automática** de jugadores infravalorados
- **Métricas avanzadas**: Fantasy Points, ROI, tendencias
- **Datos reales**: Integración con API-Sports (temporada 2025-26)
- **Algoritmo propio**: Cálculo de valor vs precio

### 2. Generación de Contenido Viral
- **Videos con IA**: Sistema VEO3 con presentadora Ana
- **Instagram Reels**: Contenido optimizado para engagement
- **YouTube Shorts**: Automatización completa
- **Carousels**: Posts multi-imagen automáticos

### 3. Sistema de Preview y Validación
- **Preview Instagram**: Mockup visual antes de publicar
- **Score viral**: 11 criterios, puntuación 0-100
- **Checklist detallado**: Recomendaciones específicas
- **Versionado**: Historial de prompts y videos generados

## 🏗️ Arquitectura Técnica

### Backend (Node.js + Express.js)
```
backend/
├── services/          # Lógica de negocio
│   ├── veo3/         # Generación videos IA
│   ├── apiSports/    # Datos La Liga
│   └── instagram/    # Contenido viral
├── routes/           # Endpoints API
├── middleware/      # Rate limiting, auth
└── config/          # Configuración
```

### Frontend (Alpine.js + Tailwind CSS)
```
frontend/
├── instagram-viral-preview.html  # Preview principal
├── test-history.html             # Historial tests
└── assets/                       # Imágenes, CSS
```

### Base de Datos (Supabase PostgreSQL)
- **Jugadores**: Estadísticas, precios, tendencias
- **Videos**: Metadatos, URLs, versiones
- **Tests**: Historial generaciones, feedback

## 🔌 Integraciones Externas

### APIs Principales
1. **API-Sports**: Datos oficiales La Liga (75K req/día)
2. **VEO3 (KIE.ai)**: Generación videos IA ($0.30/video)
3. **Bunny.net Stream**: Hosting videos ($0.005/GB)
4. **Supabase**: Base de datos PostgreSQL
5. **AEMET**: Datos meteorológicos España (gratis)
6. **OpenAI GPT-5 Mini**: Contenido IA ($0.29/mes)

### Rate Limiting
- **API-Sports**: 1 segundo entre requests
- **VEO3**: 6 segundos entre requests
- **OpenAI**: 100ms entre requests

## 🎬 Sistema VEO3 - Presentadora Ana

### Características Ana
- **Seed fijo**: 30001 (NUNCA cambiar)
- **Imagen**: URL fija GitHub
- **Idioma**: Español de España (lowercase)
- **Estilo**: Conspirador, autoridad, urgencia

### Estructura Videos
1. **Hook (8s)**: Tono conspirador, susurro
2. **Desarrollo (8s)**: Autoridad, estadísticas
3. **CTA (8s)**: Urgencia, FOMO

### Prompts Optimizados
- **Longitud**: 30-50 palabras máximo
- **Patrón**: [Sujeto] + [Acción] + [Preservación]
- **Referencias**: Genéricas ("el jugador", NO nombres)

## 📊 Sistema de Puntuación Viral

### 11 Criterios de Evaluación
1. **Hook impactante** (15 puntos)
2. **Datos específicos** (15 puntos)
3. **Urgencia temporal** (10 puntos)
4. **Comparación precio** (10 puntos)
5. **Estadísticas recientes** (10 puntos)
6. **Emociones** (10 puntos)
7. **Call-to-action claro** (10 puntos)
8. **Longitud óptima** (5 puntos)
9. **Hashtags relevantes** (5 puntos)
10. **Timing publicación** (5 puntos)
11. **Engagement potencial** (5 puntos)

### Puntuación Total: 0-100
- **90-100**: Viral garantizado
- **80-89**: Alto engagement
- **70-79**: Bueno
- **60-69**: Mejorable
- **<60**: Revisar completamente

## 🎯 Casos de Uso

### 1. Identificar Chollo
```
Input: Jugador con buen rendimiento, precio bajo
Output: Análisis detallado + recomendación
```

### 2. Generar Contenido Viral
```
Input: Datos jugador + tipo contenido
Output: Video Ana + preview Instagram + score viral
```

### 3. Validar Antes de Publicar
```
Input: Contenido generado
Output: Preview visual + checklist + recomendaciones
```

## 📈 Métricas de Éxito

### Técnicas
- **Tasa éxito VEO3**: >90% (vs <10% anterior)
- **Tiempo generación**: ~4-6 min/segmento
- **Preservación Ana**: Consistente entre segmentos
- **Rate limiting**: 0 errores por límites

### Negocio
- **Engagement Instagram**: >5% (vs 2% promedio)
- **Viralidad**: >10K views por video
- **Conversión**: >2% clicks a Fantasy La Liga
- **ROI**: $0.30 costo video → $5+ valor generado

## 🔧 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Servidor desarrollo
npm run lint             # ESLint
npm test                 # Tests
npm run db:init          # Inicializar BD
```

### VEO3
```bash
npm run veo3:generate-ana    # Generar video Ana
npm run veo3:test-retry-v3   # Test retry sistema
```

### Monitoreo
```bash
curl http://localhost:3000/api/test/ping  # Health check
ls output/veo3/sessions/                 # Ver generaciones
cat logs/server.log | grep VEO3          # Logs VEO3
```

## 🎨 Paleta de Colores

### Colores Principales
- **Primario**: #1E40AF (Azul)
- **Secundario**: #059669 (Verde)
- **Acento**: #DC2626 (Rojo)
- **Neutro**: #6B7280 (Gris)

### Uso Consistente
- **Botones**: Azul primario
- **Éxito**: Verde secundario
- **Error**: Rojo acento
- **Texto**: Gris neutro

## 📚 Documentación

### Estructura `.claude/`
- **START_HERE.md**: Punto de entrada único
- **rules/**: Reglas críticas y estándares
- **context/**: Información del proyecto
- **workflows/**: Procesos de desarrollo
- **reference/**: Referencias técnicas
- **status/**: Estado actual y prioridades

### Archivos Críticos
- **01-CRITICAL-RULES.md**: Reglas inquebrantables
- **02-development.md**: Normas desarrollo
- **03-code-style.md**: Estándares código
- **04-apis.md**: Guidelines APIs
- **05-veo3.md**: Reglas específicas VEO3

---

**Versión**: 2.0.0
**Última actualización**: 2025-10-09
**Temporada**: 2025-26 (La Liga)
**Estado**: ✅ **PRODUCCIÓN** - Sistema completo y funcional


