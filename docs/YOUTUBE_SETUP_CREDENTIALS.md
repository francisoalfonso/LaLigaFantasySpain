# YouTube OAuth2 Setup - Guía Paso a Paso

Esta guía te ayudará a obtener las credenciales necesarias para publicar videos automáticamente en YouTube usando YouTube Data API v3.

**Tiempo estimado**: 15-20 minutos
**Requisito**: Cuenta de Google con canal de YouTube activo

---

## 📋 Credenciales Necesarias

Al finalizar esta guía, tendrás estos valores en tu `.env`:

```bash
YOUTUBE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=tu_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
YOUTUBE_REFRESH_TOKEN=tu_refresh_token_permanente
```

---

## 🚀 Paso 1: Crear Google Cloud Project

### 1.1 Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google (la misma del canal de YouTube)

### 1.2 Crear Nuevo Proyecto

1. Click en el selector de proyectos (arriba a la izquierda, junto a "Google Cloud")
2. Click en **"NEW PROJECT"** (esquina superior derecha)
3. **Project name**: `Fantasy La Liga YouTube`
4. **Organization**: Dejar en "No organization"
5. Click en **"CREATE"**
6. ⏳ Espera 10-15 segundos a que se cree el proyecto
7. ✅ Verifica que el proyecto esté seleccionado en el selector (arriba)

**⚠️ IMPORTANTE**: Asegúrate de que el proyecto recién creado esté activo (visible en el selector de proyectos).

---

## 🔌 Paso 2: Habilitar YouTube Data API v3

### 2.1 Ir a API Library

1. En Google Cloud Console, busca "API Library" en el buscador superior
2. O ve directamente a: https://console.cloud.google.com/apis/library

### 2.2 Habilitar API

1. Busca: `YouTube Data API v3`
2. Click en **"YouTube Data API v3"** (by Google)
3. Click en **"ENABLE"**
4. ⏳ Espera 5-10 segundos
5. ✅ Verás "API enabled" con un checkmark verde

**Nota**: NO habilites "YouTube Analytics API" ni "YouTube Reporting API" (no son necesarias).

---

## 🔑 Paso 3: Crear OAuth 2.0 Credentials

### 3.1 Ir a Credentials

1. En el menú lateral izquierdo, click en **"Credentials"**
2. O ve a: https://console.cloud.google.com/apis/credentials

### 3.2 Configurar OAuth Consent Screen (Pantalla de Consentimiento)

**IMPORTANTE**: Debes configurar esto ANTES de crear credenciales.

1. Click en **"CONFIGURE CONSENT SCREEN"** (lateral izquierdo)
2. Selecciona **"External"** (usuarios externos)
3. Click en **"CREATE"**

**OAuth consent screen - Página 1 (App Information)**:

- **App name**: `Fantasy La Liga YouTube Publisher`
- **User support email**: Tu email
- **App logo**: (opcional, saltar)
- **Application home page**: `http://localhost:3000`
- **Application privacy policy**: (opcional, dejar vacío)
- **Application terms of service**: (opcional, dejar vacío)
- **Authorized domains**: (dejar vacío por ahora)
- **Developer contact information**: Tu email
- Click en **"SAVE AND CONTINUE"**

**OAuth consent screen - Página 2 (Scopes)**:

1. Click en **"ADD OR REMOVE SCOPES"**
2. Busca y selecciona estos scopes:
   - ✅ `https://www.googleapis.com/auth/youtube.upload` (Manage your YouTube videos)
   - ✅ `https://www.googleapis.com/auth/youtube` (Manage your YouTube account)
3. Click en **"UPDATE"**
4. Click en **"SAVE AND CONTINUE"**

**OAuth consent screen - Página 3 (Test Users)**:

1. Click en **"ADD USERS"**
2. Agrega tu email (el de tu canal de YouTube)
3. Click en **"ADD"**
4. Click en **"SAVE AND CONTINUE"**

**OAuth consent screen - Página 4 (Summary)**:

1. Revisa todo
2. Click en **"BACK TO DASHBOARD"**

✅ OAuth Consent Screen configurado.

### 3.3 Crear OAuth 2.0 Client ID

1. Vuelve a **"Credentials"** (menú lateral izquierdo)
2. Click en **"+ CREATE CREDENTIALS"** (arriba)
3. Selecciona **"OAuth client ID"**

**Create OAuth client ID**:

- **Application type**: Selecciona **"Web application"**
- **Name**: `Fantasy La Liga YouTube Client`
- **Authorized JavaScript origins**: (dejar vacío)
- **Authorized redirect URIs**:
  - Click en **"+ ADD URI"**
  - Agrega: `http://localhost:3000/auth/youtube/callback`
- Click en **"CREATE"**

### 3.4 Descargar Credenciales

1. Aparecerá un modal con tus credenciales:
   - **Client ID**: `1234567890-abc...xyz.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcd1234...`
