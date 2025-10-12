# Competitive Channels Schema - Installation Instructions

## Aplicar Schema Manualmente (Recomendado)

### Opción 1: Supabase Dashboard SQL Editor (Más Confiable)

1. **Acceder al SQL Editor**:
    - Ir a: https://supabase.com/dashboard
    - Seleccionar proyecto: `ixfowlkuypnfbrwawxlx`
    - Click en "SQL Editor" en el menú lateral

2. **Ejecutar el Schema**:
    - Abrir el archivo: `database/competitive-channels-schema.sql`
    - Copiar TODO el contenido del archivo
    - Pegarlo en el SQL Editor de Supabase
    - Click en "Run" o `Ctrl+Enter`

3. **Verificar Creación**:

    ```sql
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name IN ('competitive_channels', 'competitive_videos');
    ```

    Deberías ver:
    - `competitive_channels`
    - `competitive_videos`

---

## Verificación Post-Instalación

Una vez aplicado el schema, verifica desde el backend:

```bash
# Test CRUD endpoints
curl http://localhost:3000/api/competitive/channels

# Debería retornar:
# { "success": true, "data": [] }
```

---

## Estructura del Schema

### Tabla: `competitive_channels`

Almacena canales YouTube de competidores monitorizados

**Campos principales**:

- `id` (uuid) - PK
- `channel_url` (text) - URL del canal YouTube
- `channel_id` (text) - ID del canal YouTube
- `channel_name` (text) - Nombre del canal
- `is_active` (boolean) - Canal activo/inactivo
- `priority` (integer 1-5) - Prioridad de monitorización (5=alta)
- `monitoring_frequency` (text) - Frecuencia: 30min, 1h, 4h, 12h, 24h
- `videos_processed` (integer) - Contador de videos procesados
- `avg_quality_score` (float) - Score promedio de calidad

### Tabla: `competitive_videos`

Almacena videos detectados de canales competidores

**Campos principales**:

- `id` (uuid) - PK
- `channel_id` (uuid) - FK a competitive_channels
- `video_id` (text) - ID único del video YouTube
- `video_url` (text) - URL completa del video
- `processed` (boolean) - Video procesado/pendiente
- `processing_status` (text) - Estados: pending, analyzing, generating,
  completed, skipped
- `transcription` (jsonb) - Resultado de Whisper AI
- `analysis` (jsonb) - Resultado de Content Analyzer
- `our_response_session_id` (text) - SessionID de video VEO3 generado
- `quality_score` (float) - Score de calidad 0-10

---

## Features Automáticas

### Triggers Creados:

1. **`update_competitive_channels_updated_at`**:
    - Actualiza `updated_at` automáticamente en cada UPDATE

2. **`update_channel_stats_trigger`**:
    - Actualiza stats del canal cuando se procesa un video:
        - Incrementa `videos_processed`
        - Recalcula `avg_quality_score`

### Índices Creados:

- `idx_competitive_channels_active` - Filtra canales activos
- `idx_competitive_channels_priority` - Ordena por prioridad
- `idx_competitive_videos_processed` - Filtra videos pending/processed
- `idx_competitive_videos_quality` - Ordena por quality score

---

## Datos de Ejemplo (Opcional)

Si quieres añadir el canal de José Carrasco como ejemplo:

```sql
INSERT INTO competitive_channels (
    channel_url,
    channel_id,
    channel_name,
    priority,
    content_type,
    monitoring_frequency
) VALUES (
    'https://www.youtube.com/@JoseCarrasco_98/shorts',
    'UCxxxxxxxxxxx',
    'José Carrasco',
    5,
    'chollos',
    '1h'
) ON CONFLICT (channel_url) DO NOTHING;
```

---

## Rollback

Si necesitas eliminar el schema:

```sql
DROP TABLE IF EXISTS competitive_videos CASCADE;
DROP TABLE IF EXISTS competitive_channels CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_channel_stats() CASCADE;
```

---

## Next Steps

Después de aplicar el schema:

1. ✅ **Backend READY**: Rutas `/api/competitive/*` y `/api/content-analysis/*`
   ya registradas
2. ⏳ **Extender VEO3**: Añadir soporte para `customScript` en
   `/api/veo3/prepare-session`
3. ⏳ **Frontend**: Crear `frontend/competitive-channels.html`
4. ⏳ **Test E2E**: Probar con video real de YouTube

---

**Creado**: 12 Oct 2025 **Feature**: Competitive YouTube Analyzer
**Documentación**: `docs/FEATURE_COMPETENCIA_YOUTUBE_ANALYZER.md`
