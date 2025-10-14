# 🔐 Instagram Graph API - Guía de Configuración de Credenciales

**Objetivo**: Obtener credenciales para publicar automáticamente en @fantasy.laliga.pro

**Tiempo estimado**: 30-45 minutos
**Requisitos**: Cuenta de Instagram Business o Creator
**Fecha**: 13 Octubre 2025

---

## 📋 Pre-requisitos

Antes de empezar, necesitas:

- ✅ **Cuenta de Instagram Business o Creator** (@fantasy.laliga.pro)
- ✅ **Facebook Page** conectada a la cuenta de Instagram
- ✅ **Cuenta de desarrollador de Meta** (Facebook Developers)
- ✅ **Acceso de administrador** a la página de Facebook

---

## 🎯 Paso 1: Convertir Instagram a Business Account (si no lo es)

### 1.1 Abrir Instagram en móvil
- Ve a tu perfil @fantasy.laliga.pro
- Toca el menú (☰ arriba derecha)
- Ve a **Settings and Privacy** → **Account Type and Tools**
- Toca **Switch to Professional Account**
- Selecciona **Business** (o Creator si prefieres)
- Elige categoría: **Sports** o **Website**

### 1.2 Conectar a Facebook Page
- Instagram Business REQUIERE una Facebook Page conectada
- Si no tienes una página, créala:
  1. Ve a https://www.facebook.com/pages/create
  2. Nombre: "Fantasy La Liga Pro"
  3. Categoría: "Sports League"
  4. Descripción: "Análisis con IA para dominar tu Fantasy La Liga"

- Conectar Instagram a Facebook Page:
  1. En Instagram: Settings → **Business** → **Linked Accounts**
  2. Conecta tu Facebook Page
  3. Otorga permisos de administrador

---

## 🎯 Paso 2: Crear Facebook App (Meta Developers)

### 2.1 Acceder a Meta for Developers
1. Ve a: https://developers.facebook.com/
2. Inicia sesión con tu cuenta de Facebook (la que tiene acceso a la página)
3. Click en **My Apps** (arriba derecha)
4. Click en **Create App**

### 2.2 Configurar la App
**Tipo de App**: Selecciona **Business**

**Detalles de la App**:
- **Display Name**: `Fantasy La Liga Instagram Integration`
- **App Contact Email**: `laligafantasyspainpro@gmail.com`
- **Business Portfolio**: Selecciona o crea uno (ej: "Fantasy La Liga Business")

Click **Create App**

### 2.3 Agregar Instagram Basic Display
1. En el Dashboard de tu app, busca **Add Products**
2. Busca **Instagram Basic Display** → Click **Set Up**
3. Click en **Create New App** (si aparece)
4. **Valid OAuth Redirect URIs**: `https://localhost/`
5. **Deauthorize Callback URL**: `https://localhost/`
6. **Data Deletion Request URL**: `https://localhost/`
7. Click **Save Changes**

### 2.4 Agregar Instagram Graph API (para publicar)
1. En el Dashboard, busca **Instagram Graph API** → **Set Up**
2. Esta es la API que permite PUBLICAR contenido (no solo leerlo)

---

## 🎯 Paso 3: Obtener Access Token

### 3.1 Ir a Graph API Explorer
1. Ve a: https://developers.facebook.com/tools/explorer/
2. En **Meta App**, selecciona tu app: "Fantasy La Liga Instagram Integration"
3. En **User or Page**, selecciona tu **Facebook Page** (no tu perfil personal)

### 3.2 Generar Access Token con Permisos
1. Click en **Generate Access Token**
2. Se abrirá ventana de permisos - Otorga TODOS estos permisos:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish` ⭐ (CRÍTICO para publicar)
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_posts` (recomendado)

3. Click **Generate Token**
4. **COPIA el token** (empieza con `EAAG...`)

⚠️ **IMPORTANTE**: Este token es de **corta duración** (1-2 horas). En el paso siguiente lo convertiremos a **larga duración** (60 días).

