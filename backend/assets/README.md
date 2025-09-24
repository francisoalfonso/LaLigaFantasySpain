# Assets Directory - Fantasy La Liga

## Estructura de Carpetas

### `/logos/`
**Para tu logo SVG principal**
- Sube aquí tu logo SVG: `fantasy-laliga-logo.svg`
- Se usará en todas las imágenes generadas
- Formato recomendado: SVG vectorial

### `/team-logos/`
**Para escudos de equipos de La Liga**
- Escudos descargados automáticamente desde API-Sports
- Formato: `team_[ID].png` (ej: `team_529.png` para Barcelona)
- Cache local para mejor rendimiento

### `/player-photos/`
**Para fotos de jugadores**
- Fotos descargadas automáticamente desde API-Sports
- Formato: `player_[ID].jpg` (ej: `player_154.jpg` para Messi)
- Cache local para mejor rendimiento

### `/templates/`
**Para plantillas HTML personalizadas**
- Templates adicionales específicos por campaña
- Recursos CSS adicionales
- Fuentes personalizadas si es necesario

## Uso

1. **Tu logo**: Sube `fantasy-laliga-logo.svg` en `/logos/`
2. **El sistema descargará automáticamente** escudos y fotos desde API-Sports
3. **Las imágenes se generarán** combinando todos estos recursos

## Acceso Web

Los assets están servidos estáticamente en:
- `http://localhost:3000/assets/logos/`
- `http://localhost:3000/assets/team-logos/`
- `http://localhost:3000/assets/player-photos/`
- `http://localhost:3000/assets/templates/`