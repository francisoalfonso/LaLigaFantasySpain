#!/usr/bin/env node

// DOCUMENTARY DEEP-DIVE - Ana 16s (Serio, Profesional, Informativo)
// Estilo: Análisis táctico profesional estilo documental

const path = require('path');
const logger = require('../../../../../../../utils/logger');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const VEO3Client = require('../../backend/services/veo3/veo3Client');

class AnaDocumentaryGenerator {
  constructor() {
    this.veo3Client = new VEO3Client();
    this.outputDir = './output/veo3/ana-documentary';

    logger.info('🎬 AnaDocumentaryGenerator - Estilo Documental Profesional');
  }

  // SEGMENTO 1: Professional Setup (8s) - Estilo BBC Sports
  generateSegment1Prompt() {
    return {
      prompt: `Professional sports documentary, Ana Martinez from reference image, authoritative posture behind analysis desk with tactical boards and statistics, serious professional expression, speaking in measured Spanish: "El análisis de datos revela una tendencia preocupante en el Barcelona", Spanish from Spain accent with documentary gravitas, professional studio lighting with data visualizations, no subtitles.`,

      audioDesign: {
        style: 'authoritative_documentary',
        emotionalArc: 'serious_professional_authority',
        voice: {
          locale: 'es-ES',
          gender: 'female',
          style: 'documentary_narrator'
        },
        pace: 'measured_thoughtful',
        ambient: 'professional_analysis_studio'
      },

      cinematography: {
        movement: 'static_professional_framing',
        lighting: 'documentary_studio_lighting',
        composition: 'wide_professional_establishing_shot'
      },

      metadata: {
        segment: 1,
        style: 'documentary_professional',
        emotionalArc: 'authoritative_setup_to_data_presentation',
        purpose: 'establish_credibility_and_context'
      }
    };
  }

  // SEGMENTO 2: Data Deep-Dive (8s) - Análisis con datos duros
  generateSegment2Prompt(lastFrame) {
    return {
      prompt: `Professional sports documentary continuation, Ana Martinez from reference image, now pointing at specific data charts with tactical pointer, intense focused expression, speaking in analytical Spanish: "Los números no mienten: Lewandowski ha perdido un 23% de efectividad en área rival", Spanish from Spain accent with analytical precision, studio with detailed statistical overlays, no subtitles.`,

      audioDesign: {
        style: 'analytical_precision',
        emotionalArc: 'data_focus_to_conclusive_insight',
        voice: {
          locale: 'es-ES',
          gender: 'female',
          style: 'analytical_expert'
        },
        pace: 'precise_informative',
        ambient: 'data_analysis_environment'
      },

      cinematography: {
        movement: 'close_up_data_interaction',
        lighting: 'focused_analytical_lighting',
        composition: 'detailed_data_analysis_framing'
      },

      initialFrame: lastFrame,

      metadata: {
        segment: 2,
        style: 'documentary_analytical',
        emotionalArc: 'focused_analysis_to_definitive_conclusion',
        purpose: 'deliver_hard_data_and_insights'
      }
    };
  }

  async generateDocumentaryVideo() {
    logger.info('🎬 GENERANDO VIDEO DOCUMENTARY DEEP-DIVE 16s');
    logger.info('==========================================');
    logger.info('📊 Características:');
    logger.info('   🎯 Estilo: Documentary BBC Sports');
    logger.info('   🎭 Tono: Serio, profesional, autoridad');
    logger.info('   📈 Contenido: Análisis con datos duros');
    logger.info('   🎵 Audio: Medido, pensativo, experto');
    logger.info('   🎥 Visual: Profesional, estático, datos');
    logger.info('');

    try {
      // SEGMENTO 1: Professional Setup
      logger.info('📋 SEGMENTO 1: PROFESSIONAL SETUP (8s)');
      const segment1Prompt = this.generateSegment1Prompt();

      logger.info(`🎬 Generando segmento documental 1/2...`);
      const segment1Result = await this.veo3Client.generateVideo(segment1Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment1Prompt.audioDesign.voice
      });

      const taskId1 = segment1Result.data.taskId;
      logger.info(`✅ Segmento 1 iniciado: ${taskId1}`);

      const completedSegment1 = await this.veo3Client.waitForCompletion(taskId1);
      logger.info(`✅ Segmento 1 completado`);

      // SEGMENTO 2: Data Deep-Dive
      logger.info('📋 SEGMENTO 2: DATA DEEP-DIVE (8s)');
      const segment2Prompt = this.generateSegment2Prompt('frame_placeholder');

      logger.info(`🎬 Generando segmento documental 2/2...`);
      const segment2Result = await this.veo3Client.generateVideo(segment2Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment2Prompt.audioDesign.voice
      });

      const taskId2 = segment2Result.data.taskId;
      logger.info(`✅ Segmento 2 iniciado: ${taskId2}`);

      const completedSegment2 = await this.veo3Client.waitForCompletion(taskId2);
      logger.info(`✅ Segmento 2 completado`);

      logger.info('');
      logger.info('🎉 ¡VIDEO DOCUMENTARY 16s COMPLETADO!');
      logger.info('===================================');
      logger.info('📺 Estilo: Professional Documentary Deep-Dive');
      logger.info('🎯 Público: Audiencia seria, análisis deportivo profesional');
      logger.info('📊 Fortalezas: Credibilidad, datos duros, autoridad');
      logger.info('🎵 Audio: Medido, profesional, expertise');
      logger.info('');

      return {
        success: true,
        style: 'documentary_deep_dive',
        segments: [
          { taskId: taskId1, url: completedSegment1.localPath },
          { taskId: taskId2, url: completedSegment2.localPath }
        ],
        characteristics: {
          tone: 'Serio y profesional',
          audience: 'Audiencia experta',
          strength: 'Credibilidad y datos',
          audioStyle: 'Medido y autorativo',
          visualStyle: 'Profesional y estático',
          useCase: 'Análisis deportivo serio'
        }
      };

    } catch (error) {
      logger.error('❌ Error generando video documentary:', error.message);
      throw error;
    }
  }
}

// EJECUCIÓN
async function main() {
  const generator = new AnaDocumentaryGenerator();

  try {
    await generator.generateDocumentaryVideo();
  } catch (error) {
    logger.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AnaDocumentaryGenerator;