/**
 * Gemini Video Analyzer
 *
 * PROPÓSITO:
 * Analizar videos de YouTube directamente usando Gemini 2.5 Flash
 * sin necesidad de descargar (evita problemas de yt-dlp)
 *
 * VENTAJAS:
 * - ✅ 1 API call en lugar de 2 (Whisper + GPT)
 * - ✅ No descarga videos (evita SABR protection de YouTube)
 * - ✅ Más rápido (~30-60s vs 1-2 min)
 * - ✅ Más barato (~$0.004 vs $0.007)
 * - ✅ Análisis más completo (audio + visual)
 *
 * MODELO: Gemini 2.5 Flash
 * - Soporta videos hasta 1 hora
 * - Soporta URLs de YouTube directamente
 * - Multimodal (audio + video + texto)
 *
 * Cost: ~$0.004 por video (input + output tokens)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');
const ContentAnalyzer = require('./contentAnalyzer'); // ✅ Para usar _identifyTargetPlayer()

class GeminiVideoAnalyzer {
    constructor() {
        this.apiKey =
            process.env.GOOGLE_AI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_AI_STUDIO_KEY ||
            process.env.GOOGLE_VERTEX_AI_KEY;

        if (!this.apiKey) {
            logger.error(
                '[GeminiVideoAnalyzer] ❌ No se encontró ninguna API key de Google AI/Gemini en .env'
            );
            throw new Error(
                'Google AI API key is required (GOOGLE_AI_STUDIO_KEY, GEMINI_API_KEY, etc.)'
            );
        }

        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        logger.info('[GeminiVideoAnalyzer] ✅ Inicializado con modelo gemini-2.0-flash-exp');
    }

    /**
     * Analizar video de YouTube directamente (transcripción + análisis)
     *
     * @param {string} youtubeUrl - URL completa del video de YouTube
     * @param {Object} outlierData - Datos del outlier (título, canal, etc.)
     * @returns {Object} { transcription, contentAnalysis, cost_usd }
     */
    async analyzeYouTubeVideo(youtubeUrl, outlierData = {}) {
        try {
            logger.info('[GeminiVideoAnalyzer] 🎬 Analizando video de YouTube:', {
                url: youtubeUrl,
                title: outlierData.title?.substring(0, 50)
            });

            const startTime = Date.now();

            // Prompt para análisis completo (transcripción + análisis de contenido)
            const prompt = this._buildAnalysisPrompt(outlierData);

            // Generar contenido usando Gemini
            const result = await this.model.generateContent([
                {
                    fileData: {
                        mimeType: 'video/*',
                        fileUri: youtubeUrl
                    }
                },
                { text: prompt }
            ]);

            const response = result.response;
            const text = response.text();
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            logger.info('[GeminiVideoAnalyzer] ✅ Análisis completado', {
                duration: `${duration}s`,
                responseLength: text.length
            });

            // Parsear respuesta JSON
            const analysis = this._parseGeminiResponse(text);

            // ✅ NUEVO: Identificar jugador objetivo principal
            // Convertir players_mentioned (nombres simples) a formato esperado por _identifyTargetPlayer
            const playersForScoring = (analysis.players_mentioned || []).map(name => ({
                name: name,
                team: null,
                position: null,
                mentioned_count: 1
            }));

            const targetPlayer = ContentAnalyzer._identifyTargetPlayer(playersForScoring, {
                title: outlierData.title || '',
                transcription: analysis.transcription || ''
            });

            // ✅ NUEVO (15 Oct): Detectar tipo de video (player-specific vs generic)
            const totalPlayers = analysis.players_mentioned?.length || 0;
            const title = (outlierData.title || '').toLowerCase();

            // Indicadores de video genérico:
            // - >15 jugadores mencionados
            // - Título contiene palabras clave de análisis de jornada
            const genericKeywords = [
                'jornada',
                'análisis fantasy',
                'alineaciones probables',
                'lesionados',
                'sancionados',
                'previa'
            ];
            const isGenericVideo =
                totalPlayers > 15 || genericKeywords.some(kw => title.includes(kw));

            const videoType = isGenericVideo ? 'generic_analysis' : 'player_spotlight';

            // Calcular costo aproximado
            const usage = response.usageMetadata;
            const cost_usd = this._calculateCost(usage);

            logger.info('[GeminiVideoAnalyzer] 💰 Costo:', {
                promptTokens: usage?.promptTokenCount || 0,
                completionTokens: usage?.candidatesTokenCount || 0,
                cost: `$${cost_usd.toFixed(4)}`
            });

            logger.info('[GeminiVideoAnalyzer] 🎯 Video clasificado:', {
                videoType: videoType,
                targetPlayer: isGenericVideo ? 'N/A (video genérico)' : targetPlayer,
                totalPlayers: totalPlayers,
                reason: isGenericVideo
                    ? totalPlayers > 15
                        ? `>${totalPlayers} jugadores`
                        : 'título genérico'
                    : 'video de jugador específico'
            });

            return {
                transcription: analysis.transcription,
                contentAnalysis: {
                    thesis: analysis.thesis,
                    key_arguments: analysis.key_arguments,
                    players_mentioned: analysis.players_mentioned,
                    target_player: isGenericVideo ? null : targetPlayer, // ✅ null si es genérico
                    video_type: videoType, // ✅ NUEVO: 'player_spotlight' | 'generic_analysis'
                    viral_hooks: analysis.viral_hooks,
                    response_angle: analysis.response_angle,
                    suggested_data_points: analysis.suggested_data_points,
                    emotional_tone: analysis.emotional_tone,
                    target_audience: analysis.target_audience,
                    video_duration: analysis.video_duration,
                    key_moments: analysis.key_moments
                },
                cost_usd,
                duration_seconds: parseFloat(duration),
                model: 'gemini-2.0-flash-exp',
                success: true
            };
        } catch (error) {
            logger.error('[GeminiVideoAnalyzer] ❌ Error analizando video:', {
                error: error.message,
                stack: error.stack
            });

            throw new Error(`Gemini video analysis failed: ${error.message}`);
        }
    }

    /**
     * Construir prompt para análisis completo
     * @private
     */
    _buildAnalysisPrompt(outlierData) {
        return `Analiza este video viral de Fantasy La Liga y proporciona un análisis completo en formato JSON.

INFORMACIÓN DEL VIDEO:
- Título: ${outlierData.title || 'N/A'}
- Canal: ${outlierData.channel_name || 'N/A'}
- Views: ${outlierData.views ? outlierData.views.toLocaleString() : 'N/A'}
- Outlier Score: ${outlierData.outlier_score || 'N/A'}

INSTRUCCIONES:
1. Transcribe el audio completo del video (palabra por palabra)
2. Identifica la tesis principal del video
3. Extrae los argumentos clave
4. Detecta jugadores mencionados (nombres completos)
5. Identifica hooks virales usados
6. Determina ángulo de respuesta óptimo (rebatir, complementar, ampliar)
7. Sugiere datos de API-Sports que complementarían el análisis
8. Analiza tono emocional y audiencia objetivo

RESPONDE EN FORMATO JSON (sin markdown, solo JSON puro):
{
  "transcription": "transcripción completa del audio...",
  "thesis": "Tesis principal del video en 1 frase",
  "key_arguments": ["Argumento 1", "Argumento 2", "Argumento 3"],
  "players_mentioned": ["Pedri", "Lewandowski"],
  "viral_hooks": ["Hook 1", "Hook 2"],
  "response_angle": "rebatir | complementar | ampliar",
  "suggested_data_points": ["xG últimas 5 jornadas", "Minutos jugados"],
  "emotional_tone": "neutral | entusiasta | crítico | alarmista",
  "target_audience": "descripción de la audiencia",
  "video_duration": "duración aproximada en segundos",
  "key_moments": [
    {"timestamp": "0:15", "description": "Presenta la tesis principal"},
    {"timestamp": "1:30", "description": "Muestra estadísticas clave"}
  ]
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional antes o después.`;
    }

    /**
     * Parsear respuesta de Gemini y extraer JSON
     * @private
     */
    _parseGeminiResponse(text) {
        try {
            // Limpiar markdown si lo hay
            let jsonText = text.trim();

            // Remover bloques de código markdown
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            // Parsear JSON
            const parsed = JSON.parse(jsonText);

            // Validar campos requeridos
            if (!parsed.transcription) {
                throw new Error('Missing required field: transcription');
            }

            return parsed;
        } catch (error) {
            logger.error('[GeminiVideoAnalyzer] Error parseando respuesta JSON:', {
                error: error.message,
                responsePreview: text.substring(0, 200)
            });

            // Fallback: retornar estructura básica
            return {
                transcription: text,
                thesis: 'Análisis no disponible (parsing error)',
                key_arguments: [],
                players_mentioned: [],
                viral_hooks: [],
                response_angle: 'complementar',
                suggested_data_points: [],
                emotional_tone: 'neutral',
                target_audience: 'Fantasy managers',
                video_duration: 0,
                key_moments: []
            };
        }
    }

    /**
     * Calcular costo aproximado
     * Gemini 2.0 Flash pricing (Jan 2025):
     * - Input: $0.075 / 1M tokens (prompts hasta 128K context)
     * - Output: $0.30 / 1M tokens
     * @private
     */
    _calculateCost(usage) {
        if (!usage) {
            return 0.004; // Estimación conservadora
        }

        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;

        // Pricing para contexto <128K tokens
        const inputCost = (promptTokens / 1000000) * 0.075;
        const outputCost = (completionTokens / 1000000) * 0.3;

        return inputCost + outputCost;
    }

    /**
     * Test de conexión
     */
    async testConnection() {
        try {
            logger.info('[GeminiVideoAnalyzer] 🔍 Testing connection...');

            const result = await this.model.generateContent(['Hello, this is a test']);
            const response = result.response.text();

            logger.info('[GeminiVideoAnalyzer] ✅ Connection test successful');

            return {
                success: true,
                model: 'gemini-2.0-flash-exp',
                response: response.substring(0, 100)
            };
        } catch (error) {
            logger.error('[GeminiVideoAnalyzer] ❌ Connection test failed:', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new GeminiVideoAnalyzer();
