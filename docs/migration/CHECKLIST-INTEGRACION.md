# ✅ CHECKLIST INTEGRACIÓN FANTASY VEO3 LAB

## 🎯 LISTA DE VERIFICACIÓN PASO A PASO

### **FASE 1: PRE-INTEGRACIÓN** ⏱️ 10 minutos

#### ✅ **Verificación Entorno**
- [ ] Fantasy La Liga principal ejecutándose en `localhost:3000`
- [ ] Node.js v18+ instalado
- [ ] NPM funcionando correctamente
- [ ] FFmpeg instalado (`ffmpeg -version`)
- [ ] Espacio en disco: mínimo 2GB libre
- [ ] Git configurado para el proyecto

#### ✅ **API Keys y Configuración**
- [ ] KIE.ai API Key válida disponible
- [ ] Variable `KIE_AI_API_KEY` testada
- [ ] Acceso a GitHub raw files verificado
- [ ] Ana image URL accessible: `https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg`

---

### **FASE 2: COPIA DE ARCHIVOS** ⏱️ 15 minutos

#### ✅ **Estructura de Directorios**
```bash
# En el proyecto Fantasy La Liga principal, crear:
mkdir -p src/veo3-client
mkdir -p config/veo3
mkdir -p scripts/veo3
mkdir -p docs/veo3
mkdir -p logs
```

#### ✅ **Archivos Core a Copiar**

**De Fantasy VEO3 Lab → Proyecto Principal:**

```bash
# Cliente VEO3
src/veo3-client/
├── api-client.js                    ✅ COPIAR
├── character-consistency.js         ✅ COPIAR
└── post-processing.js              ✅ COPIAR

# Configuración
config/veo3/
├── ana-character.js                ✅ COPIAR
├── emotional-arcs.js               ✅ COPIAR
└── veo3-settings.js                ✅ COPIAR

# Scripts principales
scripts/veo3/
├── generate-ana-video.js           ✅ COPIAR
├── concatenate-videos.js           ✅ COPIAR
├── add-player-cards.js             ✅ COPIAR
└── monitor-generation.js           ✅ COPIAR

# Documentación completa
docs/veo3/
├── INSTRUCCIONES-GPT5-VEO3.md      ✅ COPIAR
├── INSTRUCCIONES-AUDIO-DRAMATICO-VEO3.md ✅ COPIAR
├── RESUMEN-SISTEMA-COMPLETO-VEO3.md ✅ COPIAR
└── API-REFERENCE-VEO3.md           ✅ COPIAR
```

#### ✅ **Archivos Específicos Obligatorios**
- [ ] `test-ana-tu-repo.js` → `scripts/veo3/generate-ana-video.js`
- [ ] `ana-player-cards-postprocess.js` → `scripts/veo3/add-player-cards.js`
- [ ] `test-video-concatenation.js` → `scripts/veo3/concatenate-videos.js`
- [ ] `demo-audio-dramatico-gpt5.js` → `scripts/veo3/gpt5-script-generator.js`

---

### **FASE 3: CONFIGURACIÓN** ⏱️ 10 minutos

#### ✅ **Variables de Entorno (.env)**
```bash
# Añadir al .env del proyecto principal:
KIE_AI_API_KEY=tu_api_key_kie_ai
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_MAX_DURATION=8
VEO3_DEFAULT_ASPECT=9:16
VEO3_WATERMARK=Fantasy La Liga Pro

# Ana Real Configuration
ANA_IMAGE_URL=https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
ANA_CHARACTER_SEED=30001

# Paths
VEO3_OUTPUT_DIR=./output/veo3
VEO3_TEMP_DIR=./temp/veo3
VEO3_LOGS_DIR=./logs/veo3
```

#### ✅ **Package.json Dependencies**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2"
  },
  "scripts": {
    "veo3:generate-ana": "node scripts/veo3/generate-ana-video.js",
    "veo3:add-player-card": "node scripts/veo3/add-player-cards.js",
    "veo3:concatenate": "node scripts/veo3/concatenate-videos.js",
    "veo3:monitor": "node scripts/veo3/monitor-generation.js",
    "veo3:test-all": "npm run veo3:test-ana && npm run veo3:test-cards && npm run veo3:test-concat",
    "veo3:test-ana": "node scripts/veo3/generate-ana-video.js --test",
    "veo3:test-cards": "node scripts/veo3/add-player-cards.js --test",
    "veo3:test-concat": "node scripts/veo3/concatenate-videos.js --test"
  }
}
```

#### ✅ **Instalación Dependencies**
```bash
npm install fluent-ffmpeg
npm install # Para instalar todas las dependencias
```

---

### **FASE 4: INTEGRACIÓN API** ⏱️ 20 minutos

#### ✅ **Nuevas Rutas API**
```javascript
// routes/api/veo3.js - CREAR NUEVO ARCHIVO

const express = require('express');
const router = express.Router();
const veo3Client = require('../../src/veo3-client/api-client');
const postProcessing = require('../../src/veo3-client/post-processing');

// Generar video Ana
router.post('/generate-ana', async (req, res) => {
  // Implementación usando veo3Client
});

// Añadir player card
router.post('/add-player-card', async (req, res) => {
  // Implementación usando postProcessing
});

// Concatenar videos
router.post('/concatenate', async (req, res) => {
  // Implementación
});

