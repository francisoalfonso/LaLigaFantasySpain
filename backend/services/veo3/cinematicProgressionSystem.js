/**
 * Cinematic Progression System - Variación de Planos y Comportamientos
 *
 * PROBLEMA RESUELTO:
 * Todos los segmentos empezaban con Ana en el mismo plano/postura inicial,
 * creando un patrón artificial de "reset" entre segmentos.
 *
 * SOLUCIÓN:
 * Sistema de progresión que varía:
 * 1. Planos cinematográficos (general → medio → primer plano)
 * 2. Comportamiento inicial de Ana (postura, gestos)
 * 3. Ángulos de cámara
 *
 * Fecha: 8 Octubre 2025
 */

const logger = require('../../utils/logger');

class CinematicProgressionSystem {
    constructor() {
        // ========================================
        // PLANOS CINEMATOGRÁFICOS
        // ========================================
        this.cameraShots = {
            // Plano General (Wide Shot)
            'wide': {
                name: 'Wide Shot',
                description: 'standing naturally in medium-wide framing, full upper body visible',
                distance: 'general',
                uses: ['establishing', 'context', 'energy'],
                bodyLanguage: ['standing confidently', 'natural stance', 'relaxed posture']
            },

            // Plano Medio (Medium Shot)
            'medium': {
                name: 'Medium Shot',
                description: 'framed from waist up, slightly closer perspective',
                distance: 'medio',
                uses: ['conversation', 'presentation', 'analysis'],
                bodyLanguage: ['leaning forward slightly', 'gesturing naturally', 'engaged posture']
            },

            // Primer Plano (Close-Up)
            'closeup': {
                name: 'Close-Up',
                description: 'framed from shoulders up, intimate perspective',
                distance: 'cercano',
                uses: ['emotion', 'emphasis', 'connection'],
                bodyLanguage: ['looking directly at camera', 'subtle facial expressions', 'focused gaze']
            },

            // Plano Medio Corto (Medium Close-Up)
            'medium_closeup': {
                name: 'Medium Close-Up',
                description: 'framed from chest up, balanced intimate shot',
                distance: 'medio-cercano',
                uses: ['revelation', 'trust', 'detail'],
                bodyLanguage: ['slight head tilt', 'expressive eyes', 'natural hand gestures visible']
            }
        };

        // ========================================
        // COMPORTAMIENTOS INICIALES
        // ========================================
        this.initialBehaviors = {
            // Entrada natural (no reset)
            'continuing': {
                description: 'continuing from previous moment, already mid-gesture',
                variants: [
                    'mid-gesture as if continuing a thought',
                    'already engaged in conversation',
                    'naturally transitioning from previous point'
                ]
            },

            // Cambio de postura
            'shift_posture': {
                description: 'shifting posture naturally',
                variants: [
                    'adjusting stance slightly',
                    'shifting weight to other side',
                    'settling into new position'
                ]
            },

            // Gesto de transición
            'transition_gesture': {
                description: 'using gesture to transition',
                variants: [
                    'raising hand to emphasize new point',
                    'opening arms to introduce new idea',
                    'nodding as if confirming previous statement'
                ]
            },

            // Mirada directa (para énfasis)
            'direct_gaze': {
                description: 'looking directly at camera',
                variants: [
                    'meeting viewer eyes directly',
                    'locking gaze with camera',
                    'intense direct eye contact'
                ]
            },

            // Movimiento sutil
            'subtle_movement': {
                description: 'subtle body movement',
                variants: [
                    'slight head turn toward camera',
                    'leaning in subtly',
                    'small step forward'
                ]
            }
        };

        // ========================================
        // PATRONES DE PROGRESIÓN
        // ========================================
        this.progressionPatterns = {
            // Patrón 1: Zoom In Progresivo (lo más común)
            'zoom_in': {
                segments: [
                    { shot: 'wide', behavior: 'continuing' },
                    { shot: 'medium', behavior: 'shift_posture' },
                    { shot: 'closeup', behavior: 'direct_gaze' }
                ],
                narrative: 'Establece → Desarrolla → Concluye con intimidad',
                bestFor: ['chollo', 'revelation']
            },

            // Patrón 2: Medium Start (balanced)
            'medium_balanced': {
                segments: [
                    { shot: 'medium', behavior: 'continuing' },
                    { shot: 'medium_closeup', behavior: 'transition_gesture' },
                    { shot: 'medium', behavior: 'shift_posture' }
                ],
                narrative: 'Conversacional constante',
                bestFor: ['analysis', 'explanation']
            },

            // Patrón 3: Alternating (variado)
            'alternating': {
                segments: [
                    { shot: 'medium', behavior: 'continuing' },
                    { shot: 'wide', behavior: 'subtle_movement' },
                    { shot: 'closeup', behavior: 'direct_gaze' }
                ],
                narrative: 'Variación visual alta',
                bestFor: ['entertainment', 'storytelling']
            },

            // Patrón 4: Close Start (impacto inmediato)
            'close_start': {
                segments: [
                    { shot: 'closeup', behavior: 'direct_gaze' },
                    { shot: 'medium', behavior: 'shift_posture' },
                    { shot: 'medium_closeup', behavior: 'transition_gesture' }
                ],
                narrative: 'Impacto → Explicación → Cierre',
                bestFor: ['breaking', 'urgency']
            },

            // Patrón 5: Random (evita patrones)
            'random': {
                segments: null, // Se genera aleatoriamente
                narrative: 'Completamente impredecible',
                bestFor: ['variety', 'natural']
            }
        };
    }

