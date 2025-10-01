# 🎬 YouTube Shorts - Automatización Completa vía API

**Fecha actualización**: 1 Octubre 2025 **Objetivo**: Automatización 100% del
flujo de publicación mediante YouTube Data API v3

---

## 🚀 Ventaja Clave: Automatización Total

**TODO se puede hacer vía API de YouTube** - No necesitas interfaz manual en
ningún momento.

### ✅ Capacidades YouTube Data API v3

| Funcionalidad                            | API Support      | Estado       |
| ---------------------------------------- | ---------------- | ------------ |
| **Upload videos**                        | ✅ Completo      | Implementado |
| **Metadata (título, descripción, tags)** | ✅ Completo      | Implementado |
| **Thumbnails personalizados**            | ✅ Completo      | Implementado |
| **Playlists**                            | ✅ Completo      | Implementado |
| **Categorías**                           | ✅ Completo      | Implementado |
| **Privacidad (public/unlisted/private)** | ✅ Completo      | Implementado |
| **Programación publicación**             | ✅ Completo      | Implementado |
| **Actualizar metadata**                  | ✅ Completo      | Implementado |
| **Eliminar videos**                      | ✅ Completo      | Implementado |
| **Analytics (views, likes, comments)**   | ✅ Completo      | Implementado |
| **Community posts**                      | ❌ No disponible | -            |
| **YouTube Stories**                      | ❌ No disponible | -            |

**Conclusión**: El 95% de lo necesario está disponible vía API. Lo único que NO
se puede hacer vía API son Community Posts y Stories (secundarios).

---

## 🎯 Estrategia de Automatización Completa

### **Fase 1: Setup Inicial (1 vez)**

#### **1.1 Crear Canal YouTube** (Manual - 5 minutos)

```
1. Ir a youtube.com
2. Click en "Crear canal"
3. Nombre: "Fantasy La Liga Pro"
4. Verificar teléfono
5. Aceptar términos
```

#### **1.2 Configurar YouTube Data API** (Manual - 10 minutos)

```
1. Google Cloud Console → console.cloud.google.com
2. Crear proyecto "Fantasy La Liga"
3. Habilitar YouTube Data API v3
4. Crear credenciales OAuth 2.0
5. Agregar scopes necesarios:
   - https://www.googleapis.com/auth/youtube.upload
   - https://www.googleapis.com/auth/youtube
   - https://www.googleapis.com/auth/youtube.force-ssl
6. Descargar client_secret.json
```

#### **1.3 Obtener Refresh Token** (Manual - 5 minutos)

```bash
# Usar script de autorización OAuth (una vez)
node scripts/youtube/auth-setup.js

# Sigue URL generada → autoriza → obtiene refresh token
# Guardar en .env:
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN=xxx
YOUTUBE_CHANNEL_ID=xxx
```

**Tiempo total setup**: 20 minutos (una sola vez)

---

### **Fase 2: Automatización Diaria (0 minutos manuales)**

Todo el flujo es **100% automático** a partir de aquí:

#### **Flujo Completo Automatizado**

```javascript
// 1. CRON JOB DIARIO (ejecuta automáticamente)
// Ejemplo: 10:00 AM cada día

async function dailyYouTubeShorts() {
    // 2. Seleccionar contenido del día
    const contentType = selectDailyContentType(); // chollo, breaking, stats, prediccion

    // 3. Obtener datos Fantasy La Liga (API-Sports)
    const contentData = await getContentData(contentType);

    // 4. Generar Short completo E2E
    const short = await generateCompleteShort(contentType, contentData);
    // → VEO3 genera video (24s, 3 segmentos)
    // → Aplica subtítulos karaoke automáticos
    // → Aplica overlays de datos
    // → Genera thumbnail impactante

    // 5. UPLOAD AUTOMÁTICO A YOUTUBE (VÍA API)
    const upload = await youtubeAPI.uploadShort(short.videoPath, {
        title: short.metadata.title,
        description: short.metadata.description,
        tags: short.metadata.tags,
        thumbnailPath: short.thumbnailPath,
        privacyStatus: 'public', // Publicar inmediatamente
        categoryId: '17', // Sports
        madeForKids: false
    });

    // 6. AGREGAR A PLAYLIST (VÍA API)
    await youtubeAPI.addToPlaylist(upload.videoId, PLAYLISTS.chollos);

    // 7. TRACKING AUTOMÁTICO
    await database.save({
        videoId: upload.videoId,
        url: upload.url,
        publishedAt: new Date(),
        contentType,
        expectedViews: estimateViews(contentType)
    });

    console.log(`✅ Short publicado: ${upload.url}`);
}

// Ejecutar automáticamente con node-cron
cron.schedule('0 10 * * *', dailyYouTubeShorts); // 10 AM diario
```

