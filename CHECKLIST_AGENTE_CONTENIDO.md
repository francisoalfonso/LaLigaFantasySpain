# ✅ CHECKLIST AGENTE CONTENIDO - Acción Rápida
## Versión Condensada para Producción Diaria

---

## 🎯 PRE-PRODUCCIÓN (5 minutos)

### 1. DEFINIR TIPO CONTENIDO ✅
```
[ ] Chollo (7-10s) - Jugador barato, alto valor
[ ] Predicción (10-15s) - Análisis jornada próxima
[ ] Breaking News (5-8s) - Lesión, alineación, transferencia
[ ] Análisis Táctico (15-30s) - Profundidad estratégica
[ ] Alerta Mercado (8-10s) - Subida/bajada precio
```

### 2. RECOPILAR DATOS (API-Sports) ✅
```bash
# Verificar API activa
curl http://localhost:3000/api/laliga/test

# Obtener top chollos
curl "http://localhost:3000/api/bargains/top?limit=5"

# Obtener datos jugador específico
curl "http://localhost:3000/api/laliga/player/{id}"
```

**Datos obligatorios**:
- [ ] Nombre jugador correcto
- [ ] Precio actual verificado
- [ ] Estadísticas recientes (últimas 5 jornadas)
- [ ] Historial vs próximo rival (si aplica)
- [ ] Jornada actual confirmada

### 3. VALIDAR VALOR USUARIO ✅
- [ ] ¿Contenido ayuda a ganar puntos? (SÍ/NO)
- [ ] ¿Tiene datos verificables? (SÍ/NO)
- [ ] ¿Acción clara para usuario? (SÍ/NO)
- [ ] ¿Timing correcto? (24-48h antes jornada) (SÍ/NO)

**Si alguna respuesta es NO → REPLANTEARLO**

---

## 🎬 PRODUCCIÓN (3 minutos)

### 4. CREAR PROMPT VEO3 ✅

**Template Minimal (SIEMPRE USAR)**:
```javascript
const prompt = `The person in the reference image speaking in Spanish: "[DIALOGUE]". Exact appearance from reference image.`;
```

**Ejemplos por tipo**:

**CHOLLO**:
```javascript
"¡Misters! He descubierto algo sobre [PLAYER]... ¡A [PRICE]€ es INCREÍBLE! ¡Preparaos para el chollo del SIGLO!"
```

**PREDICCIÓN**:
```javascript
"Para la jornada [X], mi análisis indica que [PREDICTION]. Los números son claros, Misters."
```

**BREAKING NEWS**:
```javascript
"🚨 ¡ATENCIÓN Misters! [NEWS]. ¡Actualizad vuestros equipos YA!"
```

**ANÁLISIS TÁCTICO** (3 segmentos):
```javascript
// Segmento 1
"¿Por qué [PLAYER] está en RACHA? Los números no mienten, Misters."

// Segmento 2
"[TACTICAL_INSIGHT]. [STAT_1], [STAT_2]. ¡Es MATEMÁTICA pura!"

// Segmento 3
"Mi consejo: [ACTION]. Confiad en los datos."
```

### 5. VALIDAR PROMPT ✅
- [ ] Longitud <300 caracteres (recomendado) | <500 (máximo)
- [ ] Sin palabras sensibles: "betting", "garantizado", "100% seguro"
- [ ] Sin promesas absolutas
- [ ] Español natural (no traducción literal)

### 6. GENERAR VIDEO ✅

**Opción A - Script Command Line**:
```bash
node scripts/veo3/generate-ana-video.js --chollo --player "Pedri" --price 8.5
```

**Opción B - API Endpoint**:
```bash
curl -X POST http://localhost:3000/api/veo3/generate-ana \
  -H "Content-Type: application/json" \
  -d '{"type": "chollo", "playerName": "Pedri", "price": 8.5}'
```

**Tiempo estimado**: 4-6 minutos generación

### 7. VERIFICAR CONFIGURACIÓN VEO3 ✅
```bash
# Health check antes de generar
curl http://localhost:3000/api/veo3/health

# Verificar config
curl http://localhost:3000/api/veo3/config
```

**Checklist técnico**:
- [ ] SEED = 30001 ✅
- [ ] voice.locale = 'es-ES' ✅
- [ ] aspectRatio = '9:16' ✅
- [ ] model = 'veo3_fast' ✅

---

## 🎨 POST-PRODUCCIÓN (5 minutos)

### 8. QUALITY CHECK VIDEO ✅
- [ ] Ana consistente (misma persona)
- [ ] Audio español de España (no mexicano)
- [ ] Resolución 1080x1920 px correcta
- [ ] Duración dentro rango objetivo
- [ ] Sin glitches o cortes bruscos
- [ ] Watermark visible pero no intrusivo

### 9. VERIFICAR CONTENIDO ✅
- [ ] Datos mencionados son correctos
- [ ] Nombres jugadores correctos
- [ ] Precios actualizados
- [ ] Jornada correcta
- [ ] Sin información contradictoria

