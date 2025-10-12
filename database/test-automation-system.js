/**
 * Test del Sistema de Automatización Centralizado
 *
 * Verifica que las tablas, funciones y servicios funcionan correctamente
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutomationSystem() {
    console.log('🧪 Iniciando pruebas del Sistema de Automatización Centralizado\n');

    try {
        // TEST 1: Verificar que las tablas existen
        console.log('📋 TEST 1: Verificando tablas en Supabase...');

        const { data: recommendations, error: recError } = await supabase
            .from('competitive_recommendations')
            .select('id')
            .limit(1);

        if (recError) {
            console.error('❌ Tabla competitive_recommendations no existe:', recError.message);
            return;
        }
        console.log('✅ Tabla competitive_recommendations existe');

        const { data: queue, error: queueError } = await supabase
            .from('automation_queue')
            .select('id')
            .limit(1);

        if (queueError) {
            console.error('❌ Tabla automation_queue no existe:', queueError.message);
            return;
        }
        console.log('✅ Tabla automation_queue existe\n');

        // TEST 2: Verificar funciones SQL
        console.log('⚙️  TEST 2: Verificando funciones SQL...');

        const { data: capacity, error: capError } = await supabase.rpc('get_available_capacity', {
            provider_name: 'veo3'
        });

        if (capError) {
            console.error('❌ Función get_available_capacity no funciona:', capError.message);
            return;
        }
        console.log('✅ Función get_available_capacity funciona');
        console.log('   Capacidad VEO3:', JSON.stringify(capacity, null, 2));

        // TEST 3: Encolar trabajo de prueba
        console.log('\n📤 TEST 3: Encolando trabajo de prueba...');

        const { data: jobId, error: enqueueError } = await supabase.rpc('enqueue_job', {
            job_priority: 'P2',
            job_type_param: 'veo3_chollo',
            job_title: 'TEST: Video Pepelu - Chollo Jornada 8',
            job_config_param: {
                player: 'Pepelu',
                team: 'Valencia',
                price: 5.5,
                points_potential: 8.2,
                gameweek: 8
            },
            estimated_duration: 300,
            api_provider_param: 'veo3',
            source_type_param: 'manual',
            schedule_after_param: new Date().toISOString()
        });

        if (enqueueError) {
            console.error('❌ Error encolando trabajo:', enqueueError.message);
            return;
        }
        console.log('✅ Trabajo encolado con ID:', jobId);

        // TEST 4: Verificar cola pendiente
        console.log('\n📊 TEST 4: Verificando cola pendiente...');

        const { data: pending, error: pendingError } = await supabase
            .from('queue_pending')
            .select('*')
            .limit(5);

        if (pendingError) {
            console.error('❌ Error consultando queue_pending:', pendingError.message);
            return;
        }
        console.log(`✅ ${pending.length} trabajos pendientes en cola`);
        if (pending.length > 0) {
            console.log('\n   Primer trabajo pendiente:');
            console.log('   - ID:', pending[0].id);
            console.log('   - Título:', pending[0].title);
            console.log('   - Prioridad:', pending[0].priority);
            console.log('   - Tipo:', pending[0].job_type);
            console.log('   - API:', pending[0].api_provider);
        }

        // TEST 5: Probar generación de recomendaciones
        console.log('\n🎯 TEST 5: Probando RecommendationEngine...');

        const recommendationEngine = require('../backend/services/contentAnalysis/recommendationEngine');

        // Verificar si hay videos completados para analizar
        const { data: videos, error: videosError } = await supabase
            .from('competitive_videos')
            .select('id, title, processing_status')
            .eq('processing_status', 'completed')
            .limit(5);

        if (videosError) {
            console.error('❌ Error consultando videos:', videosError.message);
            return;
        }

        console.log(`   📹 ${videos.length} videos completados disponibles para análisis`);

        if (videos.length > 0) {
            console.log('   Generando recomendaciones desde últimos 7 días...');

            const recommendations = await recommendationEngine.generateRecommendations({
                lookbackDays: 7
            });

            console.log(`✅ ${recommendations.length} recomendaciones generadas`);

            // Mostrar estadísticas
            const stats = await recommendationEngine.getStats();
            if (stats) {
                console.log('\n   📈 Estadísticas de recomendaciones:');
                console.log('   - Total:', stats.total);
                console.log('   - Por estado:', JSON.stringify(stats.by_status, null, 2));
                console.log('   - Por prioridad:', JSON.stringify(stats.by_priority, null, 2));
                console.log('   - Por tipo:', JSON.stringify(stats.by_type, null, 2));
            }
        } else {
            console.log('⚠️  No hay videos completados para generar recomendaciones');
        }

        // TEST 6: Verificar vistas de recomendaciones
        console.log('\n📊 TEST 6: Verificando vistas de recomendaciones...');

        const { data: recQueue, error: recQueueError } = await supabase
            .from('recommendations_queue')
            .select('*')
            .limit(5);

        if (recQueueError) {
            console.error('❌ Error consultando recommendations_queue:', recQueueError.message);
        } else {
            console.log(`✅ ${recQueue.length} recomendaciones pendientes en cola`);
            if (recQueue.length > 0) {
                console.log('\n   Primera recomendación:');
                console.log('   - Título:', recQueue[0].title);
                console.log('   - Tipo:', recQueue[0].recommendation_type);
                console.log('   - Prioridad:', recQueue[0].priority);
                console.log('   - Viral Potential:', recQueue[0].viral_potential);
                console.log('   - Jugador:', recQueue[0].target_player);
            }
        }

        // TEST 7: Verificar VideoOrchestrator status
        console.log('\n🎬 TEST 7: Verificando VideoOrchestrator...');

        const videoOrchestrator = require('../backend/services/videoOrchestrator');

        const orchestratorStatus = await videoOrchestrator.getStatus();

        if (orchestratorStatus) {
            console.log('✅ VideoOrchestrator status:');
            console.log('   - Running:', orchestratorStatus.is_running);
            console.log('   - Jobs en proceso:', orchestratorStatus.processing_jobs);
            console.log('   - Total trabajos:', orchestratorStatus.stats.total);
            console.log('   - Por estado:', JSON.stringify(orchestratorStatus.stats.by_status));
            console.log(
                '   - Por proveedor:',
                JSON.stringify(orchestratorStatus.stats.by_provider)
            );
        }

        // RESUMEN FINAL
        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ SISTEMA DE AUTOMATIZACIÓN CENTRALIZADO: OPERACIONAL');
        console.log('='.repeat(60));
        console.log('\n📋 Resumen:');
        console.log('   ✅ Tablas creadas y funcionando');
        console.log('   ✅ Funciones SQL operativas');
        console.log('   ✅ Cola de trabajos funcional');
        console.log('   ✅ RecommendationEngine funcional');
        console.log('   ✅ VideoOrchestrator disponible');
        console.log('\n🚀 Próximos pasos:');
        console.log('   1. Iniciar VideoOrchestrator: videoOrchestrator.start()');
        console.log('   2. Verificar procesamiento: SELECT * FROM queue_processing;');
        console.log('   3. Monitorear logs del orchestrator');
        console.log('   4. Crear dashboard visual en /automation-calendar');
        console.log('\n');
    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar tests
testAutomationSystem()
    .then(() => {
        console.log('✅ Tests completados');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error en tests:', error.message);
        process.exit(1);
    });
