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
    testsTotalCount: 3,
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
      leagues: {
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
          api_configured: config.config.sportmonks_api_configured,
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
      this.addLog('info', '🔄 Iniciando test de conexión SportMonks...');

      try {
        const result = await this.apiCall('sportmonks/test');

        if (result.success) {
          this.tests.connection.status = 'success';
          this.tests.connection.message = 'Conexión exitosa';
          this.connectionStatus = 'Conectado';
          this.apiStatus = 'connected';
          this.apiStatusText = 'Conectado';
          this.testsPassedCount = Math.max(this.testsPassedCount, 1);

          this.addLog('success', '✅ Conexión con SportMonks exitosa');

          if (result.data.leagues !== undefined) {
            this.leaguesCount = result.data.leagues;
            this.addLog('info', `📊 ${result.data.leagues} ligas disponibles`);
          }
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

    // Test de ligas
    async testLeagues() {
      this.tests.leagues.status = 'pending';
      this.tests.leagues.message = 'Obteniendo ligas...';
      this.addLog('info', '🏆 Probando obtención de ligas...');

      try {
        const result = await this.apiCall('sportmonks/leagues');

        if (result.success) {
          this.tests.leagues.status = 'success';
          this.tests.leagues.message = `${result.count} ligas obtenidas`;
          this.leaguesCount = result.count;
          this.testsPassedCount = Math.max(this.testsPassedCount, 2);

          this.addLog('success', `✅ ${result.count} ligas obtenidas exitosamente`);

          // Mostrar algunas ligas de ejemplo
          if (result.data && result.data.length > 0) {
            const firstLeagues = result.data.slice(0, 3);
            firstLeagues.forEach(league => {
              this.addLog('info', `🏆 Liga: ${league.name || 'N/A'} (ID: ${league.id || 'N/A'})`);
            });
          }
        } else {
          throw new Error('No se pudieron obtener las ligas');
        }
      } catch (error) {
        this.tests.leagues.status = 'error';
        this.tests.leagues.message = error.message;
        this.addLog('error', `❌ Error obteniendo ligas: ${error.message}`);

        // Si es un error 400, explicar que es normal con plan gratuito
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          this.addLog('warning', '⚠️ Error 400: Normal con plan gratuito de SportMonks');
          this.addLog('info', '💡 Plan gratuito limitado a Scottish Premiership y Danish Superliga');
        }
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
          this.testsPassedCount = Math.max(this.testsPassedCount, 3);

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
        await this.testLeagues();
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