/**
 * YouTube Shorts Generator
 *
 * Servicio principal para optimizar videos VEO3 específicamente para YouTube Shorts.
 * Incluye ajustes de duración, formato vertical, hooks optimizados, y configuración
 * específica para el algoritmo de Shorts 2025.
 *
 * Basado en: docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md
 */

const logger = require('../../utils/logger');
const { YOUTUBE_SHORTS } = require('../../config/constants');

/**
 * CONFIGURACIÓN OPTIMIZADA YOUTUBE SHORTS 2025
 */
const SHORTS_CONFIG = {
    // Duración óptima por tipo de contenido
    DURATION: {
        chollo_viral: { min: 20, optimal: 25, max: 30 },
        breaking_news: { min: 15, optimal: 20, max: 25 },
        stats_impactantes: { min: 25, optimal: 35, max: 40 },
        prediccion_jornada: { min: 40, optimal: 50, max: 60 }
    },

    // Formato video
    FORMAT: {
        aspectRatio: '9:16', // Vertical obligatorio
        resolution: '1080x1920', // Full HD vertical
        fps: 30,
        codec: 'h264',
        bitrate: '8M'
    },

    // Posicionamiento watermark para Shorts
    WATERMARK: {
        position: 'top-left', // No interferir con UI de Shorts
        size: '80x80',
        opacity: 0.7
    },

    // Audio optimizado para Shorts
    AUDIO: {
        volumeBoost: 1.2, // +20% para móvil
        normalization: true,
        peakLevel: -2.0 // dB
    },

    // Configuración voice para máxima retención
    VOICE: {
        pace: 'fast', // 10% más rápido para Shorts
        energy: 'high', // Energía alta para engagement
        emphasis: 'strong' // Énfasis fuerte en palabras clave
    },

    // Estructura hooks por tipo
    HOOKS: {
        chollo_viral: {
            type: 'conspiratorial',
            maxWords: 12,
            duration: 2.0,
            examples: [
                'Pssst... misters, esto NO puede salir...',
                '¡ALERTA! Descubierto el chollo del año...',
                'Si no ficha ESTO hoy, pierdes 50 puntos...'
            ]
        },
        breaking_news: {
            type: 'urgent',
            maxWords: 10,
            duration: 1.5,
            examples: [
                '🚨 ÚLTIMA HORA: Lesión confirmada...',
                '¡BOMBAZO! Cambio de alineación ahora...',
                'ATENCIÓN: Sube de precio en 2 horas...'
            ]
        },
        stats_impactantes: {
            type: 'shock',
            maxWords: 15,
            duration: 2.5,
            examples: [
                'Este dato de Lewandowski te va a EXPLOTAR la cabeza...',
                'Nadie se ha dado cuenta de ESTO sobre Pedri...',
                'La estadística más LOCA de La Liga este año...'
            ]
        },
        prediccion_jornada: {
            type: 'authoritative',
            maxWords: 18,
            duration: 3.0,
            examples: [
                'Tengo 3 predicciones para esta jornada... y la tercera es POLÉMICA...',
                'Voy a decirte EXACTAMENTE qué va a pasar este fin de semana...',
                'Llevo 15 jornadas acertando... esta es mi apuesta más segura...'
            ]
        }
    },

    // KPIs target por tipo de contenido
    KPIS: {
        chollo_viral: {
            retention: 0.80, // 80% retención mínima
            avgViewDuration: 22, // segundos
            engagement: 0.06, // 6% engagement rate
            viewed_vs_swiped: 0.85 // 85% viewed
        },
        breaking_news: {
            retention: 0.85,
            avgViewDuration: 18,
            engagement: 0.08,
            viewed_vs_swiped: 0.90
        },
        stats_impactantes: {
            retention: 0.75,
            avgViewDuration: 28,
            engagement: 0.05,
            viewed_vs_swiped: 0.80
        },
        prediccion_jornada: {
            retention: 0.70,
            avgViewDuration: 42,
            engagement: 0.07,
            viewed_vs_swiped: 0.75
        }
    }
};

class ShortsGenerator {
    constructor() {
        this.config = SHORTS_CONFIG;
        logger.info('✅ ShortsGenerator inicializado con configuración optimizada 2025');
    }

