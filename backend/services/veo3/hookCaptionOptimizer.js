const logger = require('../../utils/logger');

/**
 * HookCaptionOptimizer - Sistema de mejora automática de Hooks y Captions
 *
 * Aprende de métricas pasadas y optimiza futuros contenidos para Instagram Reels
 * Basado en análisis de 1,350M visitas de contenido viral
 */
class HookCaptionOptimizer {
    constructor() {
        // Criterios óptimos basados en investigación viral 2025
        this.hookCriteria = {
            maxWords: 15,              // Máximo palabras para hook perfecto
            acceptableWords: 20,       // Aceptable pero mejorable
            minWords: 8,               // Mínimo para tener impacto
            requiredElements: {
                intrigue: ['Pssst', 'secreto', 'nadie', 'escuchad', 'atención'],
                urgency: ['urgente', 'ahora', 'rápido', 'última hora', 'alerta'],
                value: ['€', 'precio', 'chollo', 'barato', 'valor'],
                question: ['¿', 'sabéis', 'conocéis', 'adivináis']
            }
        };

        this.captionCriteria = {
            optimal: 125,       // Óptimo para engagement
            acceptable: 200,    // Aceptable pero largo
            maximum: 250,       // Máximo antes de truncar
            emojiRange: { min: 3, max: 8 },
            requiredElements: {
                playerName: true,
                price: true,
                cta: true,
                emoji: true
            }
        };

        // Base de conocimiento de hooks exitosos
        this.hookTemplates = {
            chollo: [
                "Pssst... Misters, venid que os cuento un secreto...",
                "¿Sabéis quién está fichando todo el mundo esta jornada?",
                "Nadie está hablando de este jugador... y es un ERROR",
                "Escuchad bien... porque esto NO lo sabéis",
                "Atención Misters... os voy a revelar el chollo de la jornada"
            ],
            breaking: [
                "ALERTA URGENTE para vuestra plantilla Fantasy",
                "Noticia de ÚLTIMA HORA que cambia todo",
                "ATENCIÓN: Esto afecta a vuestro equipo YA",
                "Breaking News Fantasy... actuad RÁPIDO",
                "Esto acaba de pasar... y es GRAVE"
            ],
            prediccion: [
                "Mi capitán tiene 90% probabilidad de anotar esta jornada",
                "Os voy a contar quién va a explotar esta jornada",
                "Tengo 3 predicciones que os van a dar PUNTOS",
                "Esto es lo que va a pasar el fin de semana...",
                "La estadística NO miente... fichad ESTO"
            ],
            analisis: [
                "¿Sabéis por qué todo el mundo ficha a este jugador?",
                "He analizado 606 jugadores... y este es el mejor",
                "Los números NO engañan... mirad esto",
                "Datos que NECESITÁIS saber antes del deadline",
                "El análisis que nadie os está contando"
            ]
        };

        // Historico de performance (se guardará en BD en producción)
        this.performanceHistory = [];
    }