### 3.3 Convertir Token a Larga Duración

**Opción A: Usando Graph API Explorer**
1. Ve a: https://developers.facebook.com/tools/accesstoken/
2. Pega tu token
3. Click en **Extend Access Token**
4. Copia el nuevo token de larga duración

**Opción B: Usando cURL (recomendado para automatizar)**
```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Respuesta:
```json
{
  "access_token": "EAAGx... (token de larga duración)",
  "token_type": "bearer",
  "expires_in": 5183944  // ~60 días
}
```

---

## 🎯 Paso 4: Obtener Instagram Business Account ID

### 4.1 Método 1: Graph API Explorer
1. Ve a: https://developers.facebook.com/tools/explorer/
2. Usa el token de larga duración
3. Cambia endpoint a: `me/accounts` (para obtener tu Facebook Page ID)
4. Click **Submit**
5. Copia el `id` de tu Facebook Page

Ejemplo respuesta:
```json
{
  "data": [
    {
      "id": "123456789012345",  // ← FACEBOOK PAGE ID
      "name": "Fantasy La Liga Pro"
    }
  ]
}
```

### 4.2 Obtener Instagram Account ID
1. Ahora cambia endpoint a: `{FACEBOOK_PAGE_ID}?fields=instagram_business_account`
2. Reemplaza `{FACEBOOK_PAGE_ID}` con el ID anterior
3. Click **Submit**

Ejemplo respuesta:
```json
{
  "instagram_business_account": {
    "id": "17841... "  // ← INSTAGRAM BUSINESS ACCOUNT ID
  },
  "id": "123456789012345"
}
```

### 4.3 Método 2: cURL (alternativa)
```bash
# Paso 1: Obtener Facebook Page ID
curl -X GET "https://graph.facebook.com/v21.0/me/accounts" \
  -d "access_token=YOUR_LONG_LIVED_TOKEN"

# Paso 2: Obtener Instagram Account ID
curl -X GET "https://graph.facebook.com/v21.0/{FACEBOOK_PAGE_ID}?fields=instagram_business_account" \
  -d "access_token=YOUR_LONG_LIVED_TOKEN"
```

---

## 🎯 Paso 5: Configurar Credenciales en el Proyecto

### 5.1 Abrir archivo .env
```bash
code /Users/fran/Desktop/CURSOR/Fantasy\ la\ liga/.env
```

### 5.2 Agregar credenciales al final del archivo
```bash
# =========================================
# INSTAGRAM GRAPH API CREDENTIALS
# =========================================

# Meta Access Token (Long-lived, 60 días)
# Renovar cada 50 días usando: npm run instagram:refresh-token
META_ACCESS_TOKEN=EAAGx...tu_token_aqui...

# Facebook Page ID (conectada a Instagram Business Account)
INSTAGRAM_PAGE_ID=123456789012345

# Instagram Business Account ID
INSTAGRAM_ACCOUNT_ID=17841...tu_id_aqui...

# Facebook App Credentials (para renovar tokens automáticamente)
FACEBOOK_APP_ID=tu_app_id_aqui
FACEBOOK_APP_SECRET=tu_app_secret_aqui

# Instagram Account Info (para referencia)
INSTAGRAM_USERNAME=fantasy.laliga.pro
```

### 5.3 Guardar y reiniciar servidor
```bash
# Ctrl+S para guardar
# Reiniciar servidor (si está corriendo)
```

---

## 🎯 Paso 6: Verificar Configuración

### 6.1 Test de conexión
```bash
curl http://localhost:3000/api/instagram/health
```

Respuesta esperada:
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

### 6.2 Test de publicación (modo dry-run)
```bash
curl -X POST http://localhost:3000/api/instagram/test-publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "http://localhost:3000/output/veo3/video-with-card-1760340544198-with-captions.mp4",
    "caption": "🔥 Test de integración Instagram\\n\\n#FantasyLaLiga #Test"
  }'
