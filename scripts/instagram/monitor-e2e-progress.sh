#!/bin/bash

# Monitor del progreso del test E2E Instagram Chollos
# Muestra logs relevantes en tiempo real

echo "🔍 MONITOR E2E - Instagram Chollos"
echo "=================================="
echo ""
echo "Monitoreando logs del servidor..."
echo ""

# Función para mostrar progreso
show_progress() {
    local pattern=$1
    local label=$2

    if tail -100 logs/combined-*.log 2>/dev/null | grep -q "$pattern"; then
        echo "✅ $label"
    fi
}

# Loop de monitoreo
while true; do
    clear
    echo "🔍 MONITOR E2E - Instagram Chollos"
    echo "==================================
"
    echo "⏰ $(date '+%H:%M:%S')"
    echo ""

    # Verificar estado de archivos de log
    if [ -f "logs/combined-"*.log ]; then
        echo "📊 Últimos eventos:"
        echo "==================="
        tail -50 logs/combined-*.log 2>/dev/null | grep -E "ViralVideoBuilder|Segmento|taskId|completed|Video generado" | tail -10
        echo ""

        # Contar videos en progreso
        echo "📹 Estado videos:"
        echo "================="
        grep -c "Video iniciado" logs/combined-*.log 2>/dev/null | xargs echo "  Videos iniciados:"

        # Buscar videos completados
        find output/veo3/viral -name "*.mp4" -mmin -30 2>/dev/null | wc -l | xargs echo "  Videos completados:"

    else
        echo "⏳ Esperando logs..."
    fi

    echo ""
    echo "Presiona Ctrl+C para salir"

    sleep 5
done
