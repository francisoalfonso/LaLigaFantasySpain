/**
 * Creative Reference Generator
 *
 * Genera referencias creativas y atractivas para jugadores en guiones VEO3
 * Evita nombres bloqueados por Google Content Policy usando alternativas virales
 *
 * Ejemplo: "Vinicius Jr." → ["Vini", "el 7 madridista", "el brasileño", "el extremo del Madrid"]
 */

const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class CreativeReferenceGenerator {
    constructor() {
        this.dictionaryPath = path.join(__dirname, '../../data/player-dictionary.json');
        this.dictionary = this.loadDictionary();

        // Base de conocimiento de apodos populares
        this.popularNicknames = {
            'Vinicius Junior': ['Vini', 'Vinicius Jr', 'el brasileño', 'el 7 madridista', 'el extremo del Madrid'],
            'Vinicius Jr': ['Vini', 'el brasileño', 'el 7 madridista', 'el extremo'],
            'Lamine Yamal': ['Lamine', 'el chaval', 'la joya azulgrana', 'el 19 del Barça', 'el extremo español'],
            'Kylian Mbappé': ['Mbappé', 'Kylian', 'el francés', 'el 9 madridista', 'la estrella francesa'],
            'Robert Lewandowski': ['Lewandowski', 'Lewy', 'el polaco', 'el 9 azulgrana', 'el killer'],
            'Jude Bellingham': ['Bellingham', 'Jude', 'el inglés', 'el 5 madridista', 'el centrocampista'],
            'Pedri': ['Pedri', 'el canario', 'el 8 azulgrana', 'el centrocampista del Barça'],
            'Gavi': ['Gavi', 'el canterano', 'la perla azulgrana', 'el 6 del Barça'],
            'Iago Aspas': ['Aspas', 'el moañés', 'el capitán celeste', 'el 10 del Celta'],
            'Antoine Griezmann': ['Griezmann', 'Grizi', 'el francés', 'el 7 colchonero'],
            'Nico Williams': ['Nico', 'Williams', 'el 11 del Athletic', 'el extremo español'],
            'Rodri': ['Rodri', 'el 16 colchonero', 'el centrocampista'],
            'Alvaro Morata': ['Morata', 'el 9 colchonero', 'el delantero español'],
            'Joselu': ['Joselu', 'el 9', 'el delantero'],
            'Dani Carvajal': ['Carvajal', 'el lateral madridista', 'el 2 del Madrid'],
            'Ferran Torres': ['Ferran', 'Torres', 'el 11 azulgrana', 'el extremo español'],
            'Raphinha': ['Raphinha', 'el brasileño', 'el extremo azulgrana', 'el 11 del Barça'],
            'Jules Koundé': ['Koundé', 'el francés', 'el central azulgrana'],
            'Ronald Araujo': ['Araujo', 'el uruguayo', 'el central azulgrana'],
            'Frenkie de Jong': ['De Jong', 'Frenkie', 'el holandés', 'el centrocampista azulgrana']
        };

        // Mapeo de números de dorsal + equipo
        this.dorsalMapping = {
            'Real Madrid': { 1: 'Courtois', 7: 'Vinicius', 9: 'Mbappé', 5: 'Bellingham', 2: 'Carvajal' },
            'Barcelona': { 1: 'Ter Stegen', 9: 'Lewandowski', 8: 'Pedri', 6: 'Gavi', 19: 'Lamine Yamal' },
            'Atlético Madrid': { 7: 'Griezmann', 9: 'Morata', 16: 'Rodri' },
            'Athletic Club': { 11: 'Nico Williams' }
        };

        // Mapeo de nacionalidades
        this.nationalityMapping = {
            'Vinicius Junior': 'brasileño',
            'Vinicius Jr': 'brasileño',
            'Raphinha': 'brasileño',
            'Kylian Mbappé': 'francés',
            'Antoine Griezmann': 'francés',
            'Jules Koundé': 'francés',
            'Robert Lewandowski': 'polaco',
            'Jude Bellingham': 'inglés',
            'Ronald Araujo': 'uruguayo',
            'Frenkie de Jong': 'holandés',
            'Lamine Yamal': 'español',
            'Nico Williams': 'español',
            'Ferran Torres': 'español',
            'Pedri': 'español',
            'Gavi': 'español'
        };

        // Mapeo de posiciones genéricas
        this.positionMapping = {
            'Goalkeeper': ['el portero', 'el guardameta', 'el cancerbero'],
            'Defender': ['el defensa', 'el central', 'el lateral'],
            'Midfielder': ['el centrocampista', 'el mediocentro', 'el volante'],
            'Attacker': ['el delantero', 'el extremo', 'el ariete', 'el killer']
        };
    }

    loadDictionary() {
        try {
            if (fs.existsSync(this.dictionaryPath)) {
                const data = fs.readFileSync(this.dictionaryPath, 'utf8');
                return JSON.parse(data);
            }
            return { players: {}, teams: {} };
        } catch (error) {
            logger.error('[CreativeReferenceGenerator] Error loading dictionary:', error.message);
            return { players: {}, teams: {} };
        }
    }

    saveDictionary() {
        try {
            fs.writeFileSync(this.dictionaryPath, JSON.stringify(this.dictionary, null, 2));
            logger.info('[CreativeReferenceGenerator] ✅ Diccionario actualizado');
        } catch (error) {
            logger.error('[CreativeReferenceGenerator] Error saving dictionary:', error.message);
        }
    }

    /**
     * Genera referencias creativas para un jugador
     * @param {string} playerName - Nombre completo del jugador
     * @param {object} playerData - Datos adicionales (team, position, etc.)
     * @returns {Array<string>} - Array de referencias creativas
     */
    generateCreativeReferences(playerName, playerData = {}) {
        const { team, position, number } = playerData;

        logger.info(`[CreativeReferenceGenerator] 🎨 Generando referencias para "${playerName}"...`);

        // 1. Verificar si ya existe en diccionario
        if (this.dictionary.players[playerName]) {
            const existing = this.dictionary.players[playerName].safeReferences || [];
            if (existing.length > 0) {
                logger.info(`[CreativeReferenceGenerator] 📖 Usando referencias existentes: ${existing.join(', ')}`);
                return existing;
            }
        }

        const references = new Set();

        // 2. Agregar apellido (siempre seguro)
        const surname = this.extractSurname(playerName);
        references.add(surname);

        // 3. Agregar apodos populares (si existen)
        if (this.popularNicknames[playerName]) {
            this.popularNicknames[playerName].forEach(nick => references.add(nick));
        }

        // 4. Generar referencias basadas en número + equipo
        if (number && team) {
            const teamShortName = this.getTeamShortName(team);
            references.add(`el ${number} ${teamShortName}`);
            references.add(`el ${number}`);
        }

        // 5. Agregar nacionalidad + posición
        if (this.nationalityMapping[playerName] && position) {
            const nationality = this.nationalityMapping[playerName];
            const posRef = this.getPositionReference(position);
            references.add(`el ${posRef} ${nationality}`);
            references.add(`el ${nationality}`);
        }

        // 6. Agregar posición + equipo (sin nombre)
        if (position && team) {
            const teamShortName = this.getTeamShortName(team);
            const posRef = this.getPositionReference(position);
            references.add(`el ${posRef} ${teamShortName}`);
        }

        // 7. Referencias genéricas (fallback)
        references.add('el jugador');
        if (position) {
            const posRef = this.getPositionReference(position);
            references.add(posRef);
        }

        const finalReferences = Array.from(references);
        logger.info(`[CreativeReferenceGenerator] ✅ ${finalReferences.length} referencias generadas:`);
        logger.info(`   ${finalReferences.join(', ')}`);

        return finalReferences;
    }

    /**
     * Actualiza o crea entrada en el diccionario para un jugador
     * @param {string} playerName - Nombre completo
     * @param {object} playerData - Datos del jugador
     */
    updatePlayerInDictionary(playerName, playerData = {}) {
        const { team, position, number } = playerData;

        // Generar referencias creativas
        const creativeRefs = this.generateCreativeReferences(playerName, playerData);

        // Crear o actualizar entrada
        if (!this.dictionary.players[playerName]) {
            this.dictionary.players[playerName] = {
                surname: this.extractSurname(playerName),
                team: team || null,
                position: position || null,
                number: number || null,
                safeReferences: creativeRefs,
                avoidCombinations: this.generateAvoidCombinations(playerName, team),
                registeredNicknames: this.popularNicknames[playerName] || [],
                safeNicknames: creativeRefs.filter(ref => ref !== 'el jugador'),
                testedSuccessRate: 0,
                lastTested: null,
                totalVideos: 0,
                addedAt: new Date().toISOString()
            };

            logger.info(`[CreativeReferenceGenerator] 📝 Nueva entrada creada para "${playerName}"`);
        } else {
            // Actualizar referencias si hay nuevas
            const current = this.dictionary.players[playerName].safeReferences || [];
            const merged = Array.from(new Set([...current, ...creativeRefs]));

            this.dictionary.players[playerName].safeReferences = merged;
            this.dictionary.players[playerName].safeNicknames = merged.filter(ref => ref !== 'el jugador');

            logger.info(`[CreativeReferenceGenerator] 🔄 Entrada actualizada para "${playerName}"`);
        }

        // Guardar diccionario
        this.saveDictionary();

        return this.dictionary.players[playerName];
    }

    /**
     * Obtiene referencia aleatoria creativa (no genérica)
     * @param {string} playerName - Nombre del jugador
     * @param {object} playerData - Datos adicionales
     * @param {object} options - Opciones de selección
     * @returns {string} - Referencia creativa seleccionada
     */
    getCreativeReference(playerName, playerData = {}, options = {}) {
        const { avoidGeneric = true, preferNickname = true } = options;

        // Asegurar que existe en diccionario
        if (!this.dictionary.players[playerName]) {
            this.updatePlayerInDictionary(playerName, playerData);
        }

        const player = this.dictionary.players[playerName];
        let references = player.safeReferences || [];

        // Filtrar genéricas si se solicita
        if (avoidGeneric) {
            const filtered = references.filter(ref =>
                ref !== 'el jugador' &&
                ref !== 'el delantero' &&
                ref !== 'el centrocampista' &&
                ref !== 'el defensa' &&
                ref !== 'el portero'
            );

            if (filtered.length > 0) {
                references = filtered;
            }
        }

        // Preferir apodos si se solicita
        if (preferNickname && player.safeNicknames && player.safeNicknames.length > 0) {
            references = player.safeNicknames;
        }

        // Seleccionar aleatoriamente
        const selected = references[Math.floor(Math.random() * references.length)];

        logger.info(`[CreativeReferenceGenerator] 🎲 Referencia seleccionada: "${selected}"`);

        return selected;
    }

    /**
     * Extrae apellido del nombre completo
     */
    extractSurname(fullName) {
        if (!fullName) return 'el jugador';
        const parts = fullName.trim().split(' ');
        return parts[parts.length - 1];
    }

    /**
     * Obtiene referencia de posición
     */
    getPositionReference(position) {
        const posMap = {
            'Goalkeeper': 'portero',
            'Defender': 'defensa',
            'Midfielder': 'centrocampista',
            'Attacker': 'delantero'
        };
        return posMap[position] || 'jugador';
    }

    /**
     * Obtiene nombre corto del equipo
     */
    getTeamShortName(team) {
        const shortNames = {
            'Real Madrid': 'madridista',
            'Barcelona': 'azulgrana',
            'Atlético Madrid': 'colchonero',
            'Athletic Club': 'del Athletic',
            'Celta de Vigo': 'celeste',
            'Sevilla': 'del Sevilla',
            'Valencia': 'del Valencia',
            'Real Sociedad': 'txuri-urdin',
            'Real Betis': 'del Betis',
            'Villarreal': 'del Villarreal'
        };
        return shortNames[team] || `del ${team}`;
    }

    /**
     * Genera combinaciones a evitar
     */
    generateAvoidCombinations(playerName, team) {
        if (!team) return [];

        const surname = this.extractSurname(playerName);
        return [
            `${surname} del ${team}`,
            `${surname} ${team}`,
            `${playerName} del ${team}`,
            `${playerName} ${team}`
        ];
    }

    /**
     * Analiza un guión y sugiere mejoras con referencias creativas
     * @param {string} script - Guión original
     * @param {string} playerName - Nombre del jugador mencionado
     * @param {object} playerData - Datos del jugador
     * @returns {string} - Guión mejorado
     */
    enrichScriptWithCreativeReferences(script, playerName, playerData = {}) {
        logger.info('[CreativeReferenceGenerator] 📝 Enriqueciendo guión con referencias creativas...');

        // Asegurar entrada en diccionario
        if (!this.dictionary.players[playerName]) {
            this.updatePlayerInDictionary(playerName, playerData);
        }

        let enriched = script;

        // Reemplazar primera mención con referencia creativa
        const firstMentionRegex = new RegExp(`\\b${this.escapeRegex(playerName)}\\b`, 'i');
        const creativeRef = this.getCreativeReference(playerName, playerData, {
            avoidGeneric: true,
            preferNickname: true
        });

        enriched = enriched.replace(firstMentionRegex, creativeRef);

        // Reemplazar menciones subsecuentes con variedad
        const surname = this.extractSurname(playerName);
        const surnameRegex = new RegExp(`\\b${this.escapeRegex(surname)}\\b`, 'g');
        const alternativeRef = this.getCreativeReference(playerName, playerData, {
            avoidGeneric: true
        });

        let count = 0;
        enriched = enriched.replace(surnameRegex, (match) => {
            count++;
            // Alternar entre referencias
            return count % 2 === 0 ? alternativeRef : match;
        });

        logger.info('[CreativeReferenceGenerator] ✅ Guión enriquecido con referencias creativas');

        return enriched;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = CreativeReferenceGenerator;
