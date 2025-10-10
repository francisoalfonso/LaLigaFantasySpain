/**
 * Emotion Analyzer - Sistema Inteligente de Detección de Emociones
 *
 * Analiza el contenido de cada frase del guión y asigna la emoción
 * más apropiada del catálogo de 18 emociones de Ana.
 *
 * FACTORES DE ANÁLISIS:
 * 1. Palabras clave (keywords matching)
 * 2. Estructura gramatical (preguntas, exclamaciones, imperativos)
 * 3. Intención narrativa (hook, datos, CTA, etc.)
 * 4. Posición en el arco narrativo
 * 5. Contexto (tipo de contenido: chollo, análisis, breaking)
 */

const logger = require('../../utils/logger');

class EmotionAnalyzer {
    constructor() {
        // ========================================
        // KEYWORDS POR EMOCIÓN
        // ========================================
        this.emotionKeywords = {
            // CURIOSIDAD / INTRIGA
            'curiosidad': ['pssst', 'misters', 'escuchad', 'atención', 'secreto', 'fijaos', 'descubierto', 'nadie sabe'],
            'intriga': ['misterioso', 'oculto', 'extraño', 'raro', 'curioso', 'sorprendente'],
            'sorpresa': ['increíble', 'flipante', 'alucinante', 'no te lo vas a creer', 'adivina', 'brutal'],

            // REVELACIÓN / DESCUBRIMIENTO
            'revelacion': ['resulta que', 'la verdad es', 'de hecho', 'en realidad', 'lo que pasa', 'he descubierto'],
            'descubrimiento': ['he encontrado', 'acabo de ver', 'mirad esto', 'fíjate', 'observad'],

            // AUTORIDAD / PROFESIONALIDAD
            'autoridad': ['según los datos', 'las estadísticas', 'los números', 'el análisis', 'objetivamente'],
            'analisis': ['si analizamos', 'comparando', 'teniendo en cuenta', 'considerando', 'evaluando'],
            'construccion': ['primero', 'segundo', 'además', 'también', 'por otro lado', 'sumado a'],

            // VALIDACIÓN / PRUEBA
            'validacion': ['la prueba', 'los datos confirman', 'como veis', 'aquí está', 'fijaos en'],
            'evidencia': ['las cifras', 'los goles', 'las asistencias', 'el rating', 'el ratio', 'puntos por partido'],

            // URGENCIA / ACCIÓN
            'urgencia': ['ahora', 'ya', 'inmediatamente', 'rápido', 'antes de que', 'no esperes'],
            'escasez': ['solo', 'únicamente', 'último', 'quedan', 'se agota', 'no durará'],
            'accion': ['fichad', 'hazlo', 'corre', 'aprovecha', 'no te lo pierdas', 'imprescindible'],

            // IMPACTO / SHOCK
            'impacto': ['brutal', 'histórico', 'récord', 'nunca visto', 'bestial', 'descomunal'],
            'shock': ['bombazo', 'notición', 'breaking', 'última hora', 'acaba de pasar'],

            // CONCLUSIÓN / CIERRE
            'conclusion': ['en resumen', 'resumiendo', 'al final', 'total que', 'la clave'],
            'moraleja': ['recordad', 'no olvidéis', 'tened en cuenta', 'importante'],

            // EMPATÍA / CONEXIÓN
            'empatia': ['entiendo', 'lo sé', 'todos sabemos', 'te pasa a ti también', 'nos pasa'],
            'complicidad': ['entre nosotros', 'te cuento', 'tú y yo sabemos', 'confidencialmente'],

            // ENERGÍA POSITIVA
            'entusiasmo': ['genial', 'perfecto', 'estupendo', 'fantástico', 'maravilloso'],
            'celebracion': ['enhorabuena', 'bravo', 'bien hecho', 'lo ha petado', 'crack']
        };

        // ========================================
        // PATRONES GRAMATICALES
        // ========================================
        this.grammarPatterns = {
            question: /\?$/,
            exclamation: /!$/,
            imperative: /^(fichad|hazlo|corre|aprovecha|no te pierdas|escuchad|mirad|fijaos)/i,
            negation: /\bno\b|\bnunca\b|\bnadie\b/i,
            comparison: /\bmás\b.*\bque\b|\bmejor\b|\bpeor\b|\bsuperior\b/i,
            numbers: /\b\d+(\.\d+)?\b/,
            superlative: /\b(mejor|peor|mayor|menor|máximo|mínimo|único|solo)\b/i
        };

        // ========================================
        // MAPEO INTENCIÓN NARRATIVA → EMOCIONES
        // ========================================
        this.narrativeIntentions = {
            'hook': ['curiosidad', 'intriga', 'sorpresa'],
            'contexto': ['autoridad', 'analisis', 'construccion'],
            'conflicto': ['revelacion', 'impacto', 'shock'],
            'inflexion': ['descubrimiento', 'revelacion', 'sorpresa'],
            'resolucion': ['validacion', 'evidencia', 'autoridad'],
            'moraleja': ['conclusion', 'moraleja', 'complicidad'],
            'cta': ['urgencia', 'accion', 'escasez']
        };
    }

