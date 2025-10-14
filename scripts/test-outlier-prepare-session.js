/**
 * Test script: Outlier → VEO3 Prepare Session
 *
 * Flujo E2E:
 * 1. YouTube outlier script generado con GPT-4o
 * 2. Prepare-session con customScript
 * 3. Nano Banana genera 3 imágenes contextualizadas
 * 4. Retorna sessionId para generate-segment
 */

const axios = require('axios');

const payload = {
  contentType: 'outlier_response',
  playerData: {
    name: 'delantero polaco'
  },
  presenter: 'ana', // ✅ TEMPORAL: Verificar que Nano Banana funciona antes de probar Carlos
  customScript: [
    {
      role: 'intro',
      duration: 8,
      dialogue: 'Misters, acabo de ver el video de Fantasy Football Pro España sobre el delantero polaco... y hay datos cruciales que NO os están contando. ¡Escuchad esto!',
      emotion: 'mysterious'
    },
    {
      role: 'middle',
      duration: 8,
      dialogue: 'Los números reales son: 5 goles en 5 jornadas, 1 asistencia, y un rating de 6.8... nada comparado con lo que están vendiendo por ahí. ¡Reflexionad!',
      emotion: 'confident'
    },
    {
      role: 'outro',
      duration: 8,
      dialogue: 'Ahora vosotros decidís: confiar en el hype de un 11M o en datos reales. Yo ya os lo he dicho. ¡No os quedéis atrás!',
      emotion: 'urgent'
    }
  ]
};

console.log('🎬 Test: Outlier → VEO3 Prepare Session\n');
console.log('📋 Payload:', JSON.stringify(payload, null, 2));
console.log('\n🌐 Calling POST /api/veo3/prepare-session...\n');

const startTime = Date.now();

axios.post('http://localhost:3000/api/veo3/prepare-session', payload, {
  timeout: 300000, // 5 min
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Response (${duration}s):\n`);
  console.log(JSON.stringify(response.data, null, 2));

  if (response.data.success && response.data.data?.sessionId) {
    console.log('\n\n🎉 SESSION PREPARADA EXITOSAMENTE\n');
    console.log(`📁 Session ID: ${response.data.data.sessionId}`);
    console.log(`📂 Session Dir: ${response.data.data.sessionDir}`);
    console.log(`🖼️  Imágenes: ${response.data.data.nanoBananaImages?.length || 0}`);
    console.log(`💰 Costo Nano Banana: $${response.data.data.nanoBananaCost || 0}`);
    console.log('\n📌 Siguiente paso:');
    console.log(`   POST /api/veo3/generate-segment con sessionId=${response.data.data.sessionId}`);
  }

  process.exit(0);
})
.catch(error => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error(`\n❌ Error (${duration}s):\n`);

  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error('Message:', error.message);
  }

  process.exit(1);
});