    /**
     * Genera un Short optimizado a partir de datos de contenido
     * @param {Object} contentData - Datos del contenido (jugador, tipo, etc.)
     * @param {String} contentType - Tipo: chollo_viral, breaking_news, stats_impactantes, prediccion_jornada
     * @returns {Object} Configuración VEO3 optimizada para Shorts
     */
    generateShort(contentData, contentType) {
        logger.info(`📱 Generando Short optimizado: ${contentType}`);

        try {
            // Validar tipo de contenido
            if (!this.config.DURATION[contentType]) {
                throw new Error(`Tipo de contenido inválido: ${contentType}`);
            }

            // Construir estructura del Short
            const shortConfig = {
                // Metadata básica
                contentType,
                contentData,
                timestamp: new Date().toISOString(),

                // Hook optimizado (primeros 2 segundos CRÍTICOS)
                hook: this.generateHook(contentType, contentData),

                // Segmentos VEO3 con timing optimizado
                segments: this.buildSegments(contentType, contentData),

                // Configuración VEO3
                veo3Config: this.buildVEO3Config(contentType),

                // Configuración de subtítulos (CRÍTICO - 85% sin audio)
                captions: {
                    enabled: true,
                    style: 'karaoke', // Word-by-word highlighting
                    position: 'center',
                    fontSize: 'large',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    wordHighlight: '#FFD700' // Dorado para palabra actual
                },

                // Text overlays para datos clave
                textOverlays: this.generateTextOverlays(contentType, contentData),

                // Metadata para YouTube
                youtube: {
                    title: this.generateTitle(contentType, contentData),
                    description: this.generateDescription(contentType, contentData),
                    tags: this.generateTags(contentType, contentData),
                    category: 17, // Sports
                    defaultLanguage: 'es',
                    defaultAudioLanguage: 'es-ES'
                },

                // KPIs target
                targetKPIs: this.config.KPIS[contentType]
            };

            logger.info(`✅ Short optimizado generado para: ${contentType}`);
            return shortConfig;
        } catch (error) {
            logger.error('❌ Error generando Short:', error);
            throw error;
        }
    }

    /**
     * Genera hook optimizado para primeros 2 segundos (CRÍTICO)
     */
    generateHook(contentType, contentData) {
        const hookConfig = this.config.HOOKS[contentType];

        let hookText = '';

        switch (contentType) {
            case 'chollo_viral':
                hookText = `Pssst... ${contentData.playerName} a ${contentData.price}M es ROBO`;
                break;
            case 'breaking_news':
                hookText = `🚨 ÚLTIMA HORA: ${contentData.playerName} ${contentData.news}`;
                break;
            case 'stats_impactantes':
                hookText = `${contentData.playerName}: ${contentData.stat} que NADIE ha visto`;
                break;
            case 'prediccion_jornada':
                hookText = `Jornada ${contentData.gameweek}: 3 apuestas y la tercera es POLÉMICA`;
                break;
        }

        return {
            text: hookText,
            duration: hookConfig.duration,
            type: hookConfig.type,
            maxWords: hookConfig.maxWords,
            // Configuración visual del hook
            visual: {
                cameraMovement: 'push-in', // Dolly hacia Ana
                expression: 'conspiratorial',
                energy: 'very-high',
                gesture: 'finger-to-lips-secret'
            }
        };
    }

