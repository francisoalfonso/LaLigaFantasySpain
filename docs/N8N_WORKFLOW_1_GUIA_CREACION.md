# 📘 Guía Creación Workflow #1: Sincronización Diaria

## 🎯 Objetivo
Crear el primer workflow en n8n que sincroniza automáticamente los datos de Fantasy La Liga cada día a las 8:00 AM.

---

## 🚀 Creación Paso a Paso en n8n

### **Paso 1: Acceder a n8n**

1. Abre tu navegador en: `https://n8n-n8n.6ld9pv.easypanel.host`
2. Inicia sesión con tus credenciales
3. Click en **"New Workflow"** (botón azul arriba a la derecha)

---

### **Paso 2: Configurar Nombre y Tags**

1. En la parte superior donde dice "My workflow", cambiar nombre a:
   ```
   Fantasy La Liga - Sync Daily Data
   ```

2. Click en **"Add tag"** y agregar:
   - `fantasy-laliga`
   - `sync`
   - `daily`
   - `critical`

---

### **Paso 3: Agregar Nodos**

#### **Nodo 1: Schedule Trigger** ⏰

1. Click en el **"+"** en el canvas
2. Buscar **"Schedule Trigger"**
3. Configurar:
   - **Mode**: "Every X"
   - **Value**: `1`
   - **Unit**: `days`
   - **Hour**: `8`
   - **Minute**: `0`

   O usar **Cron Expression**:
   ```
   0 8 * * *
   ```

4. Click **"Execute Node"** para testear
5. ✅ Debe mostrar "Node executed successfully"

---

#### **Nodo 2: HTTP Request (API-Sports)** 🌐

1. Agregar nuevo nodo después del Schedule Trigger
2. Buscar **"HTTP Request"**
3. Configurar:

**Method**: `GET`

**URL**:
```
https://v3.football.api-sports.io/fixtures
```

**Authentication**: `Generic Credential Type`
- **Generic Auth Type**: `Header Auth`
- **Credential for Header Auth**: Crear nueva credencial:
  - **Name**: `API-Sports Auth`
  - **Name**: `x-apisports-key`
  - **Value**: `[TU_API_KEY_DE_API_SPORTS]`

**Query Parameters**:
```
league = 140
season = 2025
date = {{ $today.format("yyyy-MM-dd") }}
```

**Options**:
- **Timeout**: `30000` (30 segundos)

4. Click **"Execute Node"** para testear
5. ✅ Debe retornar JSON con fixtures

---

#### **Nodo 3: Function (Procesar Datos)** ⚙️

1. Agregar nodo **"Function"**
2. Configurar:

**Function Code**:
```javascript
// Procesar fixtures de API-Sports
const fixtures = items[0].json.response || [];

console.log(`Procesando ${fixtures.length} fixtures...`);

// Procesar cada fixture
const processedData = fixtures.map(fixture => {
    return {
        fixtureId: fixture.fixture.id,
        date: fixture.fixture.date,
        status: fixture.fixture.status.short,
        homeTeam: {
            id: fixture.teams.home.id,
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo
        },
        awayTeam: {
            id: fixture.teams.away.id,
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo
        },
        score: {
            home: fixture.goals.home,
            away: fixture.goals.away
        },
        venue: fixture.fixture.venue.name
    };
});

// Retornar datos procesados
return [{
    json: {
        syncDate: new Date().toISOString(),
        fixturesCount: processedData.length,
        fixtures: processedData,
        metadata: {
            league: 'La Liga',
            season: 2025,
            source: 'API-Sports'
        }
    }
}];
```

3. Click **"Execute Node"**
4. ✅ Verifica que datos estén procesados correctamente

---

#### **Nodo 4: HTTP Request (Backend Local)** 💾

1. Agregar nodo **"HTTP Request"**
2. Configurar:

**Method**: `POST`

**URL**:
```
http://localhost:3000/api/fixtures/sync/today
```

**Authentication**: `None`

**Body Content Type**: `JSON`

**Specify Body**: `Using JSON`

**JSON Body**:
```
{{ $json }}
```

**Options**:
- **Timeout**: `60000` (60 segundos)

3. Click **"Execute Node"**
4. ⚠️ Si falla, es normal (el endpoint debe existir en el backend)

---

#### **Nodo 5: IF (Verificar Éxito)** ✔️

1. Agregar nodo **"IF"**
2. Configurar:

**Conditions**:
- **Value 1**: `{{ $json.success }}`
- **Operation**: `Equal`
- **Value 2**: `true`

3. Conectar:
   - **TRUE** → Email Success (crear siguiente)
   - **FALSE** → Email Error (crear siguiente)

---

#### **Nodo 6a: Email Success** ✅📧

1. Desde rama **TRUE** del IF, agregar **"Send Email"**
2. Configurar:

**From Email**: `laligafantasyspainpro@gmail.com`

**To Email**: `laligafantasyspainpro@gmail.com`

**Subject**:
```
✅ Fantasy La Liga - Sync Diaria Exitosa
```

**Email Type**: `HTML`

