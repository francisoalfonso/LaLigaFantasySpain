const logger = require('../../utils/logger');

/**
 * Constructor de prompts VEO3 para Stats Cards
 * Genera videos de gráficos y estadísticas impactantes estilo NBA/Bleacher Report
 */

class StatsCardPromptBuilder {
    constructor() {
        // Estilos visuales basados en referencias deportivas
        this.visualStyles = {
            nba_modern: {
                colors: ['electric blue', 'neon purple', 'vibrant orange'],
                animation: 'dynamic numbers counting up',
                layout: 'split screen with player photo left, stats right'
            },
            bleacher_report: {
                colors: ['bold yellow', 'black', 'white'],
                animation: 'stats bars growing, pulse effects',
                layout: 'center player photo with floating stat bubbles'
            },
            espn_clean: {
                colors: ['red accent', 'dark gray', 'white'],
                animation: 'clean slide-in stats, minimal motion',
                layout: 'player photo background, stats overlay bottom third'
            },
            fantasy_premium: {
                colors: ['fantasy green #00ff88', 'dark purple #1a0033', 'gold accents'],
                animation: 'glowing stats, particle effects, value indicators',
                layout: 'hexagonal player frame, circular stats rings, price tag prominent'
            }
        };

        // Tipos de datos que podemos mostrar
        this.dataTypes = {
            price: { label: 'PRECIO', unit: '€', emphasis: 'high' },
            goals: { label: 'GOLES', unit: '', emphasis: 'high' },
            assists: { label: 'ASISTENCIAS', unit: '', emphasis: 'medium' },
            rating: { label: 'RATING', unit: '/10', emphasis: 'medium' },
            minutes: { label: 'MINUTOS', unit: "'", emphasis: 'low' },
            games: { label: 'PARTIDOS', unit: '', emphasis: 'low' },
            valueRatio: { label: 'VALOR FANTASY', unit: 'x', emphasis: 'high' },
            probability: { label: 'PROB. PUNTOS', unit: '%', emphasis: 'high' },
            cleanSheets: { label: 'PORTERÍA CERO', unit: '', emphasis: 'high' },
            saves: { label: 'PARADAS', unit: '', emphasis: 'medium' }
        };
    }

    /**
     * Construir prompt para video de stats card
     * @param {object} playerData - Datos del jugador
     * @param {object} options - Opciones de estilo
     * @returns {object} - Prompt y metadata
     */
    buildStatsCardPrompt(playerData, options = {}) {
        const {
            style = 'fantasy_premium',
            duration = 8,
            emphasizeStats = ['price', 'goals', 'valueRatio'],
            includeTeamLogo = true,
            animationIntensity = 'high'
        } = options;

        const visualStyle = this.visualStyles[style];

        // Construir descripción visual del segmento
        const prompt = this._buildVisualDescription(playerData, visualStyle, {
            emphasizeStats,
            includeTeamLogo,
            animationIntensity,
            duration
        });

        // Generar metadata
        const metadata = {
            type: 'stats_card',
            style,
            duration,
            playerName: playerData.name,
            teamName: playerData.team,
            statsShown: emphasizeStats,
            visualComplexity: this._calculateComplexity(emphasizeStats.length, animationIntensity)
        };

        logger.info(`[StatsCardPromptBuilder] Stats card prompt generado para ${playerData.name}`);
        logger.info(`[StatsCardPromptBuilder] Estilo: ${style}, Duración: ${duration}s, Stats: ${emphasizeStats.length}`);

        return {
            prompt,
            metadata,
            textOverlays: this._generateTextOverlays(playerData, emphasizeStats)
        };
    }

    /**
     * Construir descripción visual detallada para VEO3
     * @private
     */
    _buildVisualDescription(playerData, visualStyle, options) {
        const { emphasizeStats, includeTeamLogo, animationIntensity, duration } = options;

        // Componentes visuales
        const components = [];

        // 1. Background y atmósfera
        components.push(this._buildBackgroundDescription(visualStyle, playerData.team));

        // 2. Player photo (si disponible)
        if (playerData.photo) {
            components.push(this._buildPlayerPhotoDescription(playerData, visualStyle));
        }

        // 3. Team logo (si se solicita)
        if (includeTeamLogo && playerData.teamLogo) {
            components.push(this._buildTeamLogoDescription(playerData.team, visualStyle));
        }

        // 4. Stats principales con animaciones
        components.push(this._buildStatsDescription(playerData, emphasizeStats, visualStyle, animationIntensity));

        // 5. Efectos especiales y motion
        components.push(this._buildMotionEffectsDescription(animationIntensity, duration));

        // Combinar todo en un prompt coherente
        const fullPrompt = `Professional sports statistics motion graphic video. ${components.join(' ')} Duration: ${duration} seconds. High-energy presentation with smooth transitions. Broadcast quality graphics similar to ESPN, NBA, Bleacher Report style.`;

        // VEO3 tiene límite ~500 caracteres, simplificar si es muy largo
        if (fullPrompt.length > 500) {
            return this._simplifyPrompt(components, duration, visualStyle);
        }

        return fullPrompt;
    }

    /**
     * Background y atmósfera
     * @private
     */
    _buildBackgroundDescription(visualStyle, teamName) {
        const colors = visualStyle.colors.join(', ');
        return `Dynamic background with ${colors} gradient. Modern sports broadcast aesthetic. Team colors incorporated subtly.`;
    }

