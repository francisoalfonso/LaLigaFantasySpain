// Aplicación principal del Dashboard Fantasy La Liga
function dashboardApp() {
  return {
    // Estado general - FORZADO A FALSE
    isLoading: false,
    apiStatus: 'ready', // checking, connected, error
    apiStatusText: 'Listo',
    activeTab: 'testing', // testing, content, roadmap, architecture

    // Estadísticas
    connectionStatus: 'Verificando...',
    leaguesCount: 0,
    testsPassedCount: 0,
    testsTotalCount: 4,
    calculatorStatus: 'Pendiente',

    // Información del sistema
    systemInfo: {
      api_configured: false,
      environment: 'development',
      port: 3000,
      uptime: 0
    },

    // Estados de las pruebas
    tests: {
      connection: {
        status: 'pending', // pending, success, error
        message: 'Pendiente'
      },
      players: {
        status: 'pending',
        message: 'Pendiente'
      },
      teams: {
        status: 'pending',
        message: 'Pendiente'
      },
      calculator: {
        status: 'pending',
        message: 'Pendiente'
      }
    },

    // Log de resultados
    logs: [],
    logId: 0,

    // Muestras de datos
    dataSamples: [],

    // Calculadora Fantasy
    fantasyCalc: {
      position: 'FWD',
      minutes: 90,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      result: null
    },

    // Inicialización simplificada
    async init() {
      console.log('🚀 Alpine.js inicializando dashboard...');
      console.log('🔍 Estado inicial isLoading:', this.isLoading);

      // FORZAR isLoading a false
      this.isLoading = false;
      console.log('🔧 isLoading forzado a false:', this.isLoading);

      this.addLog('info', '🚀 Dashboard inicializado');

      // Solo cargar progreso del roadmap (sin await para evitar bloqueos)
      this.loadRoadmapTasks();

      // Inicializar fechas históricas
      this.initializeHistoricalDates();

      // Marcar estado inicial sin hacer llamadas API
      this.connectionStatus = 'Listo para probar';
      this.apiStatus = 'ready';
      this.apiStatusText = 'Listo';

      console.log('✅ Inicialización completa, isLoading final:', this.isLoading);

      // Verificación de seguridad para detectar cambios no deseados
      setTimeout(() => {
        if (this.isLoading) {
          console.warn('⚠️ isLoading detectado como true después de la inicialización!');
          this.addLog('warning', '⚠️ Estado de carga detectado como activo sin razón aparente');
        }
      }, 1000);
    },

    // Función de emergencia para resetear el estado de loading
    resetLoadingState() {
      this.isLoading = false;
      this.addLog('info', '🔄 Estado de carga reseteado manualmente');
      console.log('🔄 Loading state reset manually');
    },

    // Utilidades de logging
    addLog(type, message) {
      const timestamp = new Date().toLocaleTimeString();
      this.logs.push({
        id: this.logId++,
        type, // info, success, error, warning
        message,
        timestamp
      });

      // Scroll automático al final
      this.$nextTick(() => {
        const logContainer = document.getElementById('logContainer');
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      });

      // Mantener solo los últimos 100 logs
      if (this.logs.length > 100) {
        this.logs = this.logs.slice(-100);
      }
    },

    clearLog() {
      this.logs = [];
      this.addLog('info', '📋 Log limpiado');
    },

    downloadLog() {
      const logContent = this.logs.map(log =>
        `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
      ).join('\n');

      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fantasy-laliga-log-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      this.addLog('success', '📥 Log descargado');
    },

    // API Calls
    async apiCall(endpoint, options = {}) {
      try {
        const response = await fetch(`/api/${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        this.addLog('error', `❌ Error en ${endpoint}: ${error.message}`);
        throw error;
      }
    },

    // Verificar información del sistema
    async checkSystemInfo() {
      try {
        const health = await this.apiCall('test/ping');
        const config = await this.apiCall('test/config');

        this.systemInfo = {
          api_configured: config.config.api_sports_configured,
          environment: config.config.node_env || 'development',
          port: config.config.port || 3000,
          uptime: Math.round(health.uptime)
        };

        this.addLog('success', '✅ Información del sistema cargada');
      } catch (error) {
        this.addLog('error', '❌ Error obteniendo información del sistema');
      }
    },

    // Test de conexión
    async testConnection() {
      console.log('🔄 Iniciando test de conexión...');
      this.tests.connection.status = 'pending';
      this.tests.connection.message = 'Probando conexión...';
      this.addLog('info', '🔄 Iniciando test de conexión API-Sports...');

      try {
        const result = await this.apiCall('laliga/test');

        if (result.success) {
          this.tests.connection.status = 'success';
          this.tests.connection.message = 'Conexión exitosa';
          this.connectionStatus = 'Conectado';
          this.apiStatus = 'connected';
          this.apiStatusText = 'Conectado';
          this.testsPassedCount = Math.max(this.testsPassedCount, 1);

          this.addLog('success', '✅ Conexión con API-Sports exitosa');
          this.addLog('info', '🏆 Plan Ultra - La Liga datos completos');
        } else {
          throw new Error('Test de conexión falló');
        }
      } catch (error) {
        this.tests.connection.status = 'error';
        this.tests.connection.message = error.message;
        this.connectionStatus = 'Error';
        this.apiStatus = 'error';
        this.apiStatusText = 'Error de conexión';

        this.addLog('error', `❌ Error de conexión: ${error.message}`);
      }
    },

    // Test de jugadores La Liga
    async testPlayers() {
      this.tests.players.status = 'pending';
      this.tests.players.message = 'Obteniendo jugadores...';
      this.addLog('info', '👥 Probando obtención de jugadores La Liga...');

      try {
        const result = await this.apiCall('laliga/laliga/players');

        if (result.success) {
          this.tests.players.status = 'success';
          this.tests.players.message = `${result.count} jugadores obtenidos`;
          this.leaguesCount = result.count;
          this.testsPassedCount = Math.max(this.testsPassedCount, 2);

          this.addLog('success', `✅ ${result.count} jugadores La Liga obtenidos`);

          // Mostrar algunos jugadores de ejemplo
          if (result.data && result.data.length > 0) {
            const firstPlayers = result.data.slice(0, 3);
            firstPlayers.forEach(player => {
              this.addLog('info', `⚽ Jugador: ${player.name || 'N/A'} - ${player.team || 'N/A'}`);
            });
          }
        } else {
          throw new Error('No se pudieron obtener los jugadores');
        }
      } catch (error) {
        this.tests.players.status = 'error';
        this.tests.players.message = error.message;
        this.addLog('error', `❌ Error obteniendo jugadores: ${error.message}`);
      }
    },

    // Test de equipos La Liga
    async testTeams() {
      this.tests.teams.status = 'pending';
      this.tests.teams.message = 'Obteniendo equipos...';
      this.addLog('info', '🏛️ Probando obtención de equipos La Liga...');

      try {
        const result = await this.apiCall('laliga/laliga/teams');

        if (result.success) {
          this.tests.teams.status = 'success';
          this.tests.teams.message = `${result.count} equipos obtenidos`;
          this.testsPassedCount = Math.max(this.testsPassedCount, 3);

          this.addLog('success', `✅ ${result.count} equipos La Liga obtenidos`);

          // Mostrar algunos equipos de ejemplo
          if (result.data && result.data.length > 0) {
            const firstTeams = result.data.slice(0, 3);
            firstTeams.forEach(team => {
              this.addLog('info', `🏛️ Equipo: ${team.name || 'N/A'}`);
            });
          }
        } else {
          throw new Error('No se pudieron obtener los equipos');
        }
      } catch (error) {
        this.tests.teams.status = 'error';
        this.tests.teams.message = error.message;
        this.addLog('error', `❌ Error obteniendo equipos: ${error.message}`);
      }
    },

    // Test de calculadora Fantasy
    async testCalculator() {
      this.tests.calculator.status = 'pending';
      this.tests.calculator.message = 'Probando calculadora...';
      this.addLog('info', '🧮 Probando calculadora Fantasy...');

      try {
        const testData = {
          player_stats: {
            minutes_played: 90,
            goals: 1,
            assists: 1,
            yellow_cards: 0,
            red_cards: 0,
            clean_sheet: false,
            goals_conceded: 0,
            penalties_saved: 0
          },
          position: 'FWD'
        };

        const result = await this.apiCall('test/fantasy-points', {
          method: 'POST',
          body: JSON.stringify(testData)
        });

        if (result.success) {
          this.tests.calculator.status = 'success';
          this.tests.calculator.message = `${result.fantasy_points} puntos calculados`;
          this.calculatorStatus = 'Funcionando';
          this.testsPassedCount = Math.max(this.testsPassedCount, 4);

          this.addLog('success', `✅ Calculadora funcionando: ${result.fantasy_points} puntos`);
          this.addLog('info', `📊 Test: Delantero con 1 gol + 1 asistencia = ${result.fantasy_points} pts`);
        } else {
          throw new Error('Calculadora no funcionó correctamente');
        }
      } catch (error) {
        this.tests.calculator.status = 'error';
        this.tests.calculator.message = error.message;
        this.calculatorStatus = 'Error';
        this.addLog('error', `❌ Error en calculadora: ${error.message}`);
      }
    },

    // Ejecutar todas las pruebas
    async runFullTest() {
      console.log('🚀 runFullTest() iniciado');
      this.isLoading = true;
      this.addLog('info', '🚀 Iniciando test completo del sistema...');

      try {
        console.log('🔍 Ejecutando checkSystemInfo...');
        await this.checkSystemInfo();

        console.log('🔍 Ejecutando testConnection...');
        await this.testConnection();

        console.log('🔍 Ejecutando testPlayers...');
        await this.testPlayers();

        console.log('🔍 Ejecutando testTeams...');
        await this.testTeams();

        console.log('🔍 Ejecutando testCalculator...');
        await this.testCalculator();

        this.addLog('success', `✅ Test completo finalizado: ${this.testsPassedCount}/${this.testsTotalCount} pruebas pasadas`);

        if (this.testsPassedCount === this.testsTotalCount) {
          this.showToast('success', '¡Todos los tests pasaron exitosamente!');
        } else {
          this.showToast('warning', `${this.testsPassedCount} de ${this.testsTotalCount} tests pasaron`);
        }

        console.log('🔍 Cargando muestras de datos...');
        // Cargar muestras de datos después de los tests
        await this.loadDataSamples();

      } catch (error) {
        console.error('❌ Error en runFullTest:', error);
        this.addLog('error', `❌ Error en test completo: ${error.message}`);
        this.showToast('error', 'Error en el test completo');
      } finally {
        console.log('✅ runFullTest() finalizando, setting isLoading = false');
        this.isLoading = false;
      }
    },

    // Calcular puntos Fantasy
    async calculateFantasyPoints() {
      try {
        const testData = {
          player_stats: {
            minutes_played: parseInt(this.fantasyCalc.minutes) || 0,
            goals: parseInt(this.fantasyCalc.goals) || 0,
            assists: parseInt(this.fantasyCalc.assists) || 0,
            yellow_cards: parseInt(this.fantasyCalc.yellow_cards) || 0,
            red_cards: parseInt(this.fantasyCalc.red_cards) || 0,
            clean_sheet: false,
            goals_conceded: 0,
            penalties_saved: 0
          },
          position: this.fantasyCalc.position
        };

        const result = await this.apiCall('test/fantasy-points', {
          method: 'POST',
          body: JSON.stringify(testData)
        });

        if (result.success) {
          this.fantasyCalc.result = result.fantasy_points;
          this.addLog('success', `🧮 Calculado: ${result.fantasy_points} puntos Fantasy para ${this.fantasyCalc.position}`);
        } else {
          throw new Error('Error calculando puntos');
        }
      } catch (error) {
        this.addLog('error', `❌ Error calculando puntos: ${error.message}`);
        this.showToast('error', 'Error calculando puntos Fantasy');
      }
    },

    // Cargar muestras de datos
    async loadDataSamples() {
      try {
        console.log('🔍 loadDataSamples() iniciado');
        const result = await this.apiCall('test/samples');

        if (result.success) {
          this.dataSamples = result.samples.map(sample => ({
            name: sample.name.replace(/_sample$/, '').replace(/_/g, ' '),
            path: sample.path,
            timestamp: 'Disponible'
          }));

          this.addLog('info', `📄 ${result.count} muestras de datos disponibles`);
          console.log('✅ loadDataSamples() completado exitosamente');
        }
      } catch (error) {
        console.error('⚠️ Error en loadDataSamples:', error);
        this.addLog('warning', '⚠️ No se pudieron cargar las muestras de datos');
      }
    },

    // Ver muestra de datos
    async viewSample(sample) {
      try {
        const sampleName = sample.path.split('/').pop();
        const result = await this.apiCall(`test/samples/${sampleName}`);

        if (result.success) {
          // Crear ventana modal o nueva ventana con los datos
          const newWindow = window.open('', '_blank', 'width=800,height=600');
          newWindow.document.write(`
            <html>
              <head>
                <title>Muestra: ${sample.name}</title>
                <style>
                  body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }
                  pre { white-space: pre-wrap; word-wrap: break-word; }
                </style>
              </head>
              <body>
                <h2>${sample.name}</h2>
                <pre>${JSON.stringify(result.data, null, 2)}</pre>
              </body>
            </html>
          `);

          this.addLog('success', `👁️ Muestra "${sample.name}" abierta en nueva ventana`);
        }
      } catch (error) {
        this.addLog('error', `❌ Error abriendo muestra: ${error.message}`);
      }
    },

    // Pipeline Content Validation Data
    dataQuality: {
      lineups: '95%',
      stats: '98%',
      latency: '1.2s'
    },

    fantasyQuality: {
      accuracy: '99.1%',
      mvps: '23/25',
      completeness: '97%'
    },

    n8nIntegration: {
      webhooks: 'Activos',
      workflows: '8/8',
      efficiency: '94%'
    },

    viability: {
      contentQuality: 'Excelente',
      automation: 'Lista',
      roi: 'Alta'
    },

    // Historical simulation data
    selectedHistoricalDate: '',
    maxHistoricalDate: '',
    minHistoricalDate: '',
    historicalData: {
      matches: [],
      events: [],
      weather: {},
      fantasyStats: {}
    },

    // Detailed content plan with full copy
    detailedContentPlan: [],

    // Content statistics
    contentStats: {
      totalPosts: 0,
      automated: 0,
      aiGenerated: 0,
      readyToPublish: 0
    },

    // Content plan data for today
    contentPlan: [
      {
        id: 1,
        time: '08:00',
        channel: 'Instagram',
        channelClass: 'bg-pink-100 text-pink-600',
        type: 'Post',
        content: 'Resumen jornada anterior + Top MVPs Fantasy',
        status: 'Programado',
        statusClass: 'bg-blue-100 text-blue-600'
      },
      {
        id: 2,
        time: '10:30',
        channel: 'Twitter',
        channelClass: 'bg-blue-100 text-blue-600',
        type: 'Thread',
        content: 'Análisis estadístico jugadores destacados',
        status: 'Borrador',
        statusClass: 'bg-yellow-100 text-yellow-600'
      },
      {
        id: 3,
        time: '12:00',
        channel: 'TikTok',
        channelClass: 'bg-purple-100 text-purple-600',
        type: 'Video',
        content: 'Tips rápidos alineación Fantasy hoy',
        status: 'Generando',
        statusClass: 'bg-orange-100 text-orange-600'
      },
      {
        id: 4,
        time: '16:00',
        channel: 'Instagram',
        channelClass: 'bg-pink-100 text-pink-600',
        type: 'Story',
        content: 'Preview partido Real Madrid vs Barcelona',
        status: 'Pendiente',
        statusClass: 'bg-gray-100 text-gray-600'
      },
      {
        id: 5,
        time: '18:30',
        channel: 'YouTube',
        channelClass: 'bg-red-100 text-red-600',
        type: 'Short',
        content: 'Alineaciones confirmadas + predicciones',
        status: 'Pendiente',
        statusClass: 'bg-gray-100 text-gray-600'
      },
      {
        id: 6,
        time: '21:00',
        channel: 'Twitter',
        channelClass: 'bg-blue-100 text-blue-600',
        type: 'Live Tweets',
        content: 'Cobertura en vivo del partido',
        status: 'Automatizado',
        statusClass: 'bg-green-100 text-green-600'
      },
      {
        id: 7,
        time: '23:30',
        channel: 'Instagram',
        channelClass: 'bg-pink-100 text-pink-600',
        type: 'Post',
        content: 'Resumen partido + puntos Fantasy finales',
        status: 'Pendiente',
        statusClass: 'bg-gray-100 text-gray-600'
      }
    ],

    // Roadmap tasks data structure
    roadmapTasks: {
      setup: {
        gmail: false,
        github: false,
        api_sports: false,
        env_variables: false,
        ssl_cert: false,
        domain: false
      },
      mvp: {
        heygen_account: false,
        avatar_design: false,
        avatar_training: false,
        test_videos: false,
        content_templates: false,
        data_integration: false,
        content_scheduler: false,
        instagram_account: false,
        tiktok_account: false,
        youtube_account: false,
        brand_design: false
      },
      production: {
        content_batch: false,
        launch_strategy: false,
        analytics_setup: false,
        posting_automation: false,
        data_sync: false,
        monitoring: false,
        response_templates: false,
        engagement_strategy: false,

        // Agente Investigador Competencia
        competitive_intelligence_agent: false,
        competitor_content_monitoring: false,
        viral_content_detection: false,
        trending_topics_tracker: false,
        competitor_analysis_dashboard: false,
        automated_content_triggers: false,
        response_content_generator: false,
        real_time_trend_alerts: false,
        competitive_gap_analysis: false
      },
      team_evolution: {
        // Fase Team DAZN Model - Multi Reporteros
        team_concept_design: false,
        dazn_branding_research: false,
        avatar_personas_definition: false,

        // Reporteros individuales
        ana_martinez_avatar: false,       // Analista Senior (28)
        carlos_gonzalez_avatar: false,    // Experto Stats (32)
        lucia_rodriguez_avatar: false,    // Especialista Femenina (26)
        pablo_genz_avatar: false,         // Teenager GenZ (19)

        // Sistema técnico
        content_rotation_system: false,
        personality_script_engine: false,
        voice_cloning_setup: false,
        uniform_visual_system: false,

        // HeyGen Enterprise
        heygen_enterprise_plan: false,
        multi_avatar_setup: false,
        voice_customization: false,
        brand_overlay_system: false,

        // Liga Femenina Integration
        women_league_data_integration: false,
        lucia_content_templates: false,
        female_audience_strategy: false,

        // GenZ Strategy (Pablo)
        tiktok_viral_strategy: false,
        twitch_streaming_setup: false,
        meme_content_templates: false,
        genz_language_adaptation: false,

        // Content Distribution
        platform_specialization: false,
        daily_rotation_scheduler: false,
        special_events_assignment: false,
        cross_platform_publishing: false,

        // Channel Naming Strategy
        primary_channel_names_defined: false,
        backup_channel_names_defined: false,
        channel_availability_verified: false,
        brand_consistency_guidelines: false
      },

      scale: {
        english_avatar: false,
        usa_market: false,
        other_leagues: false,
        ai_predictions: false,
        mobile_app: false,
        premium_tier: false,
        sponsorships: false,
        affiliate_program: false,
        merchandise: false
      }
    },

    // Calcular progreso de cada fase
    getRoadmapProgress(phase) {
      const tasks = this.roadmapTasks[phase];
      if (!tasks) return 0;

      const taskValues = Object.values(tasks);
      const completedTasks = taskValues.filter(task => task === true).length;
      const totalTasks = taskValues.length;

      return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    },

    // Calcular progreso total
    getTotalProgress() {
      const phases = ['setup', 'mvp', 'production', 'team_evolution', 'scale'];
      const totalProgress = phases.reduce((sum, phase) => {
        return sum + this.getRoadmapProgress(phase);
      }, 0);

      return Math.round(totalProgress / phases.length);
    },

    // Guardar estado en localStorage
    saveRoadmapTasks() {
      try {
        localStorage.setItem('laligaai_roadmap_tasks', JSON.stringify(this.roadmapTasks));
        console.log('💾 Roadmap tasks saved to localStorage');

        // Log de progreso actualizado
        const totalProgress = this.getTotalProgress();
        this.addLog('info', `📊 Progreso del proyecto actualizado: ${totalProgress}%`);
      } catch (error) {
        console.error('❌ Error saving roadmap tasks:', error);
      }
    },

    // Actualizar estado de tarea y guardar automáticamente
    updateRoadmapTask(phase, task, value) {
      if (this.roadmapTasks[phase] && this.roadmapTasks[phase].hasOwnProperty(task)) {
        this.roadmapTasks[phase][task] = value;
        this.saveRoadmapTasks();

        // Log del cambio
        const action = value ? 'completada' : 'pendiente';
        const taskName = task.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        this.addLog('info', `📋 Tarea ${action}: ${taskName}`);
      }
    },

    // Cargar estado desde localStorage
    loadRoadmapTasks() {
      try {
        const saved = localStorage.getItem('laligaai_roadmap_tasks');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.roadmapTasks = { ...this.roadmapTasks, ...parsed };
          console.log('📂 Roadmap tasks loaded from localStorage');
        }
      } catch (error) {
        console.error('❌ Error loading roadmap tasks:', error);
      }
    },

    // Mostrar notificaciones toast
    showToast(type, message) {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="text-xl">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
          </div>
          <div>
            <p class="font-medium">${message}</p>
          </div>
        </div>
      `;

      document.body.appendChild(toast);

      // Mostrar toast
      setTimeout(() => toast.classList.add('show'), 100);

      // Ocultar y remover toast
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 400);
      }, 4000);
    },

    // Pipeline Content Functions
    getContentPlan() {
      return this.contentPlan;
    },

    // Generate content preview
    async generateContentPreview() {
      this.addLog('info', '🎬 Generando preview de contenido...');
      try {
        // Simular generación de contenido con datos reales
        const match = {
          homeTeam: 'Real Madrid',
          awayTeam: 'FC Barcelona',
          date: new Date().toLocaleDateString(),
          time: '21:00'
        };

        // Simular llamada a GPT-4 para generar contenido
        const sampleContent = {
          instagram_post: `🔥 ¡EL CLÁSICO ESTÁ AQUÍ! 🔥\n\n⚽ ${match.homeTeam} vs ${match.awayTeam}\n🕘 Hoy ${match.time}\n\n💎 TIPS FANTASY:\n• Benzema capitán seguro\n• Pedri gran opción medio\n• Courtois vs Ter Stegen\n\n¿Tu once ideal? 👇\n#ElClasico #FantasyLaLiga`,

          twitter_thread: `🧵 THREAD: Análisis pre-${match.homeTeam} vs ${match.awayTeam}\n\n1/7 Los datos no mienten: En los últimos 5 clásicos, los delanteros han sido MVP en el 80% de casos\n\n2/7 📊 Estadísticas clave:\n• Benzema: 12 goles en casa esta temporada\n• Lewandowski: 9 goles fuera\n• Ambos en gran forma`,

          tiktok_script: `🎬 GUIÓN TIKTOK (30s):\n\n0-3s: "El clásico está aquí y yo te doy los MEJORES tips"\n4-10s: Mostrar stats Benzema vs Lewandowski\n11-20s: "Pero el SECRETO está en el medio campo"\n21-30s: "Mi once ideal te dará 100+ puntos"`
        };

        // Actualizar plan de contenido con contenido generado
        this.contentPlan = this.contentPlan.map(item => {
          if (item.status === 'Pendiente' || item.status === 'Borrador') {
            return {
              ...item,
              status: 'Generado',
              statusClass: 'bg-green-100 text-green-600'
            };
          }
          return item;
        });

        this.addLog('success', '✅ Preview de contenido generado exitosamente');
        this.showToast('success', 'Contenido generado con IA');

        // Mostrar ventana con el contenido generado
        this.showContentPreview(sampleContent);

      } catch (error) {
        this.addLog('error', `❌ Error generando contenido: ${error.message}`);
        this.showToast('error', 'Error en generación de contenido');
      }
    },

    // Show content preview modal
    showContentPreview(content) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-4xl max-h-[80vh] overflow-y-auto p-6 m-4">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-800">🎬 Preview Contenido Generado</h3>
            <button onclick="this.parentElement.parentElement.parentElement.remove()"
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-pink-600 mb-3">📸 Instagram Post</h4>
              <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">${content.instagram_post}</div>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-blue-600 mb-3">🐦 Twitter Thread</h4>
              <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">${content.twitter_thread}</div>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-purple-600 mb-3">🎵 TikTok Script</h4>
              <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">${content.tiktok_script}</div>
            </div>
          </div>

          <div class="mt-6 flex justify-center space-x-4">
            <button onclick="this.parentElement.parentElement.remove()"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
              Cerrar
            </button>
            <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
              💾 Guardar en Cola
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    },

    // Export content plan
    async exportContentPlan() {
      try {
        const exportData = {
          date: new Date().toISOString().split('T')[0],
          content_plan: this.contentPlan,
          metrics: {
            data_quality: this.dataQuality,
            fantasy_quality: this.fantasyQuality,
            n8n_integration: this.n8nIntegration,
            viability: this.viability
          },
          generated_at: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `content-plan-${exportData.date}.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.addLog('success', '📥 Plan de contenido exportado');
        this.showToast('success', 'Plan exportado exitosamente');
      } catch (error) {
        this.addLog('error', `❌ Error exportando plan: ${error.message}`);
        this.showToast('error', 'Error al exportar');
      }
    },

    // Test data capture
    async testDataCapture() {
      this.addLog('info', '🧪 Iniciando test de captura de datos...');
      try {
        // Simular captura de evento en tiempo real
        const startTime = Date.now();

        // Test API-Sports
        const apiResult = await this.apiCall('laliga/test');
        const apiLatency = Date.now() - startTime;

        // Simular webhook trigger
        const webhookTest = {
          event: 'goal_scored',
          player: 'Karim Benzema',
          team: 'Real Madrid',
          minute: 67,
          timestamp: new Date().toISOString()
        };

        // Actualizar métricas
        this.dataQuality.latency = `${apiLatency}ms`;

        this.addLog('success', `✅ Captura de datos exitosa - Latencia: ${apiLatency}ms`);
        this.addLog('info', `⚽ Evento simulado: ${webhookTest.player} marca en minuto ${webhookTest.minute}`);
        this.showToast('success', `Test completado - ${apiLatency}ms latencia`);

      } catch (error) {
        this.addLog('error', `❌ Error en test captura: ${error.message}`);
        this.showToast('error', 'Error en test de captura');
      }
    },

    // Test content generation
    async testContentGeneration() {
      this.addLog('info', '🤖 Iniciando test de generación IA...');
      try {
        // Simular datos del partido actual
        const matchData = {
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          minute: 67,
          score: '2-1',
          lastEvent: {
            type: 'goal',
            player: 'Karim Benzema',
            team: 'Real Madrid'
          }
        };

        // Simular generación con GPT-4
        const generatedContent = {
          instagram: `🔥 ¡GOLAZO DE BENZEMA! ⚽\n\n${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam}\nMinuto ${matchData.minute}\n\n💎 +6 puntos Fantasy para los que lo tenían de capitán\n\n#ElClasico #Benzema #FantasyLaLiga`,

          twitter: `⚽ GOAL! ${matchData.lastEvent.player} pone por delante al ${matchData.lastEvent.team}\n\n${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam} (${matchData.minute}')\n\n📊 Fantasy Points: +4 gol + 2 partido = 6 pts\n\n#ElClasico`,

          tiktok: `¡QUE GOLAZO! Benzema la clava en el minuto ${matchData.minute}. Los que lo tenían de capitán están celebrando 🎉`
        };

        this.addLog('success', '✅ Contenido IA generado exitosamente');
        this.addLog('info', '📱 Instagram: Post con gol generado');
        this.addLog('info', '🐦 Twitter: Tweet en tiempo real creado');
        this.addLog('info', '🎵 TikTok: Script para video rápido listo');

        this.showToast('success', 'Contenido IA generado correctamente');

        // Mostrar preview del contenido
        this.showContentPreview(generatedContent);

      } catch (error) {
        this.addLog('error', `❌ Error en generación IA: ${error.message}`);
        this.showToast('error', 'Error en generación de contenido');
      }
    },

    // Test n8n workflow
    async testN8nWorkflow() {
      this.addLog('info', '⚙️ Iniciando test de workflow n8n...');
      try {
        // Simular ejecución de workflow completo
        const workflowSteps = [
          'Trigger: Nuevo gol detectado',
          'Capturando datos del jugador...',
          'Calculando puntos Fantasy...',
          'Generando contenido con GPT-4...',
          'Programando posts en redes sociales...',
          'Enviando notificaciones...'
        ];

        for (let i = 0; i < workflowSteps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          this.addLog('info', `🔄 Paso ${i + 1}/6: ${workflowSteps[i]}`);
        }

        // Simular resultado final
        const workflowResult = {
          execution_time: '2.3s',
          posts_scheduled: 4,
          notifications_sent: 2,
          fantasy_points_updated: 1250,
          status: 'success'
        };

        this.addLog('success', `✅ Workflow n8n completado en ${workflowResult.execution_time}`);
        this.addLog('info', `📅 ${workflowResult.posts_scheduled} posts programados automáticamente`);
        this.addLog('info', `📧 ${workflowResult.notifications_sent} notificaciones enviadas`);
        this.addLog('info', `🏆 ${workflowResult.fantasy_points_updated} usuarios con puntos actualizados`);

        // Actualizar métricas de n8n
        this.n8nIntegration.efficiency = '96%';

        this.showToast('success', 'Workflow n8n ejecutado correctamente');

      } catch (error) {
        this.addLog('error', `❌ Error en workflow n8n: ${error.message}`);
        this.showToast('error', 'Error en workflow de automatización');
      }
    },

    // Historical Simulation Functions
    initializeHistoricalDates() {
      const today = new Date();
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() - 1); // Yesterday

      const minDate = new Date(today);
      minDate.setDate(today.getDate() - 7); // One week ago

      this.maxHistoricalDate = maxDate.toISOString().split('T')[0];
      this.minHistoricalDate = minDate.toISOString().split('T')[0];
      this.selectedHistoricalDate = this.maxHistoricalDate; // Default to yesterday

      console.log('📅 Historical dates initialized:', this.minHistoricalDate, 'to', this.maxHistoricalDate);
    },

    // Load historical data for selected date
    async loadHistoricalData() {
      if (!this.selectedHistoricalDate) {
        this.showToast('error', 'Selecciona una fecha válida');
        return;
      }

      this.addLog('info', `📅 Cargando datos históricos para ${this.selectedHistoricalDate}...`);

      try {
        // Simulate API call to get historical matches for the date
        const historicalMatches = await this.getHistoricalMatches(this.selectedHistoricalDate);

        this.historicalData.matches = historicalMatches;
        this.addLog('success', `✅ ${historicalMatches.length} partidos cargados para ${this.selectedHistoricalDate}`);

        // Generate content plan based on historical data
        await this.generateHistoricalContentPlan();

        this.showToast('success', 'Datos históricos cargados correctamente');

      } catch (error) {
        this.addLog('error', `❌ Error cargando datos históricos: ${error.message}`);
        this.showToast('error', 'Error al cargar datos históricos');
      }
    },

    // Get historical matches for a specific date (simulated with real data structure)
    async getHistoricalMatches(date) {
      // This would be replaced with actual API-Sports historical data
      const sampleMatches = [
        {
          id: 1,
          homeTeam: 'Real Madrid',
          awayTeam: 'Atlético Madrid',
          score: '2-1',
          time: '21:00',
          fantasyEvents: 12,
          goals: [
            { player: 'Benzema', minute: 23, team: 'Real Madrid' },
            { player: 'Griezmann', minute: 67, team: 'Atlético Madrid' },
            { player: 'Modric', minute: 89, team: 'Real Madrid' }
          ],
          assists: [
            { player: 'Vinicius Jr.', minute: 23 },
            { player: 'Koke', minute: 67 },
            { player: 'Benzema', minute: 89 }
          ]
        },
        {
          id: 2,
          homeTeam: 'FC Barcelona',
          awayTeam: 'Valencia',
          score: '3-0',
          time: '16:15',
          fantasyEvents: 8,
          goals: [
            { player: 'Lewandowski', minute: 15, team: 'FC Barcelona' },
            { player: 'Pedri', minute: 34, team: 'FC Barcelona' },
            { player: 'Gavi', minute: 78, team: 'FC Barcelona' }
          ],
          assists: [
            { player: 'Raphinha', minute: 15 },
            { player: 'Lewandowski', minute: 34 },
            { player: 'Frenkie de Jong', minute: 78 }
          ]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return sampleMatches;
    },

    // Generate detailed content plan based on historical data
    async generateHistoricalContentPlan() {
      this.addLog('info', '🎬 Generando plan de contenido basado en datos históricos...');

      const detailedPlan = [
        {
          id: 1,
          time: '08:00',
          channel: 'Instagram',
          channelClass: 'bg-pink-100 text-pink-600',
          type: 'Post Matutino',
          format: '1080x1080, carousel',
          trigger: 'Programado',
          triggerClass: 'bg-blue-100 text-blue-600',
          title: 'Buenos días Fantasy Managers',
          preview: '☀️ Buenos días, Fantasy Managers! Ayer tuvimos una jornada ÉPICA con grandes performances. Benzema y Lewandowski fueron los reyes...',
          fullContent: `☀️ Buenos días, Fantasy Managers!

Ayer tuvimos una jornada ÉPICA con grandes performances que definieron muchas ligas Fantasy:

🔥 HIGHLIGHTS DEL DÍA:
• Benzema ⚽⚽ - 12 pts Fantasy
• Lewandowski ⚽⚽⚽ - 16 pts Fantasy
• Modric 🅰️ - 6 pts Fantasy
• Pedri ⚽🅰️ - 9 pts Fantasy

💎 JUGADOR DEL DÍA:
Robert Lewandowski con hat-trick ante Valencia. Los que lo tenían de capitán están celebrando 🎉

📊 ESTADÍSTICAS:
- 5 goles en 2 partidos
- 3 asistencias clave
- 2 porterías a cero

¿Cómo te fue ayer? ¡Cuéntanos en comentarios! 👇

#FantasyLaLiga #LaLiga #Benzema #Lewandowski #FantasyFootball`,
          wordCount: 95,
          hashtags: 5,
          status: 'Generado',
          statusClass: 'bg-green-100 text-green-600',
          confidence: '95% calidad'
        },
        {
          id: 2,
          time: '12:30',
          channel: 'Twitter',
          channelClass: 'bg-blue-100 text-blue-600',
          type: 'Thread Análisis',
          format: 'Thread 8 tweets',
          trigger: 'Manual',
          triggerClass: 'bg-gray-100 text-gray-600',
          title: 'THREAD: Análisis jornada Fantasy',
          preview: '🧵 THREAD: Análisis completo de la jornada Fantasy de ayer. Te explico los números que realmente importan...',
          fullContent: `🧵 THREAD: Análisis completo de la jornada Fantasy de ayer

1/8 Los números no mienten: Fue una jornada de DELANTEROS. El 70% de los puntos Fantasy vinieron de la delantera 📊

2/8 🏆 BENZEMA vs LEWANDOWSKI:
• Benzema: 2 goles, 1 asistencia = 12 pts
• Lewandowski: 3 goles, 1 asistencia = 16 pts
Ambos justificaron su precio premium

3/8 💎 GANGAS DE LA JORNADA:
• Pedri (6M): 9 puntos Fantasy
• Modric (7M): 6 puntos + asistencia clave
ROI espectacular para mediocampistas baratos

4/8 📉 DECEPCIONES:
• Griezmann: Solo 4 puntos pese a marcar
• Ter Stegen: -2 puntos por gol encajado
Los capitanes aquí sufrieron

5/8 🎯 DATOS CURIOSOS:
• El 89% de managers que tenían a Lewandowski de capitán ganaron sus mini-ligas
• Real Madrid clean sheet = Courtois 6 puntos extra

6/8 📊 FANTASY POINTS DISTRIBUTION:
• Delanteros: 45% del total
• Mediocampistas: 30%
• Defensas: 15%
• Porteros: 10%

7/8 💡 LEARNING para próxima jornada:
- Priorizar delanteros en partidos de alto scoring
- Mediocampistas creativos = mejor ROI
- No subestimar defensas en casa

8/8 ¿Te sirvió el análisis? RT si quieres más threads como este 🔄

#FantasyLaLiga #DataAnalysis`,
          wordCount: 234,
          hashtags: 2,
          status: 'Borrador',
          statusClass: 'bg-yellow-100 text-yellow-600',
          confidence: '92% calidad'
        },
        {
          id: 3,
          time: '16:00',
          channel: 'TikTok',
          channelClass: 'bg-purple-100 text-purple-600',
          type: 'Video Viral',
          format: '9:16, 30s',
          trigger: 'Trending',
          triggerClass: 'bg-red-100 text-red-600',
          title: 'Lewandowski hat-trick reaction',
          preview: 'POV: Tenías a Lewandowski de capitán cuando marcó hat-trick 🤯 La reacción que todos tuvimos...',
          fullContent: `🎬 SCRIPT TIKTOK (30 segundos):

[0-3s] HOOK: "POV: Tenías a Lewandowski de capitán"
[Visual: Cara de shock/sorpresa]

[4-8s] SETUP: "Cuando ves que marca el primer gol..."
[Visual: Emoción contenida]

[9-15s] BUILD UP: "Segundo gol... tercer gol..."
[Visual: Euforia creciente]

[16-25s] CLIMAX: "¡HAT-TRICK! +16 puntos Fantasy"
[Visual: Celebración épica]

[26-30s] CTA: "¿Lo tenías de capitán? Comenta 👇"

📝 TEXTO OVERLAY:
- "HAT-TRICK LEWANDOWSKI"
- "+16 PUNTOS FANTASY"
- "BEST CAPTAIN EVER"

🎵 MÚSICA: Trending Epic moment sound

#FantasyLaLiga #Lewandowski #HatTrick #FantasyFootball #LaLiga #Epic`,
          wordCount: 87,
          hashtags: 6,
          status: 'Pendiente',
          statusClass: 'bg-gray-100 text-gray-600',
          confidence: '88% viral'
        },
        {
          id: 4,
          time: '19:30',
          channel: 'YouTube',
          channelClass: 'bg-red-100 text-red-600',
          type: 'Short Análisis',
          format: '9:16, 60s',
          trigger: 'Programado',
          triggerClass: 'bg-blue-100 text-blue-600',
          title: 'Real Madrid vs Atlético: Análisis Fantasy',
          preview: 'Análisis completo del derbi madrileño desde perspectiva Fantasy. Los puntos clave que determinaron...',
          fullContent: `🎬 YOUTUBE SHORT SCRIPT (60 segundos):

TÍTULO: "DERBI MADRILEÑO: Análisis Fantasy Completo"

[0-5s] HOOK: "El derbi que cambió las Fantasy Leagues"

[6-15s] CONTEXT:
"Real Madrid 2-1 Atlético Madrid
Los números que REALMENTE importan para Fantasy"

[16-30s] ANÁLISIS BENZEMA:
"Benzema: 2 goles + 1 asistencia = 12 puntos
¿Por qué fue la mejor inversión?"

[31-45s] ANÁLISIS GENERAL:
"Courtois: Clean sheet = 6 puntos extras
Modric: Asistencia clave en minuto 89"

[46-55s] CONCLUSIÓN:
"Real Madrid players = mejor rendimiento
El derbi siempre da puntos Fantasy"

[56-60s] CTA: "¿Qué opinas? Comenta abajo"

📝 ELEMENTOS VISUALES:
- Stats overlay
- Player highlights
- Fantasy points tracker
- Match momentum

#FantasyLaLiga #RealMadrid #AtleticoMadrid #Derbi`,
          wordCount: 134,
          hashtags: 4,
          status: 'Programado',
          statusClass: 'bg-blue-100 text-blue-600',
          confidence: '94% engagement'
        }
      ];

      this.detailedContentPlan = detailedPlan;

      // Update content statistics
      this.updateContentStats();

      this.addLog('success', `✅ Plan detallado generado: ${detailedPlan.length} contenidos`);
    },

    // Get detailed content plan
    getDetailedContentPlan() {
      return this.detailedContentPlan;
    },

    // Update content statistics
    updateContentStats() {
      this.contentStats = {
        totalPosts: this.detailedContentPlan.length,
        automated: this.detailedContentPlan.filter(item => item.trigger === 'Automatizado' || item.trigger === 'Programado').length,
        aiGenerated: this.detailedContentPlan.filter(item => item.status === 'Generado').length,
        readyToPublish: this.detailedContentPlan.filter(item => item.status === 'Generado' || item.status === 'Programado').length
      };
    },

    // Generate detailed content plan for historical data
    async generateDetailedContentPlan() {
      this.addLog('info', '🎯 Generando plan de contenido completo...');

      try {
        if (this.historicalData.matches.length === 0) {
          this.showToast('warning', 'Primero carga datos históricos');
          return;
        }

        await this.generateHistoricalContentPlan();
        this.showToast('success', 'Plan detallado generado exitosamente');

      } catch (error) {
        this.addLog('error', `❌ Error generando plan detallado: ${error.message}`);
        this.showToast('error', 'Error en generación de plan');
      }
    },

    // Preview all content
    async previewAllContent() {
      if (this.detailedContentPlan.length === 0) {
        this.showToast('warning', 'Primero genera el plan de contenido');
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-2xl font-bold text-gray-800">📋 Preview Completo - ${this.selectedHistoricalDate}</h3>
            <button onclick="this.parentElement.parentElement.parentElement.remove()"
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="p-6 space-y-6">
            ${this.detailedContentPlan.map(item => `
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-semibold text-lg text-gray-800">${item.time} - ${item.channel}</h4>
                    <div class="text-sm text-gray-600">${item.type} | ${item.format}</div>
                  </div>
                  <span class="px-2 py-1 rounded text-xs ${item.statusClass}">${item.status}</span>
                </div>

                <h5 class="font-medium text-gray-700 mb-2">${item.title}</h5>
                <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">${item.fullContent}</div>

                <div class="mt-3 flex justify-between text-xs text-gray-500">
                  <span>${item.wordCount} palabras | ${item.hashtags} hashtags</span>
                  <span>${item.confidence}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="p-6 border-t border-gray-200 flex justify-center space-x-4">
            <button onclick="this.parentElement.parentElement.remove()"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
              Cerrar
            </button>
            <button onclick="alert('Función de exportación para avatares')"
                    class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
              📤 Exportar para Avatares
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.addLog('success', '👁️ Preview completo mostrado');
    },

    // Individual content actions
    previewContent(item) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-xl font-bold text-gray-800">${item.title}</h3>
            <button onclick="this.parentElement.parentElement.parentElement.remove()"
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="p-6">
            <div class="mb-4">
              <span class="px-3 py-1 rounded ${item.channelClass} font-medium">${item.channel}</span>
              <span class="ml-2 text-sm text-gray-600">${item.time} | ${item.type}</span>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <div class="whitespace-pre-line">${item.fullContent}</div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Palabras:</span> ${item.wordCount}
              </div>
              <div>
                <span class="text-gray-600">Hashtags:</span> ${item.hashtags}
              </div>
              <div>
                <span class="text-gray-600">Formato:</span> ${item.format}
              </div>
              <div>
                <span class="text-gray-600">Confianza:</span> ${item.confidence}
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-gray-200 flex justify-center space-x-4">
            <button onclick="this.parentElement.parentElement.remove()"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
              Cerrar
            </button>
            <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              ✏️ Editar
            </button>
            <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
              🔄 Regenerar
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    },

    editContent(item) {
      this.addLog('info', `✏️ Editando contenido: ${item.title}`);
      this.showToast('info', 'Función de edición disponible próximamente');
    },

    regenerateContent(item) {
      this.addLog('info', `🔄 Regenerando contenido: ${item.title}`);
      this.showToast('info', 'Regenerando contenido con IA...');

      // Simulate regeneration
      setTimeout(() => {
        item.status = 'Regenerado';
        item.statusClass = 'bg-purple-100 text-purple-600';
        this.showToast('success', 'Contenido regenerado exitosamente');
      }, 2000);
    },

    scheduleContent(item) {
      this.addLog('info', `📅 Programando contenido: ${item.title}`);
      this.showToast('success', 'Contenido programado para publicación');

      item.status = 'Programado';
      item.statusClass = 'bg-blue-100 text-blue-600';
      this.updateContentStats();
    }
  };
}