2. ✅ **COPIAR AMBOS VALORES** (los usaremos en el siguiente paso)
3. Click en **"OK"**

**Nota**: Puedes ver estas credenciales en cualquier momento desde la página "Credentials" → Click en el nombre del client → Ver detalles.

---

## 🔐 Paso 4: Configurar .env con Credenciales

### 4.1 Agregar Client ID y Secret

Abre tu archivo `.env` y agrega:

```bash
# YouTube OAuth2 Credentials
YOUTUBE_CLIENT_ID=TU_CLIENT_ID_AQUI.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
```

Reemplaza `TU_CLIENT_ID_AQUI` y `TU_CLIENT_SECRET_AQUI` con los valores copiados del paso anterior.

### 4.2 Reiniciar Servidor

```bash
# Detener servidor (Ctrl+C)
npm run dev
```

**Verifica que el servidor inicie correctamente sin errores de YouTube.**

---

## 🎫 Paso 5: Obtener Refresh Token

El Refresh Token es permanente y te permite publicar videos sin volver a autorizar cada vez.

### 5.1 Obtener Authorization URL

**Opción A - Usando curl**:

```bash
curl http://localhost:3000/api/youtube/auth
```

**Opción B - En el navegador**:

Ve a: http://localhost:3000/api/youtube/auth

**Resultado esperado**:

```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...",
  "message": "Abre esta URL en tu navegador para autorizar la aplicación",
  "instructions": [...]
}
```

### 5.2 Autorizar Aplicación

1. ✅ **COPIA la URL completa** de `authUrl`
2. Abre esa URL en tu navegador
3. Inicia sesión con tu cuenta de Google (la del canal de YouTube)
4. Verás la pantalla de consentimiento: **"Fantasy La Liga YouTube Publisher wants to access your Google Account"**
5. Revisa los permisos solicitados:
   - Manage your YouTube videos
   - Manage your YouTube account
6. Click en **"Continue"**
7. ⚠️ Verás "Google hasn't verified this app" (normal en desarrollo)
8. Click en **"Continue"** (o "Advanced" → "Go to Fantasy La Liga YouTube Publisher")
9. Click en **"Allow"** para dar permisos

### 5.3 Copiar Authorization Code

1. Serás redirigido a: `http://localhost:3000/auth/youtube/callback?code=4/0AanRQUL...&scope=...`
2. ⚠️ La página mostrará "Cannot GET /auth/youtube/callback" (normal, no existe endpoint)
3. ✅ **COPIA TODO EL CÓDIGO** desde la URL:
   - El valor del parámetro `code=` (después de `code=` y antes de `&scope`)
   - Ejemplo: `4/0AanRQUL-abc123...xyz789`
   - **Copia TODO el valor, suelen ser 100+ caracteres**

### 5.4 Intercambiar Code por Tokens

Ejecuta este comando **reemplazando** `TU_CODIGO_AQUI` por el código copiado:

```bash
curl -X POST http://localhost:3000/api/youtube/token \
  -H "Content-Type: application/json" \
  -d '{"code": "TU_CODIGO_AQUI"}'
```

**⚠️ IMPORTANTE**: El código expira en 10 minutos. Si falla, repite desde 5.1.

**Resultado esperado**:

```json
{
  "success": true,
  "message": "Tokens obtenidos exitosamente",
  "tokens": {
    "access_token": "OK",
    "refresh_token": "1//0gAbc123...xyz789",
    "expiry_date": 1234567890000
  },
  "instructions": [
    "1. Copia el refresh_token",
    "2. Agrégalo a .env como YOUTUBE_REFRESH_TOKEN",
    "3. Reinicia el servidor",
    "4. Verifica con GET /api/youtube/health"
  ]
}
```

### 5.5 Guardar Refresh Token

1. ✅ **COPIA el valor de `refresh_token`** (suele empezar con `1//0g...`)
2. Abre `.env` y agrega:

```bash
YOUTUBE_REFRESH_TOKEN=TU_REFRESH_TOKEN_AQUI
```

3. **Reinicia el servidor**:

```bash
# Ctrl+C para detener
npm run dev
```

---

## ✅ Paso 6: Verificar Integración

### 6.1 Health Check

```bash
curl http://localhost:3000/api/youtube/health
```

**Resultado esperado**:

```json
{
  "status": "healthy",
  "message": "Integración de YouTube funcionando correctamente",
  "configured": true,
  "channel": {
    "id": "UC...",
    "title": "Fantasy La Liga",
    "subscribers": "123",
    "videos": "45"
  }
}
```

✅ **Si ves `"status": "healthy"`, la integración está lista!**

### 6.2 Obtener Info del Canal

```bash
curl http://localhost:3000/api/youtube/channel
```

Verás el título de tu canal, suscriptores, número de videos, etc.

---

## 🎬 Paso 7: Publicar Tu Primer Short

