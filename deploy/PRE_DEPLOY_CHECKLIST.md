# ✅ Pre-Deploy Checklist - Fantasy La Liga Pro

**Fecha**: 16 Oct 2025 **VPS**: OVH vps-5d5eeeed.vps.ovh.net (151.80.119.163)
**Dominio**: laligafantasyspain.com **n8n**: Ya ejecutándose en mismo VPS ✅

---

## 🎯 Resumen Ejecutivo

**Ventajas de tu setup**:

- ✅ VPS ya pagado y activo
- ✅ n8n ya configurado en mismo servidor
- ✅ Dominio ya comprado
- ✅ 2 GB RAM suficiente para Node.js + n8n
- ✅ Sin costos adicionales de hosting

**Costo total mensual**: ~$53 ($48 APIs + €3-5 VPS)

---

## 📋 Checklist Pre-Deploy

### **1. Configuración Local** (Antes de deploy)

#### 1.1 Código Preparado

- [ ] **Git repositorio actualizado**

    ```bash
    git status  # Sin cambios pendientes
    git push origin main  # Todo pusheado
    ```

- [ ] **Variables de entorno listas**

    ```bash
    # Verificar .env tiene todas las keys
    grep -E "API_FOOTBALL_KEY|KIE_AI_API_KEY|GOOGLE_AI_STUDIO_KEY" .env
    ```

- [ ] **.gitignore correcto**
    ```bash
    # Verificar que .env NO está en git
    git check-ignore .env  # Debe devolver: .env
    ```

#### 1.2 Tests Locales

- [ ] **Servidor arranca sin errores**

    ```bash
    npm run dev
    # Debe mostrar: ✅ Servidor Fantasy La Liga iniciado
    ```

- [ ] **Health check funciona**

    ```bash
    curl http://localhost:3000/health
    # Debe retornar: {"status":"ok",...}
    ```

- [ ] **Base de datos conecta**

    ```bash
    npm run db:test
    # Debe mostrar: ✅ Conexión exitosa
    ```

- [ ] **VEO3 credentials válidas**
    ```bash
    # Hacer un test simple de VEO3
    # Verificar logs: [VEO3Client] ✅ Pool con 1 sola imagen
    ```

#### 1.3 Dependencies

- [ ] **No hay vulnerabilidades críticas**

    ```bash
    npm audit --production
    # Si hay HIGH/CRITICAL: npm audit fix
    ```

- [ ] **package.json actualizado**
    ```bash
    # Verificar "engines" especifica Node.js 18+
    grep '"engines"' package.json
    ```

---

### **2. Configuración VPS** (En el servidor)

#### 2.1 Acceso SSH

- [ ] **Puedes conectar al VPS**

    ```bash
    ssh root@151.80.119.163
    # Debe conectar sin errores
    ```

- [ ] **Verificar espacio disponible**

    ```bash
    df -h
    # Debe tener >5 GB libres en /
    ```

- [ ] **Verificar memoria disponible**
    ```bash
    free -h
    # Debe tener >500 MB disponibles
    ```

#### 2.2 n8n Ya Configurado

- [ ] **n8n está corriendo**

    ```bash
    pm2 list | grep n8n
    # Debe mostrar: n8n | online
    ```

- [ ] **n8n accesible**

    ```bash
    curl http://localhost:5678  # O el puerto que uses
    # Debe retornar HTML de n8n
    ```

- [ ] **Revisar uso de recursos n8n**
    ```bash
    pm2 monit
    # Ver cuánta RAM usa n8n (probablemente 200-300 MB)
    ```

**Importante**: Tu app usará ~500 MB RAM, n8n ~300 MB

- Total: ~800 MB / 2 GB disponibles = ✅ **Suficiente**

#### 2.3 Puertos Libres

- [ ] **Puerto 3000 disponible**

    ```bash
    netstat -tlnp | grep 3000
    # NO debe retornar nada (puerto libre)
    ```

- [ ] **Puerto 80 y 443 disponibles**
    ```bash
    netstat -tlnp | grep -E ':80|:443'
    # Si Nginx ya está: verificar no hay conflicto
    ```

---

### **3. DNS Configuration** (En panel OVH)

#### 3.1 Configurar Registros DNS

- [ ] **Registro A para dominio principal**

    ```
    Tipo: A
    Nombre: @
    Valor: 151.80.119.163
    TTL: 3600
    ```