```

---

## 🔄 Paso 7: Renovación Automática de Tokens (Opcional pero Recomendado)

Los tokens de larga duración expiran cada ~60 días. Para automatizar la renovación:

### 7.1 Crear script de renovación
El script ya existe en: `scripts/instagram/refresh-token.js`

### 7.2 Configurar cron job (cada 50 días)
```bash
# Agregar a crontab
crontab -e

# Agregar línea (ejecutar cada 50 días)
0 0 */50 * * cd /path/to/project && npm run instagram:refresh-token
```

---

## 📚 Documentación de Referencia

### URLs Útiles
- **Meta for Developers**: https://developers.facebook.com/
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Access Token Debugger**: https://developers.facebook.com/tools/debug/accesstoken/
- **Instagram Graph API Docs**: https://developers.facebook.com/docs/instagram-api
- **Content Publishing Guide**: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

### Permisos Necesarios
| Permiso | Descripción | Necesario para |
|---------|-------------|----------------|
| `instagram_basic` | Acceso básico a cuenta | Leer info de cuenta |
| `instagram_content_publish` | Publicar contenido | **PUBLICAR REELS** ⭐ |
| `pages_show_list` | Listar páginas | Obtener Facebook Page ID |
| `pages_read_engagement` | Leer engagement | Obtener insights |
| `pages_manage_posts` | Gestionar posts | Programar posts |

### Límites de la API
- **25 posts/día** (Instagram Business Account)
- **200 llamadas/hora** (Graph API rate limit)
- **Videos**: 4-90 segundos, MP4, H.264, AAC
- **Aspect ratio**: 9:16 (vertical)
- **Max file size**: 100MB

---

## 🐛 Troubleshooting

### Error: "Invalid OAuth access token"
**Causa**: Token expirado o inválido
**Solución**: Regenera el token siguiendo Paso 3

### Error: "Permissions error"
**Causa**: Falta permiso `instagram_content_publish`
**Solución**: Vuelve a generar token con TODOS los permisos del Paso 3.2

### Error: "The user must be an admin of the Instagram account"
**Causa**: Tu Facebook user no tiene permisos de admin en la página
**Solución**: Ve a Facebook Page → Settings → Page Roles → Agrégarte como Admin

### Error: "The Instagram account is not a business account"
**Causa**: Instagram no es Business Account
**Solución**: Sigue Paso 1 para convertir a Business

### Error: "Video URL is not reachable"
**Causa**: Instagram no puede acceder al video (no es público)
**Solución**:
- Opción 1: Usar Bunny.net o CloudFlare R2 (hosting público)
- Opción 2: Usar ngrok para exponer localhost temporalmente
- Opción 3: Subir video a servidor con URL pública

---

## ✅ Checklist Final

Antes de publicar tu primer Reel, verifica:

- [ ] Instagram convertido a Business Account
- [ ] Facebook Page creada y conectada
- [ ] Facebook App creada en Meta Developers
- [ ] Instagram Graph API agregado a la app
- [ ] Access Token de larga duración generado (60 días)
- [ ] Facebook Page ID obtenido
- [ ] Instagram Business Account ID obtenido
- [ ] Credenciales agregadas a `.env`
- [ ] Servidor reiniciado
- [ ] Health check exitoso (`/api/instagram/health`)
- [ ] Video accesible públicamente (no localhost)
- [ ] Caption preparado con hashtags

---

## 🚀 Próximos Pasos

Una vez configurado, ya puedes:

1. **Publicar el video de D. Blind**:
```bash
npm run instagram:publish -- --video d.-blind-v1760335656146
```

2. **Programar para 1 enero 2027**:
```bash
npm run instagram:schedule -- --video d.-blind-v1760335656146 --date "2027-01-01T20:00:00Z"
```

3. **Automatizar publicaciones futuras** con el sistema de cola de `videoOrchestrator`

---

**¿Necesitas ayuda adicional?**
Contacta al equipo de soporte de Meta: https://developers.facebook.com/support/

**Fecha de última actualización**: 13 Octubre 2025
**Versión**: 1.0