    /**
     * Construye segmentos VEO3 con timing optimizado para Shorts
     */
    buildSegments(contentType, contentData) {
        const duration = this.config.DURATION[contentType];

        switch (contentType) {
            case 'chollo_viral':
                return [
                    {
                        name: 'Hook',
                        duration: 2,
                        dialogue: this.generateHook(contentType, contentData).text,
                        behavior: 'Susurro conspirativo, dedo en labios, mirada cómplice',
                        cinematography: 'Push-in rápido, iluminación cálida low-key'
                    },
                    {
                        name: 'Revelación',
                        duration: 12,
                        dialogue: this.generateRevelacion(contentData),
                        behavior: 'Intensidad creciente, gestos enfáticos con manos',
                        cinematography: 'Medium shot estático, gráficos stats overlay'
                    },
                    {
                        name: 'CTA Urgente',
                        duration: 6,
                        dialogue: `¡Fichalo YA antes que suba! Link en bio para más chollos.`,
                        behavior: 'Urgencia, señalar con dedo, sonrisa confiada',
                        cinematography: 'Tight close-up, energía alta'
                    }
                ];

            case 'breaking_news':
                return [
                    {
                        name: 'Alerta',
                        duration: 2,
                        dialogue: this.generateHook(contentType, contentData).text,
                        behavior: 'Urgencia máxima, ojos muy abiertos, gesto STOP con mano',
                        cinematography: 'Tight close-up inmediato, iluminación high-key urgente'
                    },
                    {
                        name: 'Desarrollo',
                        duration: 10,
                        dialogue: this.generateDesarrollo(contentData),
                        behavior: 'Profesional autoritaria, gestos precisos',
                        cinematography: 'Medium shot con gráficos breaking news'
                    },
                    {
                        name: 'Acción',
                        duration: 6,
                        dialogue: `¡Actúa AHORA! Sígueme para no perderte ninguna alerta.`,
                        behavior: 'Confianza, señalar cámara, gesto urgente',
                        cinematography: 'Push-in final, energía muy alta'
                    }
                ];

            case 'stats_impactantes':
                return [
                    {
                        name: 'Hook Shock',
                        duration: 3,
                        dialogue: this.generateHook(contentType, contentData).text,
                        behavior: 'Sorpresa genuina, cejas levantadas, gesto "wow"',
                        cinematography: 'Medium shot, iluminación cool tech'
                    },
                    {
                        name: 'Análisis Datos',
                        duration: 20,
                        dialogue: this.generateAnalisisDatos(contentData),
                        behavior: 'Analítica concentrada, gestos explicativos',
                        cinematography: 'Static con overlays gráficos dinámicos'
                    },
                    {
                        name: 'Conclusión',
                        duration: 10,
                        dialogue: `Por eso ${contentData.playerName} es mi apuesta TOP. ¿Tú qué opinas?`,
                        behavior: 'Confianza, sonrisa, gesto invitación a comentar',
                        cinematography: 'Medium shot, iluminación profesional'
                    }
                ];

            case 'prediccion_jornada':
                return [
                    {
                        name: 'Hook Autoridad',
                        duration: 3,
                        dialogue: this.generateHook(contentType, contentData).text,
                        behavior: 'Confianza profesional, gesto 3 dedos',
                        cinematography: 'Medium shot, iluminación profesional broadcast'
                    },
                    {
                        name: 'Apuesta 1',
                        duration: 12,
                        dialogue: `Primera: ${contentData.prediction1}`,
                        behavior: 'Seguridad, gesto 1 dedo, explicación pausada',
                        cinematography: 'Static con overlay stats jugador'
                    },
                    {
                        name: 'Apuesta 2',
                        duration: 12,
                        dialogue: `Segunda: ${contentData.prediction2}`,
                        behavior: 'Convicción creciente, gesto 2 dedos',
                        cinematography: 'Static con overlay stats equipo'
                    },
                    {
                        name: 'Apuesta 3 + CTA',
                        duration: 15,
                        dialogue: `Y la tercera... ${contentData.prediction3}. ¡A por esos puntos! Sígueme para más.`,
                        behavior: 'Revelación dramática, sonrisa pícara, señalar cámara',
                        cinematography: 'Push-in dramático, energía muy alta'
                    }
                ];

            default:
                throw new Error(`Tipo de contenido no soportado: ${contentType}`);
        }
    }

    /**
     * Construye configuración VEO3 optimizada para Shorts
     */
    buildVEO3Config(contentType) {
        const duration = this.config.DURATION[contentType];

        return {
            model: 'veo3_fast',
            aspectRatio: this.config.FORMAT.aspectRatio,
            seed: 30001, // Ana consistencia
            voice: {
                locale: 'es-ES',
                gender: 'female',
                style: 'professional',
                pace: this.config.VOICE.pace, // fast para Shorts
                energy: this.config.VOICE.energy, // high
                emphasis: this.config.VOICE.emphasis // strong
            },
            waterMark: 'Fantasy La Liga Pro',
            watermarkPosition: this.config.WATERMARK.position,
            watermarkOpacity: this.config.WATERMARK.opacity,
            imageUrls: [
                'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/base/Ana-001.jpeg'
            ],
            referenceImageWeight: 1.0,
            characterConsistency: true,
            targetDuration: duration.optimal,
            minDuration: duration.min,
            maxDuration: duration.max
        };
    }

