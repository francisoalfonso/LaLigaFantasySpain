# YouTube Metadata Completa - Checklist de Optimización

Este documento detalla **TODOS** los datos que enviamos a YouTube para maximizar el posicionamiento SEO y la viralidad de los Shorts.

---

## ✅ Datos que SÍ Enviamos (Via API)

### 📝 snippet (Información básica del video)

```javascript
snippet: {
  // ✅ Título optimizado con keywords
  title: "CHOLLO D. Blind €4.54M - Ratio 1.74x | Fantasy La Liga #Shorts",

  // ✅ Descripción estructurada con emojis y hashtags
  description: "🔥 CHOLLO BRUTAL: D. Blind (Girona)...\n\n#FantasyLaLiga #Chollo...",

  // ✅ Tags para discoverability (máx 500 caracteres)
  tags: ["fantasy la liga", "chollo fantasy", "d blind", ...],

  // ✅ Categoría de contenido
  categoryId: "17",  // Sports (mejor que Entertainment para nuestro nicho)

  // ✅ NUEVO: Idioma del título/descripción (mejora SEO)
  defaultLanguage: "es",

  // ✅ NUEVO: Idioma del audio (ayuda a YouTube a entender el contenido)
  defaultAudioLanguage: "es-ES"
}
```

### 🔒 status (Configuración de publicación)

```javascript
status: {
  // ✅ Privacidad del video
  privacyStatus: "private",  // "public", "unlisted", "private"

  // ✅ Fecha de publicación programada
  publishAt: "2027-01-01T19:00:00Z",

  // ✅ Declaración de contenido infantil (obligatorio)
  selfDeclaredMadeForKids: false,

  // ✅ NUEVO: Licencia del video (afecta monetización)
  license: "youtube",  // "youtube" o "creativeCommon"

  // ✅ NUEVO: Permitir embeds en otros sitios (más alcance)
  embeddable: true,

  // ✅ NUEVO: Mostrar contador de visualizaciones públicamente
  publicStatsViewable: true
}
```

---

## ⚠️ Datos que NO Enviamos (Limitaciones de API)

### ❌ Thumbnail Personalizado (CRÍTICO para CTR)
**Por qué es importante**: 80% del CTR depende del thumbnail

**Limitación**: YouTube Data API v3 NO permite subir thumbnail durante `videos.insert`

**Solución**:
```javascript
// Requiere llamada separada DESPUÉS del upload
youtube.thumbnails.set({
  videoId: '1eHi6Yza7zE',
  media: {
    body: fs.createReadStream('thumbnail-dblind.jpg') // 1280x720px
  }
});
```

**Implementación futura**: Crear servicio `ThumbnailGenerator` que:
1. Tome primer frame del video (cara de Ana)
2. Agregue texto grande: "€4.54M CHOLLO"
3. Agregue logo del equipo (Girona)
4. Suba automáticamente después del upload

### ❌ Playlist Assignment
**Por qué es importante**: Mejora watch time y discoverability

**Limitación**: Requiere llamada separada a `playlistItems.insert`

**Solución**:
```javascript
youtube.playlistItems.insert({
  part: 'snippet',
  resource: {
    snippet: {
      playlistId: 'PLxxx...',  // ID de playlist "Chollos Fantasy 2025-26"
      resourceId: {
        kind: 'youtube#video',
        videoId: '1eHi6Yza7zE'
      }
    }
  }
});
```

### ❌ End Screens (Pantallas finales)
**Por qué es importante**: Retiene audiencia y promueve suscripciones

**Limitación**: NO soportado por YouTube Data API v3

**Solución**: Configurar manualmente en YouTube Studio

**Configuración recomendada**:
- Segundos 18-24: Botón de suscripción + video recomendado

### ❌ Cards (Tarjetas interactivas)
**Por qué es importante**: Promociona otros videos durante la reproducción

**Limitación**: NO soportado por YouTube Data API v3

**Solución**: Configurar manualmente en YouTube Studio

**Uso recomendado**:
- Segundo 10: Card "¿Buscas más chollos?" → Playlist chollos

### ❌ Localizations (Traducciones a otros idiomas)
**Por qué podría ser útil**: Alcance internacional

**Limitación**: Soportado por API pero no prioritario para España

**Decisión**: No implementar ahora (nicho español)

---

