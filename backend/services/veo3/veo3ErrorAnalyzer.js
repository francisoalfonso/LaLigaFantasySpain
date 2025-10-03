const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const {
    getPlayerNickname,
    getTeamNickname,
    getAllPlayerVariants,
    getAllTeamVariants,
    isHighRiskPlayer,
    isHighRiskTeam,
    PLAYER_NICKNAMES,
    TEAM_NICKNAMES
} = require('../../config/veo3/footballNicknames');

/**
 * VEO3ErrorAnalyzer - Analiza errores detallados de KIE.ai/VEO3
 *
 * Captura y analiza información completa de errores incluyendo:
 * - Error codes específicos (400, 422, etc.)
 * - Mensajes detallados de Google Content Policy
 * - Patrones de bloqueo recurrentes
 * - Sugerencias automáticas de fix
 *
 * Basado en logs del dashboard KIE.ai que muestran:
 * - "Rejected by Google's content policy (public error prominent people upload)"
 * - Soluciones sugeridas por KIE.ai
 */
class VEO3ErrorAnalyzer {
    constructor() {
        this.errorHistoryFile = path.join(__dirname, '../../../logs/veo3-errors.json');
        this.errorHistory = [];
        this.loadErrorHistory();
    }

    /**
     * Cargar historial de errores desde archivo
     */
    async loadErrorHistory() {
        try {
            const data = await fs.readFile(this.errorHistoryFile, 'utf8');
            this.errorHistory = JSON.parse(data);
            logger.info(`[VEO3ErrorAnalyzer] Historial cargado: ${this.errorHistory.length} errores registrados`);
        } catch (error) {
            // Archivo no existe, crear nuevo
            this.errorHistory = [];
            logger.info('[VEO3ErrorAnalyzer] Inicializando nuevo historial de errores');
        }
    }

    /**
     * Guardar historial de errores
     */
    async saveErrorHistory() {
        try {
            await fs.writeFile(
                this.errorHistoryFile,
                JSON.stringify(this.errorHistory, null, 2),
                'utf8'
            );
        } catch (error) {
            logger.error('[VEO3ErrorAnalyzer] Error guardando historial:', error.message);
        }
    }

    /**
     * Analizar respuesta de error de KIE.ai
     * Extrae información detallada que aparece en dashboard pero no en API response
     *
     * @param {object} statusResponse - Respuesta completa de getStatus()
     * @param {string} prompt - Prompt original que causó el error
     * @param {string} taskId - Task ID para tracking
     * @returns {object} - Análisis detallado del error
     */
    analyzeError(statusResponse, prompt, taskId) {
        const analysis = {
            timestamp: new Date().toISOString(),
            taskId,
            prompt,
            errorCode: null,
            errorMessage: null,
            errorCategory: null,
            likelyTriggers: [],
            suggestedFixes: [],
            confidence: 0
        };

        // Extraer error code y mensaje
        if (statusResponse.data) {
            analysis.errorCode = statusResponse.data.errorCode || statusResponse.data.successFlag;
            analysis.errorMessage = statusResponse.data.errorMessage || statusResponse.data.msg || 'failed';
        }

        // Categorizar error basado en patterns conocidos
        analysis.errorCategory = this.categorizeError(analysis.errorCode, analysis.errorMessage);

        // Detectar triggers en el prompt
        analysis.likelyTriggers = this.detectTriggers(prompt);

        // Generar sugerencias de fix
        analysis.suggestedFixes = this.generateFixes(prompt, analysis.likelyTriggers, analysis.errorCategory);

        // Calcular confianza del análisis
        analysis.confidence = this.calculateConfidence(analysis);

        // Registrar en historial
        this.errorHistory.push(analysis);
        this.saveErrorHistory();

        // Log detallado
        logger.error('[VEO3ErrorAnalyzer] Error analizado:', {
            taskId: analysis.taskId,
            errorCode: analysis.errorCode,
            errorMessage: analysis.errorMessage,
            category: analysis.errorCategory,
            triggers: analysis.likelyTriggers,
            confidence: `${(analysis.confidence * 100).toFixed(0)}%`
        });

        return analysis;
    }