    /**
     * Analizar frase y devolver emoción más apropiada
     * @param {string} phrase - Frase a analizar
     * @param {object} context - Contexto adicional
     * @returns {string} - Emoción detectada del catálogo
     */
    analyzePhrase(phrase, context = {}) {
        const {
            narrativeRole = null,  // hook, contexto, conflicto, etc.
            position = 0,          // Posición en el segmento (0-1)
            contentType = 'chollo', // chollo, analisis, breaking
            previousEmotion = null  // Emoción del segmento anterior
        } = context;

        logger.info(`[EmotionAnalyzer] Analizando frase: "${phrase.substring(0, 50)}..."`);

        // PASO 1: Análisis por keywords (peso: 50%)
        const keywordScores = this._analyzeKeywords(phrase);

        // PASO 2: Análisis gramatical (peso: 20%)
        const grammarScores = this._analyzeGrammar(phrase);

        // PASO 3: Análisis intención narrativa (peso: 20%)
        const intentionScores = this._analyzeNarrativeIntention(narrativeRole);

        // PASO 4: Análisis de contexto y continuidad (peso: 10%)
        const contextScores = this._analyzeContext(position, previousEmotion, contentType);

        // Combinar scores
        const combinedScores = this._combineScores(
            keywordScores,
            grammarScores,
            intentionScores,
            contextScores
        );

        // Seleccionar emoción con mayor score
        const selectedEmotion = this._selectTopEmotion(combinedScores);

        logger.info(`[EmotionAnalyzer] ✅ Emoción detectada: "${selectedEmotion}" (score: ${combinedScores[selectedEmotion].toFixed(2)})`);
        logger.info(`[EmotionAnalyzer] Top 3: ${Object.entries(combinedScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e, s]) => `${e}(${s.toFixed(1)})`).join(', ')}`);

        return selectedEmotion;
    }

    /**
     * PASO 1: Análisis por palabras clave
     */
    _analyzeKeywords(phrase) {
        const scores = {};
        const lowerPhrase = phrase.toLowerCase();

        // Contar matches de keywords por emoción
        for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
            let matchCount = 0;
            for (const keyword of keywords) {
                if (lowerPhrase.includes(keyword)) {
                    matchCount++;
                }
            }
            scores[emotion] = matchCount * 10; // 10 puntos por keyword match
        }

