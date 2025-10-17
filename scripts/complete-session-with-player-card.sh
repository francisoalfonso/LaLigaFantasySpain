#!/bin/bash

# Script para completar sesión VEO3 con player card
# Uso: bash scripts/complete-session-with-player-card.sh SESSION_ID

SESSION_ID=$1
CONTENT_TYPE=${2:-"outlier_response"}

if [ -z "$SESSION_ID" ]; then
    echo "❌ Error: SESSION_ID requerido"
    echo "Uso: bash scripts/complete-session-with-player-card.sh SESSION_ID [contentType]"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════════════"
echo "🚀 COMPLETANDO SESIÓN VEO3 CON PLAYER CARD"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Session ID: $SESSION_ID"
echo "📋 Content Type: $CONTENT_TYPE"
echo ""

# Paso 1: Generar segmentos (si no están generados)
echo "════════════════════════════════════════════════════════════════════════"
echo "PASO 1: GENERANDO 3 SEGMENTOS VEO3"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

for i in 0 1 2; do
    echo "🎥 Generando segmento $(($i + 1))/3..."

    curl -X POST http://localhost:3000/api/veo3/generate-segment \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\":\"$SESSION_ID\",\"segmentIndex\":$i}" \
      --max-time 300 \
      -s -o /dev/null -w "HTTP %{http_code}\n"

    if [ $? -eq 0 ]; then
        echo "✅ Segmento $(($i + 1)) completado"
    else
        echo "❌ Error generando segmento $(($i + 1))"
        exit 1
    fi

    # Delay entre segmentos
    if [ $i -lt 2 ]; then
        echo "⏳ Esperando 10s antes del siguiente..."
        sleep 10
    fi
done

echo ""
echo "✅ PASO 1 COMPLETADO: 3 segmentos generados"
echo ""

# Paso 2: Concatenar segmentos
echo "════════════════════════════════════════════════════════════════════════"
echo "PASO 2: CONCATENANDO SEGMENTOS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" \
  --max-time 120 \
  -s -o /dev/null -w "HTTP %{http_code}\n"

if [ $? -eq 0 ]; then
    echo "✅ PASO 2 COMPLETADO: Video concatenado"
else
    echo "❌ Error concatenando video"
    exit 1
fi

echo ""

# Paso 3: Aplicar player card + subtítulos
echo "════════════════════════════════════════════════════════════════════════"
echo "PASO 3: APLICANDO PLAYER CARD + SUBTÍTULOS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

node scripts/veo3/add-captions-to-outlier-video.js $SESSION_ID $CONTENT_TYPE

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════════════"
    echo "✅ PROCESO COMPLETADO EXITOSAMENTE"
    echo "════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "📹 Video final con player card listo"
    echo "📁 Ubicación: output/veo3/ana-concatenated-*.mp4"
else
    echo "❌ Error aplicando player card + subtítulos"
    exit 1
fi
