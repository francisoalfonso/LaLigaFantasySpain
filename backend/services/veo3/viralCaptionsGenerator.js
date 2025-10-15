/**
 * Viral Captions Generator - Subtítulos estilo TikTok/Instagram
 *
 * Genera subtítulos sincronizados palabra por palabra
 * con estilo viral (fuente grande, palabra destacada)
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class ViralCaptionsGenerator {
    constructor() {
        this.config = {
            // ✅ ESTILO APROBADO - Consistente con captionsService.js (Oct 11 16:15)
            fontSize: 80, // Tamaño equilibrado - legible sin tapar presentador
            fontFamily: 'Arial Black', // Arial Black para mejor legibilidad
            primaryColor: 'white',
            highlightColor: '#FFD700', // Dorado (más profesional que amarillo puro)
            outlineColor: 'black',
            outlineWidth: 6, // Borde más grueso para mejor contraste

            // Posicionamiento (410px desde borde inferior en 1280px = más arriba que antes)
            yPosition: '(h-410)', // 410px desde borde inferior (zona segura de apps)
            xPosition: '(w-text_w)/2', // Centrado horizontal

            // Timing
            wordsPerSecond: 2.5, // Velocidad promedio habla

            // Box background (opcional)
            enableBox: true,
            boxColor: 'black@0.7', // Negro semi-transparente
            boxPadding: 20,

            // Shadow para profundidad
            shadowX: 2,
            shadowY: 2
        };
    }

    /**
     * Genera subtítulos virales para un video
     * @param {string} videoPath - Ruta del video de entrada
     * @param {string} dialogue - Texto que Ana está diciendo
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<string>} - Ruta del video con subtítulos
     */
    async generateViralCaptions(videoPath, dialogue, options = {}) {
        const outputPath = options.outputPath || videoPath.replace('.mp4', '-with-captions.mp4');

        console.log(`🎬 Generando subtítulos virales para: ${path.basename(videoPath)}`);
        console.log(`💬 Diálogo: "${dialogue}"`);

        // Dividir diálogo en palabras
        const words = this.splitIntoWords(dialogue);
        console.log(`📝 ${words.length} palabras detectadas`);

        // Calcular timing para cada palabra
        const wordTimings = this.calculateWordTimings(words, options.videoDuration || 7); // ⚠️ 7 segundos máximo para evitar caras raras en transiciones

        // Generar filtro FFmpeg para subtítulos
        const subtitleFilter = this.buildSubtitleFilter(wordTimings);

        // Aplicar subtítulos al video
        return this.applySubtitles(videoPath, subtitleFilter, outputPath);
    }

    /**
     * Divide el diálogo en palabras manteniendo puntuación
     */
    splitIntoWords(dialogue) {
        // Limpiar y dividir en palabras
        return dialogue
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    /**
     * Calcula timing de cada palabra
     */
    calculateWordTimings(words, videoDuration) {
        const totalWords = words.length;
        const timePerWord = videoDuration / totalWords;

        const timings = [];
        let currentTime = 0;

        words.forEach(word => {
            // Palabras importantes (MAYÚSCULAS) duran más
            const isImportant = word === word.toUpperCase() && word.length > 3;
            const duration = isImportant ? timePerWord * 1.3 : timePerWord;

            timings.push({
                word: word,
                startTime: currentTime.toFixed(2),
                endTime: (currentTime + duration).toFixed(2),
                duration: duration.toFixed(2),
                isImportant: isImportant
            });

            currentTime += duration;
        });

        return timings;
    }

    /**
     * Construye filtro FFmpeg para subtítulos virales
     */
    buildSubtitleFilter(wordTimings) {
        const filters = [];

        wordTimings.forEach(timing => {
            const { word, startTime, endTime, isImportant } = timing;

            // Color: amarillo si es importante, blanco si no
            const color = isImportant ? this.config.highlightColor : this.config.primaryColor;

            // Tamaño: más grande si es importante
            const fontSize = isImportant ? this.config.fontSize + 8 : this.config.fontSize;

            // Escapar comillas y caracteres especiales
            const escapedWord = word.replace(/'/g, "'\\\\\\''");

            // Box background (opcional)
            let boxParams = '';
            if (this.config.enableBox) {
                boxParams = `:box=1:boxcolor=${this.config.boxColor}:boxborderw=${this.config.boxPadding}`;
            }

            // Construir filtro drawtext con estilo aprobado
            const filter =
                `drawtext=text='${escapedWord}'` +
                `:fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf` +
                `:fontsize=${fontSize}` +
                `:fontcolor=${color}` +
                `:borderw=${this.config.outlineWidth}` +
                `:bordercolor=${this.config.outlineColor}` +
                `:shadowx=${this.config.shadowX}` +
                `:shadowy=${this.config.shadowY}` +
                `:x=${this.config.xPosition}` +
                `:y=${this.config.yPosition}` +
                `:enable='between(t,${startTime},${endTime})'${boxParams}`;

            filters.push(filter);
        });

        return filters.join(',');
    }

    /**
     * Aplica subtítulos al video usando FFmpeg
     */
    async applySubtitles(inputPath, subtitleFilter, outputPath) {
        return new Promise((resolve, reject) => {
            console.log(`🎨 Aplicando subtítulos virales...`);

            ffmpeg(inputPath)
                .videoFilters(subtitleFilter)
                .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a copy'])
                .on('start', cmd => {
                    console.log(`▶️  FFmpeg ejecutando: ${cmd.substring(0, 100)}...`);
                })
                .on('progress', progress => {
                    if (progress.percent) {
                        console.log(`⏳ Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`✅ Subtítulos aplicados: ${outputPath}`);

                    // Verificar que el archivo existe
                    if (fs.existsSync(outputPath)) {
                        const stats = fs.statSync(outputPath);
                        console.log(`📊 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                        resolve(outputPath);
                    } else {
                        reject(new Error('Video con subtítulos no se generó correctamente'));
                    }
                })
                .on('error', err => {
                    console.error(`❌ Error aplicando subtítulos: ${err.message}`);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    /**
     * Genera subtítulos para múltiples segmentos
     */
    async generateCaptionsForSegments(segments) {
        console.log(`\n🎬 Generando subtítulos virales para ${segments.length} segmentos...`);

        const results = [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            console.log(`\n📹 Segmento ${i + 1}/${segments.length}`);

            try {
                const outputPath = await this.generateViralCaptions(
                    segment.videoPath,
                    segment.dialogue,
                    { videoDuration: segment.duration || 7 } // ⚠️ 7 segundos máximo para evitar caras raras en transiciones
                );

                results.push({
                    ...segment,
                    videoPathWithCaptions: outputPath,
                    captionsApplied: true
                });
            } catch (error) {
                console.error(`❌ Error en segmento ${i + 1}: ${error.message}`);
                results.push({
                    ...segment,
                    captionsApplied: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.captionsApplied).length;
        console.log(`\n✅ Subtítulos aplicados a ${successCount}/${segments.length} segmentos`);

        return results;
    }
}

module.exports = ViralCaptionsGenerator;