    /**
     * Categorizar tipo de error
     */
    categorizeError(errorCode, errorMessage) {
        const message = (errorMessage || '').toLowerCase();

        // Error 400: Google Content Policy
        if (errorCode === 400 || message.includes('content policy')) {
            if (message.includes('prominent people')) {
                return 'GOOGLE_POLICY_PROMINENT_PEOPLE';
            }
            if (message.includes('violent') || message.includes('gore')) {
                return 'GOOGLE_POLICY_VIOLENCE';
            }
            if (message.includes('sexual')) {
                return 'GOOGLE_POLICY_SEXUAL';
            }
            return 'GOOGLE_POLICY_GENERIC';
        }

        // Error 422: VEO3 Validation Error
        if (errorCode === 422 || errorCode === 3) {
            return 'VEO3_VALIDATION_ERROR';
        }

        // Timeout
        if (message.includes('timeout')) {
            return 'TIMEOUT';
        }

        return 'UNKNOWN';
    }

    /**
     * Detectar triggers en el prompt con análisis de contexto combinado
     *
     * LÓGICA MEJORADA V2:
     * - "Aspas" solo → OK (bajo riesgo)
     * - "Aspas" + "Celta" en misma frase → ALTO RIESGO
     * - "Iago Aspas" → SIEMPRE ALTO RIESGO
     * - Usar apodos primero es mejor que nombres completos
     */
    detectTriggers(prompt) {
        const triggers = [];

        // CRÍTICO: Nombres completos de futbolistas (SIEMPRE bloquear)
        const playerNamePatterns = [
            { pattern: /\bIago Aspas\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Iago Aspas', surname: 'Aspas', team: 'Celta', severity: 'CRITICAL' },
            { pattern: /\bRobert Lewandowski\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Robert Lewandowski', surname: 'Lewandowski', team: 'Barcelona', severity: 'CRITICAL' },
            { pattern: /\bVinicius Junior\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Vinicius Junior', surname: 'Vinicius', team: 'Real Madrid', severity: 'CRITICAL' },
            { pattern: /\bKylian Mbappé\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Kylian Mbappé', surname: 'Mbappé', team: 'Real Madrid', severity: 'CRITICAL' },
            { pattern: /\bLionel Messi\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Lionel Messi', surname: 'Messi', team: 'PSG', severity: 'CRITICAL' },
            { pattern: /\bCristiano Ronaldo\b/gi, trigger: 'PLAYER_FULL_NAME', value: 'Cristiano Ronaldo', surname: 'Ronaldo', team: 'Al Nassr', severity: 'CRITICAL' }
        ];

        // Detectar nombres completos primero
        for (const { pattern, trigger, value, surname, team, severity } of playerNamePatterns) {
            const matches = prompt.match(pattern);
            if (matches) {
                triggers.push({
                    type: trigger,
                    value,
                    surname,
                    team,
                    severity,
                    occurrences: matches.length,
                    positions: this.findPositions(prompt, pattern),
                    reason: 'Nombre completo detectado - Google bloquea siempre'
                });
            }
        }

        // ANÁLISIS CONTEXTUAL: Apellido + Equipo en misma frase
        // "Aspas del Celta" → ALTO RIESGO
        // "Aspas" solo → BAJO RIESGO (OK)
        const contextualRisks = [
            {
                playerSurname: 'Aspas',
                teamPattern: /\b(Celta|del Celta|Celta de Vigo)\b/gi,
                risk: 'HIGH',
                reason: 'Apellido + equipo en mismo contexto = Google detecta identidad'
            },
            {
                playerSurname: 'Lewandowski',
                teamPattern: /\b(Barcelona|del Barcelona|Barça|FC Barcelona)\b/gi,
                risk: 'HIGH',
                reason: 'Apellido + equipo en mismo contexto = Google detecta identidad'
            },
            {
                playerSurname: 'Vinicius',
                teamPattern: /\b(Real Madrid|del Madrid|Madrid)\b/gi,
                risk: 'HIGH',
                reason: 'Apellido + equipo en mismo contexto = Google detecta identidad'
            }
        ];

        for (const { playerSurname, teamPattern, risk, reason } of contextualRisks) {
            const hasSurname = new RegExp(`\\b${playerSurname}\\b`, 'gi').test(prompt);
            const hasTeam = teamPattern.test(prompt);

            if (hasSurname && hasTeam) {
                // RIESGO ALTO: Ambos en mismo prompt
                triggers.push({
                    type: 'CONTEXTUAL_RISK_COMBINED',
                    value: `${playerSurname} + equipo`,
                    severity: 'HIGH',
                    occurrences: 1,
                    positions: [],
                    reason: reason,
                    playerSurname,
                    teamPattern: teamPattern.source
                });
            } else if (hasSurname && !hasTeam) {
                // RIESGO BAJO: Solo apellido sin equipo
                triggers.push({
                    type: 'SURNAME_ONLY_LOW_RISK',
                    value: playerSurname,
                    severity: 'LOW',
                    occurrences: 1,
                    positions: this.findPositions(prompt, new RegExp(`\\b${playerSurname}\\b`, 'gi')),
                    reason: 'Apellido sin equipo = bajo riesgo (probablemente OK)'
                });
            }
        }

        // MARCAS COMERCIALES (muy bajo riesgo)
        const brandPatterns = [
            { pattern: /\bNike\b/gi, trigger: 'BRAND_NAME', value: 'Nike', severity: 'LOW' },
            { pattern: /\bAdidas\b/gi, trigger: 'BRAND_NAME', value: 'Adidas', severity: 'LOW' },
            { pattern: /\bPuma\b/gi, trigger: 'BRAND_NAME', value: 'Puma', severity: 'LOW' }
        ];

        for (const { pattern, trigger, value, severity } of brandPatterns) {
            const matches = prompt.match(pattern);
            if (matches) {
                triggers.push({
                    type: trigger,
                    value,
                    severity,
                    occurrences: matches.length,
                    positions: this.findPositions(prompt, pattern),
                    reason: 'Marca comercial - riesgo muy bajo'
                });
            }
        }

        // Filtrar triggers de bajo riesgo si NO hubo error (solo para logging)
        // Mantener triggers CRITICAL y HIGH siempre
        return triggers.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH' || t.severity === 'MEDIUM');
    }

    /**
     * Encontrar posiciones de matches en texto
     */
    findPositions(text, pattern) {
        const positions = [];
        let match;
        const regex = new RegExp(pattern);

        while ((match = regex.exec(text)) !== null) {
            positions.push(match.index);
        }

        return positions;
    }

    /**
     * Generar fixes sugeridos basados en triggers detectados
     *
     * ESTRATEGIA CONSERVADORA V3 (Optimizada Costos + Legal):
     * 1. Intento 1: Solo apellido SIN equipo ("Aspas está a solo 8M...")
     * 2. Intento 2: Apellido + contexto genérico ("Aspas, el delantero del norte...")
     * 3. Intento 3: Rol + geografía ("El capitán del equipo gallego...")
     * 4. Intento 4: Apodos genéricos NO registrados ("El líder de los celestes...")
     * 5. Intento 5: Descripción sin nombres ("Este delantero está a solo 8M...")
     *
     * RAZONES:
     * - Minimizar costos ($0.30 por intento)
     * - Evitar apodos potencialmente registrados como marcas
     * - Progresión de menor a mayor transformación del prompt
     */
    generateFixes(prompt, triggers, errorCategory) {
        const fixes = [];

        // CASO 1: Nombre completo detectado (ej: "Iago Aspas del Celta")
        const fullNameTriggers = triggers.filter(t => t.type === 'PLAYER_FULL_NAME');
        if (fullNameTriggers.length > 0) {
            // FIX 1 (95%): Solo apellido + ELIMINAR equipo completamente
            fixes.push({
                strategy: 'USE_SURNAME_ONLY',
                description: 'Solo apellido SIN mención de equipo (Opción más barata)',
                confidence: 0.95,
                implementation: this.replaceTriggers(prompt, fullNameTriggers, 'surname-no-team'),
                example: '"Iago Aspas del Celta está a 8M" → "Aspas está a 8M"',
                notes: 'Minimiza riesgo y costo - Primera opción SIEMPRE'
            });

            // FIX 2 (90%): Apellido + contexto genérico (NO específico equipo)
            fixes.push({
                strategy: 'SURNAME_GENERIC_CONTEXT',
                description: 'Apellido + contexto genérico ("el delantero", "el capitán")',
                confidence: 0.90,
                implementation: this.replaceTriggers(prompt, fullNameTriggers, 'surname-generic'),
                example: '"Iago Aspas del Celta" → "Aspas, el delantero del norte"',
                notes: 'Mantiene algo de contexto sin mencionar equipo específico'
            });

            // FIX 3 (85%): Rol + geografía genérica
            fixes.push({
                strategy: 'ROLE_GEOGRAPHY_ONLY',
                description: 'Solo rol + geografía (sin apellido ni equipo)',
                confidence: 0.85,
                implementation: this.replaceTriggers(prompt, fullNameTriggers, 'role-geo'),
                example: '"Iago Aspas del Celta" → "El capitán del equipo gallego"',
                notes: 'Elimina completamente nombre específico'
            });

            // FIX 4 (75%): Apodos genéricos culturales (NO registrados)
            fixes.push({
                strategy: 'SAFE_CULTURAL_NICKNAMES',
                description: 'Apodos genéricos culturales NO registrados',
                confidence: 0.75,
                implementation: this.replaceTriggers(prompt, fullNameTriggers, 'safe-nickname'),
                example: '"Iago Aspas del Celta" → "El líder de los celestes"',
                notes: 'Solo apodos genéricos - evita marcas registradas'
            });
        }

        // CASO 2: Apellido + Equipo en mismo contexto (RIESGO COMBINADO)
        const combinedRiskTriggers = triggers.filter(t => t.type === 'CONTEXTUAL_RISK_COMBINED');
        if (combinedRiskTriggers.length > 0) {
            // FIX 1 (95%): ELIMINAR equipo, dejar solo apellido
            fixes.push({
                strategy: 'REMOVE_TEAM_KEEP_SURNAME',
                description: 'Eliminar equipo completamente, mantener solo apellido',
                confidence: 0.95,
                implementation: this.removeTeamKeepSurname(prompt, combinedRiskTriggers[0]),
                example: '"Aspas del Celta está a 8M" → "Aspas está a 8M"',
                notes: 'Opción más barata - elimina riesgo combinado'
            });

            // FIX 2 (90%): Apellido + contexto genérico (sin equipo específico)
            fixes.push({
                strategy: 'SURNAME_SOFT_CONTEXT',
                description: 'Apellido + contexto suave genérico',
                confidence: 0.90,
                implementation: this.surnameWithSoftContext(prompt, combinedRiskTriggers[0]),
                example: '"Aspas del Celta" → "Aspas, el delantero del norte"',
                notes: 'Mantiene apellido pero elimina asociación directa equipo'
            });

            // FIX 3 (80%): Rol + geografía (sin apellido ni equipo)
            fixes.push({
                strategy: 'ROLE_GEO_NO_NAMES',
                description: 'Solo rol y geografía - sin nombres',
                confidence: 0.80,
                implementation: this.roleGeographyOnly(prompt, combinedRiskTriggers[0]),
                example: '"Aspas del Celta" → "El capitán del equipo gallego"',
                notes: 'Elimina completamente apellido y equipo específico'
            });
        }

        // CASO 3: Solo equipo mencionado (sin jugador)
        const teamOnlyTriggers = triggers.filter(
            t => !triggers.some(t2 => t2.type === 'PLAYER_FULL_NAME' || t2.type === 'CONTEXTUAL_RISK_COMBINED')
        );
        if (teamOnlyTriggers.length > 0) {
            fixes.push({
                strategy: 'USE_SAFE_TEAM_NICKNAMES',
                description: 'Apodos genéricos de equipos (NO registrados)',
                confidence: 0.90,
                implementation: this.replaceTriggers(prompt, teamOnlyTriggers, 'safe-team'),
                example: '"Celta" → "los celestes" (genérico cultural)',
                notes: 'Evita marcas registradas como "Submarino Amarillo"'
            });
        }

        // CASO 4: Último recurso - descripción completamente genérica
        if (errorCategory === 'GOOGLE_POLICY_PROMINENT_PEOPLE' || errorCategory === 'VEO3_VALIDATION_ERROR') {
            fixes.push({
                strategy: 'FULLY_GENERIC_DESCRIPTION',
                description: 'Descripción completamente genérica sin nombres',
                confidence: 0.60,
                implementation: this.createFullyGenericPrompt(prompt, triggers),
                example: '"Iago Aspas del Celta a 8M" → "Este delantero está a 8M"',
                notes: 'Último recurso - pierde especificidad pero garantiza bypass'
            });
        }

        // Ordenar por confianza descendente
        return fixes.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Crear versión genérica del prompt sin referencias específicas
     */
    createGenericPrompt(prompt, triggers) {
        let genericPrompt = prompt;

        // Reemplazos genéricos
        const replacements = {
            // Jugadores → "este jugador"
            'Aspas': 'este jugador',
            'Iago Aspas': 'este jugador',
            'Lewa': 'este delantero',
            'Robert Lewandowski': 'este delantero',

            // Equipos → regiones/posiciones
            'del Celta': 'del norte',
            'del Barcelona': 'del este',
            'del Real Madrid': 'del centro',
            'del Atlético': 'de la capital'
        };

        for (const [original, replacement] of Object.entries(replacements)) {
            genericPrompt = genericPrompt.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
        }

        return genericPrompt;
    }

    /**
     * NUEVO V3: Eliminar equipo completamente, mantener solo apellido
     * "Aspas del Celta está a 8M" → "Aspas está a 8M"
     */
    removeTeamKeepSurname(prompt, combinedRiskTrigger) {
        let modifiedPrompt = prompt;
        const playerSurname = combinedRiskTrigger.playerSurname;

        // Eliminar todas las menciones de equipo
        // Patterns: "del Celta", "del Celta de Vigo", "de Vigo", etc.
        const teamRemovalPatterns = [
            /\b(del|de)\s+Celta(\s+de\s+Vigo)?\b/gi,
            /\b(del|de)\s+Barcelona\b/gi,
            /\b(del|de)\s+Real\s+Madrid\b/gi,
            /\b(del|de)\s+Madrid\b/gi,
            /\b(del|de)\s+Atlético\b/gi,
            /\b(del|de)\s+Villarreal\b/gi
        ];

        for (const pattern of teamRemovalPatterns) {
            modifiedPrompt = modifiedPrompt.replace(pattern, '');
        }

        // Limpiar espacios dobles y comas sueltas
        modifiedPrompt = modifiedPrompt.replace(/\s+/g, ' ').replace(/\s,/g, ',').trim();

        return modifiedPrompt;
    }

    /**
     * NUEVO V3: Apellido + contexto genérico suave
     * "Aspas del Celta" → "Aspas, el delantero del norte"
     */
    surnameWithSoftContext(prompt, combinedRiskTrigger) {
        let modifiedPrompt = prompt;
        const playerSurname = combinedRiskTrigger.playerSurname;

        // Contextos genéricos por jugador (sin mencionar equipo específico)
        const softContexts = {
            'Aspas': 'el capitán del norte',
            'Lewandowski': 'el delantero centro-europeo',
            'Vinicius': 'el extremo brasileño'
        };

        const context = softContexts[playerSurname] || 'el jugador';

        // Reemplazar "Apellido del Equipo" → "Apellido, contexto genérico"
        const teamPattern = new RegExp(`\\b${this.escapeRegex(playerSurname)}\\s+(del|de)\\s+[\\w\\s]+`, 'gi');
        modifiedPrompt = modifiedPrompt.replace(teamPattern, `${playerSurname}, ${context}`);

        return modifiedPrompt;
    }

    /**
     * NUEVO V3: Solo rol y geografía - sin nombres
     * "Aspas del Celta" → "El capitán del equipo gallego"
     */
    roleGeographyOnly(prompt, combinedRiskTrigger) {
        let modifiedPrompt = prompt;
        const playerSurname = combinedRiskTrigger.playerSurname;

        // Mapeo jugador → rol + geografía genérica
        const roleGeoMap = {
            'Aspas': 'El capitán del equipo gallego',
            'Lewandowski': 'El delantero del equipo catalán',
            'Vinicius': 'El extremo del equipo madrileño'
        };

        const roleGeo = roleGeoMap[playerSurname] || 'El jugador del equipo';

        // Reemplazar "Apellido del Equipo" → "Rol geografía"
        const playerTeamPattern = new RegExp(`\\b${this.escapeRegex(playerSurname)}\\s+(del|de)\\s+[\\w\\s]+`, 'gi');
        modifiedPrompt = modifiedPrompt.replace(playerTeamPattern, roleGeo);

        return modifiedPrompt;
    }

    /**
     * NUEVO V3: Descripción completamente genérica
     * "Iago Aspas del Celta a 8M" → "Este delantero está a 8M"
     */
    createFullyGenericPrompt(prompt, triggers) {
        let modifiedPrompt = prompt;

        // Reemplazos completamente genéricos
        const genericReplacements = {
            // Jugadores → roles genéricos
            'Iago Aspas': 'este delantero',
            'Aspas': 'este delantero',
            'Robert Lewandowski': 'este delantero',
            'Lewandowski': 'este delantero',
            'Lewa': 'este delantero',
            'Vinicius Junior': 'este extremo',
            'Vinicius': 'este extremo',
            'Vini': 'este extremo',

            // Equipos → genéricos
            'del Celta de Vigo': '',
            'del Celta': '',
            'Celta': 'el equipo',
            'del Barcelona': '',
            'Barcelona': 'el equipo',
            'del Real Madrid': '',
            'Real Madrid': 'el equipo',
            'del Madrid': '',
            'Madrid': 'el equipo'
        };

        for (const [original, replacement] of Object.entries(genericReplacements)) {
            const regex = new RegExp(`\\b${this.escapeRegex(original)}\\b`, 'gi');
            modifiedPrompt = modifiedPrompt.replace(regex, replacement);
        }

        // Limpiar espacios dobles
        return modifiedPrompt.replace(/\s+/g, ' ').trim();
    }

    /**
     * Separar contexto de jugador y equipo
     * "Aspas del Celta" → "Aspas, el capitán de los celestes"
     */
    separatePlayerTeamContext(prompt, combinedRiskTrigger) {
        let modifiedPrompt = prompt;

        const playerSurname = combinedRiskTrigger.playerSurname;
        const teamPattern = new RegExp(combinedRiskTrigger.teamPattern, 'gi');

        // Contextos suaves para equipos
        const softTeamContexts = {
            'Aspas': {
                'Celta': 'el capitán de los celestes',
                'Celta de Vigo': 'el líder del equipo gallego'
            },
            'Lewandowski': {
                'Barcelona': 'el delantero del Barça',
                'FC Barcelona': 'el 9 azulgrana'
            },
            'Vinicius': {
                'Real Madrid': 'el extremo blanco',
                'Madrid': 'el brasileño del Madrid'
            }
        };

        // Reemplazar referencia directa equipo con contexto suave
        const softContext = softTeamContexts[playerSurname];
        if (softContext) {
            // Buscar qué variante de equipo está en el prompt
            for (const [teamName, context] of Object.entries(softContext)) {
                const teamRegex = new RegExp(`\\b${this.escapeRegex(playerSurname)}\\s+(del|de)\\s+${this.escapeRegex(teamName)}\\b`, 'gi');
                modifiedPrompt = modifiedPrompt.replace(teamRegex, `${playerSurname}, ${context}`);
            }
        }

        return modifiedPrompt;
    }

    /**
     * Usar apodo de jugador + contexto suave de equipo
     * "Aspas del Celta" → "El Príncipe de las Bateas del equipo gallego"
     */
    useNicknameWithSoftTeam(prompt, combinedRiskTrigger) {
        let modifiedPrompt = prompt;

        const playerSurname = combinedRiskTrigger.playerSurname;

        // Obtener apodo del jugador
        const playerNickname = getPlayerNickname(playerSurname, 1); // Primer apodo interesante

        // Contextos geográficos suaves
        const softGeoContexts = {
            'Aspas': 'del equipo gallego',
            'Lewandowski': 'del equipo catalán',
            'Vinicius': 'del equipo madrileño'
        };

        const geoContext = softGeoContexts[playerSurname] || 'del equipo';

        // Reemplazar "Apellido del Equipo" → "Apodo del contexto geográfico"
        const playerTeamPattern = new RegExp(`\\b${this.escapeRegex(playerSurname)}\\s+(del|de)\\s+[\\w\\s]+\\b`, 'gi');
        modifiedPrompt = modifiedPrompt.replace(playerTeamPattern, `${playerNickname} ${geoContext}`);

        return modifiedPrompt;
    }

    /**
     * Reemplazar triggers según estrategia usando diccionario de apodos
     */
    replaceTriggers(prompt, triggers, strategy) {
        let modifiedPrompt = prompt;

        for (const trigger of triggers) {
            let replacement;

            switch (strategy) {
                case 'surname-no-team':
                    // NUEVO V3: Apellido solo + ELIMINAR equipo completamente
                    if (trigger.type === 'PLAYER_FULL_NAME') {
                        // "Iago Aspas" → "Aspas"
                        replacement = trigger.surname || trigger.value.split(' ').pop();

                        // ELIMINAR cualquier mención de equipo
                        if (trigger.team) {
                            const teamRemovalPatterns = [
                                new RegExp(`\\b(del|de)\\s+${this.escapeRegex(trigger.team)}(\\s+de\\s+\\w+)?\\b`, 'gi')
                            ];
                            for (const pattern of teamRemovalPatterns) {
                                modifiedPrompt = modifiedPrompt.replace(pattern, '');
                            }
                        }
                    } else {
                        replacement = trigger.value.split(' ').pop();
                    }
                    break;

                case 'surname-generic':
                    // NUEVO V3: Apellido + contexto genérico (NO específico equipo)
                    if (trigger.type === 'PLAYER_FULL_NAME') {
                        replacement = trigger.surname || trigger.value.split(' ').pop();

                        // Cambiar equipo a contexto genérico
                        if (trigger.team) {
                            const genericContexts = {
                                'Celta': ', el delantero del norte',
                                'Barcelona': ', el delantero centro-europeo',
                                'Real Madrid': ', el extremo brasileño'
                            };
                            const teamPattern = new RegExp(`\\b(del|de)\\s+${this.escapeRegex(trigger.team)}\\b`, 'gi');
                            const context = genericContexts[trigger.team] || ', el jugador';
                            modifiedPrompt = modifiedPrompt.replace(teamPattern, context);
                        }
                    } else {
                        replacement = trigger.value.split(' ').pop();
                    }
                    break;

                case 'role-geo':
                    // NUEVO V3: Solo rol + geografía (sin apellido ni equipo)
                    if (trigger.type === 'PLAYER_FULL_NAME') {
                        const roleGeoMap = {
                            'Iago Aspas': 'El capitán del equipo gallego',
                            'Robert Lewandowski': 'El delantero del equipo catalán',
                            'Vinicius Junior': 'El extremo del equipo madrileño'
                        };
                        replacement = roleGeoMap[trigger.value] || 'El jugador del equipo';
                    } else {
                        replacement = 'El jugador';
                    }
                    break;

                case 'safe-nickname':
                    // NUEVO V3: Apodos genéricos culturales (NO registrados)
                    if (trigger.type === 'PLAYER_FULL_NAME') {
                        const safeNicknames = {
                            'Iago Aspas': 'El líder de los celestes',
                            'Robert Lewandowski': 'El goleador azulgrana',
                            'Vinicius Junior': 'El extremo blanco'
                        };
                        replacement = safeNicknames[trigger.value] || 'El jugador';
                    } else {
                        replacement = trigger.value;
                    }
                    break;

                case 'surname-smart':
                    // V2 LEGACY: Apellido solo + cambiar equipo a contexto suave si existe
                    if (trigger.type === 'PLAYER_FULL_NAME') {
                        // "Iago Aspas" → "Aspas"
                        replacement = trigger.surname || trigger.value.split(' ').pop();

                        // Si prompt también tiene equipo, cambiarlo a contexto suave
                        if (trigger.team) {
                            const teamPattern = new RegExp(`\\b(del|de)\\s+${this.escapeRegex(trigger.team)}\\b`, 'gi');
                            modifiedPrompt = modifiedPrompt.replace(teamPattern, (match) => {
                                // "del Celta" → ", el capitán de los celestes"
                                const softContexts = {
                                    'Celta': ', el capitán de los celestes',
                                    'Barcelona': ', el goleador del Barça',
                                    'Real Madrid': ', el crack del Madrid'
                                };
                                return softContexts[trigger.team] || ', del equipo';
                            });
                        }
                    } else {
                        replacement = trigger.value.split(' ').pop();
                    }
                    break;

                case 'surname':
                    // Simple: solo apellido
                    replacement = trigger.surname || trigger.value.split(' ').pop();
                    break;

                case 'nickname':
                    // NUEVO: Usar apodos futbolísticos
                    if (trigger.type === 'PLAYER_FULL_NAME' || trigger.type === 'PLAYER_SURNAME_WITH_CONTEXT') {
                        // Usar variante aleatoria de apodos
                        const variants = getAllPlayerVariants(trigger.value);
                        replacement = variants[Math.floor(Math.random() * variants.length)];
                    } else if (trigger.type === 'TEAM_REFERENCE') {
                        const variants = getAllTeamVariants(trigger.value);
                        replacement = variants[Math.floor(Math.random() * variants.length)];
                    } else {
                        replacement = trigger.value;
                    }
                    break;

                case 'safe-team':
                    // NUEVO V3: Apodos genéricos de equipos (NO registrados)
                    if (trigger.type === 'TEAM_REFERENCE') {
                        const safeTeamNicknames = {
                            'Celta': 'los celestes', // genérico color - NO registrado
                            'Barcelona': 'los azulgranas', // genérico colores - NO registrado
                            'Real Madrid': 'los blancos', // genérico color - NO registrado
                            'Atlético': 'los rojiblancos', // genérico colores - NO registrado
                            'Villarreal': 'el equipo castellonense', // geográfico - evita "Submarino Amarillo"
                            'Valencia': 'los che', // cultural genérico
                            'Sevilla': 'el equipo sevillano' // geográfico
                        };
                        replacement = safeTeamNicknames[trigger.value] || 'el equipo';
                    } else {
                        replacement = trigger.value;
                    }
                    break;

                case 'team-nickname':
                    // V2 LEGACY: Apodos de equipos
                    if (trigger.type === 'TEAM_REFERENCE') {
                        const teamNickname = getTeamNickname(trigger.value, 1);
                        replacement = teamNickname || trigger.value;
                    } else {
                        replacement = trigger.value;
                    }
                    break;

                case 'city':
                    // Usar nombres de ciudades del diccionario
                    if (trigger.type === 'TEAM_REFERENCE') {
                        const teamData = TEAM_NICKNAMES[trigger.value];
                        if (teamData) {
                            replacement = `el equipo de ${teamData.city}`;
                        } else {
                            // Fallback manual
                            const cityMap = {
                                'Celta': 'Vigo',
                                'Barcelona': 'Barcelona',
                                'Real Madrid': 'Madrid',
                                'Atlético': 'Madrid'
                            };
                            replacement = `de ${cityMap[trigger.value] || 'la región'}`;
                        }
                    } else {
                        replacement = trigger.value;
                    }
                    break;

                case 'generic':
                    // Eliminar completamente
                    replacement = '';
                    break;

                default:
                    replacement = trigger.value;
            }

            modifiedPrompt = modifiedPrompt.replace(
                new RegExp(`\\b${this.escapeRegex(trigger.value)}\\b`, 'gi'),
                replacement
            );
        }

        return modifiedPrompt.trim().replace(/\s+/g, ' '); // Limpiar espacios dobles
    }

    /**
     * Escapar caracteres especiales de regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Obtener ejemplo de apodo para jugador
     */
    getExampleNickname(playerName) {
        const variants = getAllPlayerVariants(playerName);
        if (variants.length > 1) {
            return `"${playerName}" → "${variants[1]}"`;
        }
        return `"${playerName}" → "${variants[0]}"`;
    }

    /**
     * Obtener ejemplo de apodo para equipo
     */
    getExampleTeamNickname(teamName) {
        const variants = getAllTeamVariants(teamName);
        if (variants.length > 1) {
            return `"${teamName}" → "${variants[1]}"`;
        }
        return `"${teamName}" → "${variants[0]}"`;
    }

    /**
     * Calcular confianza del análisis
     */
    calculateConfidence(analysis) {
        let confidence = 0.5; // Base

        // Mayor confianza si detectamos triggers conocidos
        if (analysis.likelyTriggers.length > 0) {
            confidence += 0.2;
        }

        // Mayor confianza si tenemos error category específico
        if (analysis.errorCategory && analysis.errorCategory !== 'UNKNOWN') {
            confidence += 0.2;
        }

        // Mayor confianza si tenemos mensaje de error detallado
        if (analysis.errorMessage && analysis.errorMessage !== 'failed') {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Obtener estadísticas de errores
     */
    getErrorStats() {
        const stats = {
            total: this.errorHistory.length,
            byCategory: {},
            byTrigger: {},
            recentErrors: this.errorHistory.slice(-10)
        };

        // Agrupar por categoría
        for (const error of this.errorHistory) {
            stats.byCategory[error.errorCategory] = (stats.byCategory[error.errorCategory] || 0) + 1;

            // Agrupar por trigger
            for (const trigger of error.likelyTriggers) {
                const key = `${trigger.type}:${trigger.value}`;
                stats.byTrigger[key] = (stats.byTrigger[key] || 0) + 1;
            }
        }

        return stats;
    }

    /**
     * Obtener patrones de bloqueo recurrentes
     */
    getBlockingPatterns() {
        const patterns = {};

        for (const error of this.errorHistory) {
            for (const trigger of error.likelyTriggers) {
                const key = trigger.value;
                if (!patterns[key]) {
                    patterns[key] = {
                        value: trigger.value,
                        type: trigger.type,
                        severity: trigger.severity,
                        occurrences: 0,
                        lastSeen: null
                    };
                }
                patterns[key].occurrences++;
                patterns[key].lastSeen = error.timestamp;
            }
        }

        // Ordenar por occurrences
        return Object.values(patterns).sort((a, b) => b.occurrences - a.occurrences);
    }
}

module.exports = VEO3ErrorAnalyzer;
