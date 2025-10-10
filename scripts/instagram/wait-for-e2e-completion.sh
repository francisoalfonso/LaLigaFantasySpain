#!/bin/bash

# Script que espera a que termine el test E2E y muestra resumen final
# Monitorea el proceso en background y notifica al completar

echo "⏳ Monitoreando test E2E Instagram Chollos..."
echo "================================================"
echo ""
echo "Inicio: $(date '+%H:%M:%S')"
echo ""
echo "El test se ejecutará durante aproximadamente 15-20 minutos."
echo "Puedes cerrar esta ventana, el test continuará en background."
echo ""
echo "Monitoreando progreso cada 30 segundos..."
echo ""

START_TIME=$(date +%s)
LAST_STATUS=""

while true; do
    # Verificar si el proceso del test sigue corriendo
    if ! pgrep -f "instagram:test-e2e" > /dev/null; then
        echo ""
        echo "✅ TEST E2E COMPLETADO!"
        echo "======================"
        echo ""

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        MINUTES=$((DURATION / 60))
        SECONDS=$((DURATION % 60))

        echo "⏱️  Duración total: ${MINUTES}m ${SECONDS}s"
        echo ""

        # Verificar videos generados
        echo "📹 Videos generados:"
        echo "==================="
        VIDEOS_COUNT=$(find output/veo3/viral -name "*.mp4" -mmin -30 2>/dev/null | wc -l | xargs)
        echo "  Total: $VIDEOS_COUNT videos"
        echo ""

        if [ "$VIDEOS_COUNT" -gt 0 ]; then
            echo "  Archivos:"
            find output/veo3/viral -name "*.mp4" -mmin -30 -exec ls -lh {} \; 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
            echo ""
        fi

        # Verificar si hubo errores
        if grep -q "❌" logs/combined-*.log 2>/dev/null | tail -50; then
            echo "⚠️  Se detectaron algunos errores. Revisa los logs para más detalles."
        else
            echo "✅ No se detectaron errores críticos"
        fi

        echo ""
        echo "Fin: $(date '+%H:%M:%S')"

        break
    fi

    # Mostrar progreso cada 30 segundos
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    ELAPSED_MIN=$((ELAPSED / 60))
    ELAPSED_SEC=$((ELAPSED % 60))

    # Contar videos completados
    VIDEOS_NOW=$(find output/veo3/viral -name "*.mp4" -mmin -30 2>/dev/null | wc -l | xargs)

    STATUS="⏱️  ${ELAPSED_MIN}m ${ELAPSED_SEC}s transcurridos | 📹 $VIDEOS_NOW/3 videos completados"

    if [ "$STATUS" != "$LAST_STATUS" ]; then
        echo "$STATUS"
        LAST_STATUS="$STATUS"
    fi

    sleep 30
done

echo ""
echo "🎉 ¡Proceso completado! Revisa los resultados arriba."
echo ""
