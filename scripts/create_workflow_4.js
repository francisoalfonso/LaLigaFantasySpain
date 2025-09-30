const axios = require('axios');
require('dotenv').config({ path: '/Users/fran/Desktop/CURSOR/Fantasy la liga/.env.n8n' });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_TOKEN = process.env.N8N_API_TOKEN;

const workflow = {
  name: "Fantasy La Liga - Weekly Content Pipeline",
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            {
              field: "cronExpression",
              expression: "0 6 * * 1"
            }
          ]
        }
      },
      name: "Schedule Trigger - Every Monday 6AM",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.1,
      position: [250, 300],
      id: "schedule-trigger-monday"
    },
    {
      parameters: {
        url: "http://localhost:3000/api/fixtures",
        options: {
          qs: {
            next: true
          }
        },
        authentication: "none",
        method: "GET"
      },
      name: "Get Next Gameweek Fixtures",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [450, 200],
      id: "get-fixtures"
    },
    {
      parameters: {
        url: "http://localhost:3000/api/bargains/top",
        options: {
          qs: {
            limit: 10
          }
        },
        authentication: "none",
        method: "GET"
      },
      name: "Get Top Bargains",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [450, 350],
      id: "get-bargains"
    },
    {
      parameters: {
        url: "http://localhost:3000/api/laliga/laliga/standings",
        authentication: "none",
        method: "GET"
      },
      name: "Get Team Standings",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [450, 500],
      id: "get-standings"
    },
    {
      parameters: {
        functionCode: `
// Lógica de planificación de contenido semanal
const fixtures = $input.all()[0].json;
const bargains = $input.all()[1].json;
const standings = $input.all()[2].json;

const today = new Date();
const weekStartDate = new Date(today);
weekStartDate.setDate(today.getDate() - today.getDay() + 1); // Lunes

// Configuración del equipo de reporteros
const reporters = {
  ana: { name: "Ana Martínez", nickname: "Ana Fantasy" },
  carlos: { name: "Carlos González", nickname: "Carlos Stats" },
  lucia: { name: "Lucía Rodríguez", nickname: "Lucía Femenina" },
  pablo: { name: "Pablo Martín", nickname: "Pablo GenZ" }
};

// Plan de contenido semanal (7 días)
const weeklyPlan = [
  {
    day: "Lunes",
    dayIndex: 0,
    contentType: "chollos",
    assignedReporter: reporters.carlos.name,
    description: "Chollos inicio semana - Top jugadores infravalorados",
    priority: 5,
    scheduledTime: "09:00",
    estimatedDuration: 120,
    platforms: ["Instagram", "TikTok"]
  },
  {
    day: "Martes",
    dayIndex: 1,
    contentType: "analysis",
    assignedReporter: reporters.ana.name,
    description: "Análisis táctico jornada - Tendencias y patrones",
    priority: 4,
    scheduledTime: "10:00",
    estimatedDuration: 180,
    platforms: ["YouTube", "Instagram"]
  },
  {
    day: "Miércoles",
    dayIndex: 2,
    contentType: "femenina",
    assignedReporter: reporters.lucia.name,
    description: "Fútbol femenino + cantera emergente",
    priority: 3,
    scheduledTime: "09:00",
    estimatedDuration: 150,
    platforms: ["Instagram", "YouTube"]
  },
  {
    day: "Jueves",
    dayIndex: 3,
    contentType: "preview",
    assignedReporter: reporters.ana.name + " + " + reporters.pablo.name,
    description: "Preview jornada + Fantasy hacks Gen Z",
    priority: 5,
    scheduledTime: "11:00",
    estimatedDuration: 200,
    platforms: ["YouTube", "TikTok", "Instagram"]
  },
  {
    day: "Viernes",
    dayIndex: 4,
    contentType: "tips",
    assignedReporter: reporters.carlos.name + " + " + reporters.pablo.name,
    description: "Tips Fantasy + contenido viral fin de semana",
    priority: 5,
    scheduledTime: "10:00",
    estimatedDuration: 180,
    platforms: ["TikTok", "Instagram Stories", "Twitch"]
  },
  {
    day: "Sábado",
    dayIndex: 5,
    contentType: "pre-match",
    assignedReporter: reporters.ana.name,
    description: "Análisis pre-partidos + alineaciones optimales",
    priority: 4,
    scheduledTime: "08:00",
    estimatedDuration: 150,
    platforms: ["Instagram", "YouTube"]
  },
  {
    day: "Domingo",
    dayIndex: 6,
    contentType: "reactions",
    assignedReporter: reporters.pablo.name + " + " + reporters.lucia.name,
    description: "Reacciones Gen Z + resumen liga femenina",
    priority: 3,
    scheduledTime: "20:00",
    estimatedDuration: 120,
    platforms: ["TikTok", "Instagram Stories", "Twitch"]
  }
];

// Generar plan con fechas reales
const contentPlan = weeklyPlan.map((day, index) => {
  const scheduleDate = new Date(weekStartDate);
  scheduleDate.setDate(weekStartDate.getDate() + day.dayIndex);
  
  return {
    ...day,
    date: scheduleDate.toISOString().split('T')[0],
    scheduledDateTime: scheduleDate.toISOString(),
    fixturesAvailable: fixtures?.fixtures?.length || 0,
    bargainsCount: bargains?.bargains?.length || 0,
    standingsUpdated: standings ? true : false
  };
});

// Metadata adicional
const metadata = {
  weekStartDate: weekStartDate.toISOString().split('T')[0],
  weekEndDate: new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalScheduled: contentPlan.length,
  nextGameweek: fixtures?.gameweek || "N/A",
  topBargainPlayer: bargains?.bargains?.[0]?.name || "N/A",
  leaderTeam: standings?.standings?.[0]?.team?.name || "N/A",
  generatedAt: new Date().toISOString()
};

return [{
  json: {
    success: true,
    metadata,
    contentPlan
  }
}];
`
      },
      name: "Create Weekly Content Plan",
      type: "n8n-nodes-base.function",
      typeVersion: 1,
      position: [650, 350],
      id: "create-plan"
    },
    {
      parameters: {
        batchSize: 1,
        options: {
          reset: false
        }
      },
      name: "Loop Over Days",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [850, 350],
      id: "loop-days"
    },
    {
      parameters: {
        assignments: {
          assignments: [
            {
              id: "day",
              name: "day",
              value: "={{ $json.day }}",
              type: "string"
            },
            {
              id: "date",
              name: "date",
              value: "={{ $json.date }}",
              type: "string"
            },
            {
              id: "contentType",
              name: "contentType",
              value: "={{ $json.contentType }}",
              type: "string"
            },
            {
              id: "reporter",
              name: "reporter",
              value: "={{ $json.assignedReporter }}",
              type: "string"
            },
            {
              id: "scheduledTime",
              name: "scheduledTime",
              value: "={{ $json.scheduledTime }}",
              type: "string"
            }
          ]
        },
        options: {}
      },
      name: "Set Variables - Day Content",
      type: "n8n-nodes-base.set",
      typeVersion: 3.3,
      position: [1050, 350],
      id: "set-vars"
    },
    {
      parameters: {
        url: "http://localhost:3000/api/content/schedule",
        authentication: "none",
        method: "POST",
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "day",
              value: "={{ $json.day }}"
            },
            {
              name: "contentType",
              value: "={{ $json.contentType }}"
            },
            {
              name: "scheduledDate",
              value: "={{ $json.date }}"
            },
            {
              name: "reporter",
              value: "={{ $json.reporter }}"
            },
            {
              name: "scheduledTime",
              value: "={{ $json.scheduledTime }}"
            }
          ]
        }
      },
      name: "Schedule Content",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1250, 350],
      id: "schedule-content"
    },
    {
      parameters: {
        functionCode: `
// Agregar resultados de todos los días programados
const allScheduled = $input.all().map(item => item.json);

return [{
  json: {
    totalScheduled: allScheduled.length,
    scheduledContent: allScheduled,
    aggregatedAt: new Date().toISOString()
  }
}];
`
      },
      name: "Aggregate Results",
      type: "n8n-nodes-base.function",
      typeVersion: 1,
      position: [1450, 350],
      id: "aggregate"
    },
    {
      parameters: {
        url: "http://localhost:3000/api/email/send",
        authentication: "none",
        method: "POST",
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "to",
              value: "laligafantasyspainpro@gmail.com"
            },
            {
              name: "subject",
              value: "📅 Plan Contenido Semanal - {{ $('Create Weekly Content Plan').item.json.metadata.weekStartDate }}"
            },
            {
              name: "html",
              value: `
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>📅 Plan de Contenido Semanal</h2>
  <p><strong>Semana:</strong> {{ $('Create Weekly Content Plan').item.json.metadata.weekStartDate }} - {{ $('Create Weekly Content Plan').item.json.metadata.weekEndDate }}</p>
  
  <h3>📊 Resumen:</h3>
  <ul>
    <li>Próxima jornada: {{ $('Create Weekly Content Plan').item.json.metadata.nextGameweek }}</li>
    <li>Top chollo: {{ $('Create Weekly Content Plan').item.json.metadata.topBargainPlayer }}</li>
    <li>Líder de liga: {{ $('Create Weekly Content Plan').item.json.metadata.leaderTeam }}</li>
    <li>Total contenidos programados: {{ $('Aggregate Results').item.json.totalScheduled }}</li>
  </ul>
  
  <h3>📆 Calendario de Contenido:</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background-color: #0066cc; color: white;">
      <th style="padding: 10px; border: 1px solid #ddd;">Día</th>
      <th style="padding: 10px; border: 1px solid #ddd;">Tipo</th>
      <th style="padding: 10px; border: 1px solid #ddd;">Reportero</th>
      <th style="padding: 10px; border: 1px solid #ddd;">Hora</th>
    </tr>
    {{ $('Create Weekly Content Plan').item.json.contentPlan.map(day => 
      '<tr><td style="padding: 10px; border: 1px solid #ddd;">' + day.day + '</td>' +
      '<td style="padding: 10px; border: 1px solid #ddd;">' + day.contentType + '</td>' +
      '<td style="padding: 10px; border: 1px solid #ddd;">' + day.assignedReporter + '</td>' +
      '<td style="padding: 10px; border: 1px solid #ddd;">' + day.scheduledTime + '</td></tr>'
    ).join('') }}
  </table>
  
  <p style="margin-top: 20px; color: #666;">Generado automáticamente por Fantasy La Liga Pro</p>
</body>
</html>
`
            }
          ]
        }
      },
      name: "Send Email Summary",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1650, 350],
      id: "send-email"
    }
  ],
  connections: {
    "Schedule Trigger - Every Monday 6AM": {
      main: [
        [
          { node: "Get Next Gameweek Fixtures", type: "main", index: 0 },
          { node: "Get Top Bargains", type: "main", index: 0 },
          { node: "Get Team Standings", type: "main", index: 0 }
        ]
      ]
    },
    "Get Next Gameweek Fixtures": {
      main: [
        [
          { node: "Create Weekly Content Plan", type: "main", index: 0 }
        ]
      ]
    },
    "Get Top Bargains": {
      main: [
        [
          { node: "Create Weekly Content Plan", type: "main", index: 0 }
        ]
      ]
    },
    "Get Team Standings": {
      main: [
        [
          { node: "Create Weekly Content Plan", type: "main", index: 0 }
        ]
      ]
    },
    "Create Weekly Content Plan": {
      main: [
        [
          { node: "Loop Over Days", type: "main", index: 0 }
        ]
      ]
    },
    "Loop Over Days": {
      main: [
        [
          { node: "Set Variables - Day Content", type: "main", index: 0 }
        ]
      ]
    },
    "Set Variables - Day Content": {
      main: [
        [
          { node: "Schedule Content", type: "main", index: 0 }
        ]
      ]
    },
    "Schedule Content": {
      main: [
        [
          { node: "Loop Over Days", type: "main", index: 0 }
        ]
      ]
    },
    "Loop Over Days": {
      main: [
        null,
        [
          { node: "Aggregate Results", type: "main", index: 0 }
        ]
      ]
    },
    "Aggregate Results": {
      main: [
        [
          { node: "Send Email Summary", type: "main", index: 0 }
        ]
      ]
    }
  },
  settings: {
    executionOrder: "v1"
  },
  staticData: null
};

