/**
 * Content Analyzer Service - Claude API Integration
 *
 * Analiza contenido transcrito de videos de competencia
 * Extrae: jugadores mencionados, claims verificables, predicciones
 *
 * Provider: Anthropic Claude API
 * Cost: ~$0.05 por análisis
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class ContentAnalyzer {
    constructor() {
        // Usar OpenAI como fallback (ya configurado en el proyecto)
        this.provider = 'openai'; // Cambiar a 'claude' cuando tengas API key
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // Rápido y económico
    }

    /**
     * Analizar contenido transcrito de video YouTube
     *
     * @param {string} transcription - Texto transcrito del video
     * @param {object} metadata - Metadata del video (título, canal, etc.)
     * @returns {Promise<object>} Análisis completo
     */
    async analyze(transcription, metadata = {}) {
        const startTime = Date.now();

        try {
            logger.info('[ContentAnalyzer] Iniciando análisis de contenido', {
                transcriptionLength: transcription.length,
                provider: this.provider,
                model: this.model
            });

            if (!this.apiKey) {
                throw new Error('OPENAI_API_KEY no configurada en .env');
            }

            const prompt = this._buildAnalysisPrompt(transcription, metadata);

            const response = await axios.post(
                this.baseUrl,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Eres un experto analista de Fantasy La Liga.
Tu tarea es analizar contenido de videos de competidores e identificar:
1. Jugadores mencionados
2. Claims verificables (predicciones, afirmaciones sobre precio, rendimiento)
3. Contexto (jornada, rival, condición del jugador)

IMPORTANTE: Devuelve SOLO JSON válido, sin texto adicional.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3, // Baja para respuestas consistentes
                    max_tokens: 1500
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const analysisText = response.data.choices[0].message.content;
            const analysis = JSON.parse(analysisText);

            const duration = Date.now() - startTime;

            logger.info('[ContentAnalyzer] ✅ Análisis completado', {
                players: analysis.players?.length || 0,
                claims: analysis.claims?.length || 0,
                predictions: analysis.predictions?.length || 0,
                duration: `${duration}ms`
            });

            return {
                players: analysis.players || [],
                claims: analysis.claims || [],
                predictions: analysis.predictions || [],
                context: analysis.context || {},
                contentType: analysis.contentType || 'general',
                viralPotential: analysis.viralPotential || 0,
                processingTime: duration
            };
        } catch (error) {
            logger.error('[ContentAnalyzer] Error en análisis', {
                error: error.message,
                stack: error.stack
            });

            throw new Error(`Content analysis failed: ${error.message}`);
        }
    }

    /**
     * Construir prompt de análisis
     *
     * @private
     * @param {string} transcription - Texto transcrito
     * @param {object} metadata - Metadata del video
     * @returns {string} Prompt formateado
     */
    _buildAnalysisPrompt(transcription, metadata) {
        return `
Analiza la siguiente transcripción de un video de Fantasy La Liga:

**Transcripción:**
"${transcription}"

**Metadata:**
- Título: ${metadata.title || 'N/A'}
- Canal: ${metadata.channelName || 'N/A'}
- Fecha: ${metadata.publishedAt || 'N/A'}

**Extrae la siguiente información en formato JSON:**

{
  "players": [
    {
      "name": "Nombre del jugador (ej: Lewandowski)",
      "team": "Equipo (ej: Barcelona)",
      "position": "Posición (ej: Delantero)",
      "mentioned_count": 3
    }
  ],
  "claims": [
    {
      "type": "price|performance|value|fixture",
      "claim": "Texto exacto del claim",
      "verifiable": true|false,
      "confidence": 0.0-1.0
    }
  ],
  "predictions": [
    {
      "player": "Nombre del jugador",
      "metric": "goals|assists|rating|points",
      "value": "Valor predicho (ej: 1+, >7.5)",
      "confidence": 0.0-1.0
    }
  ],
  "context": {
    "gameweek": "Número de jornada si se menciona",
    "opponent": "Rival si se menciona",
    "condition": "Condición del jugador (lesionado, forma, etc.)"
  },
  "contentType": "chollo|stats|prediccion|breaking|general",
  "viralPotential": 0-10
}

REGLAS IMPORTANTES:
- Solo incluir jugadores MENCIONADOS EXPLÍCITAMENTE
- Claims deben ser específicos y verificables
- viralPotential: 0=bajo, 10=muy viral (basado en palabras como REGALADO, FICHARLO YA, IMPRESCINDIBLE)
- Si no hay información, usar arrays vacíos []
`;
    }

    /**
     * Generar respuesta/contra-argumento basado en análisis
     *
     * @param {object} analysis - Resultado de analyze()
     * @param {object} ourData - Nuestros datos (BargainAnalyzer, etc.)
     * @returns {Promise<object>} Guión de respuesta para Ana
     */
    async generateResponse(analysis, ourData) {
        try {
            logger.info('[ContentAnalyzer] Generando respuesta', {
                players: analysis.players.length,
                hasData: !!ourData
            });

            const prompt = `
Genera un guión de video respuesta para Ana (nuestra analista de Fantasy La Liga).

**Contenido del video original:**
${JSON.stringify(analysis, null, 2)}

**Nuestros datos reales:**
${JSON.stringify(ourData, null, 2)}

**Genera JSON con estructura:**
{
  "segments": [
    {
      "role": "intro",
      "dialogue": "Hook conspirativo de 40-45 palabras",
      "emotion": "mysterious|curious",
      "duration": 8
    },
    {
      "role": "middle",
      "dialogue": "Datos explosivos de 40-45 palabras",
      "emotion": "confident|authoritative",
      "duration": 8
    },
    {
      "role": "outro",
      "dialogue": "CTA urgente de 40-45 palabras",
      "emotion": "urgent|exciting",
      "duration": 8
    }
  ],
  "contentType": "viral_response",
  "targetPlayer": "Nombre del jugador principal"
}

REGLAS:
- NO usar nombres de jugadores directamente (usar "el delantero polaco", "el centrocampista del Barcelona")
- Diálogos de 40-45 palabras (CRÍTICO para 8 segundos)
- Tono viral: datos concretos, urgencia, CTA claro
- Incluir números específicos de nuestros datos
- Contrastar con lo que dijo el video original
`;

            const response = await axios.post(
                this.baseUrl,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content:
                                'Eres un guionista experto en contenido viral de Fantasy La Liga.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7, // Más creatividad para guiones
                    max_tokens: 1000
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const scriptText = response.data.choices[0].message.content;
            const script = JSON.parse(scriptText);

            logger.info('[ContentAnalyzer] ✅ Respuesta generada', {
                segments: script.segments.length,
                targetPlayer: script.targetPlayer
            });

            return script;
        } catch (error) {
            logger.error('[ContentAnalyzer] Error generando respuesta', {
                error: error.message
            });

            throw new Error(`Response generation failed: ${error.message}`);
        }
    }

    /**
     * Calcular score de calidad del análisis
     *
     * @param {object} analysis - Resultado de analyze()
     * @returns {number} Score 0-10
     */
    calculateQualityScore(analysis) {
        let score = 0;

        // +3 si hay jugadores identificados
        if (analysis.players && analysis.players.length > 0) {
            score += 3;
        }

        // +2 si hay claims verificables
        const verifiableClaims = analysis.claims?.filter(c => c.verifiable) || [];
        if (verifiableClaims.length > 0) {
            score += 2;
        }

        // +2 si hay predicciones específicas
        if (analysis.predictions && analysis.predictions.length > 0) {
            score += 2;
        }

        // +2 si hay contexto (jornada, rival)
        if (analysis.context?.gameweek || analysis.context?.opponent) {
            score += 2;
        }

        // +1 por potencial viral alto
        if (analysis.viralPotential >= 7) {
            score += 1;
        }

        logger.info('[ContentAnalyzer] Quality score calculado', {
            score,
            playersFound: analysis.players?.length || 0,
            verifiableClaims: verifiableClaims.length,
            hasContext: !!(analysis.context?.gameweek || analysis.context?.opponent)
        });

        return Math.min(score, 10);
    }
}

module.exports = new ContentAnalyzer();
