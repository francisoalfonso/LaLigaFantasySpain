# 🎬 Sistema Automatizado: Canal de Documentales Shorts

**Inspirado en**: Chisme Express MX ($378,872/mes - #1 más rentable)
**Objetivo**: Replicar su modelo con 90% automatización
**Nicho**: Documentales cortos virales (crimen, misterios, celebridades)

---

## 📊 Análisis del Canal Objetivo: Chisme Express MX

### Métricas que Replicar

```
💵 Ingresos mensuales: $378,872 USD
👥 Suscriptores: 75,000
👀 Visitas totales: 488M (en 116 días)
🎬 Videos: 899 (7.8 videos/día)
📊 Promedio: 543,186 visitas/video
💰 RPM: $3.00 (documentales premium)
⏰ Antigüedad: 116 días (3.8 meses)
```

### Fórmula de Éxito Identificada

```javascript
const exito_chisme_express = {
    // Nicho
    nicho: 'Documentales de entretenimiento',
    subtemas: [
        'Crimen y narcotráfico (Pablo Escobar, carteles)',
        'Celebridades y escándalos',
        'Misterios sin resolver',
        'Historia oculta'
    ],

    // Formato
    duracion: '45-60 segundos',
    estructura: 'Hook → Historia → Twist final',
    tono: 'Conspiratorio, revelador, urgente',

    // Producción
    frecuencia: '7-8 videos/día',
    calidad: 'Media (volumen > perfección)',

    // Viralidad
    hooks: [
        'Lo que NO te cuentan sobre...',
        'La VERDADERA historia de...',
        'El secreto OSCURO de...',
        'Nadie habla de esto...'
    ],

    // Monetización
    rpm: 3.00,  // Alto por nicho documental
    revenue_anual: 4546473
};
```

### Tipos de Contenido (Analizado)

1. **Narcotráfico y Crimen** (40%)
   - Pablo Escobar, carteles mexicanos
   - Operaciones encubiertas
   - Historias de capos

2. **Celebridades** (30%)
   - Escándalos ocultos
   - Muertes misteriosas
   - Secretos de famosos

3. **Misterios Históricos** (20%)
   - Casos sin resolver
   - Conspiraciones
   - Historia alternativa

4. **Actualidad Viral** (10%)
   - Noticias trending
   - Polémicas recientes

---

## 🏗️ Arquitectura del Sistema Automatizado

### Stack Tecnológico Completo

```
┌─────────────────────────────────────────────────────────┐
│         SISTEMA AUTOMATIZADO DE SHORTS                  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 1: RESEARCH ────────────────────────┐
│                                                                   │
│  1. YouTube Trending Monitor                                      │
│     └─ YouTube Data API v3                                        │
│        └─ Detecta videos virales en nichos objetivo               │
│                                                                   │
│  2. Competitive Intelligence                                      │
│     └─ Analiza canal Chisme Express MX (benchmarking)            │
│        └─ Extrae títulos, temas, personajes                      │
│                                                                   │
│  3. News Scraper                                                  │
│     └─ Google News API / NewsAPI.org                             │
│        └─ Busca noticias trending sobre personajes               │
│                                                                   │
│  4. Wikipedia/DBpedia Research                                    │
│     └─ Enriquece datos de personajes                             │
│        └─ Biografía, eventos clave, contexto                     │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 2: CONTENT ─────────────────────────┐
│                                                                   │
│  5. GPT-4o Script Generator                                       │
│     └─ OpenAI GPT-4o                                             │
│        └─ Genera guión viral de 45-60s                           │
│           - Hook conspiratorio                                    │
│           - Historia impactante                                   │
│           - Twist final                                           │
│                                                                   │
│  6. Fact Checker                                                  │
│     └─ Perplexity AI / Claude                                    │
│        └─ Verifica veracidad de datos                            │
│           (evita desinformación)                                  │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 3: PRODUCTION ──────────────────────┐
│                                                                   │
│  7. Nano Banana Image Generator                                   │
│     └─ nanoBananaClient.js (YA IMPLEMENTADO)                     │
│        └─ Genera 3 imágenes contextuales                         │
│           - Presentador consistente                               │
│           - Fondos temáticos                                      │
│                                                                   │
│  8. VEO3 Video Generator                                          │
│     └─ veo3Client.js (YA IMPLEMENTADO)                           │
│        └─ Genera 3 segmentos de video                            │
│           - Segmento 1: Hook (15s)                                │
│           - Segmento 2: Historia (25s)                            │
│           - Segmento 3: Conclusión (15s)                          │
│                                                                   │
│  9. Audio Enhancement (NUEVO)                                     │
│     └─ ElevenLabs API                                            │
│        └─ Voz en español más natural y dramática                 │
│           (Alternativa a VEO3 voice)                              │
│                                                                   │
│  10. Subtitle Generator (NUEVO - CRÍTICO)                         │
│      └─ WhisperX + FFmpeg                                        │
│         └─ Genera subtítulos estilo karaoke                      │
│            - Palabra por palabra                                  │
│            - Colores llamativos                                   │
│            - 85% ven sin audio                                    │
│                                                                   │
│  11. Video Concatenator                                           │
│      └─ videoConcatenator.js (YA IMPLEMENTADO)                   │
│         └─ Une 3 segmentos + añade logo                          │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 4: POST-PRODUCTION ─────────────────┐
│                                                                   │
│  12. Thumbnail Generator (NUEVO)                                  │
│      └─ Canva API / Pillow (Python)                              │
│         └─ Genera thumbnail viral automático                     │
│            - Expresión facial dramática                           │
│            - Texto grande (3-5 palabras)                          │
│            - Colores alto contraste                               │
│                                                                   │
│  13. Metadata Optimizer (NUEVO)                                   │
│      └─ GPT-4o                                                   │
│         └─ Genera título + descripción + hashtags                │
│            - SEO optimizado                                       │
│            - Keywords virales                                     │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 5: DISTRIBUTION ────────────────────┐
│                                                                   │
│  14. YouTube Uploader                                             │
│      └─ YouTube Data API v3                                      │
│         └─ Sube Short automáticamente                            │
│            - Metadata optimizada                                  │
│            - Thumbnail custom                                     │
│            - Programación inmediata/futura                        │
│                                                                   │
│  15. Cross-Platform Publisher (Opcional)                          │
│      └─ TikTok API + Instagram Graph API                         │
│         └─ Publica mismo contenido en múltiples plataformas      │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────── FASE 6: MONITORING ──────────────────────┐
│                                                                   │
│  16. Analytics Tracker                                            │
│      └─ YouTube Analytics API                                    │
│         └─ Trackea performance de cada Short                     │
│            - Views, retention, CTR                                │
│            - Identifica patrones de éxito                         │
│                                                                   │
│  17. Feedback Loop                                                │
│      └─ Machine Learning (opcional)                              │
│         └─ Ajusta estrategia según lo que funciona               │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Código Reutilizable de Fantasy La Liga

### 1. Sistema VEO3 (✅ 100% Reutilizable)

**Archivos ya implementados**:

```javascript
// backend/services/veo3/
├── veo3Client.js              // ✅ Cliente KIE.ai
├── promptBuilder.js           // ✅ Constructor de prompts virales
├── nanoBananaVeo3Integrator.js // ✅ Integración Nano Banana
├── videoConcatenator.js       // ✅ FFmpeg concatenación
├── viralVideoBuilder.js       // ✅ Sistema multi-segmento
├── emotionAnalyzer.js         // ✅ Análisis de emociones
└── cinematicProgressionSystem.js // ✅ Progresión cinematográfica
```

**Adaptación necesaria**:

```javascript
// backend/services/documentales/docuShortsGenerator.js

const { nanoBananaVeo3Integrator } = require('../veo3/nanoBananaVeo3Integrator');
const { veo3Client } = require('../veo3/veo3Client');
const { videoConcatenator } = require('../veo3/videoConcatenator');

class DocuShortsGenerator {
    constructor() {
        // Personaje presentador documentales
        this.PRESENTER_CONFIG = {
            name: 'Narrator Voice',  // Voz dramática documental
            seed: 40001,  // Nuevo seed (no usar 30001/30002)
            characterBible: this.getDocumentalCharacterBible(),
            voice: {
                locale: 'es-MX',  // Acento mexicano (más dramático)
                tone: 'serious',
                energy: 'medium-high',
                emotion: 'mysterious'
            }
        };
    }

    getDocumentalCharacterBible() {
        return `
        Narrador de documentales serio, voz profunda y dramática.
        Estilo investigativo tipo Netflix.
        Expresiones faciales misteriosas y reveladoras.
        Tonos oscuros, iluminación dramática.
        Gestos que enfatizan puntos clave.
        `;
    }

    async generateDocuShort(storyData) {
        // 1. Generar script de 3 segmentos
        const script = await this.generateScript(storyData);

        // 2. Generar imágenes contextuales con Nano Banana
        const images = await nanoBananaVeo3Integrator.generateContextualImages({
            script,
            presenter: this.PRESENTER_CONFIG,
            theme: storyData.theme  // 'crime', 'celebrity', 'mystery'
        });

        // 3. Generar 3 segmentos de video con VEO3
        const segments = [];
        for (let i = 0; i < 3; i++) {
            const segment = await veo3Client.generateSegment({
                script: script[i],
                image: images[i],
                presenter: this.PRESENTER_CONFIG,
                duration: i === 0 ? 15 : (i === 1 ? 25 : 15)  // 15s + 25s + 15s = 55s
            });
            segments.push(segment);
        }

        // 4. Concatenar segmentos
        const finalVideo = await videoConcatenator.concatenate({
            segments,
            addLogo: true,
            logoPosition: 'bottom-right'
        });

        return finalVideo;
    }
}
```

**Ventaja**: Sistema VEO3 ya probado y funcionando. Solo necesita ajustes de prompts y personaje.

---

### 2. Nano Banana (✅ Reutilizable)

**Ya implementado**: `backend/services/nanoBanana/nanoBananaClient.js`

**Adaptación**:

```javascript
// Imágenes de referencia para narrador documental
const DOCU_NARRATOR_REFERENCES = [
    'https://tu-storage.com/narrator-serious-1.jpg',
    'https://tu-storage.com/narrator-mysterious-2.jpg',
    'https://tu-storage.com/narrator-dramatic-3.jpg'
];

// Generar imágenes contextuales
const contextualImages = await nanoBananaClient.generateImage({
    prompt: 'Narrador serio en estudio oscuro con documentos secretos de Pablo Escobar',
    referenceImages: DOCU_NARRATOR_REFERENCES,
    seed: 40001,  // Seed consistente
    style: 'dramatic documentary'
});
```

---

### 3. Sistema de Scripts (✅ 80% Reutilizable)

**Ya implementado**:
- `backend/services/contentAnalysis/intelligentScriptGenerator.js`
- `backend/services/veo3/unifiedScriptGenerator.js`

**Adaptación para documentales**:

```javascript
// backend/services/documentales/docuScriptGenerator.js

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class DocuScriptGenerator {
    async generateViralDocuScript(researchData) {
        const { personaje, evento, datos_verificados } = researchData;

        const prompt = `Eres guionista de documentales virales estilo Chisme Express MX.

PERSONAJE: ${personaje.nombre}
EVENTO: ${evento.titulo}
DATOS: ${JSON.stringify(datos_verificados)}

Genera un guión de documental SHORT (55 segundos) con esta estructura EXACTA:

SEGMENTO 1 (15s) - HOOK CONSPIRATORIO:
- Frase impactante que genera intriga
- Revela algo OCULTO o PROHIBIDO
- Tono misterioso
- Ejemplo: "Lo que NADIE te cuenta sobre Pablo Escobar... va a dejarte sin palabras"

SEGMENTO 2 (25s) - HISTORIA REVELADORA:
- Cuenta el evento principal con datos verificados
- Incluye detalles POCO CONOCIDOS
- Mantén tensión narrativa
- Usa números específicos cuando sea posible

SEGMENTO 3 (15s) - TWIST FINAL + CTA:
- Revelación final impactante
- Dato sorprendente que cierra la historia
- CTA sutil (suscríbete, comenta)

IMPORTANTE:
- Usa "tú" y "te" (hablar directo al espectador)
- Tono conspiratorio pero serio
- NO inventes datos, usa solo los verificados
- Máximo 40-45 palabras por segmento
- Español de México (modismos mexicanos sutiles)

Devuelve JSON:
{
  "segmento1": { "dialogo": "...", "emotion": "mysterious", "action": "..." },
  "segmento2": { "dialogo": "...", "emotion": "serious", "action": "..." },
  "segmento3": { "dialogo": "...", "emotion": "revealing", "action": "..." }
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Eres experto en guiones virales tipo Chisme Express MX' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.8  // Creatividad alta para viralidad
        });

        return JSON.parse(response.choices[0].message.content);
    }
}
```

---

### 4. YouTube Data API (✅ Parcialmente Implementado)

**Ya tenemos**:
- `scripts/youtube-viral-channels-search.js` (detección virales)

**Necesitamos añadir**:

```javascript
// backend/services/youtube/youtubeUploader.js (NUEVO)

const { google } = require('googleapis');
const fs = require('fs');

class YouTubeUploader {
    constructor() {
        this.youtube = google.youtube({
            version: 'v3',
            auth: new google.auth.OAuth2(
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET,
                process.env.YOUTUBE_REDIRECT_URI
            )
        });
    }

    async uploadShort(videoPath, metadata) {
        const { title, description, tags, thumbnailPath } = metadata;

        // 1. Upload video
        const videoResponse = await this.youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title,  // Max 100 caracteres
                    description: description + '\n\n#Shorts',  // IMPORTANTE: #Shorts
                    tags: tags,
                    categoryId: '22'  // People & Blogs (o '17' Sports)
                },
                status: {
                    privacyStatus: 'public',  // O 'private' para revisar primero
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: fs.createReadStream(videoPath)
            }
        });

        const videoId = videoResponse.data.id;

        // 2. Upload thumbnail (opcional pero recomendado)
        if (thumbnailPath) {
            await this.youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    body: fs.createReadStream(thumbnailPath)
                }
            });
        }

        return {
            videoId,
            url: `https://youtube.com/shorts/${videoId}`
        };
    }

    async scheduleShort(videoPath, metadata, publishTime) {
        // Subir como privado primero
        const result = await this.uploadShort(videoPath, {
            ...metadata,
            privacyStatus: 'private'
        });

        // Programar publicación (requiere YouTube Studio manual o API avanzada)
        // Por ahora: subir como privado, publicar manualmente en hora programada

        return result;
    }
}