- [ ] **Registro A para www**
    ```
    Tipo: A
    Nombre: www
    Valor: 151.80.119.163
    TTL: 3600
    ```

#### 3.2 Validar DNS

- [ ] **DNS propagado**

    ```bash
    # Desde tu máquina local
    dig laligafantasyspain.com +short
    # Debe retornar: 151.80.119.163

    dig www.laligafantasyspain.com +short
    # Debe retornar: 151.80.119.163
    ```

**Tiempo de propagación**: 5-30 minutos

---

### **4. Preparación Archivos Deploy**

#### 4.1 Editar Scripts

- [ ] **Actualizar deploy.sh**

    ```bash
    nano deploy/deploy.sh
    # Línea 30: EMAIL="tu-email-real@ejemplo.com"
    ```

- [ ] **Actualizar ecosystem.config.js**
    ```bash
    nano deploy/ecosystem.config.js
    # Línea 43: repo: 'git@github.com:TU-USUARIO/TU-REPO.git'
    ```

#### 4.2 Subir Scripts al VPS

- [ ] **Transferir deploy.sh**

    ```bash
    scp deploy/deploy.sh root@151.80.119.163:/root/
    ```

- [ ] **Transferir ecosystem.config.js** (opcional, el script lo crea)
    ```bash
    scp deploy/ecosystem.config.js root@151.80.119.163:/root/
    ```

---

### **5. Variables de Entorno**

#### 5.1 Preparar .env para Producción

- [ ] **Copiar .env local**

    ```bash
    cp .env .env.production
    ```

- [ ] **Editar para producción**

    ```bash
    nano .env.production
    ```

    **Cambios importantes**:

    ```bash
    NODE_ENV=production
    PORT=3000
    HOST=localhost

    # URLs deben apuntar a dominio producción
    # Ejemplo: CLIENT_URL=https://laligafantasyspain.com
    ```

#### 5.2 Validar Todas las Keys

- [ ] **API-Sports**

    ```bash
    grep API_FOOTBALL_KEY .env.production
    ```

- [ ] **VEO3/KIE.ai**

    ```bash
    grep KIE_AI_API_KEY .env.production
    ```

- [ ] **Google AI Studio**

    ```bash
    grep GOOGLE_AI_STUDIO_KEY .env.production
    ```

- [ ] **Supabase**

    ```bash
    grep -E "SUPABASE_PROJECT_URL|SUPABASE_SERVICE_ROLE_KEY" .env.production
    ```

- [ ] **OpenAI** (para análisis competitivo)

    ```bash
    grep OPENAI_API_KEY .env.production
    ```

- [ ] **Nano Banana**
    ```bash
    grep NANO_BANANA_API_KEY .env.production
    ```

---

### **6. GitHub Repository**

#### 6.1 Configurar SSH en VPS

- [ ] **Generar SSH key en VPS** (si no existe)

    ```bash
    ssh root@151.80.119.163
    ssh-keygen -t ed25519 -C "vps-ovh-fantasy"
    # Presionar Enter 3 veces (sin passphrase)

    cat ~/.ssh/id_ed25519.pub
    # Copiar la clave pública
    ```

- [ ] **Añadir SSH key a GitHub**
    - Ir a: https://github.com/settings/keys
    - Click "New SSH key"
    - Pegar la clave pública
    - Título: "VPS OVH - Fantasy La Liga"

- [ ] **Probar conexión**
    ```bash
    ssh -T git@github.com
    # Debe mostrar: Hi username! You've successfully authenticated
    ```

#### 6.2 Repositorio Listo

- [ ] **Repo es privado** (por seguridad)
- [ ] **Branch main actualizado**
- [ ] **No hay .env en el repo** (verificar)
- [ ] **README.md actualizado** (opcional)

---

### **7. Recursos del VPS**

#### 7.1 Optimizar para Bajo Consumo

Dado que compartes el VPS con n8n:

- [ ] **Limitar memoria PM2**
    - ecosystem.config.js ya tiene: `max_memory_restart: '1G'`
    - Esto reinicia la app si excede 1 GB

- [ ] **Configurar swap** (si no existe)
    ```bash
    # En el VPS
    swapon --show
    # Si no hay swap:
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```

#### 7.2 Limpiar Espacio

- [ ] **Eliminar paquetes innecesarios**

    ```bash
    apt-get autoremove -y
    apt-get autoclean
    ```

