# 🚀 Instagram Integration - Quick Reference

**Fecha**: 13 Octubre 2025
**Status**: ✅ Implementado, ⚠️ Requiere configuración de credenciales

---

## 📦 ¿Qué se implementó?

### 1. **InstagramPublisher Service**
**Ubicación**: `backend/services/instagramPublisher.js`

Servicio completo para publicar Reels en Instagram usando Instagram Graph API de Meta.

**Funcionalidades**:
- ✅ Publicar Reels con caption y hashtags
- ✅ Upload automático de videos
- ✅ Verificación de estado de procesamiento
- ✅ Health check de la integración
- ✅ Obtener información de cuenta
- ✅ Obtener insights de posts

### 2. **VideoOrchestrator Integration**
**Ubicación**: `backend/services/videoOrchestrator.js`

Integración completa con el sistema de cola de automatización.

**Cambios**:
- ✅ `_executeInstagramJob()` ahora usa `instagramPublisher` real
- ✅ Manejo de errores robusto
- ✅ Logging detallado

### 3. **API Endpoints**
**Ubicación**: `backend/routes/instagram.js`

**Nuevos endpoints**:
- ✅ `GET /api/instagram/health` - Health check de Instagram Graph API
- ✅ `POST /api/instagram/publish` - Publicar Reel directamente

**Endpoints existentes** (sin cambios):
- `GET /api/instagram/test` - Test de conexión (legacy)
- `POST /api/instagram/stage-content` - Staging
- `POST /api/instagram/approve-content/:id` - Aprobar contenido
- `GET /api/instagram/queue` - Ver cola
- `POST /api/instagram/preview-viral` - Preview de video viral
- `POST /api/instagram/publish-viral` - Publicar viral (staging)
- Endpoints de versiones: `/versions/*`

### 4. **Documentación Completa**
**Ubicación**: `docs/INSTAGRAM_SETUP_CREDENTIALS.md`

Guía paso a paso para obtener credenciales de Instagram Graph API.

---

## ⚙️ Setup Rápido

### Paso 1: Obtener Credenciales
Sigue la guía completa en: `docs/INSTAGRAM_SETUP_CREDENTIALS.md`

**Necesitas**:
1. Instagram Business Account
2. Facebook Page conectada
3. Facebook App con Instagram Graph API
4. Access Token de larga duración (60 días)
5. Facebook Page ID
6. Instagram Business Account ID

### Paso 2: Configurar .env
```bash
# Agregar al final de .env
META_ACCESS_TOKEN=EAAGx...tu_token_aqui...
INSTAGRAM_PAGE_ID=123456789012345
INSTAGRAM_ACCOUNT_ID=17841...tu_id_aqui...
FACEBOOK_APP_ID=tu_app_id_aqui
FACEBOOK_APP_SECRET=tu_app_secret_aqui
INSTAGRAM_USERNAME=fantasy.laliga.pro
```

### Paso 3: Verificar
```bash
curl http://localhost:3000/api/instagram/health
```

✅ Si ves `"status": "healthy"` → ¡Listo para publicar!

---

## 🎬 Cómo Publicar el Video de D. Blind

### Opción 1: Usando cURL (Directo)
```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://tu-servidor-publico.com/video-with-card-1760340544198-with-captions.mp4",
    "caption": "🔥 CHOLLO: D. Blind (Girona) a solo €4.54M\n\n💰 Ratio 1.74x - 0 goles, 0 asists\n\n👇 Comenta\n\n#FantasyLaLiga #Chollo #DBlind #Girona #DefensaLaLiga #FantasyFootball #LaLiga #LaLiga2526"
  }'
```

### Opción 2: Usando Script Node.js
```bash
node scripts/instagram/publish-d-blind.js
```

### Opción 3: Programar para 1 Enero 2027
(Requiere implementar scheduling en automation_queue)

---

## 🔥 Ejemplo Completo: Publicar D. Blind

### 1. Preparar Video (Debe ser accesible públicamente)

**⚠️ IMPORTANTE**: Instagram necesita una URL pública. Opciones:

**A) Subir a Bunny.net** (Recomendado)
```bash
# Subir video a Bunny.net Storage
bunny upload ./output/veo3/video-with-card-1760340544198-with-captions.mp4
```

**B) Usar ngrok (temporal para testing)**
```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: ngrok
ngrok http 3000
# Copia la URL: https://abc123.ngrok.io

# Usa: https://abc123.ngrok.io/output/veo3/video-with-card-1760340544198-with-captions.mp4
```

**C) Subir a servidor propio**
```bash
scp output/veo3/video-with-card-1760340544198-with-captions.mp4 \
  user@tu-servidor.com:/var/www/html/videos/
```

### 2. Publicar con cURL
```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://tu-url-publica.com/video.mp4",
    "caption": "🔥 CHOLLO: D. Blind (Girona) a solo €4.54M\n\n💰 Ratio 1.74x - 0 goles, 0 asists\n\n👇 Comenta\n\n#FantasyLaLiga #Chollo #DBlind #Girona #DefensaLaLiga #FantasyFootball #LaLiga #LaLiga2526",
    "shareToFeed": true
  }'
```