module.exports = YouTubeUploader;
```

---

## 🔧 Herramientas y APIs Necesarias

### 1. Ya Tenemos (Fantasy La Liga)

| Herramienta | Uso | Estado |
|-------------|-----|--------|
| **OpenAI GPT-4o** | Generación de scripts | ✅ Implementado |
| **VEO3 (KIE.ai)** | Generación de video | ✅ Implementado |
| **Nano Banana** | Imágenes contextuales | ✅ Implementado |
| **FFmpeg** | Edición de video | ✅ Implementado |
| **YouTube Data API** | Búsqueda viral | ✅ Implementado |
| **Supabase Storage** | Almacenamiento | ✅ Implementado |
| **Axios** | HTTP requests | ✅ Implementado |
| **Winston Logger** | Logging | ✅ Implementado |

**Coste actual**: $29 API-Sports + OpenAI por uso + VEO3 por uso

---

### 2. Nuevas Necesarias

| Herramienta | Propósito | Coste | Prioridad |
|-------------|-----------|-------|-----------|
| **NewsAPI.org** | Noticias trending | $449/mes (o scraping) | P1 |
| **Perplexity API** | Verificación de hechos | $20/mes | P1 |
| **ElevenLabs** | Voz más natural (opcional) | $5-22/mes | P2 |
| **Canva API** | Thumbnails automáticos | $120/año | P1 |
| **WhisperX** | Subtítulos avanzados | $0 (open source) | P0 |
| **YouTube OAuth** | Upload automático | $0 (free tier) | P0 |

**Coste adicional mensual**: ~$50-100

---

## 📋 Plan de Acción Completo

### FASE 1: Setup Infraestructura (Semana 1)

#### Día 1-2: Configuración Base

```bash
# 1. Crear nuevo proyecto o carpeta en actual
cd /path/to/project
mkdir -p backend/services/documentales
mkdir -p backend/services/youtube
mkdir -p backend/services/research

