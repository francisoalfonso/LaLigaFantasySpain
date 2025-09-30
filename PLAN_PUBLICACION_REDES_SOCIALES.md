# 📱 PLAN DE PUBLICACIÓN EN REDES SOCIALES
## Estrategia Aprobada: Ayrshare API

**Fecha decisión**: 30 Septiembre 2025
**Estado**: ✅ APROBADO - Listo para implementación

---

## 🎯 DECISIÓN ESTRATÉGICA

### **Solución Elegida: Ayrshare API 100%**

**Razón de la decisión**:
- ✅ Time to market crítico: 1-2 días vs 3-4 semanas
- ✅ 1 API call = 4 plataformas (Instagram, TikTok, YouTube, X)
- ✅ TikTok funciona inmediatamente (sin audit delay)
- ✅ Focus en contenido, no en infraestructura
- ✅ Costo razonable: $149/mes = $37.25/plataforma

**Descartado**: Implementación nativa completa
- ❌ 3-4 semanas setup (170+ horas trabajo)
- ❌ TikTok bloqueado hasta audit aprobado
- ❌ Complejidad alta para MVP
- ✅ Se considerará después de validar modelo (6-12 meses)

---

## 💰 ESTRUCTURA DE COSTOS

### **Año 1 Aprobado**

```
Meses 1-12: Ayrshare API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Costo mensual: $149
Costo anual: $1,788

Incluye:
✅ Instagram (Reels)
✅ TikTok (Videos)
✅ YouTube (Shorts)
✅ X/Twitter (Tweets con video)
✅ Posts ilimitados
✅ Scheduling automático
✅ Analytics básico
✅ Soporte técnico
```

### **Evaluación Futura** (Mes 6-12)

**Criterios para considerar migración a nativo**:
- ✅ Modelo de contenido validado (engagement >3%)
- ✅ Volumen consistente (90+ posts/mes durante 6 meses)
- ✅ Revenue generado justifica inversión tiempo
- ✅ Equipo disponible para 3-4 semanas desarrollo

**Si migramos a nativo**:
- Ahorro: $1,788/año
- Inversión tiempo: 120-160 horas
- ROI: Positivo solo si tiempo < $15/h

**Si mantenemos Ayrshare**:
- Costo predecible: $149/mes fijo
- Zero mantenimiento
- Focus 100% en contenido

---

## 🏗️ ARQUITECTURA TÉCNICA

### **Stack Completo**

```
┌─────────────────────────────────────────────────┐
│           GENERACIÓN DE CONTENIDO               │
├─────────────────────────────────────────────────┤
│ VEO3 → Video Ana Real (8s segments)             │
│ GPT-5 Mini → Caption optimizada por plataforma  │
│ Bunny.net → Hosting permanente videos           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           ORCHESTRATION (n8n)                   │
├─────────────────────────────────────────────────┤
│ Workflow Simple (5 nodos):                      │
│ 1. Webhook VEO3 completado                      │
│ 2. Descargar video Bunny.net                    │
│ 3. Generar caption GPT-5 Mini                   │
│ 4. Publicar vía Ayrshare API ← CORE             │
│ 5. Guardar resultados Supabase                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         PUBLICACIÓN (Ayrshare API)              │
├─────────────────────────────────────────────────┤
│ 1 API call → 4 plataformas en paralelo:        │
│ • Instagram Business (Reels)                    │
│ • TikTok Creator (Videos)                       │
│ • YouTube Channel (Shorts)                      │
│ • X/Twitter (Tweets con media)                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            TRACKING (Supabase)                  │
├─────────────────────────────────────────────────┤
│ • Post IDs por plataforma                       │
│ • Timestamp publicación                         │
│ • Caption utilizada                             │
│ • Engagement metrics (futuro)                   │
└─────────────────────────────────────────────────┘
```

### **Código Backend Core**

