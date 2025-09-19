// Aplicación principal del Dashboard Fantasy La Liga
function dashboardApp() {
  return {
    // Estado general
    isLoading: false,
    apiStatus: 'checking', // checking, connected, error
    apiStatusText: 'Verificando...',
    activeTab: 'testing', // testing, content

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

    // Inicialización
    async init() {
      console.log('🚀 Alpine.js inicializando dashboard...');
      this.addLog('info', '🚀 Dashboard inicializado');
      console.log('📊 Estado inicial:', this.tests);

      // Cargar progreso del roadmap desde localStorage
      this.loadRoadmapTasks();

      try {
        await this.checkSystemInfo();
        await this.testConnection();
        this.loadDataSamples();
        console.log('✅ Inicialización completa');
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        this.addLog('error', `Error de inicialización: ${error.message}`);
      }
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
      this.isLoading = true;
      this.addLog('info', '🚀 Iniciando test completo del sistema...');

      try {
        await this.checkSystemInfo();
        await this.testConnection();
        await this.testPlayers();
        await this.testTeams();
        await this.testCalculator();

        this.addLog('success', `✅ Test completo finalizado: ${this.testsPassedCount}/${this.testsTotalCount} pruebas pasadas`);

        if (this.testsPassedCount === this.testsTotalCount) {
          this.showToast('success', '¡Todos los tests pasaron exitosamente!');
        } else {
          this.showToast('warning', `${this.testsPassedCount} de ${this.testsTotalCount} tests pasaron`);
        }

        // Cargar muestras de datos después de los tests
        this.loadDataSamples();

      } catch (error) {
        this.addLog('error', `❌ Error en test completo: ${error.message}`);
        this.showToast('error', 'Error en el test completo');
      } finally {
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
        const result = await this.apiCall('test/samples');

        if (result.success) {
          this.dataSamples = result.samples.map(sample => ({
            name: sample.name.replace(/_sample$/, '').replace(/_/g, ' '),
            path: sample.path,
            timestamp: 'Disponible'
          }));

          this.addLog('info', `📄 ${result.count} muestras de datos disponibles`);
        }
      } catch (error) {
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
    }
  };
}