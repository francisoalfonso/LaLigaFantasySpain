# 🚀 Plan Mañana: Flujo End-to-End Instagram

**Fecha**: 13 Octubre 2025 **Objetivo**: Probar flujos completos contra canales
reales, publicando en Instagram (programado, no visible)

---

## 🎯 Objetivo Principal

Verificar que **todo el flujo end-to-end funciona** desde la generación de video
hasta la publicación en Instagram, comenzando con **chollos de Ana**.

---

## 📋 Tareas Prioritarias (en orden)

### 1. ✅ Verificar Credenciales Instagram

**Qué hacer**:

- Verificar que las credenciales de Instagram están configuradas en `.env`
- Verificar que el token de Instagram Graph API sigue activo
- Verificar permisos de la app (instagram_basic, instagram_content_publish)

**Archivos a revisar**:

- `.env` → `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`
- Backend service: `backend/services/instagramPublisher.js` (crear si no existe)

**Resultado esperado**: Credenciales válidas y token activo

---

### 2. 🎥 Generar Video Chollo con Ana (VEO3)

**Qué hacer**:

- Usar el sistema VEO3 para generar un video de chollos de Ana
- Tipo de contenido: `chollos`
- Duración: 24 segundos (3 segmentos de 8s)
- Usar datos reales de `BargainAnalyzer`

**Endpoint a usar**:

```bash
POST /api/veo3/generate-chollo-video
Body: {
  "playerIds": [123, 456, 789], // Top 3 chollos de la jornada actual
  "presenter": "ana"
}
```

**Resultado esperado**: Video generado en `output/veo3/sessions/session_xxx/`

---

### 3. 📝 Generar Caption Viral Automático

**Qué hacer**:

- Usar `ViralCaptionsGenerator` para crear caption automático
- Incluir: Hook + 3 chollos + CTA
- Hashtags relevantes: #LaLigaFantasy #Chollos #FantasyLaLiga

**Service**:

```javascript
const caption = await viralCaptionsGenerator.generateCaption({
    videoType: 'chollos',
    players: [player1, player2, player3],
    presenter: 'ana'
});
```

**Resultado esperado**: Caption optimizado para Instagram

---

### 4. 📤 Publicar en Instagram (Modo Programado)

**Qué hacer**:

- Publicar video en Instagram usando Graph API
- **IMPORTANTE**: Publicar como borrador o programado (NO visible públicamente)
- Usar `published=false` o agendar para fecha futura

**Instagram Graph API**:

```javascript
// 1. Upload media
POST /{ig-user-id}/media
{
  media_type: 'REELS',
  video_url: 'https://example.com/video.mp4',
  caption: 'Caption generado',
  published: false // BORRADOR
}

// 2. Publicar (o programar)
POST /{ig-user-id}/media_publish
{
  creation_id: '{media-id}'
}
```

**Resultado esperado**: Video subido a Instagram pero NO visible para público
(borrador o programado)

---

### 5. ✅ Verificar Flujo Completo

**Checklist**:

- [x] Video generado correctamente con Ana (VEO3)
- [x] Caption viral generado automáticamente
- [x] Video subido a Instagram sin errores
- [x] Video marcado como borrador/programado
- [x] Metadata correcta (hashtags, ubicación, etc.)
- [x] Video NO visible públicamente aún

**Resultado esperado**: Flujo completo funcional de punta a punta

---

## 🔄 Tipos de Contenido a Probar (en orden)

### Fase 1: Chollos (Ana) ⭐ **EMPEZAR AQUÍ**

- **Presenter**: Ana
- **Tipo**: Chollos
- **Formato**: 3 jugadores en 24 segundos
- **Frecuencia**: 2-3 por semana
- **Plataforma**: Instagram Reels

### Fase 2: Stats (Carlos)

- **Presenter**: Carlos
- **Tipo**: Estadísticas
- **Formato**: Análisis datos + gráficos
- **Frecuencia**: 1-2 por semana
- **Plataforma**: Instagram Reels

### Fase 3: Tips (Ana)

- **Presenter**: Ana
- **Tipo**: Tips rápidos
- **Formato**: 1 consejo accionable
- **Frecuencia**: 2-3 por semana
- **Plataforma**: Instagram Stories + Reels

### Fase 4: Analysis (Carlos)

- **Presenter**: Carlos
- **Tipo**: Análisis profundo
- **Formato**: Breakdown de jornada
- **Frecuencia**: 1 por semana
- **Plataforma**: Instagram Reels

---

## 📊 Métricas a Trackear

Durante las pruebas, registrar:

