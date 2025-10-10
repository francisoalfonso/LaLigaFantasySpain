# Workflow #5: Fantasy La Liga - Monitor Lesiones y Alertas

## ✅ Estado: CREADO EXITOSAMENTE

**Workflow ID**: `OoElzMLzpI81S6o8`
**Nombre**: Fantasy La Liga - Monitor Lesiones y Alertas
**Estado Actual**: 🔴 Inactivo (requiere activación)
**Nodos**: 12
**Creado**: 30/09/2025, 13:07:06
**URL n8n**: https://n8n-n8n.6ld9pv.easypanel.host/workflow/OoElzMLzpI81S6o8

---

## 🎯 Objetivo del Workflow

Detectar lesiones y sanciones de jugadores de La Liga cada 2 horas, analizarlas con IA, y enviar alertas automáticas a través de múltiples canales (Telegram, Instagram, Email).

---

## 🔧 Arquitectura Completa (12 Nodos)

### **1. Every 2 Hours Trigger** (`n8n-nodes-base.scheduleTrigger`)
- **Frecuencia**: Cada 2 horas (cron: `0 */2 * * *`)
- **Timezone**: Europe/Madrid
- **Función**: Trigger automático del workflow

### **2. Get Previous Cache** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `GET http://localhost:3000/api/cache/injuries`
- **Timeout**: 10 segundos
- **Función**: Obtener lesiones previamente detectadas del cache

### **3. Get Injuries API-Sports** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `GET https://v3.football.api-sports.io/injuries`
- **Parámetros**:
  - `league=140` (La Liga)
  - `season=2025`
  - `date={{$today.format('yyyy-MM-dd')}}`
- **Auth**: API-Sports Header Auth
- **Timeout**: 30 segundos
- **Función**: Obtener lesiones actuales de API-Sports

### **4. Compare with Cache** (`n8n-nodes-base.function`)
- **Función**: Comparar lesiones actuales vs cache
- **Output**:
  - `hasNewInjuries`: boolean
  - `newInjuries`: array de lesiones nuevas
  - `currentInjuries`: todas las lesiones actuales
  - `newInjuriesCount`: número de lesiones nuevas

### **5. Has New Injuries?** (`n8n-nodes-base.if`)
- **Condición**: `hasNewInjuries === true`
- **True Branch**: Continuar con procesamiento
- **False Branch**: Ir directamente a actualizar cache

### **6. Loop Each New Injury** (`n8n-nodes-base.splitInBatches`)
- **Batch Size**: 1 (procesar lesión por lesión)
- **Función**: Iterar sobre cada lesión nueva detectada

### **7. Analyze Impact GPT-5** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `POST http://localhost:3000/api/ai/injury-impact`
- **Body**:
  - `playerName`
  - `team`
  - `injuryType`
  - `position`
- **Timeout**: 30 segundos
- **Función**: Análisis del impacto de la lesión con GPT-5 Mini

### **8. Send Telegram Alert** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `POST http://localhost:3000/api/telegram/alert`
- **Body**:
  - `title`: "🚨 Nueva Lesión Detectada"
  - `player`, `team`, `injury`
  - `analysis`: del nodo GPT-5
- **Timeout**: 15 segundos
- **Función**: Alerta instantánea a Telegram

### **9. Post Instagram Story** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `POST http://localhost:3000/api/instagram/story`
- **Body**:
  - `type`: "injury_alert"
  - `playerData`: datos completos
- **Timeout**: 30 segundos
- **Función**: Publicar story automática en Instagram

### **10. Aggregate All Results** (`n8n-nodes-base.aggregate`)
- **Mode**: aggregateAllItemData
- **Función**: Combinar todos los resultados del loop

### **11. Update Cache Function** (`n8n-nodes-base.function`)
- **Función**: Preparar datos para actualizar cache
- **Output**:
  - `action`: "update_cache"
  - `timestamp`
  - `injuries`: lesiones actuales
  - `injuriesCount`
  - `newInjuriesProcessed`

### **12. Send Email Summary** (`n8n-nodes-base.httpRequest`)
- **Endpoint**: `POST http://localhost:3000/api/email/send`
- **To**: laligafantasyspainpro@gmail.com
- **Subject**: "📊 Resumen Lesiones - [fecha]"
- **Body**: JSON completo del resultado
- **Función**: Email resumen de la ejecución

---

## 🔗 Flujo de Conexiones

```
Every 2 Hours Trigger
    ├─→ Get Previous Cache ────────┐
    └─→ Get Injuries API-Sports ───┤
                                    ↓
                        Compare with Cache
                                    ↓
                         Has New Injuries?
                    ┌─── TRUE ───┴─── FALSE ───┐
                    ↓                           ↓
            Loop Each New Injury        Update Cache Function
                    ↓                           ↑
        ┌───────────┼───────────┐              │
        ↓           ↓           ↓              │
Analyze Impact  Telegram    Instagram          │
    GPT-5        Alert       Story              │
        └───────────┴───────────┘              │
                    ↓                          │
            Aggregate All Results              │
                    ↓                          │
            ────────┴──────────────────────────┘
                    ↓
            Send Email Summary
```

---

## 🚀 Funcionalidades Implementadas

✅ **Detección Automática**: Verifica lesiones cada 2 horas
✅ **Cache Inteligente**: Solo procesa lesiones nuevas
✅ **Análisis IA**: GPT-5 Mini analiza impacto en Fantasy
✅ **Multi-Canal**: Telegram + Instagram + Email
✅ **Loop Eficiente**: Procesa cada lesión individualmente
✅ **Agregación**: Combina todos los resultados al final
✅ **Persistencia**: Actualiza cache para próxima ejecución
✅ **Timezone**: Configurado para Europe/Madrid

---

