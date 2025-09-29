#!/usr/bin/env node

// DOCUMENTARY DEEP-DIVE - Ana 16s (Serio, Profesional, Informativo)
// Estilo: Análisis táctico profesional estilo documental

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const VEO3Client = require('../../backend/services/veo3/veo3Client');

class AnaDocumentaryGenerator {
  constructor() {
    this.veo3Client = new VEO3Client();
    this.outputDir = './output/veo3/ana-documentary';

    console.log('🎬 AnaDocumentaryGenerator - Estilo Documental Profesional');
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
    console.log('🎬 GENERANDO VIDEO DOCUMENTARY DEEP-DIVE 16s');
    console.log('==========================================');
    console.log('📊 Características:');
    console.log('   🎯 Estilo: Documentary BBC Sports');
    console.log('   🎭 Tono: Serio, profesional, autoridad');
    console.log('   📈 Contenido: Análisis con datos duros');
    console.log('   🎵 Audio: Medido, pensativo, experto');
    console.log('   🎥 Visual: Profesional, estático, datos');
    console.log('');

    try {
      // SEGMENTO 1: Professional Setup
      console.log('📋 SEGMENTO 1: PROFESSIONAL SETUP (8s)');
      const segment1Prompt = this.generateSegment1Prompt();

      console.log(`🎬 Generando segmento documental 1/2...`);
      const segment1Result = await this.veo3Client.generateVideo(segment1Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment1Prompt.audioDesign.voice
      });

      const taskId1 = segment1Result.data.taskId;
      console.log(`✅ Segmento 1 iniciado: ${taskId1}`);

      const completedSegment1 = await this.veo3Client.waitForCompletion(taskId1);
      console.log(`✅ Segmento 1 completado`);

      // SEGMENTO 2: Data Deep-Dive
      console.log('📋 SEGMENTO 2: DATA DEEP-DIVE (8s)');
      const segment2Prompt = this.generateSegment2Prompt('frame_placeholder');

      console.log(`🎬 Generando segmento documental 2/2...`);
      const segment2Result = await this.veo3Client.generateVideo(segment2Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment2Prompt.audioDesign.voice
      });

      const taskId2 = segment2Result.data.taskId;
      console.log(`✅ Segmento 2 iniciado: ${taskId2}`);

      const completedSegment2 = await this.veo3Client.waitForCompletion(taskId2);
      console.log(`✅ Segmento 2 completado`);

      console.log('');
      console.log('🎉 ¡VIDEO DOCUMENTARY 16s COMPLETADO!');
      console.log('===================================');
      console.log('📺 Estilo: Professional Documentary Deep-Dive');
      console.log('🎯 Público: Audiencia seria, análisis deportivo profesional');
      console.log('📊 Fortalezas: Credibilidad, datos duros, autoridad');
      console.log('🎵 Audio: Medido, profesional, expertise');
      console.log('');

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
      console.error('❌ Error generando video documentary:', error.message);
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
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AnaDocumentaryGenerator;