    /**
     * Player photo description
     * @private
     */
    _buildPlayerPhotoDescription(playerData, visualStyle) {
        return `${playerData.name} official photo prominently displayed in ${visualStyle.layout}. Professional lighting with glow effects.`;
    }

    /**
     * Team logo description
     * @private
     */
    _buildTeamLogoDescription(teamName, visualStyle) {
        return `${teamName} team logo visible in corner, animated entrance.`;
    }

    /**
     * Stats description con énfasis
     * @private
     */
    _buildStatsDescription(playerData, emphasizeStats, visualStyle, intensity) {
        const statsText = emphasizeStats.map(statKey => {
            const statInfo = this.dataTypes[statKey];
            const value = playerData[statKey];
            return `${statInfo.label}: ${value}${statInfo.unit}`;
        }).join(', ');

        const animationDesc = intensity === 'high'
            ? 'Numbers counting up rapidly, glowing highlights, pulse effects'
            : 'Smooth fade-in, subtle highlights';

        return `Key statistics displayed: ${statsText}. ${animationDesc}. ${visualStyle.animation}.`;
    }

    /**
     * Motion effects description
     * @private
     */
    _buildMotionEffectsDescription(intensity, duration) {
        if (intensity === 'high') {
            return `Particle effects, light rays, dynamic camera zoom. Energy level: maximum. All animations complete within ${duration} seconds.`;
        } else if (intensity === 'medium') {
            return `Smooth transitions, subtle glow effects. Professional broadcast style.`;
        } else {
            return `Minimal motion, clean presentation.`;
        }
    }

    /**
     * Simplificar prompt si es muy largo
     * @private
     */
    _simplifyPrompt(components, duration, visualStyle) {
        // Versión simplificada manteniendo elementos clave
        return `Sports stats graphic. ${visualStyle.colors[0]} and ${visualStyle.colors[1]} colors. Player photo center. Key statistics animated. ${visualStyle.animation}. ${duration} seconds. Broadcast quality.`;
    }

    /**
     * Generar overlays de texto para post-producción FFmpeg
     * @private
     */
    _generateTextOverlays(playerData, emphasizeStats) {
        return emphasizeStats.map((statKey, index) => {
            const statInfo = this.dataTypes[statKey];
            const value = playerData[statKey];

            return {
                text: `${statInfo.label}: ${value}${statInfo.unit}`,
                position: this._calculateStatPosition(index, emphasizeStats.length),
                style: {
                    fontSize: statInfo.emphasis === 'high' ? 72 : 48,
                    fontWeight: 'bold',
                    color: statInfo.emphasis === 'high' ? '#00ff88' : '#ffffff',
                    shadowColor: '#000000',
                    shadowBlur: 10
                },
                timing: {
                    start: 1 + (index * 0.5), // Aparición escalonada
                    end: 7.5
                },
                animation: {
                    entrance: 'slide_from_right',
                    emphasis: statInfo.emphasis === 'high' ? 'pulse' : 'none'
                }
            };
        });
    }

    /**
     * Calcular posición de stat en pantalla
     * @private
     */
    _calculateStatPosition(index, total) {
        // Distribución vertical equidistante
        const verticalSpacing = 1080 / (total + 1);
        return {
            x: 1200, // Lado derecho
            y: verticalSpacing * (index + 1)
        };
    }

    /**
     * Calcular complejidad visual
     * @private
     */
    _calculateComplexity(statCount, intensity) {
        const baseComplexity = statCount * 10;
        const intensityMultiplier = {
            'low': 1,
            'medium': 1.5,
            'high': 2
        };
        return baseComplexity * intensityMultiplier[intensity];
    }

    /**
     * Prompt para segmento stats en estructura 3-video
     * Optimizado para concatenación con segmentos de Ana
     * @param {object} playerData - Datos del jugador
     * @param {object} cholloContext - Contexto del chollo (por qué es bueno)
     * @param {object} options - Opciones
     * @returns {object} - Prompt y metadata
     */
    buildCholloStatsSegment(playerData, cholloContext, options = {}) {
        // Stats más relevantes para chollos
        const cholloStats = ['price', 'valueRatio', 'goals', 'probability'];

        const result = this.buildStatsCardPrompt(playerData, {
            style: 'fantasy_premium',
            duration: 6, // Segmento medio más corto para video total <20s
            emphasizeStats: cholloStats,
            includeTeamLogo: true,
            animationIntensity: 'high',
            ...options
        });

        // Agregar contexto de por qué es chollo
        result.cholloContext = {
            reason: cholloContext.reason || 'Precio bajo + Alto potencial',
            valueProposition: cholloContext.valueProposition || `${playerData.valueRatio}x valor vs precio`,
            urgency: cholloContext.urgency || 'Precio puede subir pronto'
        };

        return result;
    }

    /**
     * Validar que datos del jugador están completos
     * @param {object} playerData - Datos del jugador
     * @returns {object} - Resultado de validación
     */
    validatePlayerData(playerData) {
        const required = ['name', 'team', 'price'];
        const recommended = ['photo', 'teamLogo', 'goals', 'rating'];

        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check campos requeridos
        required.forEach(field => {
            if (!playerData[field]) {
                validation.errors.push(`Campo requerido faltante: ${field}`);
                validation.valid = false;
            }
        });

        // Check campos recomendados
        recommended.forEach(field => {
            if (!playerData[field]) {
                validation.warnings.push(`Campo recomendado faltante: ${field} - Card será menos impactante`);
            }
        });

        return validation;
    }
}

module.exports = StatsCardPromptBuilder;