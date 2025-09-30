# 🔧 Guía Completa MCP (Model Context Protocol) para Fantasy La Liga

## 📘 ¿Qué es MCP y por qué es importante?

**MCP (Model Context Protocol)** es una tecnología que permite que Claude Code se comunique directamente con n8n (tu herramienta de automatización). Es como darle a Claude un "teléfono directo" para ejecutar automatizaciones.

### **Beneficios para ti como usuario no-técnico:**
- ✅ Claude puede ejecutar workflows automáticamente
- ✅ Sincronización de datos Fantasy sin intervención manual
- ✅ Automatización completa del procesamiento de datos
- ✅ Integración fluida entre Claude y n8n

---

## 🚀 Configuración Paso a Paso (10 minutos)

### **Paso 1: Obtener tu Token de n8n**

1. Abre tu instancia de n8n: `https://n8n-n8n.6ld9pv.easypanel.host`
2. Ve a **Settings** → **API Keys**
3. Clic en **Create API Key**
4. Copia el token generado (guárdalo en un lugar seguro)

### **Paso 2: Crear archivo de configuración**

1. En la raíz de tu proyecto, crea un archivo llamado `.env.n8n`
2. Pega este contenido (reemplaza con tu token real):

```bash
# Configuración n8n MCP
N8N_API_TOKEN=tu_token_real_aqui
N8N_BASE_URL=https://n8n-n8n.6ld9pv.easypanel.host
N8N_MCP_PORT=3001
N8N_MCP_HOST=localhost
```

### **Paso 3: Configurar Claude Code**

1. Obtén tu configuración MCP ejecutando:
```bash
curl http://localhost:3000/api/n8n-mcp/config
```

2. Copia la respuesta JSON que te devuelve

3. Abre tu archivo de configuración de Claude Code MCP (ubicación según tu sistema)

4. Pega la configuración dentro del objeto `mcpServers`

5. **IMPORTANTE**: Reemplaza `<YOUR_N8N_API_TOKEN>` con tu token real

### **Paso 4: Verificar instalación**

Ejecuta este comando para verificar que todo funciona:
```bash
curl http://localhost:3000/api/n8n-mcp/test
```

Si ves `"success": true`, ¡todo está configurado correctamente! 🎉

---

## 📖 Cómo Usar MCP

### **Comandos básicos que puedes usar:**

#### 1. **Listar workflows disponibles**
```bash
curl http://localhost:3000/api/n8n-mcp/workflows
```

#### 2. **Ejecutar un workflow específico**
```bash
curl -X POST http://localhost:3000/api/n8n-mcp/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"playerData": {"name": "Lewandowski", "goals": 2}}'
```

#### 3. **Verificar estado de ejecución**
```bash
curl http://localhost:3000/api/n8n-mcp/executions/EXECUTION_ID/status
```

#### 4. **Ver herramientas MCP disponibles**
```bash
curl http://localhost:3000/api/n8n-mcp/tools
```

---

## 🛠️ Workflows Recomendados para Fantasy La Liga

### **Workflow 1: Procesamiento Automático de Datos**

**¿Qué hace?**: Obtiene datos de API-Sports, calcula puntos Fantasy y guarda en base de datos.

**Cómo crear:**
```bash
curl -X POST http://localhost:3000/api/n8n-mcp/fantasy/workflow
```

### **Workflow 2: Generación de Contenido Diario**

1. En n8n, crea un workflow con estos nodos:
   - **Schedule Trigger** (cada día a las 9:00 AM)
   - **HTTP Request** → `http://localhost:3000/api/bargains/top`
   - **AI Node** → Generar texto para redes sociales
   - **Instagram API** → Publicar automáticamente

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ **Lo que SÍ debes hacer:**
- Guardar tu token de n8n en `.env.n8n` (nunca compartir)
- Usar HTTPS en producción
- Revisar logs regularmente: `http://localhost:3000/logs`
- Hacer backup de workflows importantes

### ❌ **Lo que NO debes hacer:**
- Compartir tu token de n8n con nadie
- Subir `.env.n8n` a GitHub (ya está en .gitignore)
- Exponer endpoints MCP públicamente sin autenticación
- Ejecutar workflows sin verificar primero en modo test

---

## 🐛 Resolución de Problemas Comunes

### **Problema 1: "MCP Server no inicializado"**

**Solución:**
```bash
# 1. Verifica que .env.n8n existe y tiene tu token
cat .env.n8n

# 2. Reinicia el servidor
npm run dev
```

### **Problema 2: "Error conectando con n8n"**

**Causas posibles:**
- Token incorrecto o expirado
- URL de n8n incorrecta
- n8n no está accesible

**Solución:**
```bash
# Verificar conexión manual
curl -H "Authorization: Bearer TU_TOKEN" \
  https://n8n-n8n.6ld9pv.easypanel.host/api/v1/workflows
```

### **Problema 3: "Timeout error"**

**Solución**: El servidor MCP tiene timeout de 30 segundos. Si tus workflows son muy largos, considera:
- Dividir el workflow en pasos más pequeños
- Usar webhooks asíncronos
- Aumentar el timeout en `n8nMcpServer.js`

---

## 📊 Monitoreo y Logs

### **Ver actividad MCP en tiempo real:**

1. **Logs del servidor:**
```bash
tail -f logs/combined.log | grep MCP
```

2. **Dashboard de n8n:**
   - Ve a n8n → Executions
   - Filtra por workflows "Fantasy La Liga"

3. **Endpoint de estadísticas:**
```bash
curl http://localhost:3000/api/n8n-mcp/stats
```

---

## 🚀 Casos de Uso Avanzados

### **Automatización Completa del Pipeline**

1. **Trigger diario** (9:00 AM): Obtener datos API-Sports
2. **Calcular puntos Fantasy** automáticamente
3. **Identificar chollos** del día
4. **Generar contenido** con IA (GPT-5 Mini)
5. **Publicar en Instagram** automáticamente
6. **Notificación** a tu email con resumen

Todo esto sin tocar una línea de código, solo configurando workflows en n8n y usando MCP.

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa logs**: `http://localhost:3000/api/n8n-mcp/test`
2. **Documentación n8n**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/
3. **Comunidad**: GitHub Issues del proyecto

---

## ✅ Checklist de Seguridad

Antes de poner en producción, verifica:

- [ ] Token de n8n configurado en `.env.n8n`
- [ ] `.env.n8n` está en `.gitignore`
- [ ] Test de conexión pasa: `GET /api/n8n-mcp/test`
- [ ] Workflows críticos tienen backup
- [ ] Rate limiting configurado (ya implementado)
- [ ] HTTPS habilitado en producción
- [ ] Logs monitoreados regularmente

---

**✨ Con MCP configurado correctamente, tu proyecto Fantasy La Liga puede automatizarse al 100%, dejándote libre para enfocarte en estrategia y contenido.**