#!/bin/bash

################################################################################
# Fantasy La Liga Pro - Deploy Script para VPS OVH
#
# Este script automatiza el deploy completo en tu VPS OVH:
# - Instalación de dependencias (Node.js, PM2, Nginx)
# - Configuración de la aplicación
# - Setup de SSL con Let's Encrypt
# - Configuración de auto-restart
#
# IMPORTANTE: Ejecutar este script EN EL VPS, no en local
#
# Uso:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="laligafantasyspain.com"
APP_NAME="fantasy-laliga-pro"
APP_DIR="/var/www/${APP_NAME}"
NODE_VERSION="18"
USER="www-data"
EMAIL="laligafantasyspainpro@gmail.com"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

################################################################################
# 1. Check if running as root
################################################################################
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Este script debe ejecutarse como root. Usa: sudo ./deploy.sh"
    fi
    log "✓ Ejecutando como root"
}

################################################################################
# 2. Update system packages
################################################################################
update_system() {
    log "Actualizando paquetes del sistema..."
    apt-get update -y
    apt-get upgrade -y
    log "✓ Sistema actualizado"
}

################################################################################
# 3. Install Node.js
################################################################################
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_CURRENT_VERSION=$(node -v)
        log "Node.js ya instalado: ${NODE_CURRENT_VERSION}"
        return
    fi

    log "Instalando Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs

    NODE_VERSION_INSTALLED=$(node -v)
    NPM_VERSION_INSTALLED=$(npm -v)
    log "✓ Node.js ${NODE_VERSION_INSTALLED} instalado"
    log "✓ npm ${NPM_VERSION_INSTALLED} instalado"
}

################################################################################
# 4. Install PM2 (Process Manager)
################################################################################
install_pm2() {
    if command -v pm2 &> /dev/null; then
        log "PM2 ya instalado: $(pm2 -v)"
        return
    fi

    log "Instalando PM2..."
    npm install -g pm2
    pm2 startup systemd -u ${USER} --hp /home/${USER}
    log "✓ PM2 instalado y configurado para auto-start"
}

################################################################################
# 5. Install Nginx
################################################################################
install_nginx() {
    if command -v nginx &> /dev/null; then
        log "Nginx ya instalado: $(nginx -v 2>&1)"
        return
    fi

    log "Instalando Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    log "✓ Nginx instalado y ejecutándose"
}

################################################################################
# 6. Install Certbot (Let's Encrypt)
################################################################################
install_certbot() {
    if command -v certbot &> /dev/null; then
        log "Certbot ya instalado"
        return
    fi

    log "Instalando Certbot para SSL..."
    apt-get install -y certbot python3-certbot-nginx
    log "✓ Certbot instalado"
}

################################################################################
# 7. Install FFmpeg (required for video processing)
################################################################################
install_ffmpeg() {
    if command -v ffmpeg &> /dev/null; then
        log "FFmpeg ya instalado: $(ffmpeg -version | head -n1)"
        return
    fi

    log "Instalando FFmpeg..."
    apt-get install -y ffmpeg
    log "✓ FFmpeg instalado"
}

################################################################################
# 8. Install Git
################################################################################
install_git() {
    if command -v git &> /dev/null; then
        log "Git ya instalado: $(git --version)"
        return
    fi

    log "Instalando Git..."
    apt-get install -y git
    log "✓ Git instalado"
}

################################################################################
# 9. Create application directory
################################################################################
setup_app_directory() {
    log "Configurando directorio de aplicación: ${APP_DIR}"

    if [ ! -d "${APP_DIR}" ]; then
        mkdir -p ${APP_DIR}
        log "✓ Directorio ${APP_DIR} creado"
    else
        log "Directorio ${APP_DIR} ya existe"
    fi

    chown -R ${USER}:${USER} ${APP_DIR}
    log "✓ Permisos configurados para ${USER}"
}