        return scores;
    }

    /**
     * PASO 2: Análisis gramatical
     */
    _analyzeGrammar(phrase) {
        const scores = {};

        // Pregunta → curiosidad, intriga
        if (this.grammarPatterns.question.test(phrase)) {
            scores['curiosidad'] = (scores['curiosidad'] || 0) + 8;
            scores['intriga'] = (scores['intriga'] || 0) + 5;
        }

        // Exclamación → sorpresa, entusiasmo, impacto
        if (this.grammarPatterns.exclamation.test(phrase)) {
            scores['sorpresa'] = (scores['sorpresa'] || 0) + 6;
            scores['entusiasmo'] = (scores['entusiasmo'] || 0) + 4;
            scores['impacto'] = (scores['impacto'] || 0) + 4;
        }

        // Imperativo → urgencia, acción
        if (this.grammarPatterns.imperative.test(phrase)) {
            scores['accion'] = (scores['accion'] || 0) + 10;
            scores['urgencia'] = (scores['urgencia'] || 0) + 7;
        }

        // Comparación → análisis, validación
        if (this.grammarPatterns.comparison.test(phrase)) {
            scores['analisis'] = (scores['analisis'] || 0) + 5;
            scores['validacion'] = (scores['validacion'] || 0) + 4;
        }

        // Números → evidencia, validación, autoridad
        if (this.grammarPatterns.numbers.test(phrase)) {
            scores['evidencia'] = (scores['evidencia'] || 0) + 6;
            scores['validacion'] = (scores['validacion'] || 0) + 5;
            scores['autoridad'] = (scores['autoridad'] || 0) + 3;
        }

        // Superlativo → escasez, impacto
        if (this.grammarPatterns.superlative.test(phrase)) {
            scores['escasez'] = (scores['escasez'] || 0) + 5;
            scores['impacto'] = (scores['impacto'] || 0) + 4;
        }

        return scores;
    }

    /**
     * PASO 3: Análisis por intención narrativa
     */
    _analyzeNarrativeIntention(narrativeRole) {
        const scores = {};

        if (!narrativeRole || !this.narrativeIntentions[narrativeRole]) {
            return scores;
        }

        // Las emociones apropiadas para este rol narrativo reciben bonus
        const appropriateEmotions = this.narrativeIntentions[narrativeRole];
        for (const emotion of appropriateEmotions) {
            scores[emotion] = (scores[emotion] || 0) + 15; // 15 puntos bonus
        }

        return scores;
    }

    /**
     * PASO 4: Análisis de contexto y continuidad
     */
    _analyzeContext(position, previousEmotion, contentType) {
        const scores = {};

        // Bonus por continuidad emocional (evitar cambios bruscos)
        if (previousEmotion) {
            scores[previousEmotion] = (scores[previousEmotion] || 0) + 5;
        }

        // Ajuste por posición en el segmento
        if (position < 0.3) {
            // Inicio del segmento: favorece hooks
            scores['curiosidad'] = (scores['curiosidad'] || 0) + 3;
            scores['intriga'] = (scores['intriga'] || 0) + 2;
        } else if (position > 0.7) {
            // Final del segmento: favorece CTAs
            scores['urgencia'] = (scores['urgencia'] || 0) + 3;
            scores['accion'] = (scores['accion'] || 0) + 2;
        }

        // Ajuste por tipo de contenido
        if (contentType === 'breaking') {
            scores['shock'] = (scores['shock'] || 0) + 5;
            scores['impacto'] = (scores['impacto'] || 0) + 4;
        } else if (contentType === 'analisis') {
            scores['autoridad'] = (scores['autoridad'] || 0) + 4;
            scores['analisis'] = (scores['analisis'] || 0) + 3;
        }

        return scores;
    }

    /**
     * Combinar scores de todos los análisis
     */
    _combineScores(...scoreArrays) {
        const combined = {};

        for (const scores of scoreArrays) {
            for (const [emotion, score] of Object.entries(scores)) {
                combined[emotion] = (combined[emotion] || 0) + score;
            }
        }

        return combined;
    }

    /**
     * Seleccionar emoción con mayor score
     */
    _selectTopEmotion(scores) {
        if (Object.keys(scores).length === 0) {
            // Fallback: si no se detectó nada, usar autoridad (neutral)
            return 'autoridad';
        }

        // Ordenar por score descendente
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

        return sorted[0][0];
    }

    /**
     * Analizar segmento completo y dividirlo en frases con emociones
     * @param {string} dialogue - Diálogo completo del segmento
     * @param {object} context - Contexto del segmento
     * @returns {Array} - Array de {phrase, emotion}
     */
    analyzeSegment(dialogue, context = {}) {
        // Dividir en frases (por punto, exclamación, pregunta)
        const phrases = dialogue.split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);

        let previousEmotion = null;
        const analyzed = phrases.map((phrase, index) => {
            const phraseContext = {
                ...context,
                position: index / phrases.length,
                previousEmotion // ✅ Usar variable externa
            };

            const emotion = this.analyzePhrase(phrase, phraseContext);
            previousEmotion = emotion; // ✅ Actualizar para siguiente iteración

            return { phrase, emotion };
        });

        // Decidir emoción DOMINANTE del segmento (más frecuente)
        const emotionCounts = {};
        analyzed.forEach(({ emotion }) => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        const dominantEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        logger.info(`[EmotionAnalyzer] Segmento analizado: ${phrases.length} frases, emoción dominante: ${dominantEmotion}`);

        return {
            phrases: analyzed,
            dominantEmotion,
            emotionDistribution: emotionCounts
        };
    }
}

module.exports = EmotionAnalyzer;