**Intervención manual requerida**: **CERO**

---

## 📅 Calendario de Publicación Automatizado

### **Estrategia de Frecuencia**

```javascript
const WEEKLY_SCHEDULE = {
    // 5-6 Shorts/semana para crecimiento óptimo
    monday: { type: 'stats_impactantes', time: '10:00' },
    tuesday: { type: 'chollo_viral', time: '14:00' },
    wednesday: { type: 'breaking_news', time: '12:00' },
    thursday: { type: 'prediccion_jornada', time: '18:00' },
    friday: { type: 'chollo_viral', time: '16:00' },
    saturday: null, // Descanso
    sunday: { type: 'stats_impactantes', time: '11:00' }
};
```

**Configuración automática**:

- Publicación en horarios óptimos (10-18h España)
- 5-6 Shorts/semana (óptimo para algoritmo)
- Distribución: 40% chollos, 25% breaking, 20% stats, 15% predicciones
- Descanso sábados (bajo engagement fin de semana)

---

## 🤖 Sistema de Gestión Automática

### **1. Metadata Optimization (Automática)**

```javascript
// YouTube API maneja TODO automáticamente

const metadata = {
    // Título optimizado SEO (max 100 chars)
    title: generateOptimizedTitle(contentData),
    // Ej: "💰 CHOLLO: Pedri a 8.5M - ¡FICHALO YA! #Shorts"

    // Descripción con hashtags y links
    description: generateDescription(contentData),
    // Incluye:
    // - Resumen contenido
    // - Hashtags relevantes
    // - Links afiliados
    // - CTA suscripción

    // Tags SEO optimizados
    tags: generateTags(contentData),
    // ['fantasy la liga', 'la liga fantasy', 'chollos fantasy', ...]

    // Configuración técnica
    categoryId: '17', // Sports (obligatorio)
    defaultLanguage: 'es',
    defaultAudioLanguage: 'es-ES',
    privacyStatus: 'public', // O 'scheduled' para programar
    madeForKids: false,
    license: 'youtube',
    embeddable: true,
    publicStatsViewable: true
};

await youtubeAPI.uploadShort(videoPath, metadata);
```

### **2. Thumbnail Management (Automático)**

```javascript
// Generación + Upload automático vía API

// Generar thumbnail impactante
const thumbnail = await thumbnailGenerator.generate(contentType, contentData);
// → HTML → imagen 1280x720
// → Diseño específico por tipo
// → Texto grande + emojis + colores impactantes

// Upload automático
await youtubeAPI.uploadThumbnail(videoId, thumbnail.path);
// YouTube API acepta thumbnails custom automáticamente
```

### **3. Playlists Organization (Automática)**

```javascript
// Crear playlists automáticamente (una vez)
const PLAYLISTS = {
    chollos: await youtubeAPI.createPlaylist({
        title: '💰 Chollos Fantasy La Liga',
        description: 'Los mejores chollos de La Liga Fantasy',
        privacyStatus: 'public'
    }),

    breaking: await youtubeAPI.createPlaylist({
        title: '🚨 Noticias Fantasy Última Hora',
        description: 'Breaking news y alertas Fantasy',
        privacyStatus: 'public'
    }),

    stats: await youtubeAPI.createPlaylist({
        title: '📊 Stats Impactantes La Liga',
        description: 'Estadísticas sorprendentes de jugadores',
        privacyStatus: 'public'
    }),

    predicciones: await youtubeAPI.createPlaylist({
        title: '🎯 Predicciones Jornada',
        description: 'Predicciones y análisis jornada La Liga',
        privacyStatus: 'public'
    })
};

// Agregar cada Short a su playlist automáticamente
await youtubeAPI.addToPlaylist(videoId, PLAYLISTS[contentType]);
```

### **4. Analytics Tracking (Automático)**

```javascript
// Monitoreo automático de performance cada 24h

cron.schedule('0 0 * * *', async () => {
    const recentVideos = await database.getVideos({ lastNDays: 7 });

    for (const video of recentVideos) {
        // Obtener stats vía YouTube API
        const stats = await youtubeAPI.getVideoStats(video.videoId);

        // Guardar en DB para análisis
        await database.updateVideoStats(video.videoId, {
            views: stats.views,
            likes: stats.likes,
            comments: stats.comments,
            watchTime: stats.duration,
            retention: calculateRetention(stats),
            lastUpdated: new Date()
        });

        // Alertas automáticas
        if (stats.views > 100000) {
            await sendNotification('🔥 Video viral detectado!', video);
        }
    }
});
```