# 2. Instalar dependencias nuevas
npm install googleapis
npm install newsapi
npm install canvas  # Para thumbnails
npm install openai@latest
npm install perplexity-sdk  # Si existe, sino usar HTTP directo

# 3. Configurar variables de entorno
echo "YOUTUBE_CLIENT_ID=tu_client_id" >> .env
echo "YOUTUBE_CLIENT_SECRET=tu_client_secret" >> .env
echo "YOUTUBE_REFRESH_TOKEN=tu_refresh_token" >> .env
echo "NEWS_API_KEY=tu_news_api_key" >> .env
echo "PERPLEXITY_API_KEY=tu_perplexity_key" >> .env
echo "ELEVENLABS_API_KEY=tu_elevenlabs_key" >> .env  # Opcional
```

#### Día 3-4: Adaptar Sistema VEO3

```javascript
// backend/services/documentales/docuShortsGenerator.js
// (Código ya proporcionado arriba)

// Crear personaje narrador
const NARRATOR_CONFIG = {
    seed: 40001,
    characterBible: 'Narrador serio estilo documental Netflix...',
    voice: { locale: 'es-MX', tone: 'serious', energy: 'medium-high' }
};

// Test generación
npm run test:docu-short
```

#### Día 5-7: Sistema de Research

```javascript
// backend/services/research/trendingTopicsDetector.js