## 📊 Comparativa: Actual vs Óptimo

| Campo | Actual | Óptimo | Impacto |
|-------|--------|--------|---------|
| **Título** | ✅ Optimizado | ✅ | ⭐⭐⭐ |
| **Descripción** | ✅ Estructurada | ✅ | ⭐⭐⭐ |
| **Tags** | ✅ 9 tags | ⚠️ 30-40 tags | ⭐⭐ |
| **Category** | ⚠️ Entertainment | ✅ Sports | ⭐ |
| **Language** | ❌ No | ✅ es-ES | ⭐⭐ |
| **License** | ❌ No | ✅ youtube | ⭐ |
| **Embeddable** | ❌ No | ✅ true | ⭐ |
| **Public Stats** | ❌ No | ✅ true | ⭐ |
| **Thumbnail** | ❌ Auto | ❌ Custom | ⭐⭐⭐ |
| **Playlist** | ❌ No | ❌ Manual | ⭐⭐ |
| **End Screens** | ❌ No | ❌ Manual | ⭐⭐ |

### Leyenda
- ✅ = Implementado
- ⚠️ = Puede mejorar
- ❌ = No implementado
- ⭐⭐⭐ = Crítico para viralidad
- ⭐⭐ = Importante
- ⭐ = Moderado

---

## 🚀 Prioridades de Implementación

### Fase 1: Completado ✅
- [x] Título optimizado con keywords
- [x] Descripción estructurada
- [x] Tags básicos
- [x] Idiomas (defaultLanguage, defaultAudioLanguage)
- [x] Configuraciones de alcance (license, embeddable, publicStatsViewable)

### Fase 2: En Progreso ⏳
- [ ] Ampliar tags a 30-40 (usar `youtube-tags.js`)
- [ ] Cambiar category a "17" (Sports)
- [ ] Generar thumbnails personalizados automáticamente

### Fase 3: Futuro 📅
- [ ] Implementar `youtube.thumbnails.set()` después del upload
- [ ] Crear playlists y asignar videos automáticamente
- [ ] Configurar end screens template en YouTube Studio
- [ ] Aumentar bitrate a 5 Mbps para mejor calidad

---

## 🎯 Impacto Esperado

### Con Implementación Actual (Fase 1)
- **SEO**: 70/100 (bueno)
- **Discoverability**: 60/100 (mejorable)
- **CTR**: 40/100 (bajo sin thumbnail custom)
- **Retención**: 70/100 (video corto ayuda)

### Con Implementación Completa (Fase 1 + 2 + 3)
- **SEO**: 95/100 (excelente)
- **Discoverability**: 90/100 (muy bueno)
- **CTR**: 85/100 (excelente con thumbnail custom)
- **Retención**: 90/100 (end screens mejoran watch time)

---

## 📝 Checklist para Cada Video

### Antes de Publicar ✅
- [x] Título con keywords principales
- [x] Descripción con estructura emocional
- [x] 30-40 tags (usar `youtube-tags.js`)
- [x] Category correcta (Sports = 17)
- [x] Idiomas configurados (es-ES)
- [x] Configuraciones de alcance activadas

### Después de Publicar ⏰
- [ ] Subir thumbnail personalizado (dentro de 2 horas)
- [ ] Asignar a playlist relevante
- [ ] Configurar end screen (si aún no hay template)
- [ ] Compartir en redes sociales
- [ ] Monitorear primeras 24h de analytics

---

## 💡 Tips de Optimización

### Para Maximizar Viralidad
1. **Título**: Incluir números específicos (€4.54M, 1.74x)
2. **Thumbnail**: Cara de Ana + texto grande + colores llamativos
3. **Primeros 3 segundos**: Hook potente (YouTube mide retención)
4. **Hashtags**: Solo 3-5 hashtags (primeros 3 son visibles)
5. **Publicación**: Jueves-Domingo 18:00-22:00 CET (mayor actividad)

### Para Mejorar SEO
1. **Keywords**: Repetir naturalmente en título + descripción
2. **Tags long-tail**: "como jugar fantasy la liga", "estrategia fantasy"
3. **Descripción**: Incluir timestamps si el video tiene >15s
4. **Subtítulos**: YouTube lee subtítulos para SEO (VEO3 ya los genera)

---

**Última actualización**: 13 Oct 2025
**Versión**: 1.0.0
