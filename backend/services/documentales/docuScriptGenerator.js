/**
 * Documentary Script Generator - GPT-4o Integration
 *
 * PROPÓSITO:
 * Generar scripts VEO3 estilo documental viral para Shorts.
 * Replica fórmula de Chisme Express MX: Hook → Historia → Twist.
 *
 * DIFERENCIA CON intelligentScriptGenerator.js:
 * - intelligentScriptGenerator: Respuestas a competidores (reactivo, Fantasy La Liga)
 * - docuScriptGenerator: Documentales virales (proactivo, crimen/escándalo/misterio)
 *
 * ESTRATEGIA DE CONTENIDO:
 * - Narrator: Voz seria, estilo Netflix/HBO (NOT Ana/Carlos)
 * - Structure: 3 actos (8s cada uno = 24s total)
 * - Tono: Suspense, revelador, conspirativo
 * - Hook: Frase impactante que genera curiosidad instantánea
 * - Historia: Contexto + datos verificados + narrativa
 * - Twist: Revelación final + CTA para engagement
 *
 * INPUT:
 * - Topic trending (trending_topics table)
 * - Research data (Perplexity AI / Wikipedia)
 * - Personajes involucrados
 *
 * OUTPUT:
 * - Script VEO3 de 3 segmentos (8s cada uno)
 * - Compatible con VEO3 3-Phase System
 * - CONSTRAINT: 24-25 palabras por segmento
 * - NO usar nombres exactos si hay problemas legales (usar "el empresario", "la celebridad")
 *
 * COST: ~$0.002 por script (GPT-4o-mini)
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class DocuScriptGenerator {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // Rápido, económico

        // Configuración de script VEO3
        this.scriptConstraints = {
            segments: 3,
            duration: 8, // segundos por segmento
            wordsPerSegment: { min: 24, max: 25 }, // palabras óptimas
            speechRate: 3.43 // palabras/segundo (medido en test E2E)
        };

        // Emociones para documentales (serias, no cómicas)
        this.documentaryEmotions = [
            'serious',
            'mysterious',
            'revealing',
            'dramatic',
            'authoritative',
            'shocking',
            'contemplative'
        ];
    }

    /**
     * Generar script documental viral
     *
     * @param {Object} topicData - Datos del trending topic
     * @param {string} topicData.titulo - Título del tema
     * @param {string} topicData.descripcion - Descripción breve
     * @param {array} topicData.personajes - Personajes involucrados
     * @param {string} topicData.url - URL de la noticia original
     * @param {Object} researchData - Datos de investigación (Perplexity AI / Wikipedia)
     * @param {string} researchData.resumen - Resumen verificado del tema
     * @param {array} researchData.hechos_clave - Hechos clave verificados
     * @param {string} researchData.contexto - Contexto adicional
     * @param {array} researchData.fuentes - Fuentes verificadas
     * @param {Object} options - Opciones adicionales
     * @param {string} [options.angle='revelacion'] - 'revelacion' | 'misterio' | 'escandalo' | 'investigacion'
     * @param {string} [options.narrator='serio'] - 'serio' | 'dramatico' | 'conspirativo'
     * @returns {Promise<Object>} Script VEO3 listo para 3-phase generation
     */
    async generateViralDocuScript(topicData, researchData, options = {}) {
        const startTime = Date.now();
        const { angle = 'revelacion', narrator = 'serio' } = options;
        const maxRetries = 1;

        try {
            logger.info('[DocuScriptGenerator] Generando script documental viral', {
                topic: topicData.titulo,
                personajes: topicData.personajes?.length || 0,
                angle,
                narrator
            });

            if (!this.apiKey) {
                throw new Error('OPENAI_API_KEY no configurada en .env');
            }

            let attempt = 0;
            let lastError = null;

            // Retry loop
            while (attempt <= maxRetries) {
                try {
                    // Build prompt para GPT-4o
                    const prompt = this._buildDocuPrompt(
                        topicData,
                        researchData,
                        angle,
                        narrator,
                        lastError
                    );

                    logger.info('[DocuScriptGenerator] Llamando a GPT-4o...', {
                        attempt: attempt + 1,
                        maxRetries: maxRetries + 1
                    });

                    // Call GPT-4o
                    const response = await axios.post(
                        this.baseUrl,
                        {
                            model: this.model,
                            messages: [
                                {
                                    role: 'system',
                                    content: this._getDocuSystemPrompt(narrator)
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature: 0.75, // Más creatividad para documentales
                            max_tokens: 1000,
                            response_format: { type: 'json_object' }
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
                    const cost = (attempt + 1) * 0.002;

                    logger.info('[DocuScriptGenerator] ✅ Script documental generado exitosamente', {
                        segments: scriptData.segments.length,
                        tema: scriptData.tema,
                        angle: scriptData.angle,
                        duration: `${duration}ms`,
                        attempts: attempt + 1,
                        cost: `$${cost.toFixed(3)}`
                    });

                    return {
                        success: true,
                        script: scriptData,
                        metadata: {
                            topic_titulo: topicData.titulo,
                            personajes: topicData.personajes || [],
                            angle: angle,
                            narrator: narrator,
                            generated_at: new Date().toISOString(),
                            processing_time_ms: duration,
                            attempts: attempt + 1,
                            cost_usd: cost
                        }
                    };
                } catch (error) {
                    attempt++;

                    if (attempt > maxRetries) {
                        throw error;
                    }

                    logger.warn(
                        `[DocuScriptGenerator] ⚠️ Intento ${attempt} falló, reintentando...`,
                        {
                            error: error.message
                        }
                    );
                }
            }
        } catch (error) {
            logger.error('[DocuScriptGenerator] Error generando script documental', {
                error: error.message,
                stack: error.stack
            });

            throw new Error(`Documentary script generation failed: ${error.message}`);
        }
    }

    /**
     * Build system prompt optimizado por narrator
     * @private
     */
    _getDocuSystemPrompt(narrator) {
        const narratorProfiles = {
            serio: `Eres un narrador de documentales de alto impacto estilo Netflix/HBO.
Tu personalidad: Serio, profesional, revelador, voz de autoridad periodística.
Tu estilo: Narrativa clara, datos verificados, suspense medido, énfasis en revelaciones.
Tu objetivo: Contar historias impactantes con datos reales que generen curiosidad viral.`,

            dramatico: `Eres un narrador de documentales de crimen/misterio estilo "Making a Murderer".
Tu personalidad: Dramático, intrigante, pausado, crea tensión narrativa.
Tu estilo: Pausas dramáticas, datos impactantes, revela información gradualmente.
Tu objetivo: Generar suspenso y mantener al espectador enganchado hasta el final.`,

            conspirativo: `Eres un narrador de documentales de conspiración/secretos estilo "Ancient Aliens".
Tu personalidad: Conspirativo, misterioso, sugiere más de lo que dice, genera intriga.
Tu estilo: Preguntas retóricas, datos peculiares, conexiones inesperadas.
Tu objetivo: Hacer que el espectador se cuestione lo que sabe y quiera saber más.`
        };

        return `${narratorProfiles[narrator] || narratorProfiles.serio}

REGLAS CRÍTICAS DOCUMENTALES:

1. ✅ SIEMPRE generar 3 segmentos de exactamente 24-25 palabras cada uno
   - Menos de 24 → VEO3 inventa contenido
   - Más de 25 → Audio se corta al final

2. ✅ Estructura de 3 actos obligatoria:
   - ACTO 1 (Hook): Frase impactante que genera curiosidad inmediata
   - ACTO 2 (Historia): Contexto + datos clave + narrativa del caso
   - ACTO 3 (Twist): Revelación final + pregunta abierta que genera engagement

3. ✅ Tono documental serio:
   - NO usar expresiones casuales o coloquiales
   - SÍ usar lenguaje periodístico y profesional
   - NO bromear o trivializar el tema
   - SÍ generar suspense y curiosidad

4. ✅ Datos verificados:
   - SOLO usar datos del research proporcionado
   - NO inventar estadísticas o hechos
   - SÍ incluir números concretos cuando estén disponibles

5. ✅ Protección legal:
   - Si el tema es sensible (crimen, escándalo), usar referencias genéricas
   - Ejemplo: "un empresario de alto perfil" en vez de nombre exacto
   - Mantener tono periodístico objetivo

6. ✅ Emociones documentales válidas:
   - serious, mysterious, revealing, dramatic, authoritative, shocking, contemplative
   - NO usar: funny, playful, casual, excited (son para otros contenidos)

7. ✅ Responder en formato JSON válido con estructura EXACTA`;
    }

    /**
     * Build user prompt con todos los datos del topic
     * @private
     */
    _buildDocuPrompt(topicData, researchData, angle, narrator, lastError = null) {
        const { titulo, descripcion, personajes, url } = topicData;
        const { resumen, hechos_clave, contexto, fuentes } = researchData;

        const angles = {
            revelacion: `REVELACIÓN: Presenta datos o hechos poco conocidos que sorprenden al espectador.
Ejemplo: "Lo que nadie te ha contado sobre [caso]... los documentos revelan..."`,

            misterio: `MISTERIO: Plantea preguntas intrigantes y explora el enigma del caso.
Ejemplo: "Hay algo que no encaja en este caso... ¿por qué nadie habla de...?"`,

            escandalo: `ESCÁNDALO: Expone comportamientos o situaciones polémicas con datos verificados.
Ejemplo: "Mientras todos miraban hacia otro lado... esto es lo que realmente pasó..."`,

            investigacion: `INVESTIGACIÓN: Presenta el caso como una investigación periodística con hallazgos.
Ejemplo: "Tras semanas investigando... hemos descubierto datos que cambian todo..."`
        };

        return `# TEMA TRENDING

**Título:** ${titulo}

**Descripción:** ${descripcion}

**Personajes involucrados:**
${personajes && personajes.length > 0 ? personajes.map(p => `- ${p}`).join('\n') : 'No especificados'}

**URL fuente:** ${url}

---

# RESEARCH VERIFICADO

**Resumen:**
${resumen}

**Hechos clave verificados:**
${hechos_clave && hechos_clave.length > 0 ? hechos_clave.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No disponibles'}

**Contexto adicional:**
${contexto || 'No disponible'}

**Fuentes verificadas:**
${fuentes && fuentes.length > 0 ? fuentes.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'Fuente original'}

---

# TU TAREA

**Ángulo documental:** ${angle.toUpperCase()}

${angles[angle]}

**Estilo narrador:** ${narrator}

**Genera un script JSON documental con 3 segmentos de 24-25 palabras:**

\`\`\`json
{
  "tema": "Título breve del documental (max 60 chars)",
  "angle": "${angle}",
  "segments": [
    {
      "role": "hook",
      "duration": 8,
      "dialogue": "Hook impactante de 24-25 palabras. Ejemplo: Este caso tiene detalles que nadie ha revelado... y lo que estás a punto de descubrir puede cambiar todo lo que creías saber.",
      "emotion": "mysterious",
      "narrativeFunction": "Generar curiosidad inmediata"
    },
    {
      "role": "story",
      "duration": 8,
      "dialogue": "Historia con datos de 24-25 palabras. Ejemplo: Los documentos muestran que en [fecha], [personaje genérico] hizo [acción]... algo que contradice la versión oficial de los hechos.",
      "emotion": "serious",
      "narrativeFunction": "Presentar el caso con datos"
    },
    {
      "role": "twist",
      "duration": 8,
      "dialogue": "Twist revelador de 24-25 palabras. Ejemplo: Pero hay algo más... algo que las autoridades no han explicado. ¿Por qué? Eso es lo que debes preguntarte.",
      "emotion": "revealing",
      "narrativeFunction": "Revelación + pregunta abierta"
    }
  ],
  "factosUsados": [
    "Hecho 1 del research",
    "Hecho 2 del research",
    "Hecho 3 del research"
  ],
  "targetAudience": "Personas interesadas en [tipo de contenido]",
  "viralPotential": "Alto|Medio|Bajo - Justificación breve"
}
\`\`\`

**REGLAS CRÍTICAS:**
1. ✅ Exactamente 24-25 palabras por diálogo (cuenta palabras ANTES de generar)
2. ✅ SOLO usar datos del research verificado (NO inventar)
3. ✅ Tono periodístico serio (NOT casual)
4. ✅ Si tema sensible, usar referencias genéricas ("el empresario", "la celebridad")
5. ✅ Twist final debe dejar pregunta abierta para engagement
6. ✅ Usar solo emociones documentales: serious, mysterious, revealing, dramatic, authoritative, shocking, contemplative

${
            lastError
                ? `\n⚠️ **RETRY FEEDBACK**: El intento anterior falló:\n${lastError}\n\nCorrige estos errores en este intento. ESPECIALMENTE el word count de cada segmento.\n`
                : ''
        }

Genera el JSON ahora:`;
    }

    /**
     * Validate generated script
     * @private
     */
    _validateScript(script) {
        const errors = [];

        // Check required fields
        if (!script.tema) {
            errors.push('Missing tema');
        }

        if (!script.segments || !Array.isArray(script.segments)) {
            errors.push('Missing or invalid segments array');
        }

        if (script.segments && script.segments.length !== 3) {
            errors.push(`Expected 3 segments, got ${script.segments.length}`);
        }

        // Validate each segment
        if (script.segments) {
            script.segments.forEach((seg, i) => {
                if (!seg.dialogue || typeof seg.dialogue !== 'string') {
                    errors.push(`Segment ${i + 1}: Missing or invalid dialogue`);
                }

                if (!seg.emotion) {
                    errors.push(`Segment ${i + 1}: Missing emotion`);
                }

                // Validate documentary emotions
                if (
                    seg.emotion &&
                    !this.documentaryEmotions.includes(seg.emotion.toLowerCase())
                ) {
                    errors.push(
                        `Segment ${i + 1}: Invalid emotion "${seg.emotion}" (must be documentary-style)`
                    );
                }

                // Check word count (CRITICAL)
                if (seg.dialogue) {
                    const words = seg.dialogue.trim().split(/\s+/);
                    const wordCount = words.length;

                    if (wordCount < 22 || wordCount > 27) {
                        errors.push(
                            `Segment ${i + 1}: Word count ${wordCount} out of range [22-27] (ideal: 24-25)`
                        );
                        logger.warn(
                            `[DocuScriptGenerator] ⚠️ Segment ${i + 1} word count: ${wordCount}`
                        );
                    }
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Format script for VEO3 3-Phase System
     *
     * @param {Object} script - Script generated by generateViralDocuScript
     * @returns {Object} Formatted for VEO3 prepare-session endpoint
     */
    formatForVEO3(script) {
        return {
            contentType: 'documentary_short',
            presenter: 'narrator', // Special narrator (NOT ana/carlos)
            metadata: {
                tema: script.script.tema,
                angle: script.script.angle,
                source: 'docu_script_generator',
                generated_at: script.metadata.generated_at
            },
            segments: script.script.segments.map(seg => ({
                role: seg.role,
                dialogue: seg.dialogue,
                emotion: seg.emotion,
                duration: seg.duration,
                narrativeFunction: seg.narrativeFunction
            }))
        };
    }

    /**
     * Calculate estimated cost for script generation
     *
     * @param {number} count - Number of scripts to generate
     * @returns {number} Estimated cost in USD
     */
    calculateCost(count = 1) {
        const costPerScript = 0.002; // GPT-4o-mini
        return count * costPerScript;
    }
}

module.exports = new DocuScriptGenerator();
