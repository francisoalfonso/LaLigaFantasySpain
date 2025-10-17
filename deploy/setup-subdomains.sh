#!/bin/bash

# Script para configurar subdominios y landing page
# Uso: bash setup-subdomains.sh

set -e

echo "=========================================="
echo "Configurando arquitectura de subdominios"
echo "=========================================="
echo ""

# 1. Configurar admin.laligafantasyspain.com (dashboard actual)
echo "1. Configurando admin.laligafantasyspain.com..."

cat > /etc/nginx/sites-available/admin-fantasy-laliga-pro << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name admin.laligafantasyspain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.laligafantasyspain.com;

    ssl_certificate /etc/letsencrypt/live/admin.laligafantasyspain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.laligafantasyspain.com/privkey.pem;

    access_log /var/log/nginx/admin-fantasy-laliga-pro.access.log;
    error_log /var/log/nginx/admin-fantasy-laliga-pro.error.log;

    client_max_body_size 50M;

    # Autenticación HTTP básica
    auth_basic "Fantasy La Liga - Admin Dashboard";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;
    }
}
EOF

# 2. Crear directorio para landing page pública
echo "2. Creando directorio para landing page..."
mkdir -p /var/www/landing-page

# 3. Crear landing page simple
echo "3. Creando landing page temporal..."
cat > /var/www/landing-page/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fantasy La Liga Spain - Próximamente</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .container {
            text-align: center;
            padding: 2rem;
            max-width: 800px;
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .logo {
            font-size: 4rem;
            margin-bottom: 2rem;
        }

        .coming-soon {
            background: rgba(255,255,255,0.2);
            padding: 1rem 2rem;
            border-radius: 50px;
            display: inline-block;
            margin-top: 1rem;
            backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }

            p {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚽</div>
        <h1>Fantasy La Liga Spain</h1>
        <p>La mejor plataforma de análisis para Fantasy La Liga</p>
        <div class="coming-soon">
            🚀 Próximamente
        </div>
    </div>
</body>
</html>
HTMLEOF

# 4. Configurar laligafantasyspain.com (landing page pública)
echo "4. Configurando laligafantasyspain.com..."

cat > /etc/nginx/sites-available/landing-fantasy-laliga << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name laligafantasyspain.com www.laligafantasyspain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name laligafantasyspain.com www.laligafantasyspain.com;

    ssl_certificate /etc/letsencrypt/live/laligafantasyspain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/laligafantasyspain.com/privkey.pem;

    access_log /var/log/nginx/landing-fantasy-laliga.access.log;
    error_log /var/log/nginx/landing-fantasy-laliga.error.log;

    root /var/www/landing-page;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# 5. Activar configuraciones
echo "5. Activando configuraciones..."
rm -f /etc/nginx/sites-enabled/fantasy-laliga-pro
ln -sf /etc/nginx/sites-available/admin-fantasy-laliga-pro /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/landing-fantasy-laliga /etc/nginx/sites-enabled/

# 6. Probar configuración de Nginx
echo "6. Probando configuración de Nginx..."
nginx -t

# 7. Obtener certificado SSL para admin subdomain
echo "7. Esperando propagación DNS (30 segundos)..."
sleep 30

echo "8. Obteniendo certificado SSL para admin.laligafantasyspain.com..."
certbot --nginx -d admin.laligafantasyspain.com --non-interactive --agree-tos -m laligafantasyspainpro@gmail.com

# 8. Recargar Nginx
echo "9. Recargando Nginx..."
systemctl reload nginx

echo ""
echo "=========================================="
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "📍 Sitios configurados:"
echo ""
echo "🌐 Landing Page Pública:"
echo "   https://laligafantasyspain.com"
echo "   https://www.laligafantasyspain.com"
echo ""
echo "🔐 Dashboard Administrativo:"
echo "   https://admin.laligafantasyspain.com"
echo "   Usuario: admin"
echo "   Contraseña: (ver /root/admin-credentials.txt)"
echo ""
echo "=========================================="
echo ""
echo "Espera 5-10 minutos para que el DNS se propague completamente"