### 10. PREPARAR CAPTION INSTAGRAM ✅

**Estructura Caption**:
```
[Línea 1] 🚨/🎯/⚽ [HOOK] Jornada X
[Línea 2-3] [CONTENIDO RESUMIDO + DATOS CLAVE]
[Línea 4] ¿[PREGUNTA ENGAGEMENT]? 👇
[Línea 5] [HASHTAGS]
```

**Ejemplo Chollo**:
```
🚨 CHOLLO BRUTAL Jornada 5

Pedri a 8.5€ con 92% probabilidad asistencia vs Getafe
Historial: 2G, 3A últimos 3 enfrentamientos

¿Lo fichas? Comenta 👇

#FantasyLaLiga #LaLiga #CholloslFantasy #Pedri #Jornada5 #FantasyTips #MistersFantasy #Barcelona #FantasyLaLigaEspaña #ComunidadFantasy
```

### 11. HASHTAGS (5-15 MIX) ✅

**Template**:
```
3 AMPLIOS: #FantasyLaLiga #LaLiga #Fantasy

5 NICHO: #CholloslFantasy #FantasyTips #[Player]Fantasy #Jornada[X] #[Team]Fantasy

3 MICRO: #MistersFantasy #FantasyLaLiga2025 #ComunidadFantasy

2 COMUNIDAD: #FantasyLaLigaEspaña #AnalisisFantasy
```

### 12. AUDIO TRENDING ✅

**Buscar audio**:
1. Instagram Reels → "Audio" → "Trending"
2. Filtrar <10k usos (sweet spot)
3. Verificar relevancia deportivo

**Tipos audio por contenido**:
- **Chollos**: Epic reveal, suspense → explosión
- **Predicciones**: Professional sports broadcast
- **Breaking News**: Urgent alert sounds
- **Análisis**: Analytical background music

---

## 📱 PUBLICACIÓN (2 minutos)

### 13. HORARIO ÓPTIMO ✅
```
Primera opción: 5-7 AM (engagement máximo)
Segunda opción: 7-9 PM (segundo pico)
Días mejores: Jueves-Viernes (contenido deportivo)
```

### 14. PUBLICAR EN INSTAGRAM ✅
- [ ] Video subido
- [ ] Caption pegado con hashtags
- [ ] Audio trending agregado (si aplica)
- [ ] Thumbnail seleccionado (frame impactante)
- [ ] Share a Feed activado
- [ ] Publicar

### 15. ENGAGEMENT INMEDIATO (30 min) ✅
- [ ] Responder primeros 10 comentarios (crítico para algoritmo)
- [ ] Hacer preguntas en respuestas
- [ ] Compartir a Stories propias
- [ ] Pin comentario destacado (opcional)

---

## 📊 POST-ANÁLISIS (1 minuto)

### 16. REGISTRAR METADATA ✅
```javascript
{
  videoId: "[VEO3_TASK_ID]",
  bunnyId: "[BUNNY_NET_ID]",
  tipo: "chollo|prediccion|breaking|analisis",
  jugador: "[PLAYER_NAME]",
  jornada: X,
  duracion: Xs,
  costo: $0.30,
  fecha: "2025-09-30",
  url: "[BUNNY_NET_URL]"
}
```

### 17. TRACKING 24H ✅
```
[ ] Shares (métrica #1 prioridad)
[ ] Saves (métrica #2 prioridad)
[ ] Comments (métrica #3 prioridad)
[ ] Completion Rate (% ven video completo)
[ ] Reach (total usuarios alcanzados)
```

**Meta mínima viable**:
- Shares: >50
- Saves: >30
- Comments: >20
- Completion Rate: >70%

**Si no alcanza meta** → Revisar:
1. Hook primeros 3s
2. Duración (acortar si necesario)
3. Timing publicación
4. Relevancia contenido

---

## ⚡ CHECKLIST RÁPIDO 30 SEGUNDOS

Antes de publicar, verificar:

1. ✅ **¿Ayuda al usuario a ganar puntos?** → SÍ
2. ✅ **¿Hook primeros 3s atrapa?** → SÍ
3. ✅ **¿Duración óptima?** → SÍ
4. ✅ **¿Ana consistente?** → SÍ
5. ✅ **¿Caption + hashtags preparados?** → SÍ

**Si TODO es SÍ → PUBLICAR**
**Si alguno es NO → CORREGIR**

---

## 🚨 ERRORES CRÍTICOS A EVITAR

❌ **NUNCA**:
- Inventar datos sin verificar API
- Usar prompts complejos (>300 caracteres)
- Cambiar SEED de Ana (siempre 30001)
- Publicar sin caption preparada
- Usar audio saturado (>100k usos)
- Videos >60s (completion rate colapsa)
- Clickbait sin sustancia
- Promesas absolutas ("100% seguro")