---

## 🎯 Configuración Avanzada Automática

### **Programación de Publicaciones**

```javascript
// Publicar en momento exacto (vía API)

const publishAt = new Date('2025-10-02T14:00:00Z'); // 14:00 UTC

await youtubeAPI.uploadShort(videoPath, {
    ...metadata,
    privacyStatus: 'private' // Upload privado primero
});

// Programar publicación (YouTube lo hace automático)
await youtubeAPI.updateVideoMetadata(videoId, {
    privacyStatus: 'public',
    publishAt: publishAt.toISOString()
});

// YouTube publicará automáticamente a esa hora
```

### **A/B Testing Thumbnails**

```javascript
// Estrategia: cambiar thumbnail después de 48h si CTR bajo

cron.schedule('0 0 */2 * *', async () => {
    // Cada 2 días
    const videos = await database.getVideos({ lastNDays: 2 });

    for (const video of videos) {
        const stats = await youtubeAPI.getVideoStats(video.videoId);
        const ctr = calculateCTR(stats);

        if (ctr < 0.05) {
            // CTR < 5%
            // Generar thumbnail alternativo
            const newThumbnail = await thumbnailGenerator.generateVariation(
                video.contentType,
                video.contentData,
                2 // Variación #2
            );

            // Actualizar vía API
            await youtubeAPI.uploadThumbnail(video.videoId, newThumbnail.path);

            console.log(
                `🔄 Thumbnail actualizado para mejorar CTR: ${video.videoId}`
            );
        }
    }
});
```

### **Respuesta a Comentarios (Semi-automática)**

```javascript
// Obtener comentarios vía API
const comments = await youtubeAPI.getVideoComments(videoId);

// Filtrar preguntas sobre Fantasy
const questions = comments.filter(
    c => c.text.includes('?') && c.text.match(/fantasy|jugador|precio|puntos/i)
);

// Generar respuestas automáticas con GPT-5
for (const question of questions) {
    const response = await openai.generateResponse({
        context: 'Fantasy La Liga expert',
        question: question.text
    });

    // Responder automáticamente
    await youtubeAPI.replyToComment(question.id, response);
}
```

---

## 💰 Monetización 100% Automatizada

### **Revenue Streams Automáticos**

#### **1. Ad Revenue (Pasivo Total)**

```
✅ Se activa automáticamente al cumplir requisitos
✅ YouTube coloca ads en tus Shorts
✅ Cobro automático cada mes (>$100)
✅ NO requiere intervención

Proyección:
- Mes 1-3: $0 (construir audiencia)
- Mes 4-6: $200-500/mes
- Mes 7-12: $700-1,500/mes
- Año 2+: $2,000-5,000/mes
```

#### **2. Super Thanks (Semi-automático)**

```
✅ Habilitar en YouTube Studio (una vez)
✅ Botón aparece automáticamente en Shorts
✅ Usuarios dan tips voluntariamente
✅ Cobro automático

Potencial: $50-300/mes canales nicho
```

#### **3. Afiliados YouTube Shopping (Automático vía API)**

```javascript
// Agregar productos afiliados en descripción (automático)

const affiliateLinks = {
    jerseys: 'https://amzn.to/laliga-jerseys',
    fantasy: 'https://fantasy.laliga.com/?ref=fantasypro',
    merch: 'https://shop.laliga.com/?ref=fantasypro'
};

const description = `
${contentDescription}

🛒 PRODUCTOS RECOMENDADOS:
⚽ Jerseys La Liga: ${affiliateLinks.jerseys}
🎮 Fantasy La Liga: ${affiliateLinks.fantasy}
👕 Merchandising: ${affiliateLinks.merch}

📱 Sígueme para más chollos:
Instagram: @laligafantasyspain
TikTok: @laligafantasyspain
`;

// Se agrega automáticamente en cada upload
```

#### **4. Brand Deals (Semi-automático)**

```
Una vez alcances 50K+ subs:
- Plataformas como FameBit/BrandConnect te contactan automáticamente
- Negociación vía email
- Integración de sponsor en Shorts (manual una vez, automático después)

Potencial: $500-2,000 por sponsor mensual
```

---

## 📊 Dashboard de Gestión Automatizada

### **Panel de Control (Frontend)**