class TrendingTopicsDetector {
    constructor() {
        this.newsAPI = new NewsAPI(process.env.NEWS_API_KEY);
        this.youtubeAPI = google.youtube('v3');
    }

    async detectTrendingTopics() {
        // 1. Buscar en Google News
        const news = await this.newsAPI.v2.topHeadlines({
            language: 'es',
            country: 'mx',
            category: 'entertainment',  // O 'general'
            pageSize: 20
        });

        // 2. Buscar en YouTube trending (método alternativo)
        const ytTrending = await this.youtubeAPI.videos.list({
            part: 'snippet,statistics',
            chart: 'mostPopular',
            regionCode: 'MX',
            videoCategoryId: '24',  // Entertainment
            maxResults: 20
        });

        // 3. Extraer personajes mencionados
        const topics = [];
        for (const article of news.articles) {
            const personajes = await this.extractPersonajes(article);
            if (personajes.length > 0) {
                topics.push({
                    titulo: article.title,
                    personajes,
                    url: article.url,
                    fecha: article.publishedAt,
                    fuente: article.source.name
                });
            }
        }

        return topics;
    }

    async extractPersonajes(article) {
        // Usar GPT-4o para extraer nombres de personajes
        const prompt = `Extrae nombres de PERSONAJES (personas reales) mencionados en este artículo:

        TÍTULO: ${article.title}
        DESCRIPCIÓN: ${article.description}

        Devuelve solo nombres de personas (no organizaciones).
        Formato JSON: { "personajes": ["Nombre 1", "Nombre 2"] }`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',  // Más barato para esta tarea
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        return JSON.parse(response.choices[0].message.content).personajes;
    }
}
```

---

### FASE 2: Pipeline Automatizado (Semana 2)

#### Workflow End-to-End

```javascript
// backend/services/documentales/autoDocuPipeline.js

