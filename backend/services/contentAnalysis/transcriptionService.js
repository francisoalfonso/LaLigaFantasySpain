/**
 * Transcription Service - Whisper AI Integration
 *
 * Convierte audio de videos YouTube → texto con timestamps
 * Usado para analizar contenido de competencia
 *
 * Provider: OpenAI Whisper API
 * Cost: ~$0.006/min de audio
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class TranscriptionService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/audio/transcriptions';
        this.model = 'whisper-1';
        this.language = 'es'; // Spanish
    }

    /**
     * Transcribir audio de video a texto
     *
     * @param {string} audioFilePath - Path al archivo de audio (.mp3, .wav, .m4a)
     * @param {object} options - Opciones de transcripción
     * @param {boolean} options.timestamps - Incluir timestamps de segmentos
     * @param {string} options.responseFormat - 'json' | 'text' | 'srt' | 'vtt'
     * @returns {Promise<object>} Transcripción completa
     */
    async transcribe(audioFilePath, options = {}) {
        const startTime = Date.now();

        try {
            logger.info('[TranscriptionService] Iniciando transcripción', {
                audioFile: audioFilePath,
                model: this.model,
                language: this.language
            });

            if (!this.apiKey) {
                throw new Error('OPENAI_API_KEY no configurada en .env');
            }

            // Preparar form data
            const FormData = require('form-data');
            const fs = require('fs');
            const formData = new FormData();

            formData.append('file', fs.createReadStream(audioFilePath));
            formData.append('model', this.model);
            formData.append('language', this.language);
            formData.append('response_format', options.responseFormat || 'verbose_json');

            // Si se piden timestamps, usar formato verbose_json
            if (options.timestamps !== false) {
                formData.append('timestamp_granularities[]', 'segment');
            }

            // Request a Whisper API
            const response = await axios.post(this.baseUrl, formData, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    ...formData.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000 // 2 minutos max
            });

            const duration = Date.now() - startTime;
            const transcription = response.data;

            logger.info('[TranscriptionService] ✅ Transcripción completada', {
                textLength: transcription.text?.length || 0,
                segments: transcription.segments?.length || 0,
                duration: `${duration}ms`,
                language: transcription.language
            });

            return {
                text: transcription.text,
                segments: transcription.segments || [],
                duration: transcription.duration || 0,
                language: transcription.language || 'es',
                processingTime: duration
            };
        } catch (error) {
            logger.error('[TranscriptionService] Error en transcripción', {
                error: error.message,
                audioFile: audioFilePath,
                stack: error.stack
            });

            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    /**
     * Extraer claims específicos de la transcripción
     * Busca frases con palabras clave: "chollo", "barato", "marca fijo", etc.
     *
     * @param {object} transcription - Resultado de transcribe()
     * @returns {Array<object>} Claims encontrados con timestamps
     */
    extractClaims(transcription) {
        const keywords = [
            'chollo',
            'regalado',
            'barato',
            'marca fijo',
            'marca seguro',
            'mejor',
            'imprescindible',
            'ficharlo ya',
            'no puede faltar'
        ];

        const claims = [];

        // Buscar en cada segmento
        transcription.segments?.forEach(segment => {
            const text = segment.text.toLowerCase();

            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    claims.push({
                        keyword,
                        text: segment.text,
                        start: segment.start,
                        end: segment.end,
                        confidence: segment.avg_logprob || 0
                    });
                }
            });
        });

        logger.info('[TranscriptionService] Claims extraídos', {
            total: claims.length,
            keywords: [...new Set(claims.map(c => c.keyword))]
        });

        return claims;
    }

    /**
     * Validar calidad de transcripción
     *
     * @param {object} transcription - Resultado de transcribe()
     * @returns {object} Score de calidad + recomendaciones
     */
    validateQuality(transcription) {
        const issues = [];
        let score = 100;

        // Check 1: Duración mínima
        if (transcription.duration < 10) {
            issues.push('Video muy corto (<10s)');
            score -= 20;
        }

        // Check 2: Texto vacío o muy corto
        if (!transcription.text || transcription.text.length < 50) {
            issues.push('Transcripción muy corta o vacía');
            score -= 30;
        }

        // Check 3: Segmentos
        if (!transcription.segments || transcription.segments.length === 0) {
            issues.push('Sin segmentos detectados');
            score -= 20;
        }

        // Check 4: Idioma
        if (transcription.language && transcription.language !== 'es') {
            issues.push(`Idioma detectado: ${transcription.language} (esperado: es)`);
            score -= 10;
        }

        const quality = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

        logger.info('[TranscriptionService] Validación de calidad', {
            score,
            quality,
            issues: issues.length
        });

        return {
            score,
            quality,
            issues,
            isValid: score >= 60
        };
    }
}

module.exports = new TranscriptionService();