async function createWorkflow() {
  try {
    console.log('🚀 Creando Workflow #4: Fantasy La Liga - Weekly Content Pipeline...\n');
    
    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows`,
      workflow,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const createdWorkflow = response.data;
    
    console.log('✅ Workflow creado exitosamente!\n');
    console.log('📋 DETALLES DEL WORKFLOW:');
    console.log('========================');
    console.log('ID:', createdWorkflow.id);
    console.log('Nombre:', createdWorkflow.name);
    console.log('Estado:', createdWorkflow.active ? 'ACTIVO ✅' : 'INACTIVO ⏸️');
    console.log('Schedule:', '0 6 * * 1 (Lunes 6:00 AM - Europe/Madrid)');
    console.log('Nodos creados:', createdWorkflow.nodes.length);
    console.log('\n📊 RESUMEN DE NODOS:');
    console.log('===================');
    createdWorkflow.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.name} (${node.type})`);
    });
    
    console.log('\n🎯 TESTING SUGERIDO:');
    console.log('===================');
    console.log('1. Activar workflow manualmente en n8n UI');
    console.log('2. Ejecutar workflow de prueba:');
    console.log(`   curl -X POST "${N8N_BASE_URL}/api/v1/workflows/${createdWorkflow.id}/execute" \\`);
    console.log(`     -H "X-N8N-API-KEY: ${N8N_API_TOKEN}"`);
    console.log('\n3. Verificar endpoints backend:');
    console.log('   - GET http://localhost:3000/api/fixtures?next=true');
    console.log('   - GET http://localhost:3000/api/bargains/top?limit=10');
    console.log('   - GET http://localhost:3000/api/laliga/laliga/standings');
    console.log('   - POST http://localhost:3000/api/content/schedule');
    console.log('   - POST http://localhost:3000/api/email/send');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Implementar endpoint POST /api/content/schedule en backend');
    console.log('2. Implementar endpoint POST /api/email/send en backend');
    console.log('3. Activar workflow en n8n para ejecutar cada lunes 6:00 AM');
    console.log('4. Monitorear ejecuciones en n8n dashboard');
    
    return createdWorkflow;
    
  } catch (error) {
    console.error('❌ Error creando workflow:', error.response?.data || error.message);
    throw error;
  }
}

createWorkflow();