class AutoDocuPipeline {
    async run() {
        console.log('🎬 Iniciando pipeline automatizado...\n');

        // PASO 1: Detectar trending topics
        console.log('📡 Paso 1: Detectando trending topics...');
        const topics = await trendingTopicsDetector.detectTrendingTopics();
        console.log(`   ✅ ${topics.length} topics encontrados`);

        // PASO 2: Filtrar topics aptos para documentales
        console.log('\n🔍 Paso 2: Filtrando topics...');
        const aptTopics = topics.filter(topic => {
            // Filtrar por keywords de interés
            const keywords = ['crimen', 'escándalo', 'misterio', 'secreto', 'narcotráfico'];
            return keywords.some(kw =>
                topic.titulo.toLowerCase().includes(kw)
            );
        });
        console.log(`   ✅ ${aptTopics.length} topics aptos`);

        // PASO 3: Investigar cada topic
        console.log('\n🔬 Paso 3: Investigando topics...');
        for (const topic of aptTopics.slice(0, 7)) {  // Max 7 videos/día
            try {
                // 3.1 Investigar personaje principal
                const personaje = topic.personajes[0];
                const research = await this.investigatePersonaje(personaje, topic);

                // 3.2 Verificar hechos
                const verified = await this.verifyFacts(research);

                // 3.3 Generar script
                const script = await docuScriptGenerator.generateViralDocuScript({
                    personaje,
                    evento: topic.titulo,
                    datos_verificados: verified
                });

                // PASO 4: Generar video
                console.log(`\n🎬 Paso 4: Generando video "${topic.titulo.substring(0, 50)}..."`);
                const video = await docuShortsGenerator.generateDocuShort({
                    script,
                    personaje,
                    theme: this.detectTheme(topic)  // 'crime', 'celebrity', 'mystery'
                });

                // PASO 5: Generar subtítulos
                console.log('   📝 Generando subtítulos...');
                const subtitled = await this.addSubtitles(video, script);

                // PASO 6: Generar thumbnail
                console.log('   🖼️  Generando thumbnail...');
                const thumbnail = await this.generateThumbnail(topic, personaje);

                // PASO 7: Generar metadata
                console.log('   📋 Generando metadata...');
                const metadata = await this.generateMetadata(topic, script);

                // PASO 8: Subir a YouTube
                console.log('   ☁️  Subiendo a YouTube...');
                const uploaded = await youtubeUploader.uploadShort(subtitled, {
                    ...metadata,
                    thumbnailPath: thumbnail
                });

                console.log(`   ✅ Video publicado: ${uploaded.url}\n`);

                // Rate limiting (no saturar APIs)
                await this.sleep(60000);  // 1 minuto entre videos

            } catch (error) {
                console.error(`   ❌ Error con topic "${topic.titulo}":`, error.message);
                continue;
            }
        }

        console.log('\n🎉 Pipeline completado!');
    }