- [ ] **Verificar espacio libre**
    ```bash
    df -h
    # Debe tener >5 GB libres
    ```

---

### **8. Nginx + n8n Coexistencia**

#### 8.1 Verificar Configuración n8n

- [ ] **¿n8n usa Nginx?**

    ```bash
    ls /etc/nginx/sites-enabled/
    # Ver si hay configuración de n8n
    ```

- [ ] **¿n8n usa qué puerto?**
    ```bash
    netstat -tlnp | grep n8n
    # Anotar el puerto (probablemente 5678)
    ```

#### 8.2 Configuración Multi-Dominio

Si n8n usa un subdominio (ej: n8n.tudominio.com):

- [ ] **Configurar DNS para n8n** (si no existe)

    ```
    Tipo: A
    Nombre: n8n
    Valor: 151.80.119.163
    ```

- [ ] **Verificar Nginx no tiene conflicto**
    - El script deploy.sh creará config para laligafantasyspain.com
    - No debería afectar a n8n si usa otro dominio/puerto

---

### **9. Backups Pre-Deploy**

#### 9.1 Backup n8n (Antes de cambios)

- [ ] **Exportar workflows n8n**
    - Ir a n8n UI
    - Settings → Export workflows
    - Guardar JSON localmente

- [ ] **Backup credenciales n8n** (si aplica)
    - Depende de cómo tengas n8n configurado

#### 9.2 Backup Base de Datos

- [ ] **Backup Supabase**
    - Ir a Supabase Dashboard
    - Database → Backups
    - Crear snapshot manual (opcional, ya tiene automáticos)

---

### **10. Plan de Rollback**

#### 10.1 ¿Qué hacer si algo falla?

- [ ] **Documentado plan de rollback**
    - Si deploy falla: eliminar `/var/www/fantasy-laliga-pro`
    - Si Nginx rompe:
      `rm /etc/nginx/sites-enabled/fantasy-laliga-pro && systemctl reload nginx`
    - Si n8n se afecta: `pm2 restart n8n`

#### 10.2 Contactos de Emergencia

- [ ] **Acceso a panel OVH**
- [ ] **Acceso a consola VPS** (por si SSH falla)
- [ ] **Backup de .env local**

---

## 🚀 Orden de Ejecución Recomendado

### **Pre-Deploy** (Hoy - 1 hora)

1. ✅ Completar este checklist
2. ✅ Configurar DNS en OVH
3. ✅ Esperar propagación DNS (5-30 min)
4. ✅ Generar SSH key en VPS y añadir a GitHub
5. ✅ Editar deploy.sh con tu email

### **Deploy** (Mañana - 2 horas)

1. Subir deploy.sh al VPS
2. Ejecutar `sudo /root/deploy.sh`
3. Cuando pida .env:
   `scp .env.production root@151.80.119.163:/var/www/fantasy-laliga-pro/.env`
4. Esperar a que complete (~15 min)
5. Validar: `pm2 status && curl https://laligafantasyspain.com/health`

### **Post-Deploy** (Mismo día - 30 min)

1. Configurar monitoring (UptimeRobot)
2. Probar flujo E2E (chollos)
3. Verificar n8n sigue funcionando
4. Actualizar `docs/PRODUCTION_LAUNCH_PLAN.md` con fecha de deploy

---

## ✅ Checklist Final (Antes de Ejecutar Deploy)

- [ ] DNS configurado y propagado
- [ ] SSH key en VPS añadida a GitHub
- [ ] .env.production preparado
- [ ] deploy.sh editado con email real
- [ ] Backup de workflows n8n exportado
- [ ] VPS tiene >5 GB espacio libre
- [ ] VPS tiene >500 MB RAM libre
- [ ] Puerto 3000 está disponible
- [ ] Nginx no tiene configuración conflictiva
- [ ] Plan de rollback documentado

**Si todas las casillas están marcadas: ✅ LISTO PARA DEPLOY**

---

## 📞 Soporte

**Si encuentras blockers**:

1. Revisar logs: `tail -f /var/log/syslog`
2. Revisar n8n: `pm2 logs n8n`
3. Consultar: `deploy/DEPLOY_GUIDE.md`
4. Consultar: `docs/PRODUCTION_LAUNCH_PLAN.md`

---

**Última actualización**: 16 Oct 2025 **Estado**: ✅ Listo para revisión
**Próximo paso**: Configurar DNS y esperar propagación