    /**
     * Genera text overlays dinámicos para datos clave
     */
    generateTextOverlays(contentType, contentData) {
        const overlays = [];

        switch (contentType) {
            case 'chollo_viral':
                overlays.push({
                    text: `💰 ${contentData.price}M`,
                    position: 'top-right',
                    duration: 'full',
                    style: 'large-bold',
                    color: '#00FF00'
                });
                overlays.push({
                    text: `📈 Valor: ${contentData.valueRatio}x`,
                    position: 'bottom-left',
                    startTime: 5,
                    duration: 8,
                    style: 'medium',
                    color: '#FFD700'
                });
                break;

            case 'breaking_news':
                overlays.push({
                    text: '🚨 ÚLTIMA HORA',
                    position: 'top-center',
                    duration: 'full',
                    style: 'banner',
                    color: '#FF0000',
                    animation: 'pulse'
                });
                break;

            case 'stats_impactantes':
                overlays.push({
                    text: contentData.statValue,
                    position: 'center',
                    startTime: 3,
                    duration: 5,
                    style: 'extra-large-bold',
                    color: '#FFFFFF',
                    animation: 'zoom-in'
                });
                break;

            case 'prediccion_jornada':
                overlays.push({
                    text: `J${contentData.gameweek}`,
                    position: 'top-left',
                    duration: 'full',
                    style: 'medium',
                    color: '#0066CC'
                });
                break;
        }

        return overlays;
    }

    /**
     * Genera título optimizado para YouTube Shorts
     */
    generateTitle(contentType, contentData) {
        const titles = {
            chollo_viral: `💰 CHOLLO: ${contentData.playerName} a ${contentData.price}M - ¡FICHALO YA!`,
            breaking_news: `🚨 ÚLTIMA HORA: ${contentData.playerName} - ${contentData.newsTitle}`,
            stats_impactantes: `📊 ${contentData.playerName}: La ESTADÍSTICA que NADIE ha visto`,
            prediccion_jornada: `⚽ JORNADA ${contentData.gameweek}: 3 Predicciones (la 3ª es POLÉMICA)`
        };

        return titles[contentType] || 'Fantasy La Liga';
    }

    /**
     * Genera descripción optimizada con hashtags
     */
    generateDescription(contentType, contentData) {
        let description = '';

        switch (contentType) {
            case 'chollo_viral':
                description = `🔥 ${contentData.playerName} por solo ${contentData.price}M es el CHOLLO de la jornada\n\n`;
                description += `📊 Stats:\n`;
                description += `- Precio: ${contentData.price}M\n`;
                description += `- Valor esperado: ${contentData.expectedPoints}pts\n`;
                description += `- Ratio valor: ${contentData.valueRatio}x\n\n`;
                break;
            case 'breaking_news':
                description = `🚨 ÚLTIMA HORA sobre ${contentData.playerName}\n\n${contentData.newsDetail}\n\n`;
                break;
            case 'stats_impactantes':
                description = `📊 Análisis estadístico de ${contentData.playerName}\n\n${contentData.statDetail}\n\n`;
                break;
            case 'prediccion_jornada':
                description = `⚽ Predicciones Jornada ${contentData.gameweek}\n\n`;
                description += `1️⃣ ${contentData.prediction1}\n`;
                description += `2️⃣ ${contentData.prediction2}\n`;
                description += `3️⃣ ${contentData.prediction3}\n\n`;
                break;
        }

        description += `👉 Sígueme para más análisis Fantasy La Liga\n`;
        description += `📱 Instagram: @laligafantasyspain\n`;
        description += `🎯 TikTok: @laligafantasyspain\n\n`;
        description += this.generateHashtags(contentType);

        return description;
    }

    /**
     * Genera tags optimizados para SEO
     */
    generateTags(contentType, contentData) {
        const baseTags = [
            'fantasy la liga',
            'la liga fantasy',
            'fantasy football',
            'la liga',
            'fantasy español'
        ];

        const contentTags = {
            chollo_viral: ['chollos fantasy', 'jugadores baratos', 'fichajes fantasy'],
            breaking_news: ['noticias fantasy', 'última hora fantasy', 'alertas fantasy'],
            stats_impactantes: ['estadísticas la liga', 'análisis jugadores', 'stats fantasy'],
            prediccion_jornada: ['predicciones fantasy', 'jornada la liga', 'tips fantasy']
        };

        return [...baseTags, ...contentTags[contentType]];
    }