```javascript
// backend/services/ayrsharePublisher.js
const axios = require('axios');

class AyrsharePublisher {
    constructor() {
        this.apiKey = process.env.AYRSHARE_API_KEY;
        this.baseUrl = 'https://app.ayrshare.com/api';
    }

    /**
     * Publicar video en 4 plataformas simultáneamente
     * @param {object} videoData - Datos del video (bunnyUrl, caption, hashtags)
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - IDs de posts en cada plataforma
     */
    async publishToAllPlatforms(videoData, options = {}) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/post`,
                {
                    post: `${videoData.caption}\n\n${videoData.hashtags}`,
                    platforms: options.platforms || ['instagram', 'tiktok', 'youtube', 'twitter'],
                    videoUrl: videoData.bunnyUrl,
                    scheduleDate: options.scheduleDate || null,

                    // Instagram specific
                    instagramOptions: {
                        mediaType: 'REELS',
                        shareToFeed: true
                    },

                    // YouTube specific
                    youtubeOptions: {
                        title: videoData.caption.substring(0, 100),
                        description: videoData.caption,
                        visibility: 'public',
                        category: '17', // Sports
                        tags: ['fantasy', 'la liga', 'football']
                    },

                    // TikTok specific
                    tiktokOptions: {
                        privacyLevel: 'PUBLIC_TO_EVERYONE',
                        disableComment: false,
                        disableDuet: false,
                        disableStitch: false
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('[AyrsharePublisher] ✅ Video publicado exitosamente');
            console.log('Post IDs:', response.data.postIds);

            return {
                success: true,
                ayrshareId: response.data.id,
                postIds: response.data.postIds, // { instagram, tiktok, youtube, twitter }
                timestamp: new Date()
            };

        } catch (error) {
            console.error('[AyrsharePublisher] ❌ Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Obtener estado de publicación
     * @param {string} ayrshareId - ID de publicación Ayrshare
     * @returns {Promise<object>} - Estado actual
     */
    async getPostStatus(ayrshareId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/post/${ayrshareId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('[AyrsharePublisher] Error obteniendo estado:', error.message);
            throw error;
        }
    }

    /**
     * Obtener analytics de post
     * @param {string} ayrshareId - ID de publicación Ayrshare
     * @returns {Promise<object>} - Métricas de engagement
     */
    async getPostAnalytics(ayrshareId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/analytics/post/${ayrshareId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('[AyrsharePublisher] Error obteniendo analytics:', error.message);
            throw error;
        }
    }
}

module.exports = AyrsharePublisher;
```

### **API Route**

```javascript
// backend/routes/social.js
const express = require('express');
const router = express.Router();
const AyrsharePublisher = require('../services/ayrsharePublisher');

/**
 * Publicar video en todas las plataformas
 * POST /api/social/publish
 */
router.post('/publish', async (req, res) => {
    try {
        const { videoUrl, caption, hashtags, scheduleDate } = req.body;

        const publisher = new AyrsharePublisher();
        const result = await publisher.publishToAllPlatforms({
            bunnyUrl: videoUrl,
            caption: caption,
            hashtags: hashtags
        }, {
            scheduleDate: scheduleDate
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[API Social] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Test endpoint
 * GET /api/social/test
 */
router.get('/test', async (req, res) => {
    try {
        const apiKey = process.env.AYRSHARE_API_KEY;

        if (!apiKey) {
            throw new Error('AYRSHARE_API_KEY no configurada');
        }

        res.json({
            success: true,
            message: 'Ayrshare API configurada correctamente',
            apiKeyPresent: true
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
```

---

## 📅 PLAN DE IMPLEMENTACIÓN

### **SEMANA 1: Setup y Testing**

#### **Día 1: Configuración Inicial** ✅
```bash
# Tareas:
[ ] 1. Crear cuenta Ayrshare en https://app.ayrshare.com
[ ] 2. Upgrade a Premium Plan ($149/mes)
[ ] 3. Conectar cuentas sociales:
    [ ] Instagram Business Account
    [ ] TikTok Creator Account
    [ ] YouTube Channel
    [ ] X/Twitter Account
[ ] 4. Obtener API Key desde dashboard
[ ] 5. Agregar a .env: AYRSHARE_API_KEY=xxx
[ ] 6. Test manual: Publicar 1 post test en cada plataforma
```

**Verificación**:
- ✅ 4 cuentas conectadas correctamente
- ✅ API Key funciona
- ✅ Post test visible en cada plataforma

---

#### **Día 2: Integración Backend** ✅
```bash
# Tareas:
[ ] 1. Crear backend/services/ayrsharePublisher.js
[ ] 2. Implementar función publishToAllPlatforms()
[ ] 3. Crear backend/routes/social.js
[ ] 4. Agregar route a backend/server.js
[ ] 5. Implementar error handling
[ ] 6. Test endpoint: curl http://localhost:3000/api/social/test
```

**Verificación**:
- ✅ AyrsharePublisher implementado
- ✅ Endpoint /api/social/publish funciona
- ✅ Error handling correcto

---

#### **Día 3: n8n Workflow** ✅
```bash
# Tareas:
[ ] 1. Crear workflow "VEO3 → Ayrshare Publisher"
[ ] 2. Configurar 5 nodos:
    [ ] Webhook VEO3 completado
    [ ] HTTP Request descargar video
    [ ] OpenAI generar caption
    [ ] HTTP Request Ayrshare API
    [ ] Postgres guardar resultados
[ ] 3. Test workflow completo
[ ] 4. Agregar error notifications (Slack/Email)
```

**Verificación**:
- ✅ Workflow ejecuta sin errores
- ✅ Video se publica en 4 plataformas
- ✅ Resultados guardados en Supabase

---

#### **Día 4: Optimización Captions** ✅
```bash
# Tareas:
[ ] 1. Crear templates caption por plataforma:
    [ ] Instagram: Hook + hashtags (max 2,200 chars)
    [ ] TikTok: Corto + trending hashtags
    [ ] YouTube: Descriptivo + keywords SEO
    [ ] X: Ultra corto (280 chars) + hashtag principal
[ ] 2. Integrar con GPT-5 Mini
[ ] 3. Test A/B diferentes estilos caption
[ ] 4. Ajustar según mejores resultados
```

**Verificación**:
- ✅ Captions optimizadas por plataforma
- ✅ Hashtags relevantes incluidos
- ✅ SEO keywords presentes

---

#### **Día 5: Testing End-to-End** ✅
```bash
# Tareas:
[ ] 1. Generar video real Ana con VEO3
[ ] 2. Trigger workflow completo
[ ] 3. Verificar publicación en 4 plataformas:
    [ ] Instagram: Reel visible, caption correcta
    [ ] TikTok: Video visible, hashtags correctos
    [ ] YouTube: Short visible, título/descripción OK
    [ ] X: Tweet visible, video reproducible
[ ] 4. Verificar resultados en Supabase
[ ] 5. Test scheduling (publicación programada)
```

**Verificación**:
- ✅ Pipeline completo VEO3 → Ayrshare funciona
- ✅ Video publicado exitosamente en 4 plataformas
- ✅ Calidad contenido según guía maestra
- ✅ Scheduling funciona correctamente

---

### **SEMANA 2: Producción y Monitoreo**

#### **Lunes: Primer Post Producción** 🚀
```bash
# Contenido: Chollo Jornada actual
[ ] 1. Generar video chollo top player
[ ] 2. Publicar vía workflow automático
[ ] 3. Monitorear primeras 2 horas (engagement inicial)
[ ] 4. Responder primeros comentarios
```

#### **Martes-Domingo: Operación Normal**
```bash
# Frecuencia: 1-2 posts/día
[ ] Contenido según calendario:
    - Lunes: Chollos inicio semana
    - Martes: Análisis táctico
    - Miércoles: Predicciones jornada
    - Jueves: Preview partidos clave
    - Viernes: Últimas recomendaciones
    - Sábado: Alertas alineaciones
    - Domingo: Reacciones post-jornada
```

**Métricas a trackear**:
- Posts publicados exitosamente (objetivo: >95%)
- Tiempo publicación (objetivo: <5 min)
- Engagement rate por plataforma (objetivo: >3%)
- Errores/fallos (objetivo: <5%)

---

## 📊 MÉTRICAS DE ÉXITO

### **KPIs Técnicos (Mes 1)**

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| **Uptime** | >99% | ✅ |
| **Posts exitosos** | >95% | ✅ |
| **Tiempo publicación** | <5 min | ✅ |
| **Errores** | <5% | ✅ |
| **Plataformas funcionando** | 4/4 | ✅ |

### **KPIs Contenido (Mes 1-3)**

| Plataforma | Métrica | Objetivo Mes 1 | Objetivo Mes 3 |
|------------|---------|----------------|----------------|
| **Instagram** | Engagement rate | >3% | >5% |
| **TikTok** | Views | >1,000/video | >5,000/video |
| **YouTube** | Views | >500/short | >2,000/short |
| **X** | Engagement | >2% | >4% |
| **Todas** | Followers growth | >10%/mes | >20%/mes |

### **KPIs Negocio (Mes 3-6)**

| Métrica | Objetivo | Indicador Éxito |
|---------|----------|-----------------|
| **Revenue generado** | >$2,000 | Cubre costos Ayrshare |
| **Engagement total** | >5% | Audiencia activa |
| **Conversión** | >1% | Monetización viable |

---

## 🔄 EVALUACIÓN Y OPTIMIZACIÓN

### **Revisión Mensual (Checklist)**

```bash
# Cada fin de mes ejecutar:
[ ] 1. Análisis métricas engagement por plataforma
[ ] 2. Review top 5 posts mejor performance
[ ] 3. Review top 5 posts peor performance
[ ] 4. Identificar patrones (hora, tipo contenido, formato)
[ ] 5. Ajustar estrategia mes siguiente
[ ] 6. Verificar costos Ayrshare ($149 facturado)
[ ] 7. Calcular ROI (revenue vs costos)
```

### **Evaluación Semestral (Mes 6)**

**Decisión: ¿Mantener Ayrshare o migrar a nativo?**

```python
# Criterios de decisión

if revenue_mes_6 > $5000 and engagement_rate > 5%:
    # Modelo validado, considerar migración
    if ahorro_anual_nativo > costo_desarrollo:
        decision = "MIGRAR A NATIVO"
    else:
        decision = "MANTENER AYRSHARE"

elif revenue_mes_6 > $2000 and engagement_rate > 3%:
    # Modelo prometedor, mantener Ayrshare
    decision = "MANTENER AYRSHARE 6 MESES MÁS"

else:
    # Modelo no validado, revisar estrategia contenido
    decision = "OPTIMIZAR CONTENIDO ANTES DE CAMBIAR TECH"
```

---

## 🛠️ MANTENIMIENTO Y SOPORTE

### **Tareas Semanales**

```bash
# Lunes:
[ ] Review métricas semana anterior
[ ] Planificar contenido semana actual
[ ] Verificar calendario publicaciones

# Miércoles:
[ ] Mid-week check: engagement trends
[ ] Ajustar horarios si necesario
[ ] Responder comentarios pendientes

# Viernes:
[ ] Review preparación fin de semana
[ ] Agendar posts sábado/domingo
[ ] Backup datos importantes
```

### **Tareas Mensuales**

```bash
# Día 1 del mes:
[ ] Factura Ayrshare verificada ($149)
[ ] Análisis completo métricas mes anterior
[ ] Report mensual stakeholders
[ ] Planificación contenido mes nuevo

# Día 15 del mes:
[ ] Mid-month review performance
[ ] Ajustes estrategia si necesario
[ ] Test nuevos formatos contenido
```

### **Soporte Ayrshare**

- **Documentación**: https://docs.ayrshare.com
- **Soporte**: support@ayrshare.com
- **Status page**: https://status.ayrshare.com
- **API docs**: https://docs.ayrshare.com/rest-api

---

## ⚠️ CONTINGENCIAS Y PLAN B

### **Escenario 1: Ayrshare API down**

```bash
Probabilidad: Baja (<1%)
Impacto: Alto (no publicar contenido)

Plan B:
1. Check status page Ayrshare
2. Si >2h down: Publicación manual temporal
3. Notificar soporte Ayrshare
4. Documentar incidencia
5. Post-mortem: ¿necesitamos fallback nativo?
```

### **Escenario 2: Una plataforma falla (ej: TikTok)**

```bash
Probabilidad: Media (5-10%)
Impacto: Medio (3/4 plataformas funcionan)

Plan B:
1. Verificar en dashboard Ayrshare qué plataforma falló
2. Re-autorizar cuenta si necesario
3. Retry publicación solo en plataforma fallida
4. Si persiste: Contactar soporte Ayrshare
5. Temporal: Publicar manualmente en plataforma afectada
```

### **Escenario 3: Costos exceden presupuesto**

```bash
Probabilidad: Nula (plan fijo $149/mes)
Impacto: N/A

Plan B: No aplica (Ayrshare es flat rate)
```

### **Escenario 4: Necesitamos features no soportadas**

```bash
Probabilidad: Media (20%)
Impacto: Variable

Ejemplos:
- Instagram Stories automatizadas (no soportado)
- Carruseles multi-imagen (no soportado)
- Analytics avanzado (limitado)

Plan B:
1. Evaluar importancia feature
2. Si crítico: Considerar migración nativa adelantada
3. Si nice-to-have: Mantener Ayrshare + feature manual
4. Si muy crítico: Implementar híbrido (Ayrshare + API nativa específica)
```

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### **Documentación Técnica**

- ✅ **GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md** - Best practices contenido
- ✅ **CHECKLIST_AGENTE_CONTENIDO.md** - Workflow producción diaria
- ✅ **INFORME_PUBLICACION_AUTOMATIZADA_REDES_SOCIALES.md** - Investigación completa APIs
- ✅ **PLAN_PUBLICACION_REDES_SOCIALES.md** - Este documento

### **APIs y Servicios**

- **Ayrshare API**: https://docs.ayrshare.com
- **VEO3 (KIE.ai)**: https://kie.ai/docs
- **Bunny.net Stream**: https://docs.bunny.net/docs/stream
- **n8n Workflows**: https://docs.n8n.io

### **Código Relacionado**

```
backend/
├── services/
│   ├── ayrsharePublisher.js          # ← NUEVO (implementar Semana 1 Día 2)
│   ├── veo3/
│   │   ├── veo3Client.js             # Generación videos Ana
│   │   └── promptBuilder.js          # Prompts optimizados
│   ├── bunnyStreamManager.js         # Hosting videos
│   └── contentGenerator.js           # Generación contenido IA
├── routes/
│   ├── social.js                     # ← NUEVO (implementar Semana 1 Día 2)
│   └── veo3.js                       # Rutas VEO3 existentes
└── config/
    └── veo3/
        └── anaCharacter.js           # Ana Character Bible

n8n/
└── workflows/
    └── veo3-to-social-publisher.json # ← NUEVO (implementar Semana 1 Día 3)
```

---

## ✅ CHECKLIST FINAL PRE-LANZAMIENTO

### **Antes de ir a producción, verificar**:

#### **Configuración**
- [ ] Cuenta Ayrshare Premium creada ($149/mes)
- [ ] 4 cuentas sociales conectadas y verificadas
- [ ] AYRSHARE_API_KEY en .env configurada
- [ ] Test manual exitoso en 4 plataformas

#### **Código**
- [ ] AyrsharePublisher implementado y testeado
- [ ] Route /api/social/publish funciona
- [ ] Error handling robusto
- [ ] Logging detallado implementado

#### **n8n**
- [ ] Workflow "VEO3 → Ayrshare" creado
- [ ] Todos los nodos configurados correctamente
- [ ] Webhook VEO3 conectado
- [ ] Test end-to-end exitoso

#### **Contenido**
- [ ] Templates caption por plataforma listos
- [ ] Hashtags research completado
- [ ] Calendario contenido Semana 1 planificado
- [ ] Guía maestra revisada por equipo

#### **Monitoreo**
- [ ] Supabase table para tracking posts creada
- [ ] Notificaciones error configuradas (Slack/Email)
- [ ] Dashboard métricas preparado
- [ ] Proceso respuesta comentarios definido

---

## 🎯 OBJETIVO FINAL

**Mes 1**: Sistema estable publicando 1-2 posts/día en 4 plataformas automáticamente

**Mes 3**: Engagement >3%, followers growth >10%/mes, contenido viral ocasional

**Mes 6**: Decisión informada sobre mantener Ayrshare o migrar a nativo basada en ROI real

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

**ESTA SEMANA**:
1. [ ] Crear cuenta Ayrshare Premium
2. [ ] Conectar 4 cuentas sociales
3. [ ] Test publicación manual
4. [ ] Confirmar que todo funciona antes de integración

**PRÓXIMA SEMANA**:
1. [ ] Implementar AyrsharePublisher backend
2. [ ] Crear n8n workflow
3. [ ] Testing completo end-to-end
4. [ ] **LANZAMIENTO PRODUCCIÓN** 🚀

---

**Última actualización**: 30 Septiembre 2025
**Próxima revisión**: Fin Mes 1 (30 Octubre 2025)
**Responsable**: Equipo Fantasy La Liga Pro
**Estado**: ✅ PLAN APROBADO - Ready to implement