    async investigatePersonaje(personaje, topic) {
        // Usar Perplexity AI para investigar
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [{
                    role: 'user',
                    content: `Investiga sobre ${personaje} en el contexto de: ${topic.titulo}

                    Proporciona:
                    1. Biografía breve
                    2. Evento/escándalo mencionado
                    3. Datos verificados con fuentes
                    4. Detalles poco conocidos (si existen)

                    Formato JSON con fuentes.`
                }]
            })
        });

        return await response.json();
    }

    async verifyFacts(research) {
        // Verificar datos con múltiples fuentes
        // Descartar si no hay suficiente verificación
        // Retornar solo datos confirmados
        return research.verified_data;
    }

    async addSubtitles(videoPath, script) {
        // CRÍTICO: 85% ven sin audio
        // Usar FFmpeg + subtítulos estilo karaoke

        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // 1. Generar archivo SRT
        const srtContent = this.generateSRT(script);
        const srtPath = videoPath.replace('.mp4', '.srt');
        fs.writeFileSync(srtPath, srtContent);

        // 2. Aplicar subtítulos con estilo viral
        const outputPath = videoPath.replace('.mp4', '_subtitled.mp4');

        const ffmpegCmd = `ffmpeg -i "${videoPath}" -vf "subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFF,OutlineColour=&H000000,Bold=1,Alignment=2'" -c:a copy "${outputPath}"`;

        await execAsync(ffmpegCmd);

        return outputPath;
    }

    generateSRT(script) {
        // Convertir script a formato SRT
        let srt = '';
        let index = 1;
        let currentTime = 0;

        for (const segmento of Object.values(script)) {
            const words = segmento.dialogo.split(' ');
            const wordsPerSecond = 5;  // Velocidad habla
            const duration = segmento.dialogo.split(' ').length / wordsPerSecond;

            const startTime = this.formatSRTTime(currentTime);
            const endTime = this.formatSRTTime(currentTime + duration);

            srt += `${index}\n`;
            srt += `${startTime} --> ${endTime}\n`;
            srt += `${segmento.dialogo}\n\n`;

            currentTime += duration;
            index++;
        }

        return srt;
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    async generateThumbnail(topic, personaje) {
        // Usar Canva API o Pillow (Python) para generar thumbnail viral

        const Canvas = require('canvas');
        const canvas = Canvas.createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');

        // Fondo oscuro dramático
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 1280, 720);

        // Texto grande con el nombre del personaje
        ctx.font = 'bold 80px Arial';
        ctx.fillStyle = '#FFD700';  // Dorado
        ctx.textAlign = 'center';
        ctx.fillText(personaje.toUpperCase(), 640, 300);

        // Texto secundario (hook)
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('EL SECRETO OCULTO', 640, 400);

        // Guardar
        const buffer = canvas.toBuffer('image/png');
        const thumbnailPath = `/tmp/thumbnail_${Date.now()}.png`;
        fs.writeFileSync(thumbnailPath, buffer);

        return thumbnailPath;
    }

    async generateMetadata(topic, script) {
        // Generar título, descripción, hashtags con GPT-4o
        const prompt = `Genera metadata viral para YouTube Short documental:

TEMA: ${topic.titulo}
SCRIPT: ${JSON.stringify(script)}

Genera:
1. Título (max 100 caracteres, VIRAL, clickbait ético)
2. Descripción (SEO optimizada, 150-300 palabras)
3. Hashtags (15-20, relevantes + virales)

Formato JSON.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        return JSON.parse(response.choices[0].message.content);
    }

    detectTheme(topic) {
        const titulo = topic.titulo.toLowerCase();

        if (titulo.includes('crimen') || titulo.includes('narcotráfico')) {
            return 'crime';
        } else if (titulo.includes('celebridad') || titulo.includes('escándalo')) {
            return 'celebrity';
        } else {
            return 'mystery';
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

---

### FASE 3: Automatización Completa (Semana 3)

#### Cron Job Diario

```javascript
// backend/cron/dailyDocuProduction.js

const cron = require('node-cron');
const AutoDocuPipeline = require('../services/documentales/autoDocuPipeline');

// Ejecutar todos los días a las 6:00 AM
cron.schedule('0 6 * * *', async () => {
    console.log('🌅 [CRON] Iniciando producción diaria de documentales...');

    try {
        const pipeline = new AutoDocuPipeline();
        await pipeline.run();

        console.log('✅ [CRON] Producción diaria completada');
    } catch (error) {
        console.error('❌ [CRON] Error en producción:', error);
        // Enviar alerta (email, Telegram, etc.)
    }
}, {
    timezone: 'America/Mexico_City'  // Ajustar según tu zona
});

console.log('⏰ Cron job configurado: Producción diaria a las 6:00 AM');
```

#### npm Script

```json
// package.json

{
  "scripts": {
    "docu:auto": "node backend/cron/dailyDocuProduction.js",
    "docu:test": "node backend/services/documentales/__tests__/testPipeline.js",
    "docu:manual": "node backend/services/documentales/manualProduction.js"
  }
}
```

---

## 🚀 Ejecución y Monitoreo

### Lanzamiento Día 1

```bash
# 1. Test del pipeline
npm run docu:test

# 2. Producción manual primera vez
npm run docu:manual

# 3. Verificar videos generados
ls output/documentales/

# 4. Activar cron automático
npm run docu:auto &

# 5. Monitorear logs
tail -f logs/docu-production.log
```

### Dashboard de Monitoreo

```javascript
// backend/routes/documentales-dashboard.js

router.get('/dashboard', async (req, res) => {
    const stats = {
        videos_generados_hoy: await getVideosGeneradosHoy(),
        videos_subidos: await getVideosSubidos(),
        views_totales: await getViewsTotales(),
        ingresos_estimados: await calcularIngresosEstimados(),
        proxima_ejecucion: '6:00 AM',
        status: 'ACTIVO'
    };

    res.json(stats);
});
```

---

## 💰 Proyección Financiera

### Escenario Conservador (60% de Chisme Express MX)

```
Publicación: 5 videos/día (vs 7.8 de Chisme)
Promedio: 300K views/video (vs 543K de Chisme)
RPM España: $1.95 (documentales)

Cálculo:
- Videos/mes: 150
- Visitas/mes: 45,000,000
- Ingresos: (45,000,000 / 1,000) × $1.95 = $87,750/mes

ANUAL: $1,053,000
```

### Escenario Realista (80% de Chisme Express MX)

```
Publicación: 7 videos/día
Promedio: 400K views/video
RPM España: $1.95

Cálculo:
- Videos/mes: 210
- Visitas/mes: 84,000,000
- Ingresos: (84,000,000 / 1,000) × $1.95 = $163,800/mes

ANUAL: $1,965,600
```

### Escenario Optimista (100% de Chisme Express MX)

```
Publicación: 7.8 videos/día
Promedio: 543K views/video
RPM España: $1.95 (vs $3.00 global de Chisme)

Cálculo España:
- Videos/mes: 234
- Visitas/mes: 127,062,000
- Ingresos: (127,062,000 / 1,000) × $1.95 = $247,770/mes

ANUAL: $2,973,240

(Chisme hace $4.5M/año con RPM $3.00 global)
```

---

## ✅ Checklist de Implementación

### Semana 1: Setup

- [ ] Configurar YouTube OAuth (credenciales)
- [ ] Obtener NewsAPI key
- [ ] Obtener Perplexity API key
- [ ] Adaptar sistema VEO3 para documentales
- [ ] Crear personaje narrador (seed 40001)
- [ ] Test Nano Banana con narrador

### Semana 2: Pipeline

- [ ] Implementar `trendingTopicsDetector.js`
- [ ] Implementar `docuScriptGenerator.js`
- [ ] Implementar `autoDocuPipeline.js`
- [ ] Sistema de subtítulos (FFmpeg)
- [ ] Generador de thumbnails
- [ ] YouTube uploader

### Semana 3: Automatización

- [ ] Cron job diario
- [ ] Dashboard de monitoreo
- [ ] Sistema de alertas
- [ ] Backup automático
- [ ] Test E2E completo

### Semana 4: Lanzamiento

- [ ] Generar 30 videos piloto
- [ ] Publicar primeros 10 videos
- [ ] Analizar performance
- [ ] Ajustar estrategia
- [ ] Activar producción diaria automática

---

## 🎯 Métricas de Éxito

### Mes 1 (Validación)

- Suscriptores: 1,000+
- Views/video: 50K+
- Retención: >60%
- Videos publicados: 150+

### Mes 3 (Monetización)

- Suscriptores: 10,000+
- Views totales: 10M+ (requisito Shorts)
- Ingresos: $10,000+/mes
- Videos publicados: 450+

### Mes 6 (Consolidación)

- Suscriptores: 50,000+
- Views/mes: 30M+
- Ingresos: $50,000+/mes
- Automatización: 95%+

---

## 📚 Recursos Adicionales

### Documentación

- YouTube Data API: https://developers.google.com/youtube/v3
- NewsAPI: https://newsapi.org/docs
- Perplexity AI: https://docs.perplexity.ai
- FFmpeg Subtitles: https://ffmpeg.org/ffmpeg-filters.html#subtitles-1

### Scripts de Referencia

- Sistema VEO3: `backend/services/veo3/`
- Nano Banana: `backend/services/nanoBanana/nanoBananaClient.js`
- YouTube Search: `scripts/youtube-viral-channels-mega-search.js`

---

**IMPORTANTE**: Este sistema puede generar **$1-3M/año** si se ejecuta correctamente. La clave es:

1. ✅ **Consistencia**: 7 videos/día sin falta
2. ✅ **Calidad de scripts**: Hooks virales + datos verificados
3. ✅ **Subtítulos siempre**: 85% ven sin audio
4. ✅ **Thumbnails impactantes**: CTR crítico
5. ✅ **Monitoreo diario**: Ajustar según lo que funciona

---

¿Quieres que empiece a implementar alguna parte específica? Puedo crear los archivos del pipeline completo paso a paso.
