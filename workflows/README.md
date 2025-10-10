# Workflows n8n - Fantasy La Liga

Workflows automatizados para publicación de contenido en Instagram.

---

## 📋 Workflows Disponibles

### 1. `n8n-carousel-top-chollos.json` ✅ ACTIVO

**Descripción**: Publica carrusel Top 10 Chollos cada martes a las 10:00 AM

**Schedule**: `0 10 * * 2` (Martes 10:00 AM)

**Flujo**:
```
1. Trigger (Martes 10:00 AM)
   ↓
2. GET /api/carousels/generate-with-hook (con hook viral)
   ↓
3. Check Success
   ↓
4. ContentDrips - Generate Carousel
   ↓
5. Wait for Render Complete
   ↓
6. Instagram - Post Carousel
   ↓
7. Log Success
```

**Prerequisitos**:
- ✅ Hook viral actualizado en `.claude/hooks/carousel-intro-hook.md`
- ⏳ ContentDrips API Key ($39/mo) - PENDIENTE activar
- ⏳ Instagram Business Account + Access Token - PENDIENTE configurar

---

## 🚀 Setup n8n

### 1. Importar Workflow

```bash
# En n8n dashboard:
# 1. Click "Workflows" → "Add Workflow"
# 2. Click "..." → "Import from File"
# 3. Seleccionar: workflows/n8n-carousel-top-chollos.json
```

### 2. Configurar Credenciales

#### A. ContentDrips API (Pendiente)
```
Name: ContentDrips API
Type: Header Auth
Header Name: Authorization
Header Value: Bearer YOUR_CONTENTDRIPS_API_KEY
```

**Obtener API Key**:
1. Ir a https://contentdrips.com/pricing
2. Suscribirse a plan Business ($39/mo)
3. Dashboard → API → Generate Key
4. Copiar y pegar en n8n credentials

#### B. Instagram Business Account (Pendiente)
```
Name: Instagram Graph API
Type: OAuth2
Client ID: YOUR_FACEBOOK_APP_ID
Client Secret: YOUR_FACEBOOK_APP_SECRET
Business Account ID: YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID
Access Token: YOUR_LONG_LIVED_ACCESS_TOKEN
```

**Obtener credenciales**:
1. Facebook Developer → Create App → Business Type
2. Add Instagram Graph API product
3. Generate Access Token (long-lived, 60 días)
4. Get Instagram Business Account ID from Graph API Explorer

### 3. Configurar Variables de Entorno

En n8n settings → Variables:

```bash
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
CONTENTDRIPS_API_KEY=your_contentdrips_api_key
```

### 4. Activar Workflow

```bash
# En n8n:
# 1. Abrir workflow "Instagram Carousel - Top Chollos Jornada"
# 2. Click toggle "Active" en esquina superior derecha
# 3. Verificar que aparece "ACTIVE" en verde
```

---

## 🪝 Sistema de Hooks Virales

**IMPORTANTE**: El hook viral debe actualizarse **CADA SEMANA** antes del trigger (Martes 10:00 AM).

### Proceso Semanal

**Lunes (antes de las 23:59)**:
1. Content Manager edita `.claude/hooks/carousel-intro-hook.md`
2. Actualiza sección "Hook Activo (Semana Actual)"
3. Cambia hook por uno diferente (evitar repetición)
4. Registra hook usado en "Historial de Hooks Usados"
5. Commit cambios a git

**Martes (10:00 AM)**:
- n8n ejecuta workflow automáticamente
- Workflow llama a `/api/carousels/generate-with-hook`
- Endpoint lee hook de `.claude/hooks/carousel-intro-hook.md`
- Hook se aplica como `intro_slide.subtitle`
- Carrusel se publica con hook viral

### Ejemplos de Hooks Virales

```markdown
✅ BUENOS (variar cada semana):
- "¡10 chollos de oro en J5! 🔥"
- "Los chollos que todos ignoran 👀"
- "Triplica puntos con estos chollos 🚀"
- "El secreto de los top managers 👑"
- "Solo el 5% conoce estos chollos 💎"

❌ EVITAR (repetitivos):
- "Top chollos jornada 5"
- "Mejores jugadores Fantasy"
- "Chollos de la semana"
```