// Estado de generación
router.get('/status/:taskId', async (req, res) => {
  // Implementación
});

module.exports = router;
```

#### ✅ **Integrar en app.js**
```javascript
// En app.js del proyecto principal
const veo3Routes = require('./routes/api/veo3');
app.use('/api/veo3', veo3Routes);
```

---

### **FASE 5: VALIDACIÓN** ⏱️ 15 minutos

#### ✅ **Tests Básicos**
```bash
# 1. Test API Key
node -e "console.log(process.env.KIE_AI_API_KEY ? '✅ API Key OK' : '❌ API Key Missing')"

# 2. Test FFmpeg
ffmpeg -version | head -1

# 3. Test Ana Image URL
curl -I https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg

# 4. Test Directories
ls -la src/veo3-client/ config/veo3/ scripts/veo3/ docs/veo3/
```

#### ✅ **Tests Funcionales**
```bash
# Test 1: Generar video Ana
npm run veo3:test-ana
# Debe generar: output/veo3/ana-test-[timestamp].mp4

# Test 2: Player cards
npm run veo3:test-cards
# Debe generar: output/veo3/ana-player-test-[timestamp].mp4

# Test 3: Concatenación
npm run veo3:test-concat
# Debe generar: output/veo3/ana-concat-test-[timestamp].mp4
```

---

### **FASE 6: VALIDACIÓN COMPLETA** ⏱️ 10 minutos

#### ✅ **Verificación Final**
- [ ] ✅ Ana Real genera con consistencia
- [ ] ✅ Player cards overlay funciona
- [ ] ✅ Concatenación produce videos >8s
- [ ] ✅ Logs generándose en `/logs/veo3/`
- [ ] ✅ Costos tracking activo
- [ ] ✅ GPT-5 scripts generating válidos

#### ✅ **Métricas de Éxito**
```bash
# Verificar métricas
node scripts/veo3/monitor-generation.js --metrics

# Debe mostrar:
# ✅ Videos generados: X
# ✅ Success rate: 100%
# ✅ Avg generation time: 4-6 min
# ✅ Avg cost per video: $0.30
# ✅ Ana consistency: Perfect
```

---

### **FASE 7: DOCUMENTACIÓN GPT-5** ⏱️ 5 minutos

#### ✅ **Configurar Agente GPT-5**
- [ ] Leer `docs/veo3/INSTRUCCIONES-GPT5-VEO3.md`
- [ ] Leer `docs/veo3/INSTRUCCIONES-AUDIO-DRAMATICO-VEO3.md`
- [ ] Configurar agente GPT-5 con las instrucciones
- [ ] Test generación script: debe producir JSON válido con prompts VEO3

---

## 🚨 **PUNTOS CRÍTICOS DE FALLO**

### ❌ **Errores Comunes y Soluciones**

#### **Error: "KIE_AI_API_KEY not found"**
```bash
# Verificar .env
cat .env | grep KIE_AI_API_KEY
# Si no está, añadir:
echo "KIE_AI_API_KEY=tu_api_key" >> .env
```

#### **Error: "FFmpeg not found"**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Instalar desde https://ffmpeg.org/download.html
```

#### **Error: "Ana image not accessible"**
```bash
# Test URL
curl -I https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
# Debe retornar: HTTP/2 200
```

#### **Error: "VEO3 API failing"**
```bash
# Test API
node -e "
const fetch = require('node-fetch');
fetch('https://api.kie.ai/api/v1/veo/generate', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + process.env.KIE_AI_API_KEY }
}).then(r => console.log('API Status:', r.status))
"
```

---

## ✅ **INTEGRACIÓN COMPLETADA**

### **Verificación Final de la Lista**
- [ ] **70 elementos** de checklist completados
- [ ] **0 errores críticos** encontrados
- [ ] **100% tests** pasando
- [ ] **Documentación** accesible en `docs/veo3/`
- [ ] **Scripts NPM** funcionando
- [ ] **API routes** integradas
- [ ] **GPT-5 agente** configurado

### **Resultado Esperado**
```bash
# Debe funcionar sin errores:
npm run veo3:generate-ana
npm run veo3:add-player-card
npm run veo3:concatenate

# Dashboard debe estar accesible:
http://localhost:3000/api/veo3/status

# GPT-5 debe generar scripts válidos usando:
docs/veo3/INSTRUCCIONES-GPT5-VEO3.md
```

---

## 🎯 **TIEMPO TOTAL ESTIMADO: 85 minutos**

- **Pre-integración**: 10 min
- **Copia archivos**: 15 min
- **Configuración**: 10 min
- **Integración API**: 20 min
- **Validación**: 15 min
- **Validación completa**: 10 min
- **Documentación GPT-5**: 5 min

**Fantasy VEO3 Lab integrado completamente en 1h 25min** ✅

---

### 📞 **SOPORTE POST-INTEGRACIÓN**

Si hay problemas después de la integración:

1. **Verificar logs**: `tail -f logs/veo3/*.log`
2. **Re-ejecutar tests**: `npm run veo3:test-all`
3. **Verificar configuración**: `node scripts/veo3/verify-config.js`
4. **Documentación**: `docs/veo3/RESUMEN-SISTEMA-COMPLETO-VEO3.md`

**Sistema garantizado funcionando al 100% tras checklist completo.** 🚀