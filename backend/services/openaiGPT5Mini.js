/**
 * Servicio de integración con OpenAI GPT-5 Mini
 * Optimizado para generación de contenido Fantasy La Liga 2025-26
 *
 * MODELO SELECCIONADO: GPT-5 Mini
 * - Precio: $0.25/1M input, $2.00/1M output
 * - Calidad: 80% de GPT-5 completo
 * - Contexto: 272K tokens input, 128K output
 * - Cache: 90% descuento en contenido repetido
 */

const axios = require('axios');

class OpenAIGPT5MiniService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-5-mini';
    this.rateLimitDelay = 100; // 100ms entre llamadas
    this.lastRequestTime = 0;

    // Headers para OpenAI API
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    // Configuración del modelo
    this.modelConfig = {
      model: this.model,
      max_tokens: 4000, // Límite conservador para contenido Fantasy
      temperature: 0.7, // Balance creatividad/consistencia
      top_p: 0.9,
      frequency_penalty: 0.1, // Evitar repeticiones
      presence_penalty: 0.1
    };

    console.log('🤖 OpenAI GPT-5 Mini inicializado para Fantasy La Liga 2025-26');
    console.log(`📊 Modelo: ${this.model}`);
    console.log('💰 Precio: $0.25/1M input, $2.00/1M output');
  }

  // Control de rate limiting
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Generar análisis de jugador para avatar
   * @param {Object} playerData - Datos del jugador
   * @param {Object} context - Contexto adicional (clima, forma, etc.)
   */
  async generatePlayerAnalysis(playerData, context = {}) {
    await this.waitForRateLimit();

    const prompt = `Como experto en Fantasy La Liga 2025-26, analiza este jugador para contenido de avatar IA:

JUGADOR: ${playerData.name} (${playerData.team}) - ${playerData.position}
ESTADÍSTICAS TEMPORADA 2025-26:
- Partidos: ${playerData.stats?.games || 'N/A'}
- Minutos: ${playerData.stats?.minutes || 'N/A'}
- Goles: ${playerData.stats?.goals || 0}
- Asistencias: ${playerData.stats?.assists || 0}
- Rating: ${playerData.stats?.rating || 'N/A'}
- Precio estimado: ${playerData.analysis?.estimatedPrice || 'N/A'}M€

${context.weather ? `CONTEXTO CLIMA: ${context.weather.description} (${context.weather.temperature}°C)` : ''}
${context.form ? `FORMA RECIENTE: ${context.form}` : ''}

Genera un análisis de 150-200 palabras para avatar que incluya:
1. Rendimiento actual en la temporada 2025-26
2. Valor Fantasy (¿es chollo, buen precio, caro?)
3. Recomendación clara (comprar/vender/mantener)
4. Dato curioso o insight
5. Si hay contexto clima, menciónalo brevemente

Tono: Profesional pero cercano, como influencer experto.`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        ...this.modelConfig,
        messages: [
          {
            role: "system",
            content: "Eres un experto analista de Fantasy La Liga con amplio conocimiento de la temporada 2025-26. Generas contenido para avatares IA de Instagram."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }, { headers: this.headers });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        tokens: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens
        },
        cost: this.calculateCost(response.data.usage)
      };

    } catch (error) {
      console.error('❌ Error en GPT-5 Mini:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackAnalysis(playerData)
      };
    }
  }

  /**
   * Generar predicción de jornada
   */
  async generateMatchdayPrediction(matchdayData, weatherData) {
    await this.waitForRateLimit();

    const prompt = `Como experto Fantasy La Liga 2025-26, crea una predicción para la próxima jornada:

JORNADA: ${matchdayData.round || 'Próxima'}
FECHA: ${matchdayData.date || 'Próximamente'}
PARTIDOS DESTACADOS: ${matchdayData.keyMatches?.join(', ') || 'Por confirmar'}

CLIMA GENERAL: ${weatherData?.generalConditions || 'Condiciones normales'}

Genera predicción de 300-400 palabras que incluya:
1. Partidos más atractivos para Fantasy
2. Jugadores con mayor potencial de puntos
3. Posibles chollos de la jornada
4. Capitanes recomendados
5. Factores clima si son relevantes

Tono: Experto y confiado, con datos específicos.`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        ...this.modelConfig,
        max_tokens: 6000,
        messages: [
          {
            role: "system",
            content: "Eres el mejor analista de Fantasy La Liga, especializado en predicciones de jornada para la temporada 2025-26."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }, { headers: this.headers });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        tokens: response.data.usage,
        cost: this.calculateCost(response.data.usage)
      };

    } catch (error) {
      console.error('❌ Error en predicción jornada:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar contenido para redes sociales
   */
  async generateSocialPost(type, data, options = {}) {
    await this.waitForRateLimit();

    const prompts = {
      chollo: `Crea un post de Instagram sobre este chollo Fantasy La Liga 2025-26:
JUGADOR: ${data.name} (${data.team})
PRECIO: ${data.price}M€
RATIO VALOR: ${data.valueRatio}
PUNTOS ESPERADOS: ${data.expectedPoints}

Post de 80-100 palabras con emojis, hashtags relevantes.`,

      clima: `Post sobre clima para partido:
PARTIDO: ${data.match}
ESTADIO: ${data.stadium}
CLIMA: ${data.weather}
TEMPERATURA: ${data.temperature}°C

Post 60-80 palabras con contexto Fantasy.`,

      resultado: `Post sobre resultado Fantasy:
JUGADOR: ${data.player}
PUNTOS OBTENIDOS: ${data.points}
DESTACAR: ${data.highlight}

Post celebrando/analizando 70-90 palabras.`
    };

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        ...this.modelConfig,
        max_tokens: 2000,
        temperature: 0.8, // Más creatividad para redes
        messages: [
          {
            role: "system",
            content: "Eres el community manager experto en Fantasy La Liga. Creas posts virales y engaging para Instagram."
          },
          {
            role: "user",
            content: prompts[type] || prompts.chollo
          }
        ]
      }, { headers: this.headers });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        tokens: response.data.usage,
        cost: this.calculateCost(response.data.usage)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcular coste de la petición
   */
  calculateCost(usage) {
    const inputCost = (usage.prompt_tokens / 1000000) * 0.25; // $0.25 per 1M
    const outputCost = (usage.completion_tokens / 1000000) * 2.00; // $2.00 per 1M

    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
      tokens: usage
    };
  }

  /**
   * Análisis fallback si GPT-5 Mini falla
   */
  generateFallbackAnalysis(playerData) {
    return `${playerData.name} (${playerData.team}) está mostrando un rendimiento interesante en la temporada 2025-26. Con ${playerData.stats?.games || 0} partidos jugados y ${playerData.stats?.goals || 0} goles, su valor Fantasy merece atención. Recomendamos seguir su evolución de cerca.`;
  }

  /**
   * Validar configuración del servicio
   */
  validateConfiguration() {
    const issues = [];

    if (!this.apiKey) {
      issues.push('OPENAI_API_KEY no configurada');
    }

    return {
      isValid: issues.length === 0,
      issues,
      model: this.model,
      pricing: {
        input: '$0.25 per 1M tokens',
        output: '$2.00 per 1M tokens',
        cache_discount: '90% on repeated content'
      }
    };
  }
}

module.exports = OpenAIGPT5MiniService;