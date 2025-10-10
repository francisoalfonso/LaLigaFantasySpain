# Google Vertex AI VEO3 - Guía de Setup

Configuración para usar la API oficial de Google Vertex AI VEO3 como alternativa a KIE.ai.

## 📋 Requisitos Previos

1. **Cuenta Google Cloud Platform**
   - Si no tienes: https://console.cloud.google.com/
   - $300 créditos gratis para nuevos usuarios (3 meses)

2. **gcloud CLI instalado** (desarrollo local)
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Verificar instalación
   gcloud --version
   ```

3. **Proyecto Google Cloud creado**

## 🚀 Setup Rápido (Desarrollo Local)

### Paso 1: Autenticación con gcloud

```bash
# Login con tu cuenta Google
gcloud auth login

# Configurar proyecto (reemplaza PROJECT_ID con tu ID real)
gcloud config set project PROJECT_ID

# Autenticación para Application Default Credentials
gcloud auth application-default login
```

### Paso 2: Habilitar APIs Necesarias

```bash
# Habilitar Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Verificar que está habilitada
gcloud services list --enabled | grep aiplatform
```

### Paso 3: Configurar Variables de Entorno

Agregar a tu `.env`:

```bash
# Google Cloud Vertex AI
GOOGLE_CLOUD_PROJECT_ID=tu-project-id-aqui
GOOGLE_CLOUD_LOCATION=us-central1

# Para desarrollo local NO necesitas GOOGLE_APPLICATION_CREDENTIALS
# gcloud CLI maneja la autenticación automáticamente
```

### Paso 4: Instalar Dependencia Google Auth

```bash
npm install google-auth-library
```

### Paso 5: Ejecutar Test Comparativo

```bash
npm run veo3:test-google-vs-kie
```

Este test generará el mismo video con ambas APIs y comparará resultados.

---

## 🏢 Setup Producción (Service Account)

### Paso 1: Crear Service Account

```bash
# Crear service account
gcloud iam service-accounts create veo3-video-generator \
  --display-name="VEO3 Video Generator" \
  --description="Service account for VEO3 video generation"

# Ver email del service account
gcloud iam service-accounts list
```

### Paso 2: Asignar Permisos

```bash
# Asignar rol de usuario Vertex AI
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:veo3-video-generator@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Paso 3: Generar Clave JSON

```bash
# Crear key file
gcloud iam service-accounts keys create ~/veo3-service-account.json \
  --iam-account=veo3-video-generator@PROJECT_ID.iam.gserviceaccount.com

# Mover a ubicación segura
mv ~/veo3-service-account.json /path/to/secure/location/
```

### Paso 4: Configurar Variables de Entorno

Agregar a tu `.env`:

```bash
# Google Cloud Vertex AI (Producción)
GOOGLE_CLOUD_PROJECT_ID=tu-project-id-aqui
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/veo3-service-account.json

# IMPORTANTE: Nunca commitear el archivo JSON a git
# Agregarlo a .gitignore
```

---

## 📊 Comparativa: Google Vertex AI vs KIE.ai

| Aspecto | Google Vertex AI | KIE.ai |
|---------|------------------|--------|
| **API Oficial** | ✅ Sí (Google directa) | ⚠️ No (wrapper third-party) |
| **Estabilidad** | ✅ Alta (SLA 99.9%) | ⚠️ Media (depende de KIE.ai) |
| **Pricing** | ⚠️ Pay-per-use (complejo) | ✅ Flat $0.30/video |
| **Rate Limits** | ✅ 100 req/min | ⚠️ 10 req/min |
| **Soporte** | ✅ Google Cloud Support | ⚠️ Email básico |
| **Control Parámetros** | ✅ Completo | ⚠️ Limitado |
| **Image Fetch** | ❓ Por verificar | ❌ Bloquea Imgur |

## 🧪 Test Comparativo

El script `test-google-vertex-vs-kie.js` ejecuta ambas APIs con:

- **Mismo prompt**: Garantiza comparación justa
- **Misma imagen Ana**: Usando ANA_IMAGE_URL
- **Misma duración**: 8 segundos
- **Mismo aspect ratio**: 9:16 vertical

**Métricas comparadas**:
- ✅ Éxito/fallo generación
- ⏱️ Tiempo de respuesta
- 🖼️ Aceptación de imagen referencia
- 📝 Mensajes de error
- 💰 Costo por video

## 🔍 Verificar Estado del Test

Después de ejecutar `npm run veo3:test-google-vs-kie`, verás:

```
┌─────────────────────┬──────────────────────┬──────────────────────┐
│ Métrica             │ Google Vertex AI     │ KIE.ai               │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ Status              │ ✅ ÉXITO             │ ❌ FALLÓ             │
│ Tiempo              │ 4.23s                │ 5.67s                │
│ Error               │ N/A                  │ Image fetch failed.. │
└─────────────────────┴──────────────────────┴──────────────────────┘

💡 Recomendación:
   → Migrar a Google Vertex AI (más estable, acepta imagen Ana)
```

## 🚨 Troubleshooting

### Error: "Failed to get access token"

**Causa**: gcloud CLI no autenticado o proyecto incorrecto.

**Solución**:
```bash
gcloud auth application-default login
gcloud config set project PROJECT_ID
```

### Error: "API aiplatform.googleapis.com is not enabled"

**Causa**: Vertex AI API no habilitada en el proyecto.

**Solución**:
```bash
gcloud services enable aiplatform.googleapis.com
```

### Error: "Permission denied"

**Causa**: Service Account sin permisos suficientes.

**Solución**:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:YOUR-SA@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## 💰 Pricing Google Vertex AI VEO3

**Modelo veo-2.0** (disponible en Vertex AI):

- **Generación de video**: $0.005 por segundo de video
- **Video de 8s**: ~$0.04 por video
- **100 videos/mes**: ~$4.00

**Comparado con KIE.ai**:
- KIE.ai: $0.30 × 100 = $30/mes
- Google: $0.04 × 100 = $4/mes
- **Ahorro**: $26/mes (87% más barato)

## 📚 Recursos Adicionales

- **Vertex AI VEO Docs**: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
- **Quickstart**: https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal
- **Pricing**: https://cloud.google.com/vertex-ai/generative-ai/pricing
- **Google Auth Library**: https://www.npmjs.com/package/google-auth-library

## ✅ Checklist de Migración

Si decides migrar de KIE.ai a Google Vertex AI:

- [ ] Setup Google Cloud Project
- [ ] Habilitar Vertex AI API
- [ ] Configurar autenticación (gcloud o Service Account)
- [ ] Agregar variables entorno GOOGLE_CLOUD_*
- [ ] Ejecutar test comparativo
- [ ] Verificar que imagen Ana funciona
- [ ] Actualizar veo3Client.js para usar Google por defecto
- [ ] Migrar viralVideoBuilder.js
- [ ] Actualizar documentación CLAUDE.md
- [ ] Eliminar dependencia KIE_AI_API_KEY

---

**Fecha actualización**: 5 Octubre 2025
**Próxima revisión**: Después de ejecutar test comparativo
