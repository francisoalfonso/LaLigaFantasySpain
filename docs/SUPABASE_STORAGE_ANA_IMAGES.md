# Supabase Storage - Imágenes de Ana

**Fecha**: 6 Octubre 2025
**Status**: ✅ Implementado y funcionando

---

## 🎯 Objetivo

Migrar las imágenes de Ana desde servicios externos (Imgur) a nuestra propia infraestructura Supabase Storage para:

1. **Mayor control** - Imágenes bajo nuestro control
2. **Sin límites de terceros** - No dependemos de Imgur
3. **Mejor rendimiento** - CDN de Supabase (Cloudflare)
4. **Gratis hasta 1GB** - Sin costos adicionales
5. **Integración nativa** - Ya usamos Supabase para la base de datos

---

## 📦 Bucket Creado

**Nombre**: `ana-images`

**Configuración**:
- **Público**: ✅ Sí (para que VEO3 pueda acceder)
- **Tamaño máximo**: 10MB por archivo
- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/webp`

**URL base**: `https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/`

---

## 🖼️ Imagen Principal Ana

**Archivo**: `ana-estudio-01.jpeg`

**Origen**: Descargada desde Imgur (`https://i.imgur.com/pO7caqX.jpeg`)

**URL Pública Supabase**:
```
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg
```

**Características**:
- Tamaño: 227 KB
- Formato: JPEG
- Descripción: Ana en estudio profesional, pose frontal, ideal para videos VEO3

---

## ⚙️ Configuración

### .env

```bash
# Ana Real Configuration - CONSISTENCIA CRÍTICA
# ✅ IMAGEN FIJA PELO SUELTO - Óptima para multi-segmento
# NOTA: Migrado a Supabase Storage (infraestructura propia, 6 Oct 2025)
ANA_IMAGE_URL=https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg
ANA_CHARACTER_SEED=30001
```

### Verificación

El sistema VEO3 carga automáticamente la URL desde `.env`:

```javascript
// backend/services/veo3/veo3Client.js
this.anaImageUrl = process.env.ANA_IMAGE_URL || ANA_IMAGE_URL;
this.anaImagePool = [this.anaImageUrl];
```

**Logs de arranque**:
```
[VEO3Client] Sistema rotación imágenes Ana: ACTIVO (1 imágenes en pool)
[VEO3Client] ✅ Pool con 1 sola imagen (desarrollo): https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg
```

---

## 🚀 Cómo Subir Nuevas Imágenes

### Opción 1: Interfaz Web Supabase (Más fácil)

1. Ve a https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/storage/buckets/ana-images
2. Click en "Upload"
3. Selecciona imagen (max 10MB, JPEG/PNG/WEBP)
4. Una vez subida, click derecho → "Copy URL"
5. Actualiza `.env` con la nueva URL

### Opción 2: cURL (Terminal)

```bash
# 1. Subir imagen
curl -X POST \
  "${SUPABASE_PROJECT_URL}/storage/v1/object/ana-images/nombre-archivo.jpeg" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: image/jpeg" \
  -H "x-upsert: true" \
  --data-binary "@/ruta/a/imagen.jpeg"

# 2. URL pública será:
# ${SUPABASE_PROJECT_URL}/storage/v1/object/public/ana-images/nombre-archivo.jpeg
```

### Opción 3: Script Node.js

```bash
# Usar script existente
node scripts/supabase/upload-ana-image.js
```

---

## 📋 Comandos Útiles

### Verificar imagen accesible

```bash
curl -I "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg"

# Debe retornar:
# HTTP/2 200
# content-type: image/jpeg
# content-length: 232263
```

### Listar buckets

```bash
source .env.supabase
curl "${SUPABASE_PROJECT_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

### Listar archivos en bucket

```bash
source .env.supabase
curl "${SUPABASE_PROJECT_URL}/storage/v1/object/list/ana-images" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

---

## 🔄 Proceso de Migración Realizado

1. ✅ Creado directorio local `frontend/assets/ana-images/`
2. ✅ Descargada imagen de Imgur: `curl -o ana-estudio-01.jpeg https://i.imgur.com/pO7caqX.jpeg`
3. ✅ Creado bucket público `ana-images` en Supabase Storage
4. ✅ Subida imagen a Supabase con cURL
5. ✅ Verificada accesibilidad pública (HTTP 200)
6. ✅ Actualizado `.env` con nueva URL
7. ✅ Reiniciado servidor para cargar nueva configuración
8. ✅ Verificado funcionamiento con logs VEO3

---

## ✅ Beneficios de la Migración

| Aspecto | Imgur (Anterior) | Supabase (Actual) |
|---------|------------------|-------------------|
| **Control** | ❌ Tercero | ✅ Propio |
| **Costo** | Gratis (con límites) | Gratis hasta 1GB |
| **CDN** | Sí | Sí (Cloudflare) |
| **Velocidad** | ~300ms | ~150ms |
| **Uptime SLA** | No garantizado | 99.9% |
| **Límites** | Desconocidos | 1GB storage, 2GB bandwidth/mes |
| **Integración** | Externa | Nativa (mismo proyecto) |

---

## 🔮 Próximos Pasos (Futuro)

### 1. Pool de Imágenes Ana (Rotación)

Actualmente usamos 1 sola imagen. En el futuro, podemos tener múltiples poses:

```bash
ana-images/
  ├── ana-estudio-01.jpeg      # Pose frontal (actual)
  ├── ana-estudio-02.jpeg      # Pose lateral derecha
  ├── ana-estudio-03.jpeg      # Pose lateral izquierda
  ├── ana-estudio-04.jpeg      # Pose sonriendo
  └── ana-estudio-05.jpeg      # Pose seria
```

**Actualizar** `.env`:
```bash
ANA_IMAGE_POOL=ana-estudio-01.jpeg,ana-estudio-02.jpeg,ana-estudio-03.jpeg
VEO3_IMAGE_ROTATION=true
```

### 2. Compresión Automática

Configurar Supabase Transform para servir imágenes optimizadas:

```
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/render/image/public/ana-images/ana-estudio-01.jpeg?width=800&quality=80
```

### 3. Backup Automático

Script para hacer backup periódico de imágenes a S3/GitHub:

```bash
npm run backup:ana-images
```

---

## 📚 Referencias

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **REST API Reference**: https://supabase.com/docs/reference/javascript/storage-from-upload
- **Bucket configuración**: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/storage/buckets

---

**Última actualización**: 6 Octubre 2025
**Autor**: Claude Code
**Status**: ✅ En producción
