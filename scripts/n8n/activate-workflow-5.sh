#!/bin/bash

# Script para activar Workflow #5: Monitor Lesiones y Alertas
# Uso: ./activate-workflow-5.sh

WORKFLOW_ID="OoElzMLzpI81S6o8"
N8N_BASE_URL="https://n8n-n8n.6ld9pv.easypanel.host"

# Cargar token desde .env.n8n
if [ -f ".env.n8n" ]; then
    export $(cat .env.n8n | grep N8N_API_TOKEN | xargs)
else
    echo "❌ Error: .env.n8n no encontrado"
    exit 1
fi

if [ -z "$N8N_API_TOKEN" ]; then
    echo "❌ Error: N8N_API_TOKEN no encontrado en .env.n8n"
    exit 1
fi

echo "🚀 Activando Workflow #5: Monitor Lesiones y Alertas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Workflow ID: $WORKFLOW_ID"
echo "Base URL: $N8N_BASE_URL"
echo ""

# Activar workflow
response=$(curl -s -X PATCH \
    "$N8N_BASE_URL/api/v1/workflows/$WORKFLOW_ID" \
    -H "X-N8N-API-KEY: $N8N_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"active": true}')

# Verificar si fue exitoso
if echo "$response" | grep -q '"active":true'; then
    echo "✅ Workflow activado exitosamente!"
    echo ""
    echo "📊 Estado del Workflow:"
    echo "$response" | grep -o '"name":"[^"]*"' | head -1
    echo "$response" | grep -o '"active":[^,}]*'
    echo ""
    echo "⏰ Próxima Ejecución:"
    echo "El workflow se ejecutará automáticamente cada 2 horas"
    echo "Cron: 0 */2 * * * (Europe/Madrid timezone)"
    echo ""
    echo "🔍 Monitorear ejecuciones:"
    echo "curl \"$N8N_BASE_URL/api/v1/executions?workflowId=$WORKFLOW_ID\" \\"
    echo "  -H \"X-N8N-API-KEY: \$N8N_API_TOKEN\""
else
    echo "❌ Error activando workflow"
    echo "Respuesta:"
    echo "$response"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Workflow #5 activo y monitoreando lesiones cada 2h"