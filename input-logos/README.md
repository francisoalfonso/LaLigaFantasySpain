# 📁 Estructura de Carpetas para Logos e Imágenes

## 🎯 **PARA LOGOS DE EQUIPOS**

### Sube tus archivos PNG aquí:
```
📂 input-logos/teams/
├── 541.png    (Real Madrid)
├── 529.png    (Barcelona)
├── 530.png    (Atlético Madrid)
├── 531.png    (Athletic Bilbao)
├── 532.png    (Valencia)
├── 533.png    (Villarreal)
├── 536.png    (Sevilla)
├── 538.png    (Celta Vigo)
├── 539.png    (Levante)
├── 540.png    (Espanyol)
├── 542.png    (Alavés)
├── 543.png    (Real Betis)
├── 546.png    (Getafe)
├── 547.png    (Girona)
├── 548.png    (Real Sociedad)
├── 718.png    (Oviedo)
├── 727.png    (Osasuna)
├── 728.png    (Rayo Vallecano)
├── 797.png    (Elche)
└── 798.png    (Mallorca)
```

### Procesamiento Automático:
```bash
# Una vez subidos los logos de equipos:
node scripts/process-team-logos.js ./input-logos/teams
```

## 📸 **PARA FOTOS DE JUGADORES**

### Opción 1: Subir fotos manualmente
```
📂 input-logos/players/
├── 755-jaime-seoane.jpg    (Player ID - Nombre)
├── 31-jose-gimenez.jpg
├── 143-carles-alena.jpg
└── ... (más fotos)
```

### Opción 2: Descarga automática (🔥 RECOMENDADO)
```bash
# Descarga automáticamente las fotos de todos los jugadores desde API-Sports
node scripts/process-player-photos.js --download
```

## 🚀 **Comandos de Procesamiento**

### Equipos (después de subir):
```bash
node scripts/process-team-logos.js ./input-logos/teams
```

### Jugadores - Manual:
```bash
node scripts/process-player-photos.js ./input-logos/players
```

### Jugadores - Automático (🌟 MAGIC!):
```bash
node scripts/process-player-photos.js --download
```

## 📁 **Carpetas de Salida**

Los archivos procesados se generan en:
```
📂 frontend/assets/logos/
├── teams/
│   ├── 541-real-madrid-logo.webp
│   ├── 541-real-madrid-logo-sm.webp
│   ├── 541-real-madrid-logo-md.webp
│   ├── 541-real-madrid-logo-lg.webp
│   └── ... (resto de equipos)
└── players/
    ├── 755-jaime-seoane-photo.webp
    ├── 755-jaime-seoane-photo-sm.webp
    ├── 755-jaime-seoane-photo-md.webp
    ├── 755-jaime-seoane-photo-lg.webp
    └── ... (resto de jugadores)
```

## ✨ **Lo que hace la automatización:**

### Para Equipos:
✅ Detecta equipo por código numérico
✅ Convierte PNG → WebP (25-35% menos peso)
✅ Genera 4 tamaños (64px, 128px, 256px, 512px)
✅ Naming SEO: `541-real-madrid-logo.webp`
✅ Valida que todos los 20 equipos tengan logos

### Para Jugadores:
✅ Descarga automática desde API-Sports (URLs oficiales)
✅ Convierte a WebP con calidad optimizada
✅ Genera 4 tamaños responsivos
✅ Naming SEO: `755-jaime-seoane-photo.webp`
✅ Procesa todos los 599 jugadores automáticamente

## 🎯 **¡Listo para usar!**

**Para empezar:**
1. Sube tus logos PNG a `input-logos/teams/`
2. Ejecuta el script de procesamiento
3. Para jugadores, usa `--download` para automatización completa

**¡Los scripts están listos para procesar todo automáticamente!** 🚀