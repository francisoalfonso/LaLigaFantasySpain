# 📦 GUÍA DE MIGRACIÓN FANTASY VEO3 LAB

## 🎯 DOCUMENTO MAESTRO PARA INTEGRACIÓN

Esta guía contiene **TODO lo necesario** para migrar Fantasy VEO3 Lab al proyecto principal Fantasy La Liga sin errores y sin dudas.

---

## 📋 CHECKLIST DE MIGRACIÓN

### ✅ **PASO 1: VERIFICACIÓN PRE-MIGRACIÓN**
- [ ] Fantasy La Liga principal ejecutándose en `localhost:3000`
- [ ] KIE.ai API Key válida configurada
- [ ] FFmpeg instalado en sistema
- [ ] Node.js v18+ disponible
- [ ] Espacio disco: mínimo 2GB libre

### ✅ **PASO 2: ARCHIVOS CORE A MIGRAR**

#### **Archivos Críticos (OBLIGATORIOS)**
```
📁 COPIAR AL PROYECTO PRINCIPAL:

src/veo3-client/
├── api-client.js                    # Cliente VEO3 optimizado
├── character-consistency.js         # Sistema consistencia Ana
└── post-processing.js              # FFmpeg automation

config/
├── ana-character.js                # Ana Character Bible
├── emotional-arcs.js               # Arcos emocionales
└── veo3-settings.js                # Configuración VEO3

scripts/
├── generate-ana-video.js           # Generación Ana Real
├── concatenate-videos.js           # Sistema concatenación
├── add-player-cards.js             # Player cards overlay
└── monitor-generation.js           # Monitoreo estado

docs/integration/
├── INSTRUCCIONES-GPT5-VEO3.md      # Guía GPT-5 agente
├── INSTRUCCIONES-AUDIO-DRAMATICO-VEO3.md  # Control emocional
└── API-REFERENCE-VEO3.md           # Referencia técnica
```

#### **Environment Variables (.env)**
```bash
# Añadir al .env principal
KIE_AI_API_KEY=tu_api_key_aqui
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_MAX_DURATION=8
VEO3_DEFAULT_ASPECT=9:16
VEO3_WATERMARK=Fantasy La Liga Pro

# Ana Real Configuration
ANA_IMAGE_URL=https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
ANA_CHARACTER_SEED=30001
```

### ✅ **PASO 3: DEPENDENCIAS NPM**

#### **Añadir a package.json principal**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2"
  },
  "scripts": {
    "generate-ana-video": "node scripts/generate-ana-video.js",
    "add-player-card": "node scripts/add-player-cards.js",
    "concatenate-videos": "node scripts/concatenate-videos.js",
    "monitor-veo3": "node scripts/monitor-generation.js"
  }
}
```

### ✅ **PASO 4: INTEGRACIÓN API ROUTES**

#### **Nuevas rutas a añadir**
```javascript
// routes/api/veo3.js
app.post('/api/veo3/generate-ana', generateAnaVideo);
app.post('/api/veo3/add-player-card', addPlayerCard);
app.post('/api/veo3/concatenate', concatenateVideos);
app.get('/api/veo3/status/:taskId', getVideoStatus);
app.get('/api/veo3/cost-analysis', getCostAnalysis);
```

---

## 📁 ESTRUCTURA DE ARCHIVOS DE MIGRACIÓN

### **docs/migration/** - Documentos de proceso
- `GUIA-MIGRACION-FANTASY-VEO3.md` (este archivo)
- `CHECKLIST-INTEGRACION.md` - Checklist detallado paso a paso
- `VALIDATION-TESTS.md` - Tests de validación post-migración

### **docs/integration/** - Documentación técnica
- `INSTRUCCIONES-GPT5-VEO3.md` - Instrucciones completas GPT-5
- `INSTRUCCIONES-AUDIO-DRAMATICO-VEO3.md` - Control emocional avanzado
- `API-REFERENCE-VEO3.md` - Referencia API completa

### **docs/reference/** - Referencias y ejemplos
- `PROMPT-TEMPLATES.md` - Templates de prompts VEO3
- `EJEMPLOS-SCRIPTS.md` - Scripts de ejemplo listos
- `TROUBLESHOOTING.md` - Solución problemas comunes

---

## 🚀 PROCESO DE INTEGRACIÓN RÁPIDA

### **Comando de Migración Automática**
```bash
# En el proyecto Fantasy La Liga principal

# 1. Clonar Fantasy VEO3 Lab
git clone [repo-fantasy-veo3-lab] ./temp-veo3-lab

# 2. Ejecutar script de migración
node ./temp-veo3-lab/scripts/migrate-to-main.js --target=./

# 3. Verificar instalación
npm run test-veo3-integration