```javascript
// Vista en tiempo real de todo el sistema

const YouTubeAutomationDashboard = {
    // Stats en tiempo real (vía API)
    stats: {
        totalVideos: 150,
        totalViews: 5_000_000,
        totalSubs: 25_000,
        monthlyRevenue: 850,
        nextVideo: '2025-10-02 14:00'
    },

    // Últimos uploads automáticos
    recentUploads: [
        {
            date: '2025-10-01',
            type: 'chollo',
            views: 15000,
            status: 'published'
        },
        { date: '2025-09-30', type: 'stats', views: 8000, status: 'published' }
    ],

    // Queue de publicaciones programadas
    scheduledQueue: [
        { date: '2025-10-02 10:00', type: 'stats_impactantes' },
        { date: '2025-10-03 14:00', type: 'chollo_viral' }
    ],

    // Alertas automáticas
    alerts: [
        { type: 'viral', message: 'Video superó 100K views' },
        { type: 'monetization', message: 'Alcanzaste 10M views en 90 días!' }
    ]
};
```

### **Comandos de Gestión**

```bash
# Start automatización
npm run youtube:start-automation

# Generar y publicar ahora (manual override)
npm run youtube:publish-now -- --type=chollo

# Ver stats en tiempo real
npm run youtube:stats

# Pausar automatización (vacaciones)
npm run youtube:pause

# Reanudar
npm run youtube:resume
```

---

## 🔐 Seguridad y Limitaciones

### **Rate Limits YouTube API**

```javascript
// Quota diario: 10,000 puntos

const QUOTA_COSTS = {
    upload: 1600, // Upload video
    update: 50, // Actualizar metadata
    list: 1, // Listar videos
    insert: 50, // Agregar a playlist
    thumbnail: 50 // Upload thumbnail
};

// Uploads diarios permitidos: ~6 (10000 / 1600)
// SUFICIENTE para 5-6 Shorts/semana
```

**Solución si excedes**:

- Request quota increase (aprobado automáticamente >10K subs)
- O usar múltiples canales (no recomendado)

### **Backup y Seguridad**

```javascript
// Backup automático de videos
cron.schedule('0 2 * * 0', async () => {
    // Domingos 2 AM
    const videos = await database.getVideos({ lastNDays: 7 });

    for (const video of videos) {
        // Descargar desde YouTube vía API
        await downloadVideoBackup(video.videoId);

        // Subir a almacenamiento seguro
        await uploadToBackupStorage(video.videoPath);
    }
});
```

---

## ✅ Checklist Automatización Completa

### **Setup Inicial (20 min - una vez)**

```
□ Crear canal YouTube "Fantasy La Liga Pro"
□ Configurar branding (logo, banner)
□ Habilitar YouTube Data API en Google Cloud
□ Obtener OAuth credentials
□ Generar refresh token
□ Agregar a .env
□ Test upload manual para verificar
□ Habilitar monetización cuando cumplas requisitos
```

### **Sistema Automático (0 min diario)**

```
□ CRON job configurado (5-6 Shorts/semana)
□ Generación VEO3 automática
□ Subtítulos karaoke automáticos
□ Overlays de datos automáticos
□ Thumbnail generación automática
□ Upload YouTube vía API automático
□ Playlists organization automática
□ Analytics tracking automático
□ Respuestas comentarios semi-automática
□ A/B testing thumbnails automático
```

---

## 🎯 Resultado Final

### **Tiempo Requerido**

| Fase             | Tiempo Manual                         |
| ---------------- | ------------------------------------- |
| Setup inicial    | 20 minutos (una vez)                  |
| Operación diaria | **0 minutos** (100% automático)       |
| Revisión semanal | 15 minutos (opcional - ver analytics) |

### **Output Esperado**

```
5-6 Shorts/semana automáticos
= 260 Shorts/año
= CERO intervención manual diaria
```

### **ROI Proyectado**

```
Inversión:
- VEO3: $0.90/Short × 260 = $234/año
- API costs: $0 (dentro de free tier)
- Tiempo: 20 min setup + 0 min operación

Retorno (Año 1):
- Ad revenue: $8,000-$18,000
- Super Thanks: $600-$3,600
- Afiliados: $1,200-$6,000
- Total: $9,800-$27,600

ROI: 4,100-11,700% 🚀
```

---

## 🚀 Próximos Pasos

1. **Ejecutar setup OAuth** (20 min)

    ```bash
    node scripts/youtube/setup-oauth.js
    ```

2. **Test primera publicación**

    ```bash
    npm run youtube:publish-now -- --type=chollo --test
    ```

3. **Habilitar CRON automático**

    ```bash
    npm run youtube:enable-automation
    ```

4. **Monitor dashboard**
    ```
    http://localhost:3000/youtube-dashboard
    ```

**TODO automatizado. CERO trabajo manual diario. Sistema funcionando 24/7.**