################################################################################
# 10. Clone repository
################################################################################
clone_repository() {
    log "Clonando repositorio..."

    info "IMPORTANTE: Asegúrate de tener SSH keys configuradas en el servidor"
    info "O usa HTTPS con personal access token"

    read -p "URL del repositorio (SSH o HTTPS): " REPO_URL

    if [ -d "${APP_DIR}/.git" ]; then
        warn "Repositorio ya existe. Actualizando..."
        cd ${APP_DIR}
        sudo -u ${USER} git pull
    else
        cd /var/www
        sudo -u ${USER} git clone ${REPO_URL} ${APP_NAME}
    fi

    log "✓ Repositorio clonado/actualizado"
}

################################################################################
# 11. Install npm dependencies
################################################################################
install_dependencies() {
    log "Instalando dependencias npm..."
    cd ${APP_DIR}
    sudo -u ${USER} npm install --production
    log "✓ Dependencias instaladas"
}

################################################################################
# 12. Setup environment variables
################################################################################
setup_env() {
    log "Configurando variables de entorno..."

    if [ -f "${APP_DIR}/.env" ]; then
        warn ".env ya existe. ¿Sobrescribir? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log "Manteniendo .env existente"
            return
        fi
    fi

    info "Copia tu archivo .env local al servidor:"
    info "scp .env root@151.80.119.163:${APP_DIR}/.env"
    info ""
    info "O edita manualmente: nano ${APP_DIR}/.env"

    read -p "¿Continuar cuando .env esté configurado? (Enter para continuar)"

    if [ ! -f "${APP_DIR}/.env" ]; then
        error ".env no encontrado. Deploy abortado."
    fi

    # Ensure correct permissions
    chown ${USER}:${USER} ${APP_DIR}/.env
    chmod 600 ${APP_DIR}/.env

    log "✓ Variables de entorno configuradas"
}

################################################################################
# 13. Configure Nginx
################################################################################
configure_nginx() {
    log "Configurando Nginx para ${DOMAIN}..."

    NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"

    cat > ${NGINX_CONF} <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirect all HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logs
    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log /var/log/nginx/${APP_NAME}.error.log;

    # Max upload size for videos
    client_max_body_size 50M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts (important for VEO3 long requests)
        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;
    }

    # Serve static files directly
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root ${APP_DIR}/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve videos directly (if stored locally)
    location /output/veo3/ {
        alias ${APP_DIR}/output/veo3/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF

    # Enable site
    ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/

    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx configuration
    nginx -t || error "Nginx configuration test failed"

    systemctl reload nginx

    log "✓ Nginx configurado"
}

################################################################################
# 14. Setup SSL with Let's Encrypt
################################################################################
setup_ssl() {
    log "Configurando SSL con Let's Encrypt..."

    # First, temporarily configure Nginx without SSL for Certbot validation
    NGINX_CONF_TEMP="/etc/nginx/sites-available/${APP_NAME}.temp"

    cat > ${NGINX_CONF_TEMP} <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

    ln -sf ${NGINX_CONF_TEMP} /etc/nginx/sites-enabled/${APP_NAME}
    systemctl reload nginx

    # Obtain certificate
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL}

    if [ $? -eq 0 ]; then
        log "✓ SSL certificate obtenido"

        # Now apply the full configuration with SSL
        configure_nginx
    else
        error "Falló la obtención del certificado SSL"
    fi

    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer

    log "✓ Auto-renovación de SSL configurada"
}

################################################################################
# 15. Configure PM2
################################################################################
configure_pm2() {
    log "Configurando PM2..."

    cd ${APP_DIR}

    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

    chown ${USER}:${USER} ecosystem.config.js

    # Create logs directory
    mkdir -p ${APP_DIR}/logs
    chown -R ${USER}:${USER} ${APP_DIR}/logs

    # Start application with PM2
    sudo -u ${USER} pm2 delete ${APP_NAME} 2>/dev/null || true
    sudo -u ${USER} pm2 start ecosystem.config.js
    sudo -u ${USER} pm2 save

    log "✓ PM2 configurado y aplicación iniciada"
}

################################################################################
# 16. Setup firewall
################################################################################
setup_firewall() {
    log "Configurando firewall UFW..."

    if ! command -v ufw &> /dev/null; then
        apt-get install -y ufw
    fi

    # Allow SSH (important!)
    ufw allow 22/tcp

    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Enable firewall
    ufw --force enable

    log "✓ Firewall configurado"
}

