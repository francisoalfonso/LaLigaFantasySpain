#!/bin/bash

###############################################################################
# Script de Diagnóstico y Reparación de n8n
# Fecha: 16 Oct 2025
# Arregla problemas de conexión entre Nginx y n8n
###############################################################################

set -e

echo "🔧 Diagnóstico y reparación de n8n"
echo "===================================="
echo ""

# 1. Verificar estado del contenedor
echo "1️⃣ Verificando contenedor n8n..."
CONTAINER_STATUS=$(docker ps --filter name=n8n --format "{{.Status}}")

if [[ -z "$CONTAINER_STATUS" ]]; then
    echo "❌ Contenedor n8n no está corriendo"
    echo "   Iniciando contenedor..."

    docker start n8n 2>/dev/null || docker run -d \
      --name n8n \
      --restart always \
      -p 127.0.0.1:5678:5678 \
      -e N8N_BASIC_AUTH_ACTIVE=true \
      -e N8N_BASIC_AUTH_USER=admin \
      -e N8N_BASIC_AUTH_PASSWORD=FantasyLaLiga2025! \
      -e N8N_HOST=n8n.laligafantasyspain.com \
      -e N8N_PROTOCOL=https \
      -e N8N_PORT=443 \
      -e WEBHOOK_URL=https://n8n.laligafantasyspain.com/ \
      -e GENERIC_TIMEZONE=Europe/Madrid \
      -v /root/.n8n:/home/node/.n8n \
      n8nio/n8n:latest

    echo "⏳ Esperando 20 segundos a que n8n inicie..."
    sleep 20
else
    echo "✅ Contenedor n8n está corriendo: $CONTAINER_STATUS"
fi

echo ""

# 2. Verificar puerto interno
echo "2️⃣ Verificando puerto interno..."
INTERNAL_PORT=$(docker port n8n | grep 5678)

if [[ -z "$INTERNAL_PORT" ]]; then
    echo "❌ Puerto 5678 no está mapeado correctamente"
    echo "   Recreando contenedor..."
    docker stop n8n
    docker rm n8n

    docker run -d \
      --name n8n \
      --restart always \
      -p 127.0.0.1:5678:5678 \
      -e N8N_BASIC_AUTH_ACTIVE=true \
      -e N8N_BASIC_AUTH_USER=admin \
      -e N8N_BASIC_AUTH_PASSWORD=FantasyLaLiga2025! \
      -e N8N_HOST=n8n.laligafantasyspain.com \
      -e N8N_PROTOCOL=https \
      -e N8N_PORT=443 \
      -e WEBHOOK_URL=https://n8n.laligafantasyspain.com/ \
      -e GENERIC_TIMEZONE=Europe/Madrid \
      -v /root/.n8n:/home/node/.n8n \
      n8nio/n8n:latest

    sleep 20
else
    echo "✅ Puerto mapeado correctamente: $INTERNAL_PORT"
fi

echo ""

# 3. Test de conectividad local
echo "3️⃣ Probando conectividad local..."
sleep 5

if curl -s http://127.0.0.1:5678 > /dev/null 2>&1; then
    echo "✅ n8n responde en localhost:5678"
else
    echo "⚠️  n8n no responde inmediatamente (puede ser normal)"
    echo "   Esperando 10 segundos más..."
    sleep 10

    if curl -s http://127.0.0.1:5678 > /dev/null 2>&1; then
        echo "✅ n8n ahora responde en localhost:5678"
    else
        echo "❌ n8n aún no responde"
        echo "   Logs recientes:"
        docker logs n8n --tail 10
    fi
fi

echo ""

# 4. Verificar configuración de Nginx
echo "4️⃣ Verificando configuración de Nginx..."

if [[ -f /etc/nginx/sites-available/n8n-fantasy-laliga ]]; then
    echo "✅ Archivo de configuración existe"

    # Verificar que tiene el proxy_pass correcto
    if grep -q "proxy_pass http://127.0.0.1:5678" /etc/nginx/sites-available/n8n-fantasy-laliga; then
        echo "✅ Configuración proxy_pass correcta"
    else
        echo "❌ Configuración proxy_pass incorrecta, corrigiendo..."

        # Backup
        cp /etc/nginx/sites-available/n8n-fantasy-laliga /etc/nginx/sites-available/n8n-fantasy-laliga.bak

        # Recrear configuración
        cat > /etc/nginx/sites-available/n8n-fantasy-laliga << 'EOF'
server {
    server_name n8n.laligafantasyspain.com;

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

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/n8n.laligafantasyspain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.laligafantasyspain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = n8n.laligafantasyspain.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name n8n.laligafantasyspain.com;
    return 404;
}
EOF

        echo "✅ Configuración recreada"
    fi
else
    echo "❌ Archivo de configuración no existe"
    exit 1
fi

echo ""

# 5. Test de configuración de Nginx
echo "5️⃣ Validando configuración de Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de Nginx válida"
else
    echo "❌ Error en configuración de Nginx"
    exit 1
fi

echo ""

# 6. Recargar Nginx
echo "6️⃣ Recargando Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx recargado exitosamente"
else
    echo "❌ Error al recargar Nginx"
    exit 1
fi

echo ""

# 7. Test final
echo "7️⃣ Test final de acceso..."
sleep 3

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://n8n.laligafantasyspain.com --insecure)

echo "   HTTP Status: $RESPONSE"

if [[ "$RESPONSE" == "200" ]] || [[ "$RESPONSE" == "401" ]]; then
    echo "✅ n8n está accesible vía HTTPS"
elif [[ "$RESPONSE" == "502" ]]; then
    echo "⚠️  Error 502 - n8n aún no responde"
    echo "   Posibles causas:"
    echo "   - n8n aún está iniciándose (esperar 1-2 minutos)"
    echo "   - Problema de permisos en /root/.n8n"
    echo ""
    echo "   Verificando logs de n8n:"
    docker logs n8n --tail 20
else
    echo "⚠️  Status inesperado: $RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Resumen:"
echo "   URL: https://n8n.laligafantasyspain.com"
echo "   Usuario: admin"
echo "   Password: FantasyLaLiga2025!"
echo ""
echo "🔍 Comandos útiles:"
echo "   docker ps | grep n8n           # Ver estado del contenedor"
echo "   docker logs n8n --tail 50      # Ver logs de n8n"
echo "   systemctl status nginx         # Ver estado de Nginx"
echo ""
echo "Si aún ves error 502, espera 2 minutos y refresca el navegador."
echo "n8n puede tardar en iniciar completamente."
echo ""