1. **Tiempo de generación**: ¿Cuánto tarda VEO3 en generar el video?
2. **Tasa de éxito**: ¿Cuántos intentos necesita para video exitoso?
3. **Tiempo de subida**: ¿Cuánto tarda subir a Instagram?
4. **Errores**: Documentar cualquier error encontrado

---

## 🚨 Blockers Potenciales

1. **Instagram API Rate Limits**:
    - Máximo 50 publicaciones/hora
    - Máximo 200 publicaciones/día
    - **Solución**: Respetar rate limits con delays

2. **VEO3 Timeouts**:
    - Videos pueden tardar 4-6 minutos
    - **Solución**: Usar timeouts largos (≥120s)

3. **Credenciales Expiradas**:
    - Tokens de Instagram expiran cada 60 días
    - **Solución**: Renovar token antes de empezar

4. **Video muy largo para Instagram**:
    - Instagram Reels máximo 90 segundos
    - **Solución**: Ya usamos 24 segundos, OK

---

## 🔧 Herramientas y Scripts

### Generar Chollos Video

```bash
npm run veo3:generate-chollo
```

### Subir a Instagram (borrador)

```bash
npm run instagram:upload-draft
```

### Test completo end-to-end

```bash
npm run instagram:test-e2e
```

---

## 📝 Notas de Implementación

### Instagram Publisher Service (crear si no existe)

**Archivo**: `backend/services/instagramPublisher.js`

```javascript
class InstagramPublisher {
    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.accountId = process.env.INSTAGRAM_ACCOUNT_ID;
        this.graphApiUrl = 'https://graph.facebook.com/v18.0';
    }

    async publishReel(videoUrl, caption, isDraft = true) {
        // 1. Upload media container
        const mediaResponse = await axios.post(
            `${this.graphApiUrl}/${this.accountId}/media`,
            {
                media_type: 'REELS',
                video_url: videoUrl,
                caption: caption,
                published: !isDraft // false = borrador
            },
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            }
        );

        const mediaId = mediaResponse.data.id;

        // 2. Check media status (puede tardar minutos)
        await this._waitForMediaReady(mediaId);

        // 3. Publish (o dejar como borrador)
        if (!isDraft) {
            await axios.post(
                `${this.graphApiUrl}/${this.accountId}/media_publish`,
                {
                    creation_id: mediaId
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`
                    }
                }
            );
        }

        return mediaId;
    }

    async _waitForMediaReady(mediaId) {
        // Polling hasta que status = FINISHED
        let attempts = 0;
        while (attempts < 20) {
            const status = await this._checkMediaStatus(mediaId);
            if (status === 'FINISHED') return;
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15s
            attempts++;
        }
        throw new Error('Media processing timeout');
    }
}
```

### Endpoint para E2E Test

**Archivo**: `backend/routes/instagram.js`

```javascript
router.post('/test-e2e-chollo', async (req, res) => {
    try {
        // 1. Get top 3 chollos
        const chollos = await bargainAnalyzer.getTopBargains(3);

        // 2. Generate video
        const video = await veo3Client.generateCholloVideo({
            players: chollos,
            presenter: 'ana'
        });

        // 3. Generate caption
        const caption = await viralCaptionsGenerator.generateCaption({
            videoType: 'chollos',
            players: chollos,
            presenter: 'ana'
        });

        // 4. Upload to Instagram (draft)
        const mediaId = await instagramPublisher.publishReel(
            video.url,
            caption,
            true // draft mode
        );

        res.json({
            success: true,
            videoUrl: video.url,
            caption,
            instagramMediaId: mediaId,
            message: 'Video subido como borrador en Instagram'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## ✅ Criterios de Éxito

Al final del día, deberíamos tener:

1. ✅ **1 video de chollos generado** con Ana usando VEO3
2. ✅ **Caption viral generado** automáticamente
3. ✅ **Video subido a Instagram** como borrador (NO visible)
4. ✅ **Documentación** de errores encontrados y soluciones
5. ✅ **Flujo end-to-end funcionando** sin intervención manual

---

## 🎯 Próximos Pasos (después de chollos)

1. **Probar Stats con Carlos**
2. **Probar Tips con Ana**
3. **Probar Analysis con Carlos**
4. **Configurar automatización completa** (cron jobs)
5. **Activar publicación automática** (quitar modo borrador)

---

## 📚 Referencias

- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api
- **VEO3 System**: `docs/VEO3_GUIA_COMPLETA.md`
- **Viral Captions**: `backend/services/veo3/viralCaptionsGenerator.js`
- **Bargain Analyzer**: `backend/services/bargainAnalyzer.js`

---

**Última actualización**: 12 Octubre 2025 20:45 **Responsable**: Fran + Claude
**Estado**: ✅ Listo para empezar mañana