### Validación Pre-publicación

```bash
# Verificar que hook está actualizado:
cat .claude/hooks/carousel-intro-hook.md | grep "Hook Activo"

# Probar endpoint con hook:
curl http://localhost:3000/api/carousels/generate-with-hook?limit=10 | jq '.stats.viral_subtitle'

# Debe retornar el hook del archivo, NO el default
```

---

## 🧪 Testing Workflow

### Test Manual (sin esperar a Martes)

```bash
# En n8n:
# 1. Abrir workflow
# 2. Click "Execute Workflow" (botón play)
# 3. Verificar output de cada nodo
```

### Test con datos reales

```bash
# 1. Actualizar hook en .claude/hooks/carousel-intro-hook.md
# 2. Ejecutar endpoint directamente:
curl 'http://localhost:3000/api/carousels/generate-with-hook?limit=10' | jq

# 3. Verificar que stats.viral_subtitle contiene el hook actualizado
# 4. Si correcto, ejecutar workflow en n8n manualmente
```

---

## 📊 Monitoreo

### Logs Backend

```bash
# Ver logs del endpoint generate-with-hook:
tail -f logs/combined.log | grep "generate-with-hook"

# Verificar que hook fue aplicado:
tail -f logs/combined.log | grep "Hook viral generado"
```

### Logs n8n

```bash
# En n8n dashboard:
# 1. Click "Executions" en sidebar
# 2. Filtrar por workflow "Instagram Carousel - Top Chollos"
# 3. Ver detalles de cada ejecución
```

### Verificar publicación en Instagram

```bash
# Después de ejecución exitosa:
# 1. Ir a Instagram Business Account
# 2. Verificar nuevo post de carrusel
# 3. Confirmar que caption incluye el hook viral
```

---

## ⚠️ Troubleshooting

### Workflow falla en "Fetch Carousel Data"
```bash
# Verificar que backend está corriendo:
curl http://localhost:3000/api/carousels/test

# Si falla, reiniciar backend:
npm run dev
```

### Hook no se aplica (usa default)
```bash
# Verificar que archivo hook existe:
ls -la .claude/hooks/carousel-intro-hook.md

# Verificar contenido:
cat .claude/hooks/carousel-intro-hook.md | grep "Hook:"

# Si no existe, crear desde template
```

### ContentDrips timeout
```bash
# Aumentar timeout en nodo "ContentDrips - Generate Carousel":
# options.timeout = 60000 (1 minuto)
# Si persiste, contactar soporte ContentDrips
```

### Instagram API error 403
```bash
# Access token expirado (caducan cada 60 días)
# Regenerar long-lived token:
# https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens
```

---

## 📅 Calendario de Publicaciones

| Día | Hora | Workflow | Contenido |
|-----|------|----------|-----------|
| Martes | 10:00 AM | `n8n-carousel-top-chollos` | Carrusel Top 10 Chollos |
| (Futuro) Jueves | 18:00 PM | `n8n-reel-chollo-destacado` | Reel Ana chollo destacado |
| (Futuro) Domingo | 12:00 PM | `n8n-story-resultados` | Story resultados jornada |

---

## 🔗 Enlaces Útiles

- **n8n Dashboard**: https://n8n-n8n.6ld9pv.easypanel.host
- **ContentDrips**: https://contentdrips.com
- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api
- **Cron Expression Helper**: https://crontab.guru

---

## 📝 Notas

- **Costos mensuales**:
  - ContentDrips: $39/mo
  - Instagram Graph API: Gratis (hasta 200 requests/hora)

- **Rate Limits**:
  - Instagram: 200 posts/día
  - ContentDrips: 1000 renders/mes (plan Business)

- **Backup**:
  - Workflows se exportan como JSON
  - Guardar en git para versionado
  - Restaurar con "Import from File"

---

**Última actualización**: 2025-10-06
**Mantenido por**: Fantasy La Liga Team
