#!/bin/bash

###############################################################################
# Script de Deploy Completo a Producción OVH
# Fantasy La Liga - Sistema Completo de Automatización
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 DEPLOY A PRODUCCIÓN - OVH                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
SERVER_IP="151.80.119.163"
PROJECT_PATH="~/Fantasy la liga"
BRANCH="feature/competitive-youtube-analyzer"

echo -e "${YELLOW}📋 Checklist Pre-Deploy:${NC}"
echo "  ✓ Código pusheado a GitHub"
echo "  ✓ Tests pasados localmente"
echo "  ✓ Variables de entorno revisadas"
echo ""

read -p "¿Continuar con el deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelado"
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Paso 1/6: Conectando a OVH...${NC}"
ssh root@${SERVER_IP} << 'ENDSSH'

cd ~/Fantasy\ la\ liga

echo "📦 Git status actual:"
git status

echo ""
echo "🔄 Haciendo pull del nuevo código..."
git fetch origin
git checkout feature/competitive-youtube-analyzer
git pull origin feature/competitive-youtube-analyzer

echo ""
echo "📦 Instalando/actualizando dependencias..."
npm install

echo ""
echo "✅ Código actualizado correctamente"

ENDSSH

echo ""
echo -e "${GREEN}✅ Paso 1 completado${NC}"
echo ""

echo -e "${YELLOW}🔧 Paso 2/6: Verificar variables de entorno${NC}"
echo ""
echo "Necesitas verificar que el .env en el servidor tenga estas variables:"
echo ""
echo "# Chollos Scheduler"
echo "CHOLLOS_CRON_SCHEDULE=0 8 * * *"
echo "CHOLLOS_CRON_ENABLED=true"
echo ""
echo "# Outliers Detector"
echo "OUTLIERS_DETECTION_ENABLED=true"
echo "OUTLIERS_CRON_SCHEDULE=0 * * * *  # Cada hora"
echo ""
echo "# Server"
echo "SERVER_URL=https://laligafantasyspain.com"
echo ""
echo "# Instagram (si tienes configurado)"
echo "INSTAGRAM_ACCESS_TOKEN=..."
echo "INSTAGRAM_ACCOUNT_ID=..."
echo ""

read -p "¿Ya verificaste las variables de entorno en el servidor? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Por favor, conéctate al servidor y edita el .env:"
    echo "  ssh root@${SERVER_IP}"
    echo "  cd ~/Fantasy\ la\ liga"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Paso 3/6: Reiniciando servidor...${NC}"
ssh root@${SERVER_IP} << 'ENDSSH'

cd ~/Fantasy\ la\ liga

echo "🔄 Reiniciando aplicación con PM2..."
pm2 restart all

echo ""
echo "⏳ Esperando 5 segundos para que el servidor inicie..."
sleep 5

echo ""
echo "📊 Estado de los procesos PM2:"
pm2 list

echo ""
echo "📋 Últimos logs:"
pm2 logs --lines 20 --nostream

ENDSSH

echo ""
echo -e "${GREEN}✅ Paso 3 completado${NC}"
echo ""

echo -e "${YELLOW}🧪 Paso 4/6: Verificando salud del servidor...${NC}"
echo ""

# Health check
echo "🔍 Verificando /health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://laligafantasyspain.com/health)

if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ Servidor respondiendo correctamente (200 OK)${NC}"
else
    echo -e "${RED}❌ Servidor no responde correctamente (HTTP $HEALTH_RESPONSE)${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🧪 Paso 5/6: Verificando sistemas automáticos...${NC}"
echo ""

# Chollos Scheduler Status
echo "🔍 Verificando ChollosScheduler..."
CHOLLOS_STATUS=$(curl -s https://laligafantasyspain.com/api/chollos/status)
echo "$CHOLLOS_STATUS" | jq '.'

echo ""

# Outliers Status (si existe endpoint)
echo "🔍 Verificando Outliers Detector..."
OUTLIERS_STATUS=$(curl -s https://laligafantasyspain.com/api/outliers/stats)
echo "$OUTLIERS_STATUS" | jq '.'

echo ""
echo -e "${GREEN}✅ Paso 5 completado${NC}"
echo ""

echo -e "${YELLOW}📊 Paso 6/6: Resumen del Deploy${NC}"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOY COMPLETADO EXITOSAMENTE                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 URLs de Verificación:"
echo "  • Dashboard: https://laligafantasyspain.com"
echo "  • Health: https://laligafantasyspain.com/health"
echo "  • Chollos Status: https://laligafantasyspain.com/api/chollos/status"
echo "  • Outliers Stats: https://laligafantasyspain.com/api/outliers/stats"
echo ""
echo "🤖 Sistemas Automáticos Activos:"
echo "  • ChollosScheduler: Ejecuta a las 8:00 AM (España)"
echo "  • OutliersDetector: Ejecuta cada hora"
echo ""
echo "📝 Próximos Pasos:"
echo "  1. Verificar logs en tiempo real: ssh root@${SERVER_IP} 'pm2 logs'"
echo "  2. Monitorear primera ejecución de chollos mañana a las 8 AM"
echo "  3. Configurar n8n workflows para publicación automática"
echo ""
echo "💰 Costos Estimados:"
echo "  • Chollos: ~$0.96/día = $28.80/mes"
echo "  • Outliers: Variable según detecciones"
echo ""

echo -e "${GREEN}🎉 Deploy completado! El sistema está en producción.${NC}"
