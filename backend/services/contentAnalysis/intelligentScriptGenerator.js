/**
 * Intelligent Script Generator for Outlier Responses
 *
 * PROPÓSITO:
 * Generar scripts VEO3 inteligentes para responder a videos virales de competidores.
 * Usa GPT-4o para crear respuestas basadas en datos: rebatir, complementar, ampliar.
 *
 * DIFERENCIA CON unifiedScriptGenerator.js:
 * - unifiedScriptGenerator: Templates para nuestros chollos (contenido proactivo)
 * - intelligentScriptGenerator: GPT-driven para respuestas a competidores (reactivo)
 *
 * INPUT:
 * - Transcripción del video viral
 * - Análisis GPT del contenido (tesis, argumentos, hooks, jugadores)
 * - Datos enriquecidos de API-Sports (stats reales de los jugadores mencionados)
 *
 * OUTPUT:
 * - Script VEO3 de 3 segmentos (8s cada uno = 24s total)
 * - Compatible con sistema VEO3 3-Phase
 * - CONSTRAINT: 24-25 palabras por segmento (evita cortes de audio)
 * - NO usar nombres de jugadores (auto-reemplazados por referencias genéricas)
 *
 * 🚨 VEO3 PRONUNCIATION LIMITATIONS (15 Oct 2025):
 * - VEO3 NO pronuncia bien datos estadísticos complejos
 * - Evita listas de números: "3 goles, 2 asistencias, rating 7.8"
 * - Convierte datos a lenguaje natural: "está ARRASANDO" en vez de "3 goals + 2 assists"
 * - Usa números SOLO si son redondos y simples: "3 goles", "CERO derrotas"
 * - Prioriza insights narrativos sobre estadísticas secas
 *
 * COST: ~$0.002 por script (GPT-4o-mini cached)
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class IntelligentScriptGenerator {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // Rápido, económico, cached

        // Configuración de script VEO3
        this.scriptConstraints = {
            segments: 3,
            duration: 8, // segundos por segmento
            wordsPerSegment: { min: 24, max: 25 }, // palabras óptimas
            speechRate: 3.43 // palabras/segundo (medido en test E2E)
        };
    }

    /**
     * Generar script inteligente de respuesta a outlier
     *
     * @param {object} outlierData - Datos del outlier completo
     * @param {string} outlierData.title - Título del video viral
     * @param {string} outlierData.channel_name - Nombre del canal competidor
     * @param {number} outlierData.views - Vistas del video viral
     * @param {string} outlierData.transcription - Transcripción completa
     * @param {object} outlierData.content_analysis - Análisis GPT del contenido
     * @param {array} outlierData.enriched_data - Stats de API-Sports de jugadores mencionados
     * @param {object} options - Opciones adicionales
     * @param {string} options.responseAngle - 'rebatir' | 'complementar' | 'ampliar'
     * @param {string} options.presenter - 'ana' | 'carlos'
     * @returns {Promise<object>} Script VEO3 listo para 3-phase generation
     */
    async generateResponseScript(outlierData, options = {}) {
        const startTime = Date.now();
        const { responseAngle = 'rebatir', presenter = 'ana' } = options;
        const maxRetries = 1; // Máximo 1 retry para evitar gastar quota

        // ✅ NUEVO: Extraer target_player del análisis de contenido
        const targetPlayer = outlierData.content_analysis?.target_player || null;

        try {
            logger.info('[IntelligentScriptGenerator] Generando script inteligente de respuesta', {
                videoId: outlierData.video_id,
                channel: outlierData.channel_name,
                views: outlierData.views,
                responseAngle,
                presenter,
                targetPlayer: targetPlayer // ✅ Log jugador objetivo identificado
            });

            if (!this.apiKey) {
                throw new Error('OPENAI_API_KEY no configurada en .env');
            }

            let attempt = 0;
            let lastError = null;

            // Retry loop
            while (attempt <= maxRetries) {
                try {
                    // Build prompt para GPT-4o (con feedback si es retry)
                    const prompt = this._buildPrompt(
                        outlierData,
                        responseAngle,
                        presenter,
                        targetPlayer, // ✅ NUEVO: Pasar target player identificado
                        lastError
                    );

                    logger.info('[IntelligentScriptGenerator] Llamando a GPT-4o...', {
                        attempt: attempt + 1,
                        maxRetries: maxRetries + 1,
                        isRetry: attempt > 0
                    });

                    // Call GPT-4o
                    const response = await axios.post(
                        this.baseUrl,
                        {
                            model: this.model,
                            messages: [
                                {
                                    role: 'system',
                                    content: this._getSystemPrompt(presenter)
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature: 0.7, // Balance creatividad + consistencia
                            max_tokens: 800,
                            response_format: { type: 'json_object' } // Force JSON output
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 45000
                        }
                    );

                    const scriptData = JSON.parse(response.data.choices[0].message.content);

                    // Validate script
                    const validation = this._validateScript(scriptData);
                    if (!validation.valid) {
                        lastError = validation.errors.join(', ');
                        throw new Error(`Script validation failed: ${lastError}`);
                    }

                    // ✅ Validación exitosa
                    const duration = Date.now() - startTime;
                    const cost = (attempt + 1) * 0.002; // $0.002 por intento

                    logger.info('[IntelligentScriptGenerator] ✅ Script generado exitosamente', {
                        segments: scriptData.segments.length,
                        targetPlayer: scriptData.targetPlayer,
                        responseAngle: scriptData.responseAngle,
                        duration: `${duration}ms`,
                        attempts: attempt + 1,
                        cost: `$${cost.toFixed(3)}`
                    });

                    return {
                        success: true,
                        script: scriptData,
                        metadata: {
                            outlier_video_id: outlierData.video_id,
                            competitor_channel: outlierData.channel_name,
                            response_angle: responseAngle,
                            presenter: presenter,
                            targetPlayer: targetPlayer || scriptData.targetPlayer, // ✅ NUEVO: Target player identificado
                            generated_at: new Date().toISOString(),
                            processing_time_ms: duration,
                            attempts: attempt + 1,
                            cost_usd: cost
                        }
                    };
                } catch (error) {
                    attempt++;

                    if (attempt > maxRetries) {
                        // Sin más retries, lanzar error
                        throw error;
                    }

                    logger.warn(
                        `[IntelligentScriptGenerator] ⚠️ Intento ${attempt} falló, reintentando...`,
                        {
                            error: error.message,
                            nextAttempt: attempt + 1
                        }
                    );

                    // Continuar al siguiente intento del loop
                }
            }
        } catch (error) {
            logger.error('[IntelligentScriptGenerator] Error generando script', {
                error: error.message,
                stack: error.stack
            });

            throw new Error(`Script generation failed: ${error.message}`);
        }
    }

    /**
     * Build system prompt optimizado por presentador
     * @private
     */
    _getSystemPrompt(presenter) {
        const presenterProfiles = {
            ana: `Eres Ana, analista experta de Fantasy La Liga de 32 años.
Tu personalidad: Confiada, directa, datos-driven, con toque conspirativo y misterioso.
Tu estilo: Hablas con autoridad, usas números concretos, generas FOMO, eres viral.
Tu objetivo: Responder a videos de competidores con datos reales que desafían sus claims.`,
            carlos: `Eres Carlos, analista veterano de Fantasy La Liga.
Tu personalidad: Calmado, analítico, educativo, mentor de confianza.
Tu estilo: Explicaciones claras, pausa dramática, énfasis en fundamentos.
Tu objetivo: Complementar y ampliar el análisis de competidores con contexto profundo.`
        };

        return `${presenterProfiles[presenter] || presenterProfiles.ana}

REGLAS CRÍTICAS:
1. ❌ NUNCA uses nombres de jugadores directamente (VEO3 los rechaza por derechos de imagen)
   ✅ Usar referencias genéricas: "el delantero polaco", "el centrocampista del Barcelona", "el 10 blaugrana"

2. ✅ SIEMPRE generar 3 segmentos de exactamente 24-25 palabras cada uno
   - Menos de 24 palabras → VEO3 inventa contenido
   - Más de 25 palabras → Audio se corta al final (medido en test E2E)

3. ✅ Responder en formato JSON válido con esta estructura EXACTA

4. 🚨 LIMITACIONES VEO3 CON NÚMEROS (CRÍTICO):
   ❌ VEO3 NO pronuncia bien datos estadísticos complejos
   ❌ Evitar cifras exactas múltiples ("3 goles, 2 asistencias, rating 7.8")
   ❌ Evitar números decimales ("7.23", "€6.5M")
   ❌ Evitar porcentajes precisos ("87.3%", "2.1 expected goals")

   ✅ CONVERTIR DATOS A LENGUAJE NATURAL VIRAL:
   • "3 goles, 2 asistencias" → "está ARRASANDO en ataque"
   • "rating 7.8" → "rendimiento BRUTAL"
   • "€4.5M" → "baratísimo", "un regalo"
   • "87% pass accuracy" → "controla el medio como NADIE"
   • "xG 0.8 por partido" → "genera peligro CONSTANTE"

   ✅ Usar números SOLO cuando son:
   • Redondos y simples: "3 goles", "5 partidos", "€4M"
   • Emotivos: "CERO derrotas en casa"
   • Comparativos virales: "el DOBLE que su competencia"

5. ✅ Tono viral: urgencia, datos narrativos (no estadísticos), CTA claro, generar FOMO

6. ✅ Contrastar lo que dijo el competidor con insights narrativos basados en datos reales`;
    }

    /**
     * Build user prompt con todos los datos del outlier
     * @private
     */
    _buildPrompt(outlierData, responseAngle, presenter, targetPlayer = null, lastError = null) {
        const { title, channel_name, views, transcription, content_analysis, enriched_data } =
            outlierData;

        // Extract key info
        const thesis = content_analysis?.thesis || 'N/A';
        const keyArguments = content_analysis?.key_arguments || [];
        const viralHooks = content_analysis?.viral_hooks || [];
        const players = content_analysis?.players_mentioned || [];

        // Format enriched data (API-Sports)
        const playerStats = this._formatPlayerStats(enriched_data);

        const responseAngles = {
            rebatir: `REBATIR el claim del competidor con datos que CONTRADICEN su tesis.
Ejemplo: Si dice "Es el mejor chollo", tú demuestras que hay mejores opciones con datos.`,
            complementar: `COMPLEMENTAR su análisis añadiendo datos que NO mencionó pero son clave.
Ejemplo: Si habla de goles, tú añades asistencias, minutos, rival fácil próximo.`,
            ampliar: `AMPLIAR su visión con contexto más profundo y datos avanzados.
Ejemplo: Si menciona precio, tú añades proyección de subida, tendencia histórica, xG.`
        };

        return `# CONTEXTO DEL VIDEO VIRAL

**Video original:**
- Título: "${title}"
- Canal: ${channel_name}
- Vistas: ${views.toLocaleString()}

**Tesis del competidor:**
${thesis}

**Argumentos clave del competidor:**
${keyArguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n')}

**Hooks virales usados:**
${viralHooks.map((hook, i) => `${i + 1}. "${hook}"`).join('\n')}

**Jugadores mencionados:**
${players.map(p => `- ${p}`).join('\n')}

**🎯 JUGADOR OBJETIVO IDENTIFICADO:**
${targetPlayer ? `${targetPlayer} (este es el jugador principal del video, enfócate en él)` : 'No identificado (usa el más mencionado)'}

**Transcripción relevante (primeras 500 chars):**
"${transcription.substring(0, 500)}..."

---

# DATOS REALES (API-SPORTS)

${playerStats}

---

# TU TAREA

**Ángulo de respuesta:** ${responseAngle.toUpperCase()}

${responseAngles[responseAngle]}

**Genera un script JSON para ${presenter === 'ana' ? 'Ana' : 'Carlos'} con 3 segmentos de 24-25 palabras:**

\`\`\`json
{
  "targetPlayer": "${targetPlayer || 'Nombre del jugador principal (para interno, NO se usa en diálogos)'}",
  "responseAngle": "${responseAngle}",
  "segments": [
    {
      "role": "intro",
      "duration": 8,
      "dialogue": "Hook conspirativo de 24-25 palabras. Ejemplo: Misters, acabo de ver el video de [canal] sobre [referencia genérica del jugador]... y hay datos que NO os están contando.",
      "emotion": "mysterious",
      "narrativeFunction": "Hook + intriga"
    },
    {
      "role": "middle",
      "duration": 8,
      "dialogue": "Insights narrativos de 24-25 palabras. Ejemplo: Mientras hablan de suerte, los datos cuentan otra historia... el delantero está ARRASANDO y nadie lo está viendo.",
      "emotion": "confident",
      "narrativeFunction": "Prueba con insights narrativos (NO listas de números)"
    },
    {
      "role": "outro",
      "duration": 8,
      "dialogue": "CTA urgente de 24-25 palabras. Ejemplo: Ahora vosotros decidís: confiar en hype... o en datos reales. Yo ya os lo he dicho.",
      "emotion": "urgent",
      "narrativeFunction": "FOMO + CTA"
    }
  ],
  "dataUsed": [
    "rendimiento ofensivo excepcional",
    "forma ascendente últimas jornadas",
    "valor Fantasy subestimado"
  ],
  "competitorClaimChallenged": "Descripción breve del claim que estás rebatiendo/complementando/ampliando"
}
\`\`\`

**REGLAS CRÍTICAS:**
1. ❌ NO uses nombres de jugadores en dialogues (usar "el delantero", "el 10 del Barça", etc.)
2. ✅ Exactamente 24-25 palabras por diálogo (cuenta palabras ANTES de generar)
3. 🚨 CONVERTIR DATOS A LENGUAJE NATURAL (VEO3 limitation):
   • ❌ NO listas de números: "3 goles, 2 asistencias, rating 7.8"
   • ✅ Insights narrativos: "está ARRASANDO en ataque", "rendimiento BRUTAL"
   • ✅ Usar números SOLO si son redondos y simples: "3 goles", "CERO derrotas"
4. ✅ Contrastar con lo que dijo el competidor usando insights (no estadísticas secas)
5. ✅ Generar urgencia y FOMO en el outro
6. ✅ Usar solo emociones válidas: mysterious, curious, confident, authoritative, urgent, exciting

${
    lastError
        ? `\n⚠️ **RETRY FEEDBACK**: El intento anterior falló con estos errores:\n${lastError}\n\nPor favor, corrígelos en este nuevo intento. ESPECIALMENTE presta atención al word count de cada segmento.\n`
        : ''
}
Genera el JSON ahora:`;
    }

    /**
     * Format player stats from API-Sports enriched data
     * @private
     */
    _formatPlayerStats(enrichedData) {
        if (!enrichedData || !Array.isArray(enrichedData.players)) {
            return 'No hay datos enriquecidos disponibles.';
        }

        return enrichedData.players
            .map(player => {
                if (!player.found) {
                    return `- ${player.name}: No encontrado en API-Sports`;
                }

                const { name, season_stats, recent_form, injuries } = player;
                return `
**${name}**
- Partidos: ${season_stats.games}
- Goles: ${season_stats.goals}
- Asistencias: ${season_stats.assists}
- Rating: ${season_stats.rating}
- Forma reciente (últimos 5): ${recent_form?.goals || 0} goles, rating ${recent_form?.avg_rating || 'N/A'}
- Lesionado: ${injuries.length > 0 ? 'SÍ' : 'NO'}
`;
            })
            .join('\n');
    }

    /**
     * Validate generated script
     * @private
     */
    _validateScript(script) {
        const errors = [];

        // Check required fields
        if (!script.targetPlayer) {
            errors.push('Missing targetPlayer');
        }

        if (!script.segments || !Array.isArray(script.segments)) {
            errors.push('Missing or invalid segments array');
        }

        if (script.segments.length !== 3) {
            errors.push(`Expected 3 segments, got ${script.segments.length}`);
        }

        // Validate each segment
        script.segments.forEach((seg, i) => {
            if (!seg.dialogue || typeof seg.dialogue !== 'string') {
                errors.push(`Segment ${i + 1}: Missing or invalid dialogue`);
            }

            if (!seg.emotion) {
                errors.push(`Segment ${i + 1}: Missing emotion`);
            }

            // Check word count (CRITICAL)
            if (seg.dialogue) {
                const words = seg.dialogue.trim().split(/\s+/);
                const wordCount = words.length;

                // ✅ Rango ampliado a [20-30] para dar flexibilidad (antes: 22-27)
                if (wordCount < 20 || wordCount > 30) {
                    errors.push(
                        `Segment ${i + 1}: Word count ${wordCount} out of range [20-30] (ideal: 24-25)`
                    );
                    logger.warn(
                        `[IntelligentScriptGenerator] ⚠️ Segment ${i + 1} word count: ${wordCount}`
                    );
                }

                // Check for player names (CRITICAL - VEO3 blocks them)
                const commonPlayerNames = [
                    'Pedri',
                    'Gavi',
                    'Lewandowski',
                    'Vinicius',
                    'Benzema',
                    'Griezmann',
                    'Muniain',
                    'Oyarzabal',
                    'Morata'
                ];

                commonPlayerNames.forEach(name => {
                    if (seg.dialogue.includes(name)) {
                        errors.push(
                            `Segment ${i + 1}: Contains player name "${name}" (VEO3 will reject it)`
                        );
                        logger.error(
                            `[IntelligentScriptGenerator] ❌ Player name detected: ${name}`
                        );
                    }
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Format script for VEO3 3-Phase System
     *
     * @param {object} script - Script generated by generateResponseScript
     * @returns {object} Formatted for VEO3 prepare-session endpoint
     */
    formatForVEO3(script) {
        return {
            contentType: 'outlier_response',
            presenter: script.metadata.presenter,
            playerData: {
                name: script.script.targetPlayer,
                // VEO3 will use CreativeReferenceGenerator to avoid player names
                useGenericReference: true
            },
            segments: script.script.segments.map(seg => ({
                role: seg.role,
                dialogue: seg.dialogue,
                emotion: seg.emotion,
                duration: seg.duration,
                narrativeFunction: seg.narrativeFunction
            })),
            metadata: {
                source: 'intelligent_script_generator',
                targetPlayer: script.metadata.targetPlayer || script.script.targetPlayer, // ✅ NUEVO: Target player en metadata
                outlier_video_id: script.metadata.outlier_video_id,
                response_angle: script.metadata.response_angle,
                generated_at: script.metadata.generated_at
            }
        };
    }

    /**
     * Calculate estimated cost for script generation
     *
     * @param {number} count - Number of scripts to generate
     * @returns {number} Estimated cost in USD
     */
    calculateCost(count = 1) {
        const costPerScript = 0.002; // GPT-4o-mini with caching
        return count * costPerScript;
    }

    /**
     * Generate multiple response scripts with different angles
     *
     * @param {object} outlierData - Outlier data
     * @returns {Promise<object>} Scripts for all 3 angles
     */
    async generateAllAngles(outlierData) {
        const angles = ['rebatir', 'complementar', 'ampliar'];

        logger.info('[IntelligentScriptGenerator] Generando scripts para todos los ángulos...');

        const results = await Promise.allSettled(
            angles.map(angle => this.generateResponseScript(outlierData, { responseAngle: angle }))
        );

        const scripts = {};
        results.forEach((result, i) => {
            const angle = angles[i];
            if (result.status === 'fulfilled') {
                scripts[angle] = result.value;
            } else {
                logger.error(
                    `[IntelligentScriptGenerator] Error generando script ${angle}:`,
                    result.reason.message
                );
                scripts[angle] = { success: false, error: result.reason.message };
            }
        });

        return {
            success: true,
            scripts,
            totalCost: this.calculateCost(3)
        };
    }
}

module.exports = new IntelligentScriptGenerator();
