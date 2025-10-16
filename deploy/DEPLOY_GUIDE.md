# 🚀 Guía de Deploy - Fantasy La Liga Pro

**VPS**: OVH vps-5d5eeeed.vps.ovh.net **IP**: 151.80.119.163 **Dominio**:
laligafantasyspain.com **Ubicación**: Estrasburgo, Francia

---

## 📋 Pre-Requisitos

### 1. Acceso al VPS

```bash
ssh root@151.80.119.163
```

### 2. DNS Configurado en OVH

Antes de ejecutar el deploy, configura DNS:

```
Tipo A:   @     →  151.80.119.163
Tipo A:   www   →  151.80.119.163
```

**Validar DNS** (esperar 5-30 min propagación):

```bash
dig laligafantasyspain.com
dig www.laligafantasyspain.com
```

### 3. Variables de Entorno Preparadas

Asegúrate de tener listo tu archivo `.env` local con todas las API keys.

---

## 🎯 Opción 1: Deploy Automatizado (Recomendado)

### Paso 1: Subir script al VPS

```bash
# Desde tu máquina local
scp deploy/deploy.sh root@151.80.119.163:/root/
```

### Paso 2: Conectar al VPS

```bash
ssh root@151.80.119.163
```

### Paso 3: Editar configuración

```bash
nano /root/deploy.sh
```

**Cambiar**:

- Línea 30: `EMAIL="tu-email@ejemplo.com"` → Tu email real
- Cuando te pregunte la URL del repo, usar:
    - SSH: `git@github.com:tu-usuario/fantasy-laliga-pro.git`
    - HTTPS: `https://github.com/tu-usuario/fantasy-laliga-pro.git`

### Paso 4: Ejecutar deploy

```bash
chmod +x /root/deploy.sh
sudo /root/deploy.sh
```

**El script hará automáticamente**:

- ✅ Instalar Node.js 18
- ✅ Instalar PM2
- ✅ Instalar Nginx
- ✅ Instalar Certbot (Let's Encrypt)
- ✅ Instalar FFmpeg
- ✅ Clonar tu repositorio
- ✅ Instalar dependencias
- ✅ Configurar Nginx con SSL
- ✅ Obtener certificado SSL
- ✅ Iniciar app con PM2
- ✅ Configurar auto-restart

**Duración**: 10-15 minutos

### Paso 5: Subir archivo .env

```bash
# Durante el deploy, cuando te lo pida:
# Desde otra terminal local:
scp .env root@151.80.119.163:/var/www/fantasy-laliga-pro/.env
```

### Paso 6: Validar Deploy

```bash
# En el VPS
pm2 status
pm2 logs fantasy-laliga-pro

# Desde tu navegador
https://laligafantasyspain.com
```

---

## 🛠️ Opción 2: Deploy Manual (Paso a Paso)

### 1. Actualizar Sistema

```bash
ssh root@151.80.119.163
apt-get update && apt-get upgrade -y
```

### 2. Instalar Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node -v  # Verificar instalación
npm -v
```

### 3. Instalar PM2

```bash
npm install -g pm2
pm2 startup systemd
```

### 4. Instalar Nginx

```bash
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 5. Instalar Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
```

### 6. Instalar FFmpeg

```bash
apt-get install -y ffmpeg
```

### 7. Instalar Git

```bash
apt-get install -y git
```

### 8. Crear Directorio App

```bash
mkdir -p /var/www/fantasy-laliga-pro
cd /var/www/fantasy-laliga-pro
```

### 9. Clonar Repositorio

```bash
# SSH (requiere SSH key configurada)
git clone git@github.com:tu-usuario/fantasy-laliga-pro.git .

# O HTTPS (requiere personal access token)
git clone https://github.com/tu-usuario/fantasy-laliga-pro.git .
```

### 10. Instalar Dependencias

```bash
npm install --production
```

### 11. Configurar Variables de Entorno

```bash
# Desde tu máquina local
scp .env root@151.80.119.163:/var/www/fantasy-laliga-pro/.env

# En el VPS
chmod 600 /var/www/fantasy-laliga-pro/.env
```

### 12. Configurar Nginx

```bash
nano /etc/nginx/sites-available/fantasy-laliga-pro
```

**Pegar** (ver archivo `nginx.conf` en este directorio)

```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/fantasy-laliga-pro /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Eliminar sitio default

# Test configuración
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 13. Obtener Certificado SSL

```bash
certbot --nginx -d laligafantasyspain.com -d www.laligafantasyspain.com
```

**Seguir instrucciones**:

- Email: tu-email@ejemplo.com
- Aceptar términos: Y
- Redirect HTTP a HTTPS: 2 (Yes)

### 14. Iniciar App con PM2

```bash
cd /var/www/fantasy-laliga-pro
pm2 start ecosystem.config.js
pm2 save
```

### 15. Configurar Firewall

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 16. Verificar Todo Funciona

```bash
pm2 status
pm2 logs fantasy-laliga-pro
curl https://laligafantasyspain.com
```

---

## 📊 Post-Deploy

### Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs fantasy-laliga-pro

# Ver status
pm2 status

# Reiniciar app
pm2 restart fantasy-laliga-pro

# Detener app
pm2 stop fantasy-laliga-pro

# Ver métricas
pm2 monit

# Ver logs de Nginx
tail -f /var/log/nginx/fantasy-laliga-pro.access.log
tail -f /var/log/nginx/fantasy-laliga-pro.error.log
```

### Actualizar App (Futuras Actualizaciones)

```bash
# Método 1: Script automático
/var/www/fantasy-laliga-pro/update.sh

# Método 2: Manual
cd /var/www/fantasy-laliga-pro
git pull
npm install --production
pm2 restart fantasy-laliga-pro
```

---

## 🔧 Troubleshooting

### Problema: SSL no funciona

```bash
# Verificar DNS apunta al VPS
dig laligafantasyspain.com

# Verificar Certbot
certbot certificates

# Renovar manualmente
certbot renew --dry-run
```

### Problema: App no arranca

```bash
# Ver logs detallados
pm2 logs fantasy-laliga-pro --lines 100

# Ver logs de Winston
tail -f /var/www/fantasy-laliga-pro/logs/combined.log

# Verificar .env
cat /var/www/fantasy-laliga-pro/.env
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar app está corriendo
pm2 status

# Verificar puerto 3000
netstat -tlnp | grep 3000

# Ver logs Nginx
tail -f /var/log/nginx/fantasy-laliga-pro.error.log
```

### Problema: Out of Memory

```bash
# Ver uso memoria
free -h
pm2 monit

# Aumentar max memory PM2
pm2 restart fantasy-laliga-pro --max-memory-restart 1500M
pm2 save
```

---

## 🔐 Seguridad

### SSH Hardening (Recomendado)

```bash
# 1. Crear usuario no-root
adduser deploy
usermod -aG sudo deploy

# 2. Configurar SSH key
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Deshabilitar login root
nano /etc/ssh/sshd_config
# Cambiar: PermitRootLogin no
systemctl restart sshd

# 4. Futuras conexiones
ssh deploy@151.80.119.163
sudo su  # Si necesitas root
```

### Rate Limiting (Ya configurado en app)

- API endpoints: 100 req/15min
- VEO3 endpoints: 5 req/hora
- API-Sports: 75 req/min

### Backups Automáticos

```bash
# Crear script de backup
nano /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
APP_DIR="/var/www/fantasy-laliga-pro"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p ${BACKUP_DIR}

# Backup .env
cp ${APP_DIR}/.env ${BACKUP_DIR}/.env.${DATE}

# Backup database (if local)
# pg_dump ... > ${BACKUP_DIR}/db.${DATE}.sql

# Backup videos (sample)
tar -czf ${BACKUP_DIR}/videos.${DATE}.tar.gz ${APP_DIR}/output/veo3/sessions --exclude='*.mp4' # Solo progress.json

# Keep last 7 days
find ${BACKUP_DIR} -mtime +7 -delete

echo "Backup completado: ${DATE}"
```

```bash
chmod +x /root/backup.sh

# Agregar a crontab (diario 3am)
crontab -e
0 3 * * * /root/backup.sh
```

---

## 📈 Monitoring

### Setup Uptime Monitoring (UptimeRobot - Gratis)

1. Ir a https://uptimerobot.com
2. Crear cuenta
3. Añadir monitor:
    - Type: HTTPS
    - URL: https://laligafantasyspain.com/health
    - Interval: 5 minutos
    - Alert: Email

### Setup Error Tracking (Sentry - Gratis)

```bash
cd /var/www/fantasy-laliga-pro
npm install @sentry/node
```

**Añadir a `backend/server.js`** (inicio del archivo):

```javascript
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: 'production',
        tracesSampleRate: 0.1
    });
}
```

**Añadir a `.env`**:

```
SENTRY_DSN=https://...@sentry.io/...
```

---

## 💰 Costos Estimados

| Servicio                 | Costo        |
| ------------------------ | ------------ |
| VPS OVH (ya tienes)      | €3-5/mes     |
| Dominio OVH (ya tienes)  | €0           |
| APIs (API-Sports + VEO3) | $48/mes      |
| **TOTAL**                | **~$53/mes** |

**Ahorro vs Railway**: $15/mes 🎉

---

## ✅ Checklist Post-Deploy

- [ ] App accesible en https://laligafantasyspain.com
- [ ] SSL válido (candado verde en navegador)
- [ ] Health check funciona: https://laligafantasyspain.com/health
- [ ] PM2 muestra app "online"
- [ ] Logs sin errores críticos
- [ ] Firewall UFW habilitado
- [ ] Certificado SSL auto-renewal configurado
- [ ] DNS propagado correctamente
- [ ] Backups configurados (opcional)
- [ ] Monitoring configurado (UptimeRobot)

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa logs: `pm2 logs fantasy-laliga-pro`
2. Revisa Nginx: `tail -f /var/log/nginx/fantasy-laliga-pro.error.log`
3. Revisa Winston: `tail -f /var/www/fantasy-laliga-pro/logs/combined.log`
4. Consulta este documento
5. Revisar docs: `docs/PRODUCTION_LAUNCH_PLAN.md`

---

**Última actualización**: 16 Oct 2025 **Mantenido por**: Claude Code + Fran