    /**
     * Validar hook antes de usar
     * @param {string} hook - Hook a validar
     * @param {string} contentType - chollo, breaking, prediccion, analisis
     * @returns {object} - { valid: boolean, score: number, issues: array, suggestions: array }
     */
    validateHook(hook, contentType = 'chollo') {
        const issues = [];
        const suggestions = [];
        let score = 0;
        const maxScore = 100;

        // Limpiar hook
        const cleanHook = hook.trim();
        const words = cleanHook.split(/\s+/);
        const wordCount = words.length;

        logger.info(`[HookOptimizer] Validando hook: "${cleanHook}" (${wordCount} palabras)`);

        // ===== CRITERIO 1: LONGITUD (40 puntos) =====
        if (wordCount <= this.hookCriteria.maxWords) {
            score += 40;
            logger.info(`[HookOptimizer] ✅ Longitud perfecta: ${wordCount} palabras ≤ ${this.hookCriteria.maxWords}`);
        } else if (wordCount <= this.hookCriteria.acceptableWords) {
            score += 25;
            issues.push(`Hook tiene ${wordCount} palabras (mejor si ≤${this.hookCriteria.maxWords})`);
            suggestions.push(`Reducir a ${this.hookCriteria.maxWords} palabras o menos para máximo impacto`);
        } else {
            issues.push(`Hook DEMASIADO LARGO: ${wordCount} palabras (máximo ${this.hookCriteria.acceptableWords})`);
            suggestions.push(`CRÍTICO: Reducir a menos de ${this.hookCriteria.maxWords} palabras`);
            suggestions.push(`Ejemplo: "${this.getOptimalHookExample(contentType, cleanHook)}"`);
        }

        // ===== CRITERIO 2: ELEMENTOS DE INTRIGA (20 puntos) =====
        const hasIntrigue = this.hookCriteria.requiredElements.intrigue.some(element =>
            cleanHook.toLowerCase().includes(element.toLowerCase())
        );
        if (hasIntrigue) {
            score += 20;
            logger.info(`[HookOptimizer] ✅ Elemento de intriga presente`);
        } else {
            issues.push('Falta elemento de intriga (Pssst, secreto, nadie, etc.)');
            suggestions.push(`Agregar inicio intrigante: "Pssst...", "¿Sabéis...?", "Nadie..."`);
        }

        // ===== CRITERIO 3: URGENCIA (15 puntos) =====
        const hasUrgency = this.hookCriteria.requiredElements.urgency.some(element =>
            cleanHook.toLowerCase().includes(element.toLowerCase())
        );
        if (hasUrgency || contentType === 'breaking') {
            score += 15;
            logger.info(`[HookOptimizer] ✅ Urgencia presente`);
        } else {
            if (contentType === 'breaking' || contentType === 'chollo') {
                issues.push('Falta elemento de urgencia');
                suggestions.push('Agregar urgencia: "ahora", "rápido", "última hora"');
            } else {
                score += 10; // No crítico para análisis/predicción
            }
        }

        // ===== CRITERIO 4: MENCIÓN DE VALOR (15 puntos) =====
        const hasValue = this.hookCriteria.requiredElements.value.some(element =>
            cleanHook.includes(element)
        );
        if (hasValue || contentType !== 'chollo') {
            score += 15;
            logger.info(`[HookOptimizer] ✅ Valor mencionado o no requerido`);
        } else {
            issues.push('Chollos deben mencionar precio/valor en hook');
            suggestions.push('Incluir "€", "precio" o "chollo" en el hook');
        }

        // ===== CRITERIO 5: PREGUNTA O INTERACCIÓN (10 puntos) =====
        const hasQuestion = cleanHook.includes('¿') ||
                           this.hookCriteria.requiredElements.question.some(q =>
                               cleanHook.toLowerCase().includes(q)
                           );
        if (hasQuestion) {
            score += 10;
            logger.info(`[HookOptimizer] ✅ Pregunta/interacción presente`);
        } else {
            suggestions.push('Considera usar pregunta para mayor engagement: "¿Sabéis...?"');
        }

        const valid = score >= 70; // 70/100 mínimo para aprobar

        logger.info(`[HookOptimizer] Score final: ${score}/${maxScore} - ${valid ? '✅ VÁLIDO' : '❌ REQUIERE MEJORA'}`);

        return {
            valid,
            score,
            wordCount,
            issues,
            suggestions,
            analysis: {
                hasIntrigue,
                hasUrgency,
                hasValue,
                hasQuestion,
                tooLong: wordCount > this.hookCriteria.acceptableWords,
                optimal: wordCount <= this.hookCriteria.maxWords && score >= 85
            }
        };
    }