## ⚠️ ENDPOINTS BACKEND REQUERIDOS

### **Prioridad CRÍTICA - Implementar antes de activar workflow**

#### 1. **Cache Management**
```bash
GET  /api/cache/injuries    # Leer cache de lesiones
POST /api/cache/injuries    # Guardar cache de lesiones
```

#### 2. **AI Analysis**
```bash
POST /api/ai/injury-impact  # Análisis impacto lesión con GPT-5 Mini
# Body: { playerName, team, injuryType, position }
# Response: { analysis: string, impact: "high"|"medium"|"low" }
```

#### 3. **Telegram Integration**
```bash
POST /api/telegram/alert    # Enviar alerta Telegram
# Body: { title, player, team, injury, analysis }
```

#### 4. **Instagram Integration**
```bash
POST /api/instagram/story   # Publicar Instagram story
# Body: { type: "injury_alert", playerData }
```

#### 5. **Email Service**
```bash
POST /api/email/send        # Enviar email resumen
# Body: { to, subject, body }
```

---

## 🔐 Configuración Requerida

### **n8n Credentials**

#### API-Sports Header Auth
```
Credential Name: API-Sports Auth
Type: httpHeaderAuth
Header Name: x-apisports-key
Header Value: [TU_API_SPORTS_KEY]
```

**⚠️ Importante**: Asignar esta credencial al nodo "Get Injuries API-Sports"

### **Environment Variables**

Asegurar que `.env` contenga:
```bash
# API-Sports
API_FOOTBALL_KEY=tu_api_key_aqui

# OpenAI GPT-5 Mini
OPENAI_API_KEY=tu_openai_key_aqui

# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_telegram_token
TELEGRAM_CHAT_ID=tu_chat_id

# Instagram
INSTAGRAM_ACCESS_TOKEN=tu_instagram_token

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=laligafantasyspainpro@gmail.com
SMTP_PASSWORD=tu_smtp_password
```

---

## 📊 Testing y Activación

### **Paso 1: Test Endpoints Backend**
```bash
# Test cache
curl http://localhost:3000/api/cache/injuries

# Test AI injury impact
curl -X POST http://localhost:3000/api/ai/injury-impact \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Pedri", "team": "Barcelona", "injuryType": "Hamstring", "position": "MID"}'

# Test Telegram
curl -X POST http://localhost:3000/api/telegram/alert \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "player": "Test Player", "team": "Test Team", "injury": "Test Injury"}'
```

### **Paso 2: Configurar Credencial API-Sports en n8n**
1. Ir a n8n → Credentials
2. Crear nueva credencial "HTTP Header Auth"
3. Nombre: "API-Sports Auth"
4. Header Name: `x-apisports-key`
5. Header Value: [TU_API_KEY]
6. Asignar al nodo "Get Injuries API-Sports"

### **Paso 3: Test Manual del Workflow**
```bash
# Ejecutar manualmente desde n8n UI
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/api/v1/workflows/OoElzMLzpI81S6o8/execute" \
  -H "X-N8N-API-KEY: [TU_TOKEN]" \
  -H "Content-Type: application/json"
```

### **Paso 4: Activar Workflow**
```bash
curl -X PATCH "https://n8n-n8n.6ld9pv.easypanel.host/api/v1/workflows/OoElzMLzpI81S6o8" \
  -H "X-N8N-API-KEY: [TU_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

---

## 📈 Monitoreo y Logs

### **Ver Ejecuciones**
```bash
# Listar últimas ejecuciones
curl "https://n8n-n8n.6ld9pv.easypanel.host/api/v1/executions?workflowId=OoElzMLzpI81S6o8" \
  -H "X-N8N-API-KEY: [TU_TOKEN]"
```

### **Estado de Ejecución**
```bash
curl "https://n8n-n8n.6ld9pv.easypanel.host/api/v1/executions/[EXECUTION_ID]" \
  -H "X-N8N-API-KEY: [TU_TOKEN]"
```

---

## 💰 Costos Estimados

### **API Calls por Ejecución** (cada 2h)
- API-Sports: 1 request
- GPT-5 Mini: N requests (N = número de lesiones nuevas)
- Telegram: N requests
- Instagram: N requests
- Email: 1 request

### **Diario** (12 ejecuciones/día)
- API-Sports: 12 requests/día
- GPT-5 Mini: ~36 requests/día (promedio 3 lesiones/día)
- Coste GPT-5 Mini: ~$0.03/día

### **Mensual**
- API-Sports: 360 requests/mes
- GPT-5 Mini: ~1,080 requests/mes
- Coste total: ~$0.90/mes

---

## 🎯 Próximos Pasos

### **Inmediato**
- [ ] Implementar endpoints backend requeridos
- [ ] Configurar credencial API-Sports en n8n
- [ ] Test manual del workflow completo
- [ ] Activar workflow en n8n

### **Corto Plazo**
- [ ] Monitorear primeras ejecuciones automáticas
- [ ] Ajustar parámetros según resultados
- [ ] Implementar sistema de retry para errores
- [ ] Agregar métricas y dashboards

### **Medio Plazo**
- [ ] Integrar con sistema de notificaciones push
- [ ] Agregar análisis histórico de lesiones
- [ ] Implementar predicción de retorno de lesión
- [ ] Sistema de recomendaciones de sustitutos

---

## 📞 Soporte

**Script de Creación**: `/scripts/n8n/create-workflow-5-injuries.js`
**Workflow URL**: https://n8n-n8n.6ld9pv.easypanel.host/workflow/OoElzMLzpI81S6o8
**Documentación n8n**: https://docs.n8n.io

---

**Creado**: 30/09/2025
**Estado**: ✅ Workflow creado - Pendiente activación
**Autor**: Claude Code (Sonnet 4.5)