✅ **SIEMPRE**:
- Verificar datos con API-Sports
- Usar prompt minimal template
- Confirmar SEED = 30001
- Caption con keywords SEO
- Audio trending early (<10k usos)
- Duración óptima por tipo (7-30s)
- Fundamentar con datos
- Nivel confianza realista (bajo/medio/alto)

---

## 🎯 WORKFLOWS POR TIPO CONTENIDO

### WORKFLOW CHOLLO (15 min total)
```
1. API: curl bargains/top → 2 min
2. Seleccionar jugador → 1 min
3. Prompt minimal → 1 min
4. Generar VEO3 → 6 min
5. Verificar video → 1 min
6. Caption + hashtags → 2 min
7. Publicar + responder → 2 min
```

### WORKFLOW PREDICCIÓN (18 min total)
```
1. API: fixtures próxima jornada → 2 min
2. Análisis historial vs rival → 3 min
3. Prompt minimal → 1 min
4. Generar VEO3 → 6 min
5. Verificar video → 1 min
6. Caption + hashtags → 2 min
7. Publicar + responder → 3 min
```

### WORKFLOW BREAKING NEWS (10 min total)
```
1. Verificar noticia (API/oficial) → 2 min
2. Prompt minimal → 1 min
3. Generar VEO3 → 5 min
4. Caption urgente → 1 min
5. Publicar inmediato → 1 min
```

### WORKFLOW ANÁLISIS TÁCTICO (25 min total)
```
1. Investigación táctica profunda → 5 min
2. 3 prompts segmentos → 2 min
3. Generar 3 videos VEO3 → 12 min
4. Concatenar videos → 2 min
5. Caption detallada → 2 min
6. Publicar + engagement → 2 min
```

---

## 📚 RECURSOS RÁPIDOS

### Comandos Útiles
```bash
# Health check completo
curl http://localhost:3000/api/veo3/health

# API-Sports connectivity
curl http://localhost:3000/api/laliga/test

# Top 5 chollos actuales
curl "http://localhost:3000/api/bargains/top?limit=5"

# Generar video Ana
node scripts/veo3/generate-ana-video.js --chollo --player "Pedri" --price 8.5

# Test VEO3 completo
npm run veo3:test-all
```

### Links Documentación
- **Guía Maestra Completa**: `GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md`
- **VEO3 Technical Docs**: `backend/services/veo3/README.md`
- **CLAUDE.md Normas**: Sección "NORMAS CRÍTICAS VEO3"
- **Ana Character Bible**: `backend/config/veo3/anaCharacter.js`

---

## 🎬 PLANTILLAS PROMPT LISTAS PARA USAR

### Template 1 - Chollo Genérico
```javascript
`The person in the reference image speaking in Spanish: "¡Misters! He descubierto algo sobre ${playerName}... ¡A ${price}€ es INCREÍBLE! ¡Preparaos para el chollo del SIGLO!". Exact appearance from reference image.`
```

### Template 2 - Predicción Capitán
```javascript
`The person in the reference image speaking in Spanish: "Para la jornada ${gameweek}, mi análisis indica que ${playerName} vs ${rival}... ¡Hazlo capitán! Los números son claros.". Exact appearance from reference image.`
```

### Template 3 - Breaking Lesión
```javascript
`The person in the reference image speaking in Spanish: "🚨 ¡ATENCIÓN Misters! ${playerName} LESIONADO. ${weeks} semanas fuera. ¡Actualizad vuestros equipos YA!". Exact appearance from reference image.`
```

### Template 4 - Alerta Subida Precio
```javascript
`The person in the reference image speaking in Spanish: "¡Misters! ${playerName} sube a ${newPrice}€ en 48h. Véndelo ahora o prepara presupuesto.". Exact appearance from reference image.`
```

### Template 5 - Análisis Táctico Intro
```javascript
`The person in the reference image speaking in Spanish: "¿Por qué ${playerName} está en RACHA? Los números no mienten, Misters. Vamos a analizarlo.". Exact appearance from reference image.`
```

---

## 🚀 QUICK START - PRIMER VIDEO HOY

### Paso a Paso (15 minutos)
```
1. [ ] curl "http://localhost:3000/api/bargains/top?limit=5"
2. [ ] Copiar datos top chollo
3. [ ] Usar Template 1 con datos
4. [ ] node scripts/veo3/generate-ana-video.js --chollo --player "[NAME]" --price [X]
5. [ ] Esperar 6 min (tomar café ☕)
6. [ ] Descargar video de output/veo3/
7. [ ] Escribir caption con Template Instagram
8. [ ] Subir a Instagram + audio trending
9. [ ] PUBLICAR
10. [ ] Responder primeros 10 comentarios
```

**🎯 META**: 1 Reel diario usando este checklist = Crecimiento consistente

---

**Última actualización**: 30 Septiembre 2025
**Versión**: 1.0