    /**
     * Seleccionar patrón de progresión según tipo de contenido
     * @param {string} contentType - Tipo de contenido (chollo, analysis, breaking)
     * @param {string} emotionalArc - Arco emocional detectado
     * @returns {object} - Patrón seleccionado
     */
    selectPattern(contentType, emotionalArc = null) {
        // Mapeo tipo de contenido → patrón recomendado
        const typeToPattern = {
            'chollo': 'zoom_in',         // Progresión clásica
            'analysis': 'medium_balanced', // Conversacional
            'breaking': 'close_start',    // Impacto inmediato
            'prediction': 'alternating',  // Variado
            'generic': 'random'           // Aleatorio
        };

        let patternKey = typeToPattern[contentType] || 'zoom_in';

        // Override: Si hay arco emocional con mucha urgencia, usar close_start
        if (emotionalArc && emotionalArc.includes('urgencia')) {
            patternKey = 'close_start';
        }

        // Si es random, generar patrón aleatorio
        if (patternKey === 'random') {
            return this._generateRandomPattern();
        }

        const pattern = this.progressionPatterns[patternKey];

        logger.info(`[CinematicProgression] Patrón seleccionado: ${patternKey}`);
        logger.info(`[CinematicProgression] Narrativa: ${pattern.narrative}`);

        return {
            key: patternKey,
            ...pattern
        };
    }

    /**
     * Generar patrón aleatorio (evita repetición)
     */
    _generateRandomPattern() {
        const shotKeys = Object.keys(this.cameraShots);
        const behaviorKeys = Object.keys(this.initialBehaviors);

        // Shuffle para evitar patrones
        const shuffledShots = this._shuffle(shotKeys);
        const shuffledBehaviors = this._shuffle(behaviorKeys);

        const segments = [
            { shot: shuffledShots[0], behavior: shuffledBehaviors[0] },
            { shot: shuffledShots[1], behavior: shuffledBehaviors[1] },
            { shot: shuffledShots[2], behavior: shuffledBehaviors[2] }
        ];

        logger.info(`[CinematicProgression] Patrón random generado`);
        logger.info(`[CinematicProgression] Planos: ${segments.map(s => s.shot).join(' → ')}`);

        return {
            key: 'random',
            segments,
            narrative: 'Patrón aleatorio generado',
            bestFor: ['variety']
        };
    }

    /**
     * Obtener configuración cinematográfica para un segmento específico
     * @param {number} segmentIndex - Índice del segmento (0, 1, 2)
     * @param {string} contentType - Tipo de contenido
     * @param {string} emotionalArc - Arco emocional
     * @returns {object} - Configuración cinematográfica
     */
    getSegmentCinematography(segmentIndex, contentType, emotionalArc = null) {
        // Seleccionar patrón
        const pattern = this.selectPattern(contentType, emotionalArc);

        // Obtener configuración del segmento
        const segmentConfig = pattern.segments[segmentIndex];

        // Obtener detalles del plano
        const shot = this.cameraShots[segmentConfig.shot];

        // Obtener comportamiento inicial
        const behavior = this.initialBehaviors[segmentConfig.behavior];

        // Seleccionar variante aleatoria del comportamiento
        const behaviorVariant = behavior.variants[
            Math.floor(Math.random() * behavior.variants.length)
        ];

        logger.info(`[CinematicProgression] Segmento ${segmentIndex + 1}:`);
        logger.info(`[CinematicProgression]   Plano: ${shot.name} (${shot.distance})`);
        logger.info(`[CinematicProgression]   Comportamiento: ${segmentConfig.behavior}`);

        return {
            shot: {
                type: segmentConfig.shot,
                name: shot.name,
                description: shot.description,
                distance: shot.distance,
                uses: shot.uses
            },
            behavior: {
                type: segmentConfig.behavior,
                description: behaviorVariant,
                category: behavior.description
            },
            // Prompt fragment para VEO3
            promptFragment: `${shot.description}, ${behaviorVariant}`
        };
    }

    /**
     * Obtener configuración completa para todos los segmentos
     * @param {string} contentType - Tipo de contenido
     * @param {array} emotionalArc - Array de emociones [seg1, seg2, seg3]
     * @returns {array} - Array de configuraciones cinematográficas
     */
    getFullProgression(contentType, emotionalArc = null) {
        const progression = [];

        for (let i = 0; i < 3; i++) {
            const config = this.getSegmentCinematography(i, contentType, emotionalArc);
            progression.push(config);
        }

        logger.info(`[CinematicProgression] Progresión completa generada para ${contentType}`);
        logger.info(`[CinematicProgression] Planos: ${progression.map(p => p.shot.name).join(' → ')}`);

        return progression;
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    _shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Verificar que no hay repetición del plano anterior
     * (opcional, para forzar cambio)
     */
    ensureVariation(segmentIndex, currentShot, previousShot) {
        if (segmentIndex === 0) return currentShot; // Primer segmento, cualquier plano ok

        // Si es el mismo plano que el anterior, cambiar
        if (currentShot === previousShot) {
            const allShots = Object.keys(this.cameraShots);
            const availableShots = allShots.filter(s => s !== previousShot);
            const newShot = availableShots[Math.floor(Math.random() * availableShots.length)];

            logger.info(`[CinematicProgression] ⚠️ Plano repetido detectado (${currentShot}), cambiando a ${newShot}`);

            return newShot;
        }

        return currentShot;
    }
}

module.exports = CinematicProgressionSystem;