################################################################################
# 17. Create deployment script for future updates
################################################################################
create_update_script() {
    log "Creando script de actualización..."

    cat > ${APP_DIR}/update.sh <<'EOF'
#!/bin/bash
# Script de actualización rápida

set -e

APP_DIR="/var/www/fantasy-laliga-pro"
USER="www-data"

echo "🔄 Actualizando Fantasy La Liga Pro..."

cd ${APP_DIR}

# Pull latest changes
echo "📥 Descargando últimos cambios..."
sudo -u ${USER} git pull

# Install dependencies
echo "📦 Instalando dependencias..."
sudo -u ${USER} npm install --production

# Restart PM2
echo "🔄 Reiniciando aplicación..."
sudo -u ${USER} pm2 restart fantasy-laliga-pro

echo "✅ Actualización completada!"
echo ""
echo "📊 Estado de la aplicación:"
sudo -u ${USER} pm2 status
EOF

    chmod +x ${APP_DIR}/update.sh
    chown ${USER}:${USER} ${APP_DIR}/update.sh

    log "✓ Script de actualización creado: ${APP_DIR}/update.sh"
}

################################################################################
# 18. Final checks and summary
################################################################################
final_checks() {
    log "Realizando verificaciones finales..."

    # Check if Node.js app is running
    if sudo -u ${USER} pm2 list | grep -q ${APP_NAME}; then
        log "✓ Aplicación ejecutándose en PM2"
    else
        warn "Aplicación no encontrada en PM2"
    fi

    # Check Nginx
    if systemctl is-active --quiet nginx; then
        log "✓ Nginx ejecutándose"
    else
        warn "Nginx no está ejecutándose"
    fi

    # Check SSL certificate
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        log "✓ Certificado SSL instalado"
    else
        warn "Certificado SSL no encontrado"
    fi
}

print_summary() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ DEPLOY COMPLETADO EXITOSAMENTE${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "   https://${DOMAIN}"
    echo "   https://www.${DOMAIN}"
    echo ""
    echo "📊 Comandos útiles:"
    echo "   Ver logs:        sudo -u ${USER} pm2 logs ${APP_NAME}"
    echo "   Estado app:      sudo -u ${USER} pm2 status"
    echo "   Reiniciar:       sudo -u ${USER} pm2 restart ${APP_NAME}"
    echo "   Actualizar app:  ${APP_DIR}/update.sh"
    echo ""
    echo "📁 Directorios importantes:"
    echo "   App:             ${APP_DIR}"
    echo "   Logs PM2:        ${APP_DIR}/logs/"
    echo "   Logs Nginx:      /var/log/nginx/${APP_NAME}.*.log"
    echo "   Logs Winston:    ${APP_DIR}/logs/ (dentro de la app)"
    echo ""
    echo "🔐 Certificado SSL:"
    echo "   Renovación automática configurada"
    echo "   Próxima renovación: $(certbot certificates | grep 'Expiry Date' | head -1)"
    echo ""
    echo "⚙️  Configuración Nginx:"
    echo "   /etc/nginx/sites-available/${APP_NAME}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configura tu DNS${NC}"
    echo "   Apunta ${DOMAIN} a la IP: $(curl -s ifconfig.me)"
    echo "   Tipo A: @ -> $(curl -s ifconfig.me)"
    echo "   Tipo A: www -> $(curl -s ifconfig.me)"
    echo ""
    echo -e "${BLUE}📝 Siguiente paso:${NC}"
    echo "   1. Configurar DNS en OVH"
    echo "   2. Esperar propagación DNS (5-30 min)"
    echo "   3. Visitar https://${DOMAIN}"
    echo ""
}

################################################################################
# Main execution
################################################################################
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Fantasy La Liga Pro - Automated Deployment Script"
    echo "  VPS: OVH vps-5d5eeeed.vps.ovh.net"
    echo "  Domain: ${DOMAIN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_root
    update_system
    install_nodejs
    install_pm2
    install_nginx
    install_certbot
    install_ffmpeg
    install_git
    setup_app_directory
    clone_repository
    install_dependencies
    setup_env
    setup_firewall
    configure_pm2
    configure_nginx
    setup_ssl
    create_update_script
    final_checks
    print_summary
}

# Run main function
main