**HTML**:
```html
<h2>✅ Sincronización Diaria Completada</h2>
<p><strong>Fecha:</strong> {{ $now.format("dd/MM/yyyy HH:mm") }}</p>
<p><strong>Fixtures sincronizados:</strong> {{ $json.fixturesCount }}</p>
<p><strong>Estado:</strong> Exitoso</p>

<h3>Detalles:</h3>
<ul>
    <li>Liga: La Liga (2025-26)</li>
    <li>Fuente: API-Sports</li>
    <li>Endpoint: /api/fixtures/sync/today</li>
</ul>

<p style="color: green;">Todos los datos se han sincronizado correctamente.</p>
```

**Credentials**: Configurar credenciales SMTP de Gmail:
- **User**: `laligafantasyspainpro@gmail.com`
- **Password**: `[App Password de Gmail]`
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Secure**: `TLS`

---

#### **Nodo 6b: Email Error** ❌📧

1. Desde rama **FALSE** del IF, agregar **"Send Email"**
2. Configurar igual que Email Success pero cambiar:

**Subject**:
```
❌ Fantasy La Liga - ERROR en Sync Diaria
```

**HTML**:
```html
<h2 style="color: red;">❌ Error en Sincronización Diaria</h2>
<p><strong>Fecha:</strong> {{ $now.format("dd/MM/yyyy HH:mm") }}</p>
<p><strong>Estado:</strong> Error</p>

<h3>Detalles del Error:</h3>
<pre>{{ JSON.stringify($json, null, 2) }}</pre>

<h3>Acción Requerida:</h3>
<p>Por favor, revisar logs del servidor y reintentar manualmente.</p>
<p><a href="http://localhost:3000/api/fixtures/sync/today">Ejecutar sync manual</a></p>
```

---

### **Paso 4: Guardar y Activar Workflow**

1. Click en **"Save"** (arriba a la derecha)
2. Toggle **"Active"** a ON (debe ponerse verde)
3. ✅ El workflow ahora se ejecutará automáticamente cada día a las 8:00 AM

---

## 🧪 Testing Manual

### **Test Completo del Workflow:**

1. Click en **"Execute Workflow"** (botón play arriba)
2. Verifica que cada nodo se ejecute en secuencia
3. Revisa los datos en cada paso
4. Confirma que recibes email (success o error)

### **Test Individual de Nodos:**

Para cada nodo:
1. Click en el nodo
2. Click en **"Execute node"**
3. Verifica output en panel derecho

---

## 📊 Monitoreo

### **Ver Ejecuciones:**

1. En n8n, ir a **"Executions"** (menú lateral)
2. Ver todas las ejecuciones del workflow
3. Click en cualquier ejecución para ver detalles

### **Logs:**

Cada ejecución guarda:
- ✅ Success/Error status
- ⏱️ Duración de ejecución
- 📝 Output de cada nodo
- 🔍 Errores detallados

---

## ⚠️ Troubleshooting

### **Problema: Schedule no ejecuta automáticamente**

**Solución:**
1. Verificar que workflow esté **ACTIVE** (toggle verde)
2. Verificar cron expression correcta
3. Esperar a próxima ejecución programada

### **Problema: API-Sports retorna error 401**

**Solución:**
1. Verificar API Key en credenciales
2. Verificar header name exacto: `x-apisports-key`
3. Confirmar que tienes acceso a fixtures endpoint

### **Problema: Email no se envía**

**Solución:**
1. Configurar App Password en Gmail (no usar contraseña normal)
2. Verificar credenciales SMTP correctas
3. Test con email node individual primero

### **Problema: Backend local no responde**

**Solución:**
1. Verificar que servidor backend esté corriendo: `npm run dev`
2. Verificar URL correcta: `http://localhost:3000`
3. Test endpoint manualmente: `curl http://localhost:3000/api/fixtures/sync/today`

---

## ✅ Checklist Final

Antes de dar por completado el workflow, verificar:

- [ ] Workflow guardado con nombre correcto
- [ ] Tags agregados (fantasy-laliga, sync, daily, critical)
- [ ] Schedule Trigger configurado para 8:00 AM
- [ ] API-Sports credentials configuradas
- [ ] Function procesa datos correctamente
- [ ] Backend endpoint responde
- [ ] IF conditional funciona
- [ ] Email credentials configuradas (Gmail SMTP)
- [ ] Email Success template correcto
- [ ] Email Error template correcto
- [ ] Workflow ACTIVE (toggle verde)
- [ ] Test manual exitoso (Execute Workflow)
- [ ] Email recibido correctamente

---

## 📝 Notas Importantes

1. **Gmail App Password**: Para enviar emails desde n8n, necesitas crear un **App Password** en tu cuenta Gmail (no uses tu contraseña normal). Guía: https://support.google.com/accounts/answer/185833

2. **API-Sports Rate Limit**: Tienes 75k requests/día. Este workflow usa solo 1 request/día, así que es súper seguro.

3. **Backup**: n8n guarda automáticamente todas las versiones del workflow. Puedes restaurar cualquier versión desde "Workflow History".

4. **Logs**: Todas las ejecuciones se guardan por 336 horas (14 días) por defecto en n8n.

---

## 🚀 Próximos Pasos

Una vez que Workflow #1 funcione correctamente:

1. **Día 2**: Crear Workflow #2 (Detección Chollos Automática)
2. **Día 3**: Crear Workflow #3 (Videos Ana VEO3)
3. **Día 4**: Crear Workflow #8 (Backup Automático)

---

**¿Necesitas ayuda con algún paso? Pregúntame y te guío en detalle.** 🎯