### 3. Respuesta Esperada
```json
{
  "success": true,
  "message": "Reel publicado exitosamente en Instagram",
  "data": {
    "success": true,
    "postId": "18012345678901234",
    "permalink": "https://www.instagram.com/p/ABC123xyz/",
    "publishedAt": "2025-10-13T10:30:00.000Z"
  }
}
```

### 4. Verificar en Instagram
Abre: https://www.instagram.com/fantasy.laliga.pro/

---

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3000/api/instagram/health
```

**Respuesta si NO configurado**:
```json
{
  "status": "not_configured",
  "message": "Credenciales de Instagram no configuradas",
  "configured": false
}
```

**Respuesta si SÍ configurado**:
```json
{
  "status": "healthy",
  "message": "Integración de Instagram funcionando correctamente",
  "configured": true,
  "account": {
    "id": "17841...",
    "username": "fantasy.laliga.pro",
    "name": "Fantasy La Liga Pro",
    "followers": 0,
    "media_count": 0
  }
}
```

### 2. Test de Publicación (Dry Run)
Antes de publicar el video real, prueba con un video de ejemplo:

```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "caption": "🧪 Test de integración Instagram\n\n#Test"
  }'
```

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  VEO3 System                        │
│  (Genera video D. Blind con enhancements)          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Video Final MP4    │
         │  + Caption + Hook   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Upload a hosting público│
         │  (Bunny.net / Servidor)  │
         └──────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │     InstagramPublisher Service        │
    │  - Crear media container              │
    │  - Esperar procesamiento              │
    │  - Publicar en @fantasy.laliga.pro    │
    └───────────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Instagram Graph API │
         │  (Meta)              │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  ✅ Reel publicado   │
         │  en Instagram        │
         └──────────────────────┘
```

---

## 🔧 Troubleshooting

### Error: "InstagramPublisher no está configurado"
**Solución**: Agrega credenciales a `.env` (ver Paso 2 arriba)

### Error: "Invalid OAuth access token"
**Solución**:
1. Token expirado (60 días) → Regenera token
2. Token sin permisos → Genera con `instagram_content_publish`

### Error: "Video URL is not reachable"
**Solución**: Video debe ser público
- ❌ NO funciona: `http://localhost:3000/...`
- ✅ SÍ funciona: `https://cdn.bunny.net/...`

### Error: "The user must be an admin of the Instagram account"
**Solución**: Tu Facebook user debe ser admin de la Facebook Page conectada

---

## 📚 Archivos Creados/Modificados

### Nuevos Archivos
1. `backend/services/instagramPublisher.js` - Servicio principal
2. `docs/INSTAGRAM_SETUP_CREDENTIALS.md` - Guía de setup
3. `docs/INSTAGRAM_QUICK_REFERENCE.md` - Esta guía

### Archivos Modificados
1. `backend/services/videoOrchestrator.js`
   - `_executeInstagramJob()` → Integración real
2. `backend/routes/instagram.js`
   - `GET /api/instagram/health` → Nuevo endpoint
   - `POST /api/instagram/publish` → Nuevo endpoint
   - Import de `instagramPublisher`

---

## 🚀 Próximos Pasos

### Inmediato (Hoy)
1. ✅ Servicio InstagramPublisher creado
2. ✅ VideoOrchestrator integrado
3. ✅ Endpoints disponibles
4. ⚠️ **PENDIENTE**: Obtener credenciales Instagram (usuario)
5. ⚠️ **PENDIENTE**: Subir video a hosting público
6. ⚠️ **PENDIENTE**: Publicar D. Blind

### Corto Plazo (Esta Semana)
1. Implementar scheduling (posts programados)
2. Renovación automática de tokens
3. Dashboard para monitorear posts
4. Tracking de insights/métricas

### Medio Plazo (Próximas Semanas)
1. Automatización completa (cola)
2. Stories automáticas
3. Carouseles con ContentDrips
4. A/B testing de captions

---

## 💡 Tips

### Mejores Prácticas
- ✅ Usa tokens de larga duración (60 días)
- ✅ Configura renovación automática de tokens
- ✅ Siempre verifica con `/health` antes de publicar
- ✅ Prueba primero con ngrok antes de usar hosting
- ✅ Respeta límite de 25 posts/día

### Formato de Videos
- **Duración**: 4-90 segundos (ideal: 15-30s)
- **Aspect Ratio**: 9:16 (vertical) ⭐
- **Codec**: H.264, AAC audio
- **Max Size**: 100MB
- **Formato**: MP4

### Captions Virales
- Usa emojis (pero no abuses)
- Primera línea es crucial (hook)
- Max 2200 caracteres
- Max 30 hashtags (recomendado: 8-12)
- CTA al final ("Comenta", "Guarda", etc.)

---

**¿Necesitas ayuda?**
- 📖 Setup completo: `docs/INSTAGRAM_SETUP_CREDENTIALS.md`
- 🐛 Troubleshooting: Ver sección arriba
- 💬 Soporte Meta: https://developers.facebook.com/support/

**Status**: ✅ Sistema listo - Solo falta configurar credenciales
**Última actualización**: 13 Octubre 2025
