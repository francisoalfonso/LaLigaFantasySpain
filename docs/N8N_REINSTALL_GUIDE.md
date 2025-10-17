# Guía de Reinstalación n8n en Servidor OVH

**Fecha**: 16 Oct 2025 22:45 **Razón**: Servidor reinstalado, se perdió
instalación anterior de n8n **Objetivo**: Reinstalar n8n + reconfigurar 8
workflows

---

## 📋 Contexto

Antes de la reinstalación del servidor teníamos:

- ✅ n8n instalado en Easypanel (https://n8n-n8n.6ld9pv.easypanel.host)
- ✅ 8 workflows creados (101 nodos)
- ✅ 1 workflow activo (Chollos Detection)
- ✅ Sistema MCP funcionando

**Estado actual**:

- ❌ Token expirado / n8n sin workflows
- ✅ Servidor n8n respondiendo (HTTP 401)
- ✅ Credenciales guardadas en `.env.n8n`

---

## 🎯 Plan de Reinstalación

### Opción A: Reinstalar n8n en Easypanel (Recomendado)

**Ventajas**:

- Ya tienes experiencia con Easypanel
- URL existente: https://n8n-n8n.6ld9pv.easypanel.host
- Interfaz gráfica para gestión

**Pasos**:

1. **Acceder a Easypanel**
    - URL: https://easypanel.6ld9pv.easypanel.host (o la que uses)
    - Login con tus credenciales

2. **Verificar estado de n8n**
    - Ir a aplicaciones
    - Buscar "n8n"
    - Si existe pero sin workflows → generar nuevo API token
    - Si no existe → crear nueva aplicación n8n

3. **Crear aplicación n8n (si no existe)**

    ```yaml
    Name: n8n
    Docker Image: n8nio/n8n:latest
    Port: 5678
    Domain: n8n-n8n.6ld9pv.easypanel.host
    Environment Variables:
        N8N_BASIC_AUTH_ACTIVE: true
        N8N_BASIC_AUTH_USER: admin
        N8N_BASIC_AUTH_PASSWORD: [TU_PASSWORD_SEGURO]
        N8N_HOST: n8n-n8n.6ld9pv.easypanel.host
        N8N_PROTOCOL: https
        N8N_PORT: 5678
        WEBHOOK_URL: https://n8n-n8n.6ld9pv.easypanel.host/
    Volumes:
        - /root/.n8n:/home/node/.n8n
    ```

4. **Generar nuevo API Token**
    - Acceder a https://n8n-n8n.6ld9pv.easypanel.host
    - Login con admin / password
    - Ir a Settings → API
    - Generate new API Key
    - Copiar token

5. **Actualizar `.env.n8n`**

    ```bash
    cd /Users/fran/Desktop/CURSOR/Fantasy\ la\ liga
    nano .env.n8n
    ```

    Actualizar:

    ```
    N8N_API_TOKEN=[NUEVO_TOKEN_AQUI]
    N8N_BASE_URL=https://n8n-n8n.6ld9pv.easypanel.host
    ```

6. **Verificar conexión**
    ```bash
    npm run n8n:check-versions
    ```

---

### Opción B: Instalar n8n localmente (Desarrollo)

**Ventajas**:

- Testing rápido
- Sin dependencia de servidor remoto
- Desarrollo offline

**Pasos**:

1. **Instalar n8n**

    ```bash
    npm install -g n8n
    ```

2. **Iniciar n8n**

    ```bash
    n8n start
    ```

    n8n iniciará en: http://localhost:5678

3. **Generar API Token**
    - Ir a http://localhost:5678
    - Crear cuenta
    - Settings → API → Generate API Key

4. **Actualizar `.env.n8n`**

    ```
    N8N_API_TOKEN=[TOKEN_LOCAL]
    N8N_BASE_URL=http://localhost:5678
    ```

5. **Verificar conexión**
    ```bash
    npm run n8n:check-versions
    ```

---

## 🔄 Recrear 8 Workflows

Una vez n8n esté funcionando con API token válido:

### Método 1: Restaurar desde JSON (Más rápido)

**Si tenemos backups de workflows**:

1. Buscar backups en:

    ```bash
    ls -la workflows/
    ls -la n8n-workflows/
    ```

2. Importar en n8n UI:
    - Ir a Workflows → Import from File
    - Seleccionar cada JSON
    - Import

### Método 2: Recrear con scripts (Automatizado)

**Si NO tenemos backups**:

1. **Verificar scripts existentes**:

    ```bash
    ls -la scripts/n8n/
    ```

    Deberíamos tener:
    - `create-workflow-1-sync.js`
    - `create-workflow-3-veo3.js`
    - `create-workflow-5-injuries.js`
    - `create-workflow-chollos.js`

2. **Ejecutar scripts**:

    ```bash
    # Workflow #1: Sincronización Diaria
    node scripts/n8n/create-workflow-1-sync.js

    # Workflow #2: Chollos Detection
    node scripts/create-workflow-chollos.js

    # Workflow #3: Videos Ana VEO3
    node scripts/n8n/create-workflow-3-veo3.js

    # Workflow #5: Monitor Lesiones
    node scripts/n8n/create-workflow-5-injuries.js
    ```

3. **Workflows sin scripts** (crear manualmente en n8n UI):
    - Workflow #4: Pipeline Contenido Semanal
    - Workflow #6: Análisis Post-Jornada
    - Workflow #7: Optimización Plantilla
    - Workflow #8: Backup Automático

    **Referencia**: Ver `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md` para
    arquitectura completa

### Método 3: Usar servicio `n8nWorkflowBuilder.js`

**Si los scripts no funcionan**:

1. **Crear workflow via backend**:

    ```bash
    curl -X POST http://localhost:3000/api/n8n-mcp/workflows/create \
      -H "Content-Type: application/json" \
      -d @workflows/n8n-carousel-top-chollos.json
    ```

2. **Verificar workflows creados**:
    ```bash
    curl http://localhost:3000/api/n8n-mcp/workflows
    ```

---

## ✅ Checklist Post-Instalación

### 1. Verificación Básica

- [ ] n8n accesible en browser
- [ ] Login funcionando
- [ ] API token generado
- [ ] `.env.n8n` actualizado
- [ ] `npm run n8n:check-versions` exitoso

### 2. Workflows Recreados

- [ ] Workflow #1: Sincronización Diaria
- [ ] Workflow #2: Chollos Detection
- [ ] Workflow #3: Videos Ana VEO3
- [ ] Workflow #4: Pipeline Contenido Semanal
- [ ] Workflow #5: Monitor Lesiones
- [ ] Workflow #6: Análisis Post-Jornada
- [ ] Workflow #7: Optimización Plantilla
- [ ] Workflow #8: Backup Automático

### 3. Configuración de Credenciales en n8n UI

**Ir a Settings → Credentials y agregar**:

- [ ] **API-Sports** (HTTP Request)

    ```
    Name: API-Sports Ultra
    Auth Type: Header Auth
    Header Name: x-rapidapi-key
    Header Value: [TU_API_KEY]
    ```

- [ ] **OpenAI** (OpenAI)

    ```
    Name: OpenAI GPT-5 Mini
    API Key: [TU_OPENAI_KEY]
    Organization ID: (opcional)
    ```

- [ ] **KIE.ai VEO3** (HTTP Request)

    ```
    Name: KIE.ai VEO3
    Auth Type: Header Auth
    Header Name: Authorization
    Header Value: Bearer [TU_KIE_KEY]
    ```

- [ ] **Instagram Graph API** (HTTP Request)

    ```
    Name: Instagram Graph API
    Auth Type: OAuth2
    Grant Type: Authorization Code
    Access Token: [TU_ACCESS_TOKEN]
    ```

- [ ] **Google Drive** (Google Drive)

    ```
    Name: Google Drive Backups
    Auth Type: OAuth2
    Client ID: [TU_CLIENT_ID]
    Client Secret: [TU_CLIENT_SECRET]
    ```

- [ ] **Telegram Bot** (Telegram)

    ```
    Name: Fantasy La Liga Bot
    Bot Token: [TU_BOT_TOKEN]
    ```

- [ ] **Email SMTP** (SMTP)
    ```
    Name: Gmail SMTP
    Host: smtp.gmail.com
    Port: 587
    User: laligafantasyspainpro@gmail.com
    Password: [APP_PASSWORD]
    ```

### 4. Test de Workflows

- [ ] **Workflow #1**: Test manual → verificar sincronización
- [ ] **Workflow #2**: POST webhook chollos → verificar Instagram
- [ ] **Workflow #3**: POST webhook video Ana → verificar VEO3
- [ ] **Workflow #5**: Forzar ejecución → verificar detección lesiones
- [ ] **Workflow #8**: Forzar backup → verificar Google Drive

### 5. Activación de Workflows

Ir a cada workflow en n8n UI y activar:

- [ ] Workflow #1 activo (Schedule 8AM)
- [ ] Workflow #2 activo (Webhook)
- [ ] Workflow #3 activo (Webhook)
- [ ] Workflow #4 activo (Schedule Lunes 6AM)
- [ ] Workflow #5 activo (Schedule cada 2h)
- [ ] Workflow #6 activo (Webhook)
- [ ] Workflow #7 activo (Manual + Viernes 10AM)
- [ ] Workflow #8 activo (Schedule 3AM)

---

## 🚨 Troubleshooting

### Error: "401 Authorization Required"

**Causa**: Token inválido o expirado **Solución**: Generar nuevo API token en
n8n UI → Settings → API

### Error: "Cannot connect to n8n"

**Causa**: n8n no está corriendo o URL incorrecta **Solución**:

1. Verificar n8n está running: `curl https://n8n-n8n.6ld9pv.easypanel.host`
2. Verificar `.env.n8n` tiene URL correcta

### Error: "Workflow creation failed"

**Causa**: Script desactualizado o n8n API cambió **Solución**: Crear workflow
manualmente en n8n UI siguiendo `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md`

### Error: "Missing credentials"

**Causa**: Credenciales no configuradas en n8n **Solución**: Ir a n8n UI →
Settings → Credentials → agregar cada credencial

---

## 📚 Documentación de Referencia

- **Arquitectura completa**: `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md`
- **Workflow #1 guía**: `docs/N8N_WORKFLOW_1_GUIA_CREACION.md`
- **Workflow #6 guía**: `docs/n8n-workflow-6-post-jornada.md`
- **Scripts creación**: `scripts/n8n/`
- **Workflows JSON**: `workflows/` y `n8n-workflows/`

---

## 🎯 Próximos Pasos

1. **HOY** (16 Oct 2025):
    - [ ] Reinstalar n8n en Easypanel
    - [ ] Generar nuevo API token
    - [ ] Actualizar `.env.n8n`
    - [ ] Verificar conexión

2. **Mañana** (17 Oct 2025):
    - [ ] Test VEO3.1 (después de 24h estabilización)
    - [ ] Recrear 8 workflows
    - [ ] Configurar credenciales
    - [ ] Test básico de workflows

3. **Próxima semana**:
    - [ ] Activar workflows críticos (#1, #2, #3)
    - [ ] Implementar endpoints backend pendientes
    - [ ] Activar workflows restantes (#4-#8)

---

**Última actualización**: 16 Oct 2025 22:45 **Autor**: Claude Code **Estado**:
Guía lista para reinstalación
