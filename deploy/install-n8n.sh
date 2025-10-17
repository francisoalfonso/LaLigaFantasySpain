#!/bin/bash

###############################################################################
# Script de Instalación de n8n en VPS OVH
# Fecha: 16 Oct 2025
# Instala n8n con Docker + Nginx + SSL automáticamente
###############################################################################

set -e  # Salir si hay error

echo "🚀 Instalación de n8n en VPS OVH"
echo "=================================="
echo ""

# Variables
DOMAIN="n8n.laligafantasyspain.com"
N8N_PORT=5678
N8N_DATA_DIR="/root/.n8n"
N8N_BASIC_AUTH_USER="admin"
N8N_BASIC_AUTH_PASSWORD="FantasyLaLiga2025!"

echo "📋 Configuración:"
echo "   Domain: $DOMAIN"
echo "   Port: $N8N_PORT"
echo "   Data: $N8N_DATA_DIR"
echo ""

# 1. Verificar que estamos como root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Este script debe ejecutarse como root"
   echo "   Ejecuta: sudo su - && bash install-n8n.sh"
   exit 1
fi

echo "✅ Usuario root verificado"
echo ""

# 2. Instalar Docker si no está
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release

    # Añadir repositorio oficial de Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    echo "✅ Docker instalado"
else
    echo "✅ Docker ya instalado"
fi

echo ""

# 3. Crear directorio de datos n8n
echo "📁 Creando directorio de datos..."
mkdir -p $N8N_DATA_DIR
chmod -R 755 $N8N_DATA_DIR
echo "✅ Directorio creado: $N8N_DATA_DIR"
echo ""

# 4. Detener contenedor anterior si existe
if docker ps -a | grep -q n8n; then
    echo "🛑 Deteniendo contenedor n8n anterior..."
    docker stop n8n 2>/dev/null || true
    docker rm n8n 2>/dev/null || true
    echo "✅ Contenedor anterior eliminado"
fi

echo ""

# 5. Iniciar n8n con Docker
echo "🐳 Iniciando contenedor n8n..."
docker run -d \
  --name n8n \
  --restart always \
  -p 127.0.0.1:$N8N_PORT:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=$N8N_BASIC_AUTH_USER \
  -e N8N_BASIC_AUTH_PASSWORD=$N8N_BASIC_AUTH_PASSWORD \
  -e N8N_HOST=$DOMAIN \
  -e N8N_PROTOCOL=https \
  -e N8N_PORT=443 \
  -e WEBHOOK_URL=https://$DOMAIN/ \
  -e GENERIC_TIMEZONE=Europe/Madrid \
  -v $N8N_DATA_DIR:/home/node/.n8n \
  n8nio/n8n:latest

echo "✅ Contenedor n8n iniciado"
echo ""

# 6. Esperar a que n8n inicie
echo "⏳ Esperando a que n8n inicie (15 segundos)..."
sleep 15

# Verificar que n8n está corriendo
if docker ps | grep -q n8n; then
    echo "✅ n8n está corriendo"
else
    echo "❌ Error: n8n no se inició correctamente"
    echo "   Logs:"
    docker logs n8n
    exit 1
fi

echo ""

# 7. Configurar Nginx
echo "🌐 Configurando Nginx..."

# Crear configuración de Nginx para n8n
cat > /etc/nginx/sites-available/n8n-fantasy-laliga << 'EOF'
server {
    listen 80;
    server_name n8n.laligafantasyspain.com;

    # Redirigir a HTTPS (después de SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Headers para n8n
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout para webhooks largos
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Crear symlink
ln -sf /etc/nginx/sites-available/n8n-fantasy-laliga /etc/nginx/sites-enabled/

# Test de configuración
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de Nginx válida"
    systemctl reload nginx
    echo "✅ Nginx recargado"
else
    echo "❌ Error en configuración de Nginx"
    exit 1
fi

echo ""

# 8. Configurar DNS
echo "⚠️  IMPORTANTE: Configurar DNS antes de SSL"
echo ""
echo "Ve a tu panel de OVH (https://www.ovh.com/manager/)"
echo "Y añade este registro DNS:"
echo ""
echo "   Tipo: A"
echo "   Nombre: n8n"
echo "   Valor: 151.80.119.163"
echo "   TTL: 3600"
echo ""
echo "Después ejecuta: certbot --nginx -d n8n.laligafantasyspain.com"
echo ""

# 9. Generar API Token
echo "📝 Generando configuración de API Token..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ n8n INSTALADO EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 ACCESO A n8n:"
echo "   URL: http://n8n.laligafantasyspain.com"
echo "   Usuario: $N8N_BASIC_AUTH_USER"
echo "   Password: $N8N_BASIC_AUTH_PASSWORD"
echo ""
echo "⚠️  PRÓXIMOS PASOS:"
echo ""
echo "1. Configurar DNS en OVH:"
echo "   - Ir a: https://www.ovh.com/manager/"
echo "   - Añadir registro A: n8n → 151.80.119.163"
echo "   - Esperar 5-10 minutos"
echo ""
echo "2. Configurar SSL:"
echo "   certbot --nginx -d n8n.laligafantasyspain.com"
echo ""
echo "3. Acceder a n8n y generar API Token:"
echo "   - Ir a: http://n8n.laligafantasyspain.com"
echo "   - Login con admin / $N8N_BASIC_AUTH_PASSWORD"
echo "   - Settings → API → Create API Key"
echo "   - Copiar token y actualizar .env.n8n en Mac"
echo ""
echo "4. Verificar que n8n esté corriendo:"
echo "   docker ps | grep n8n"
echo "   docker logs n8n"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Guardar credenciales
cat > /root/n8n-credentials.txt << EOF
n8n Credentials - Fantasy La Liga
==================================

URL: http://n8n.laligafantasyspain.com
Usuario: $N8N_BASIC_AUTH_USER
Password: $N8N_BASIC_AUTH_PASSWORD

Después de configurar DNS y SSL:
URL: https://n8n.laligafantasyspain.com

Docker Container:
docker ps | grep n8n
docker logs n8n
docker restart n8n

Data Directory: $N8N_DATA_DIR
EOF

echo "💾 Credenciales guardadas en: /root/n8n-credentials.txt"
echo ""
echo "✅ Instalación completa!"