### 7.1 Publicar D. Blind Programado para 01/01/2027

Ejecuta este comando para publicar el video de D. Blind programado para el **1 de enero de 2027 a las 8:00 PM CET**:

```bash
curl -X POST http://localhost:3000/api/youtube/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/Users/fran/Desktop/CURSOR/Fantasy la liga/output/veo3/video-with-card-1760340544198-with-captions.mp4",
    "title": "CHOLLO D. Blind €4.54M - Ratio 1.74x | Fantasy La Liga #Shorts",
    "description": "🔥 CHOLLO BRUTAL: D. Blind (Girona) por solo €4.54M con ratio 1.74x\n\n💎 ANÁLISIS:\n• Precio: €4.54M\n• Ratio valor: 1.74x\n• Posición: Defensa (DEF)\n• Equipo: Girona FC\n\n🎯 ¿Por qué es un CHOLLO?\nDefensa infravalorado con excelente ratio precio/rendimiento. Ideal para optimizar presupuesto en Fantasy La Liga 2025-26.\n\n📊 Más chollos y análisis en:\nhttps://fantasylaliga.pro\n\n#FantasyLaLiga #Chollo #DBlind #Girona #DefensaLaLiga #FantasyFootball #LaLiga #LaLiga2526 #FantasyTips #CholloFantasy",
    "tags": ["fantasy la liga", "chollo fantasy", "d blind", "girona", "fantasy football", "la liga", "fantasy tips", "chollos la liga", "defensa fantasy"],
    "privacyStatus": "private",
    "scheduledPublishTime": "2027-01-01T19:00:00Z"
  }'
```

**Notas**:
- `privacyStatus: "private"` es obligatorio para videos programados
- `scheduledPublishTime` está en UTC (19:00 UTC = 20:00 CET)
- El video quedará visible en YouTube Studio como "Scheduled"

**Resultado esperado**:

```json
{
  "success": true,
  "message": "Short programado exitosamente",
  "data": {
    "videoId": "abc123xyz",
    "url": "https://youtube.com/shorts/abc123xyz",
    "status": "scheduled",
    "publishedAt": "2027-01-01T19:00:00Z"
  }
}
```

### 7.2 Verificar en YouTube Studio

1. Ve a: https://studio.youtube.com/
2. En el menú lateral, click en **"Content"**
3. Verás tu video con estado **"Scheduled"**
4. Click en el video para ver detalles y fecha de publicación

---

## 📌 Resumen de Credenciales

Al finalizar, tu `.env` debe tener:

```bash
# YouTube OAuth2 Credentials
YOUTUBE_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-abcd1234...
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
YOUTUBE_REFRESH_TOKEN=1//0gAbc123...xyz789
```

---

## 🐛 Troubleshooting

### Error: "invalid_grant" al obtener tokens

**Causa**: El authorization code expiró (10 minutos de vida)
**Solución**: Repite desde Paso 5.1 (obtener nueva authorization URL)

### Error: "Access Not Configured"

**Causa**: YouTube Data API v3 no está habilitada
**Solución**: Repite Paso 2 (habilitar API)

### Error: "redirect_uri_mismatch"

**Causa**: La redirect URI en .env no coincide con la configurada en Google Cloud Console
**Solución**:
1. Verifica que `.env` tenga: `YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback`
2. Verifica que en Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs tenga exactamente: `http://localhost:3000/auth/youtube/callback`

### Health check retorna "not_configured"

**Causa**: Credenciales faltantes en .env o servidor no reiniciado
**Solución**:
1. Verifica que `.env` tenga todas las variables: CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
2. Reinicia el servidor: Ctrl+C y `npm run dev`

### Error: "The request cannot be completed because you have exceeded your quota"

**Causa**: Has excedido la cuota diaria de YouTube API (10,000 unidades/día)
**Cada upload consume**: ~1,600 unidades
**Uploads permitidos por día**: ~6 videos
**Solución**: Espera hasta mañana (la cuota se resetea a medianoche PST)

---

## 📚 Recursos Adicionales

- **YouTube Data API v3 Docs**: https://developers.google.com/youtube/v3
- **OAuth2 Scopes**: https://developers.google.com/identity/protocols/oauth2/scopes#youtube
- **Quota Calculator**: https://developers.google.com/youtube/v3/determine_quota_cost
- **YouTube Studio**: https://studio.youtube.com/

---

## 💡 Próximos Pasos

Una vez configurado YouTube, puedes:

1. **Automatizar publicación con n8n**: Crear workflow que tome videos de VEO3 y los publique automáticamente
2. **Integrar con VideoOrchestrator**: Agregar YouTube como destino de publicación automática
3. **Crear calendario de contenido**: Programar Shorts con anticipación

---

**¿Listo?** Empieza con el Paso 1 y avanza paso a paso. Si encuentras errores, revisa la sección de Troubleshooting.
