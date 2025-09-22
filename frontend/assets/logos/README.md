# 🎨 Team Logos Optimization Guide

## 📁 Estructura de Archivos Recomendada

```
frontend/assets/logos/teams/
├── 541-real-madrid-logo.webp         # Principal (512x512)
├── 541-real-madrid-logo-sm.webp      # Pequeño (64x64)
├── 541-real-madrid-logo-md.webp      # Mediano (128x128)
├── 541-real-madrid-logo-lg.webp      # Grande (256x256)
├── 529-barcelona-logo.webp
├── 529-barcelona-logo-sm.webp
├── 529-barcelona-logo-md.webp
├── 529-barcelona-logo-lg.webp
└── ...
```

## 🎯 Convención de Naming

### Patrón Principal:
```
{team_api_id}-{slug}-logo[-size].webp
```

### Ejemplos:
- `541-real-madrid-logo.webp` (Principal 512x512)
- `541-real-madrid-logo-sm.webp` (64x64)
- `541-real-madrid-logo-md.webp` (128x128)
- `541-real-madrid-logo-lg.webp` (256x256)

## 📐 Especificaciones Técnicas

### Tamaños Requeridos:
- **Small (sm)**: 64x64px - Para listas, tablas
- **Medium (md)**: 128x128px - Para cards, preview
- **Large (lg)**: 256x256px - Para headers, destacados
- **Principal**: 512x512px - Para máxima calidad

### Formato y Calidad:
- **Formato**: WebP (mejor compresión que PNG/JPG)
- **Calidad**: 85-90% (balance perfecto calidad/tamaño)
- **Transparencia**: Sí (para fondos flexibles)
- **Compresión**: Lossless para logos vectoriales

### Optimización SEO:
- **Alt Text**: "{Nombre Completo} Logo"
- **Title**: "Logo oficial {Nombre Equipo}"
- **Keywords**: Incluir apodos, aliases populares

## 🚀 Beneficios de Esta Convención

### 1. **Base de Datos**
```javascript
// Mapeo directo con team_id
const logo = LOGO_UTILS.getLogoUrl(541); // Real Madrid
```

### 2. **SEO Optimizado**
```html
<img src="541-real-madrid-logo.webp"
     alt="Real Madrid CF Logo"
     title="Logo oficial Real Madrid"
     loading="lazy">
```

### 3. **Responsive Design**
```css
.team-logo-sm { content: url('541-real-madrid-logo-sm.webp'); }
.team-logo-md { content: url('541-real-madrid-logo-md.webp'); }
.team-logo-lg { content: url('541-real-madrid-logo-lg.webp'); }
```

### 4. **AI/ML Friendly**
- Naming consistente para entrenamiento
- Keywords para clasificación automática
- Metadatos estructurados

## 📋 Lista Completa de IDs API-Sports

| Team ID | Slug | Nombre |
|---------|------|--------|
| 541 | real-madrid | Real Madrid |
| 529 | barcelona | Barcelona |
| 530 | atletico-madrid | Atlético Madrid |
| 531 | athletic-bilbao | Athletic Club |
| 532 | valencia | Valencia |
| 533 | villarreal | Villarreal |
| 536 | sevilla | Sevilla |
| 538 | celta-vigo | Celta Vigo |
| 539 | levante | Levante |
| 540 | espanyol | Espanyol |
| 542 | alaves | Alavés |
| 543 | real-betis | Real Betis |
| 546 | getafe | Getafe |
| 547 | girona | Girona |
| 548 | real-sociedad | Real Sociedad |
| 718 | oviedo | Oviedo |
| 727 | osasuna | Osasuna |
| 728 | rayo-vallecano | Rayo Vallecano |
| 797 | elche | Elche |
| 798 | mallorca | Mallorca |

## 🛠️ Script de Procesamiento Automático

```bash
# Convertir y optimizar todos los logos
for file in *.{png,jpg,jpeg}; do
  # Extraer team ID del nombre del archivo
  team_id=$(echo "$file" | grep -o '^[0-9]*')

  # Generar todos los tamaños
  cwebp -q 90 "$file" -o "${team_id}-logo.webp"
  cwebp -q 90 -resize 256 256 "$file" -o "${team_id}-logo-lg.webp"
  cwebp -q 90 -resize 128 128 "$file" -o "${team_id}-logo-md.webp"
  cwebp -q 90 -resize 64 64 "$file" -o "${team_id}-logo-sm.webp"
done
```

## 🎨 Uso en el Código

### Backend (API Response):
```javascript
const { LOGO_UTILS } = require('../config/teamLogosMapping');

// En respuesta API
const teamData = {
  id: 541,
  name: "Real Madrid",
  logo: LOGO_UTILS.getLogoUrl(541, 'https://cdn.laligafantasy.com'),
  logo_sizes: LOGO_UTILS.getResponsiveLogos(541),
  seo: {
    alt: LOGO_UTILS.getAltText(541),
    keywords: LOGO_UTILS.getKeywords(541)
  }
};
```

### Frontend (HTML/CSS):
```html
<!-- Responsive logo -->
<picture>
  <source media="(max-width: 64px)" srcset="541-real-madrid-logo-sm.webp">
  <source media="(max-width: 128px)" srcset="541-real-madrid-logo-md.webp">
  <source media="(max-width: 256px)" srcset="541-real-madrid-logo-lg.webp">
  <img src="541-real-madrid-logo.webp"
       alt="Real Madrid CF Logo"
       loading="lazy">
</picture>
```

## 📈 Performance Benefits

- **WebP**: 25-35% menor tamaño que PNG
- **Lazy Loading**: Carga solo cuando es visible
- **CDN Ready**: Optimizado para distribución global
- **Cache Friendly**: Nombres consistentes para caching
- **SEO Boost**: Alt text y keywords optimizados

## ✅ Checklist Pre-Upload

- [ ] Formato WebP con 85-90% calidad
- [ ] 4 tamaños: 64px, 128px, 256px, 512px
- [ ] Naming pattern: `{id}-{slug}-logo[-size].webp`
- [ ] Transparencia habilitada
- [ ] Compresión optimizada
- [ ] Metadatos SEO incluidos