    /**
     * Genera hashtags optimizados para descripción
     */
    generateHashtags(contentType) {
        const baseHashtags = '#FantasyLaLiga #LaLigaFantasy #FantasyFootball';

        const contentHashtags = {
            chollo_viral: '#Chollos #Fichajes #JugadoresBaratos',
            breaking_news: '#ÚltimaHora #Breaking #AlertaFantasy',
            stats_impactantes: '#Stats #Estadísticas #Análisis',
            prediccion_jornada: '#Predicciones #Jornada #Tips'
        };

        return `${baseHashtags} ${contentHashtags[contentType]} #Shorts #YouTubeShorts`;
    }

    // === MÉTODOS AUXILIARES PARA GENERACIÓN DE DIÁLOGOS ===

    generateRevelacion(contentData) {
        return `${contentData.playerName} está a ${contentData.price}M. ` +
            `Con su próximo rival y forma actual, te puede dar ${contentData.expectedPoints} puntos. ` +
            `Ratio valor ${contentData.valueRatio}x. Es un ROBO absoluto.`;
    }

    generateDesarrollo(contentData) {
        return `${contentData.newsDetail}. ` +
            `Esto afecta directamente a tu Fantasy. ` +
            `${contentData.impact}`;
    }

    generateAnalisisDatos(contentData) {
        return `Mira este dato: ${contentData.statDetail}. ` +
            `Comparado con el resto de la liga, ${contentData.comparison}. ` +
            `Por eso creo que ${contentData.conclusion}`;
    }

    /**
     * Valida que el Short cumple con KPIs objetivo
     */
    validateShortQuality(shortConfig) {
        const targetKPIs = shortConfig.targetKPIs;
        const validation = {
            passed: true,
            checks: [],
            warnings: []
        };

        // Check 1: Duración dentro del rango
        const totalDuration = shortConfig.segments.reduce((sum, seg) => sum + seg.duration, 0);
        const durationConfig = this.config.DURATION[shortConfig.contentType];

        if (totalDuration < durationConfig.min || totalDuration > durationConfig.max) {
            validation.checks.push({
                name: 'Duración',
                passed: false,
                message: `Duración ${totalDuration}s fuera de rango (${durationConfig.min}-${durationConfig.max}s)`
            });
            validation.passed = false;
        } else {
            validation.checks.push({
                name: 'Duración',
                passed: true,
                message: `Duración óptima: ${totalDuration}s`
            });
        }

        // Check 2: Hook corto y efectivo
        const hookDuration = shortConfig.hook.duration;
        if (hookDuration > 3) {
            validation.warnings.push('Hook demasiado largo (>3s) - puede afectar retención');
        }

        // Check 3: Subtítulos habilitados (CRÍTICO)
        if (!shortConfig.captions.enabled) {
            validation.checks.push({
                name: 'Subtítulos',
                passed: false,
                message: 'Subtítulos CRÍTICOS - 85% usuarios sin audio'
            });
            validation.passed = false;
        } else {
            validation.checks.push({
                name: 'Subtítulos',
                passed: true,
                message: 'Subtítulos habilitados ✅'
            });
        }

        // Check 4: Formato vertical
        if (shortConfig.veo3Config.aspectRatio !== '9:16') {
            validation.checks.push({
                name: 'Formato',
                passed: false,
                message: 'Debe ser 9:16 vertical'
            });
            validation.passed = false;
        } else {
            validation.checks.push({
                name: 'Formato',
                passed: true,
                message: 'Formato 9:16 vertical ✅'
            });
        }

        // Check 5: CTA presente
        const lastSegment = shortConfig.segments[shortConfig.segments.length - 1];
        const hasCTA =
            lastSegment.dialogue.toLowerCase().includes('sígueme') ||
            lastSegment.dialogue.toLowerCase().includes('suscríbete') ||
            lastSegment.dialogue.toLowerCase().includes('link en bio');

        if (!hasCTA) {
            validation.warnings.push('No se detectó CTA claro en segmento final');
        } else {
            validation.checks.push({
                name: 'CTA',
                passed: true,
                message: 'CTA presente en cierre ✅'
            });
        }

        return validation;
    }

    /**
     * Obtiene estadísticas del generador
     */
    getStats() {
        return {
            supportedTypes: Object.keys(this.config.DURATION),
            config: this.config,
            version: '1.0.0',
            lastUpdated: '2025-10-01'
        };
    }
}

module.exports = ShortsGenerator;