# 4. Limpiar archivos temporales
rm -rf ./temp-veo3-lab
```

### **Verificación Rápida**
```bash
# Verificar que todo funciona
node scripts/generate-ana-video.js --test
# Debe generar: "ana-test-integration-[timestamp].mp4"

# Verificar player cards
node scripts/add-player-cards.js --test --player=pedri
# Debe generar: "ana-pedri-test-[timestamp].mp4"
```

---

## 🔧 CONFIGURACIÓN POR ENTORNO

### **Desarrollo (localhost)**
```javascript
// config/veo3-settings.js
module.exports = {
  environment: 'development',
  debug: true,
  save_temp_files: true,
  max_concurrent_videos: 2,
  cost_limit_daily: 10.00
};
```

### **Producción**
```javascript
// config/veo3-settings.js
module.exports = {
  environment: 'production',
  debug: false,
  save_temp_files: false,
  max_concurrent_videos: 5,
  cost_limit_daily: 50.00
};
```

---

## 📊 VALIDACIÓN POST-MIGRACIÓN

### **Tests Obligatorios**
```bash
# 1. Test Ana Real
npm run test-ana-generation

# 2. Test Player Cards
npm run test-player-cards

# 3. Test Concatenación
npm run test-video-concatenation

# 4. Test Integración GPT-5
npm run test-gpt5-integration

# 5. Test Costos
npm run test-cost-tracking
```

### **Métricas de Éxito**
- ✅ Ana Real genera con consistencia 100%
- ✅ Player cards overlay funciona
- ✅ Concatenación produce videos >8s
- ✅ Costos tracked correctamente
- ✅ GPT-5 genera scripts válidos

---

## 🚨 ASPECTOS CRÍTICOS

### **NO CAMBIAR NUNCA**
1. **Ana Character Bible**: Descripción exacta para consistencia
2. **GitHub Image URL**: URL Ana Real en repositorio
3. **VEO3 API Endpoints**: URLs KIE.ai exactas
4. **FFmpeg Commands**: Comandos post-processing validados

### **VARIABLES DE ENTORNO CRÍTICAS**
```bash
KIE_AI_API_KEY=             # Sin esto no funciona nada
ANA_IMAGE_URL=              # Para consistencia Ana
VEO3_DEFAULT_MODEL=veo3_fast # Modelo más estable
```

### **LÍMITES IMPORTANTES**
- **8 segundos máximo** por video individual
- **$0.30 por video** de costo
- **10 requests/minuto** límite API
- **2-6 minutos** tiempo generación

---

## 📞 SOPORTE POST-MIGRACIÓN

### **Logs Importantes**
```bash
# Monitorear estos logs
tail -f logs/veo3-generation.log
tail -f logs/player-cards.log
tail -f logs/concatenation.log
tail -f logs/cost-tracking.log
```

### **Dashboard Monitoreo**
```bash
# Arrancar dashboard VEO3
npm run veo3-dashboard
# Disponible en: http://localhost:3001/veo3
```

### **Comandos Troubleshooting**
```bash
# Verificar estado API
npm run verify-veo3-api

# Reset configuración
npm run reset-veo3-config

# Limpiar cache
npm run clean-veo3-cache
```

---

## 🎯 RESULTADO FINAL ESPERADO

Después de la migración exitosa, el proyecto Fantasy La Liga tendrá:

### **Nuevas Capacidades**
- ✅ Generación automática videos Ana Real
- ✅ Player cards overlay en videos
- ✅ Videos largos via concatenación
- ✅ Control emocional audio dramático
- ✅ Integración completa con GPT-5

### **Nuevos Endpoints API**
- `POST /api/veo3/generate-ana` - Generar video Ana
- `POST /api/veo3/add-player-card` - Añadir player card
- `POST /api/veo3/concatenate` - Concatenar videos
- `GET /api/veo3/status/:taskId` - Estado generación

### **Scripts NPM Nuevos**
- `npm run generate-ana-video` - Video Ana rápido
- `npm run add-player-card` - Player card overlay
- `npm run concatenate-videos` - Videos largos
- `npm run veo3-dashboard` - Dashboard monitoreo

---

## ✅ MIGRACIÓN COMPLETA

**Todo lo necesario está en esta guía y en la carpeta `docs/`.**

**NO faltan archivos. NO hay dudas. Sistema 100% listo para migrar.** 🚀

---

### 📁 **ARCHIVOS DE ESTA GUÍA**

Todos los archivos referenciados están en:
- `docs/migration/` - Proceso de migración
- `docs/integration/` - Documentación técnica
- `docs/reference/` - Referencias y ejemplos
- `src/`, `config/`, `scripts/` - Código source listo

**Copia toda la carpeta `docs/` + archivos source = migración completa.** ✨