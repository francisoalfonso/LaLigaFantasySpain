# 🔐 PENDIENTE: Configurar GitHub Secrets para Auto-Deploy

**Fecha**: 16 Oct 2025 19:15 **Estado**: ⏸️ En pausa - Pendiente para mañana
**Prioridad**: 🔴 P0 - Necesario para activar CI/CD

---

## 📋 Contexto

Hemos implementado un sistema de **auto-deploy GitHub → OVH** mediante GitHub
Actions.

El código ya está pusheado y el workflow está listo en:

- `.github/workflows/deploy-to-ovh.yml`

**Falta**: Configurar los 3 secrets en GitHub para que el workflow pueda
conectarse a OVH.

---

## ✅ Lo que YA está hecho:

1. ✅ Sistema de chollos automático implementado y commiteado
2. ✅ GitHub Action creado (`.github/workflows/deploy-to-ovh.yml`)
3. ✅ Script de deploy manual de respaldo (`deploy/deploy-to-ovh.sh`)
4. ✅ Todo el código pusheado a GitHub
5. ✅ Usuario ya está en la pantalla de Secrets en GitHub

---

## 🚀 Próximos Pasos (Para mañana)

### 1. Configurar 3 Secrets en GitHub

**URL**:
https://github.com/francisoalfonso/LaLigaFantasySpain/settings/secrets/actions

Hacer clic en **"New repository secret"** y añadir uno por uno:

#### Secret 1: OVH_HOST

```
Name: OVH_HOST
Secret: 151.80.119.163
```

#### Secret 2: OVH_USERNAME

```
Name: OVH_USERNAME
Secret: root
```

#### Secret 3: OVH_SSH_KEY

```
Name: OVH_SSH_KEY
Secret: [Clave privada SSH completa]
```

**Para obtener la clave SSH**:

```bash
cat ~/.ssh/id_rsa
```

O si no existe, listar claves disponibles:

```bash
ls ~/.ssh/
```

Copiar **TODO** el contenido (desde `-----BEGIN` hasta `-----END-----`
incluyendo esas líneas).

---

### 2. Probar el Auto-Deploy

Una vez configurados los secrets:

```bash
# Hacer cualquier cambio pequeño
echo "# Test" >> README.md

# Commit y push
git add .
git commit -m "test: Probar auto-deploy"
git push

# Ver el deploy en tiempo real
# https://github.com/francisoalfonso/LaLigaFantasySpain/actions
```

El GitHub Action se activará automáticamente y hará:

1. Conectar a OVH via SSH
2. `git pull` del nuevo código
3. `npm install`
4. `pm2 restart all`
5. Health checks automáticos

---

### 3. Validar Sistemas Automáticos

Una vez que el auto-deploy funcione, verificar que todos los sistemas estén
activos:

#### Chollos Scheduler

```bash
curl https://laligafantasyspain.com/api/chollos/status | jq '.'
```

Debería mostrar:

- `status: "ACTIVO"`
- `nextRun: "2025-10-17T06:00:00.000Z"` (mañana 8 AM)

#### Outliers Detector

```bash
curl https://laligafantasyspain.com/api/outliers/stats | jq '.'
```

#### Health General

```bash
curl https://laligafantasyspain.com/health
```

---

### 4. Configurar Variables de Entorno en OVH

Conectar al servidor y verificar/añadir estas variables en `.env`:

```bash
ssh root@151.80.119.163
cd ~/Fantasy\ la\ liga
nano .env
```

**Variables críticas para chollos**:

```bash
# Chollos Scheduler
CHOLLOS_CRON_SCHEDULE=0 8 * * *
CHOLLOS_CRON_ENABLED=true

# Outliers Detector
OUTLIERS_DETECTION_ENABLED=true
OUTLIERS_CRON_SCHEDULE=0 * * * *

# Server
SERVER_URL=https://laligafantasyspain.com
NODE_ENV=production
```

Guardar y reiniciar:

```bash
pm2 restart all
```

---

### 5. Validar Flujos End-to-End

Una vez todo activo, validar:

- [ ] **Chollos**: Ejecutar manual con `POST /api/chollos/run-now`
- [ ] **Outliers**: Verificar detección automática cada hora
- [ ] **Instagram**: Configurar n8n workflow para publicación automática
- [ ] **YouTube**: Configurar n8n workflow para publicación automática
- [ ] **n8n Workflows**: Verificar que estén activos y conectados

---

## 📊 Estado de Sistemas

| Sistema           | Código | Deploy | Config     | Testing |
| ----------------- | ------ | ------ | ---------- | ------- |
| Chollos Scheduler | ✅     | ⏸️     | ⏸️         | ⏸️      |
| Outliers Detector | ✅     | ⏸️     | ⏸️         | ⏸️      |
| Auto-Deploy CI/CD | ✅     | ⏸️     | 🔴 Secrets | ⏸️      |
| Instagram n8n     | ✅     | ⏸️     | ⏸️         | ⏸️      |
| YouTube n8n       | ❓     | ⏸️     | ⏸️         | ⏸️      |

---

## 🎯 Objetivo Final

**Flujo Completamente Automatizado**:

```
1. Desarrollo Local (Mac)
   ↓
2. git push → GitHub
   ↓
3. GitHub Action → Auto-deploy OVH
   ↓
4. Sistemas Activos en Producción:
   • ChollosScheduler (8 AM diario)
   • OutliersDetector (cada hora)
   • n8n → Instagram (automático)
   • n8n → YouTube (automático)
```

**Resultado**: Sistema funcionando 24/7 sin intervención manual, generando y
publicando contenido automáticamente.

---

## 💡 Notas Importantes

- **GitHub Action** ya está configurado para activarse en push a `main` y
  `feature/competitive-youtube-analyzer`
- **Script manual de backup** disponible en `deploy/deploy-to-ovh.sh` por si el
  GitHub Action falla
- **Documentación completa** del sistema de chollos en
  `docs/CHOLLOS_CRON_SYSTEM.md`
- **Costos estimados**: ~$0.96/día para chollos = ~$28.80/mes

---

## 🔗 Links Rápidos

- GitHub Secrets:
  https://github.com/francisoalfonso/LaLigaFantasySpain/settings/secrets/actions
- GitHub Actions: https://github.com/francisoalfonso/LaLigaFantasySpain/actions
- Producción: https://laligafantasyspain.com
- n8n: https://n8n-n8n.6ld9pv.easypanel.host

---

**Próxima sesión**: Comenzar por configurar los 3 secrets en GitHub y probar el
auto-deploy.
