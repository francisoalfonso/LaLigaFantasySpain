#!/bin/bash

# Script para configurar autenticación HTTP básica en Nginx
# Uso: ./setup-auth.sh

set -e

echo "Configurando autenticación del dashboard..."

# Crear contraseña segura
PASSWORD="XCIolG9C4HodjOMA7zw3MA=="

# Crear archivo htpasswd
htpasswd -cb /etc/nginx/.htpasswd admin "$PASSWORD"

# Guardar credenciales
echo "GUARDA ESTAS CREDENCIALES:" > /root/admin-credentials.txt
echo "Usuario: admin" >> /root/admin-credentials.txt
echo "Contraseña: $PASSWORD" >> /root/admin-credentials.txt

# Actualizar configuración de Nginx
cat > /etc/nginx/sites-available/fantasy-laliga-pro << 'EOF'
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

    access_log /var/log/nginx/fantasy-laliga-pro.access.log;
    error_log /var/log/nginx/fantasy-laliga-pro.error.log;

    client_max_body_size 50M;

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

# Probar y recargar Nginx
nginx -t
systemctl reload nginx

echo ""
echo "=========================================="
echo "✅ AUTENTICACIÓN CONFIGURADA"
echo "=========================================="
echo "Usuario: admin"
echo "Contraseña: $PASSWORD"
echo "=========================================="
echo ""
echo "Ahora https://laligafantasyspain.com pedirá usuario y contraseña"
echo "Credenciales guardadas en: /root/admin-credentials.txt"