    /**
     * Validar caption Instagram
     * @param {string} caption - Caption a validar
     * @param {object} contentData - Datos del contenido (jugador, precio, etc)
     * @returns {object} - { valid: boolean, score: number, issues: array, suggestions: array }
     */
    validateCaption(caption, contentData = {}) {
        const issues = [];
        const suggestions = [];
        let score = 0;
        const maxScore = 100;

        const cleanCaption = caption.trim();
        const length = cleanCaption.length;
        const emojiCount = (cleanCaption.match(/[\p{Emoji}]/gu) || []).length;

        logger.info(`[HookOptimizer] Validando caption: ${length} caracteres, ${emojiCount} emojis`);

        // ===== CRITERIO 1: LONGITUD (40 puntos) =====
        if (length <= this.captionCriteria.optimal) {
            score += 40;
            logger.info(`[HookOptimizer] ✅ Caption longitud óptima: ${length} ≤ ${this.captionCriteria.optimal}`);
        } else if (length <= this.captionCriteria.acceptable) {
            score += 25;
            issues.push(`Caption largo: ${length} caracteres (óptimo ${this.captionCriteria.optimal})`);
            suggestions.push('Acortar a 125 caracteres para mejor engagement');
        } else if (length <= this.captionCriteria.maximum) {
            score += 15;
            issues.push(`Caption MUY largo: ${length} caracteres`);
            suggestions.push('CRÍTICO: Reducir a máximo 200 caracteres');
        } else {
            issues.push(`Caption EXCESIVO: ${length} caracteres (máximo ${this.captionCriteria.maximum})`);
            suggestions.push('URGENTE: Caption será truncado en feed, reducir a <200 caracteres');
        }

        // ===== CRITERIO 2: EMOJIS (20 puntos) =====
        if (emojiCount >= this.captionCriteria.emojiRange.min &&
            emojiCount <= this.captionCriteria.emojiRange.max) {
            score += 20;
            logger.info(`[HookOptimizer] ✅ Cantidad emojis óptima: ${emojiCount}`);
        } else if (emojiCount > 0) {
            score += 12;
            if (emojiCount < this.captionCriteria.emojiRange.min) {
                suggestions.push(`Agregar más emojis (actual: ${emojiCount}, óptimo: 3-8)`);
            } else {
                suggestions.push(`Reducir emojis (actual: ${emojiCount}, óptimo: 3-8)`);
            }
        } else {
            issues.push('Sin emojis - impacto visual bajo');
            suggestions.push('Agregar 3-8 emojis relevantes (🔥💰⚽📊)');
        }

        // ===== CRITERIO 3: ELEMENTOS REQUERIDOS (30 puntos) =====
        let requiredElementsScore = 0;

        // Nombre jugador (si aplica)
        if (!contentData.playerName || cleanCaption.includes(contentData.playerName)) {
            requiredElementsScore += 10;
        } else {
            issues.push(`Falta nombre jugador: ${contentData.playerName}`);
        }

        // Precio (si aplica)
        if (!contentData.price || cleanCaption.includes(`€${contentData.price}`) || cleanCaption.includes(contentData.price.toString())) {
            requiredElementsScore += 10;
        } else {
            issues.push(`Falta precio: €${contentData.price}M`);
        }

        // CTA
        const ctaKeywords = ['fichad', 'link', 'bio', 'comentarios', 'sígueme', 'suscríbete'];
        const hasCTA = ctaKeywords.some(kw => cleanCaption.toLowerCase().includes(kw));
        if (hasCTA) {
            requiredElementsScore += 10;
        } else {
            issues.push('Falta Call-To-Action claro');
            suggestions.push('Agregar CTA: "¿Fichamos? 👇", "Link en bio", "Comenta tu equipo"');
        }

        score += requiredElementsScore;

        // ===== CRITERIO 4: HASHTAGS (10 puntos) =====
        const hashtagCount = (cleanCaption.match(/#\w+/g) || []).length;
        if (hashtagCount === 0) {
            // Hashtags deberían estar separados, pero verificamos
            score += 10; // Asumimos que van en campo separado
        } else if (hashtagCount >= 3 && hashtagCount <= 10) {
            score += 10;
        } else {
            suggestions.push('Hashtags óptimos: 5-10 separados del caption');
        }

        const valid = score >= 65; // 65/100 mínimo para aprobar

        logger.info(`[HookOptimizer] Caption score: ${score}/${maxScore} - ${valid ? '✅ VÁLIDO' : '❌ REQUIERE MEJORA'}`);

        return {
            valid,
            score,
            length,
            emojiCount,
            issues,
            suggestions,
            analysis: {
                tooLong: length > this.captionCriteria.acceptable,
                optimalLength: length <= this.captionCriteria.optimal,
                hasEmojis: emojiCount > 0,
                optimalEmojis: emojiCount >= 3 && emojiCount <= 8,
                hasCTA,
                hasPlayerName: !contentData.playerName || cleanCaption.includes(contentData.playerName)
            }
        };
    }

    /**
     * Generar hook optimizado automáticamente
     * @param {string} contentType - chollo, breaking, prediccion, analisis
     * @param {object} contentData - Datos del contenido
     * @returns {object} - { hook: string, metadata: object }
     */
    generateOptimizedHook(contentType, contentData) {
        const { playerName, price, team, position, ratio } = contentData;

        logger.info(`[HookOptimizer] Generando hook optimizado para: ${contentType}`);

        let hook = '';
        let template = '';

        switch (contentType) {
            case 'chollo':
                // Seleccionar template aleatorio
                const cholloTemplates = this.hookTemplates.chollo;
                template = cholloTemplates[Math.floor(Math.random() * cholloTemplates.length)];

                // Variante específica con datos
                if (template.includes('secreto')) {
                    hook = `Pssst... Misters, ${position || 'jugador'} del ${team} a €${price}M... CHOLLO`;
                } else if (template.includes('fichando')) {
                    hook = `¿Sabéis quién fichando todo el mundo? ${position} €${price}M ratio ${ratio}x`;
                } else {
                    hook = `Nadie habla de ${playerName}... €${price}M y es un CHOLLO brutal`;
                }
                break;

            case 'breaking':
                hook = `ALERTA: ${playerName} - Noticia URGENTE que afecta tu Fantasy`;
                break;

            case 'prediccion':
                hook = `${playerName} tiene 90% probabilidad... los datos NO mienten`;
                break;

            case 'analisis':
                hook = `¿Por qué ${playerName} es IMPRESCINDIBLE esta jornada? Datos reales`;
                break;

            default:
                hook = `${playerName} - ${position} del ${team} por €${price}M ¿Fichamos?`;
        }

        // Validar hook generado
        const validation = this.validateHook(hook, contentType);

        // Si no es válido, acortar
        if (!validation.valid && validation.wordCount > this.hookCriteria.maxWords) {
            hook = this.shortenHook(hook, this.hookCriteria.maxWords);
            logger.info(`[HookOptimizer] Hook acortado a: "${hook}"`);
        }

        return {
            hook,
            metadata: {
                contentType,
                template,
                wordCount: hook.split(/\s+/).length,
                validation: this.validateHook(hook, contentType)
            }
        };
    }

    /**
     * Generar caption optimizado automáticamente
     * @param {string} contentType - Tipo de contenido
     * @param {object} contentData - Datos del contenido
     * @returns {object} - { caption: string, metadata: object }
     */
    generateOptimizedCaption(contentType, contentData) {
        const { playerName, price, team, ratio, stats = {} } = contentData;

        logger.info(`[HookOptimizer] Generando caption optimizado para: ${contentType}`);

        let caption = '';

        switch (contentType) {
            case 'chollo':
                caption = `🔥 CHOLLO: ${playerName} (${team}) a solo €${price}M\n\n💰 Ratio ${ratio}x - ${stats.goals || 0} goles, ${stats.assists || 0} asists\n⚡ Buen calendario próximos partidos\n\n¿Fichamos? 👇 Comenta`;
                break;

            case 'breaking':
                caption = `🚨 BREAKING: ${playerName}\n\n⚠️ Noticia de ÚLTIMA HORA\n📊 Afecta a tu plantilla Fantasy\n\n👉 Link análisis completo bio`;
                break;

            case 'prediccion':
                caption = `🎯 MI PREDICCIÓN: ${playerName}\n\n📈 ${stats.rating || 0} rating - forma BRUTAL\n⚽ Probabilidad gol: ALTA\n\n¿Coincides? 💬 Comenta tu capitán`;
                break;

            case 'analisis':
                caption = `📊 ANÁLISIS: ${playerName} (${team})\n\n💎 €${price}M | Ratio ${ratio}x\n⭐ Stats: ${stats.goals}G ${stats.assists}A\n\n👉 ¿Lo tenéis? Comenta 👇`;
                break;

            default:
                caption = `${playerName} - ${team}\n€${price}M | Ratio ${ratio}x\n\n¿Fichamos? 👇`;
        }

        // Validar longitud
        if (caption.length > this.captionCriteria.optimal) {
            caption = this.shortenCaption(caption, this.captionCriteria.optimal);
            logger.info(`[HookOptimizer] Caption acortado a ${caption.length} caracteres`);
        }

        const validation = this.validateCaption(caption, contentData);

        return {
            caption,
            metadata: {
                contentType,
                length: caption.length,
                emojiCount: (caption.match(/[\p{Emoji}]/gu) || []).length,
                validation
            }
        };
    }

    /**
     * Acortar hook manteniendo impacto
     * @param {string} hook - Hook original
     * @param {number} maxWords - Máximo de palabras
     * @returns {string} - Hook acortado
     */
    shortenHook(hook, maxWords) {
        const words = hook.split(/\s+/);
        if (words.length <= maxWords) return hook;

        // Mantener inicio intrigante + final impactante
        const shortened = words.slice(0, maxWords).join(' ');

        // Asegurar que termina bien
        if (!shortened.endsWith('...') && !shortened.endsWith('?') && !shortened.endsWith('!')) {
            return shortened + '...';
        }

        return shortened;
    }

    /**
     * Acortar caption manteniendo elementos clave
     * @param {string} caption - Caption original
     * @param {number} maxLength - Máximo caracteres
     * @returns {string} - Caption acortado
     */
    shortenCaption(caption, maxLength) {
        if (caption.length <= maxLength) return caption;

        // Mantener primera línea + emojis + CTA
        const lines = caption.split('\n');
        let shortened = lines[0];

        // Agregar líneas hasta alcanzar límite
        for (let i = 1; i < lines.length; i++) {
            if ((shortened + '\n' + lines[i]).length <= maxLength - 20) {
                shortened += '\n' + lines[i];
            } else {
                break;
            }
        }

        // Asegurar CTA al final si hay espacio
        if (!shortened.toLowerCase().includes('comenta') &&
            !shortened.toLowerCase().includes('link') &&
            shortened.length < maxLength - 15) {
            shortened += '\n\n👇 Comenta';
        }

        return shortened.substring(0, maxLength);
    }

    /**
     * Obtener ejemplo de hook óptimo basado en el hook actual
     * @param {string} contentType - Tipo de contenido
     * @param {string} currentHook - Hook actual que falló
     * @returns {string} - Ejemplo optimizado
     */
    getOptimalHookExample(contentType, currentHook) {
        const templates = this.hookTemplates[contentType] || this.hookTemplates.chollo;

        // Intentar preservar algún dato del hook original
        let example = templates[0];

        // Si el hook original tiene precio, intentar preservarlo
        const priceMatch = currentHook.match(/€(\d+\.?\d*)M?/);
        if (priceMatch) {
            example = example.replace(/jugador/, `jugador a ${priceMatch[0]}`);
        }

        return example;
    }

    /**
     * Registrar performance de hook/caption para aprendizaje
     * @param {object} contentData - Datos del contenido publicado
     * @param {object} metrics - Métricas obtenidas (views, engagement, etc)
     */
    registerPerformance(contentData, metrics) {
        const record = {
            timestamp: new Date().toISOString(),
            hook: contentData.hook,
            caption: contentData.caption,
            contentType: contentData.contentType,
            hookValidation: this.validateHook(contentData.hook, contentData.contentType),
            captionValidation: this.validateCaption(contentData.caption, contentData),
            metrics: {
                views: metrics.views || 0,
                likes: metrics.likes || 0,
                comments: metrics.comments || 0,
                shares: metrics.shares || 0,
                saves: metrics.saves || 0,
                engagementRate: metrics.engagementRate || 0,
                retention: metrics.retention || 0
            }
        };

        this.performanceHistory.push(record);

        logger.info(`[HookOptimizer] Performance registrada: ${metrics.views} views, ${metrics.engagementRate}% engagement`);

        // TODO: Guardar en base de datos para análisis a largo plazo
        // await this.saveToDatabase(record);

        return record;
    }

    /**
     * Obtener mejores hooks históricos por tipo
     * @param {string} contentType - Tipo de contenido
     * @param {number} limit - Límite de resultados
     * @returns {array} - Top hooks por performance
     */
    getBestHooks(contentType, limit = 5) {
        const filtered = this.performanceHistory
            .filter(r => r.contentType === contentType)
            .sort((a, b) => {
                // Ordenar por engagement rate primero, luego views
                if (b.metrics.engagementRate !== a.metrics.engagementRate) {
                    return b.metrics.engagementRate - a.metrics.engagementRate;
                }
                return b.metrics.views - a.metrics.views;
            })
            .slice(0, limit);

        logger.info(`[HookOptimizer] Top ${limit} hooks para ${contentType}:`, filtered.map(r => r.hook));

        return filtered;
    }
}

module.exports = HookCaptionOptimizer;
