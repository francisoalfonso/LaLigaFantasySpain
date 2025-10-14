/**
 * YouTube Tags Optimization
 *
 * Keywords estratégicos para maximizar discoverability y SEO
 * Máximo: 500 caracteres total
 */

module.exports = {
    // Tags base (siempre incluir)
    BASE_TAGS: [
        'fantasy la liga',
        'fantasy laliga',
        'laliga fantasy',
        'fantasy football',
        'fantasy españa'
    ],

    // Tags por tipo de contenido
    CHOLLO_TAGS: [
        'chollo fantasy',
        'chollos fantasy la liga',
        'jugadores baratos fantasy',
        'mejores chollos fantasy',
        'fichajes baratos',
        'fantasy tips',
        'consejos fantasy'
    ],

    // Tags de temporada
    SEASON_TAGS: [
        'fantasy la liga 2025',
        'fantasy laliga 2025-26',
        'laliga2526',
        'temporada 2025-26'
    ],

    // Tags por posición
    POSITION_TAGS: {
        DEF: [
            'defensas fantasy',
            'mejores defensas fantasy',
            'defensas baratos'
        ],
        MID: [
            'centrocampistas fantasy',
            'mejores medios fantasy',
            'medios baratos'
        ],
        FWD: [
            'delanteros fantasy',
            'mejores delanteros fantasy',
            'delanteros baratos'
        ],
        GK: [
            'porteros fantasy',
            'mejores porteros fantasy',
            'porteros baratos'
        ]
    },

    // Tags de equipos principales
    TEAM_TAGS: {
        'Real Madrid': ['real madrid fantasy', 'jugadores real madrid'],
        'Barcelona': ['barcelona fantasy', 'jugadores barcelona', 'barca fantasy'],
        'Atlético Madrid': ['atletico fantasy', 'atleti fantasy'],
        'Girona': ['girona fantasy', 'jugadores girona'],
        'Athletic Club': ['athletic fantasy', 'athletic bilbao'],
        'Real Sociedad': ['real sociedad fantasy'],
        'Villarreal': ['villarreal fantasy'],
        'Betis': ['betis fantasy', 'real betis'],
        'Valencia': ['valencia fantasy'],
        'Sevilla': ['sevilla fantasy']
    },

    // Tags de competidores (capturar tráfico)
    COMPETITOR_TAGS: [
        'biwenger',
        'comunio',
        'fantasy marca',
        'mister fantasy',
        'futmondo'
    ],

    // Tags long-tail (baja competencia, alta conversión)
    LONG_TAIL_TAGS: [
        'como jugar fantasy la liga',
        'estrategia fantasy la liga',
        'ratio fantasy la liga',
        'puntos fantasy la liga',
        'fichajes jornada fantasy'
    ],

    /**
     * Generar tags para un chollo específico
     *
     * @param {Object} player - Datos del jugador
     * @param {string} player.name - Nombre del jugador
     * @param {string} player.team - Equipo
     * @param {string} player.position - Posición
     * @param {number} player.price - Precio
     * @param {number} player.ratio - Ratio valor
     * @returns {string[]} Array de tags (max 500 caracteres)
     */
    generateCholloTags(player) {
        const tags = [
            ...this.BASE_TAGS,
            ...this.CHOLLO_TAGS,
            ...this.SEASON_TAGS,
            ...this.POSITION_TAGS[player.position] || [],
            ...this.TEAM_TAGS[player.team] || [],
            ...this.COMPETITOR_TAGS,

            // Tags específicos del jugador
            player.name.toLowerCase().replace('.', ''),
            `${player.name.toLowerCase()} fantasy`,
            `${player.team.toLowerCase()} fantasy`,

            // Tags de valor
            `ratio ${Math.round(player.ratio)}x`,
            player.price < 5 ? 'jugador barato' : 'buen precio'
        ];

        // Limitar a 500 caracteres
        return this._limitToMaxLength(tags, 500);
    },

    /**
     * Limitar tags a máximo de caracteres
     * @private
     */
    _limitToMaxLength(tags, maxLength) {
        const uniqueTags = [...new Set(tags)]; // Eliminar duplicados
        let result = [];
        let totalLength = 0;

        for (const tag of uniqueTags) {
            const tagLength = tag.length + 1; // +1 por la coma
            if (totalLength + tagLength <= maxLength) {
                result.push(tag);
                totalLength += tagLength;
            } else {
                break;
            }
        }

        return result;
    }
};
