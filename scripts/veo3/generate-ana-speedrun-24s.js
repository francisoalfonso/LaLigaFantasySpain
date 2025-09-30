#!/usr/bin/env node

// SPEED RUN ANALYSIS - Ana 24s (Dinámico, Creativo, Atractivo)
// Estilo: Análisis rápido estilo TikTok con energía alta

const path = require('path');
const logger = require('../../../../../../../utils/logger');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const VEO3Client = require('../../backend/services/veo3/veo3Client');

class AnaSpeedRunGenerator {
  constructor() {
    this.veo3Client = new VEO3Client();
    this.outputDir = './output/veo3/ana-speedrun';

    logger.info('⚡ AnaSpeedRunGenerator - Estilo Speed Run Dinámico');
  }

  // SEGMENTO 1: Rapid-Fire Intro (8s) - Energía alta, setup rápido
  generateSegment1Prompt() {
    return {
      prompt: `High-energy sports analysis video, Ana Martinez from reference image, dynamic energetic posture with quick hand gestures, bright excited expression, speaking rapidly in Spanish: "¡60 segundos para encontrar los 3 chollos que van a revolucionar tu Fantasy!", Spanish from Spain accent with high-energy TikTok style, vibrant studio with quick-cut style graphics, no subtitles.`,

      audioDesign: {
        style: 'high_energy_rapid_fire',
        emotionalArc: 'explosive_energy_to_building_excitement',
        voice: {
          locale: 'es-ES',
          gender: 'female',
          style: 'energetic_presenter'
        },
        pace: 'fast_paced_engaging',
        ambient: 'dynamic_social_media_studio'
      },

      cinematography: {
        movement: 'dynamic_quick_cuts_energy',
        lighting: 'bright_vibrant_social_media',
        composition: 'energetic_close_up_engagement'
      },

      metadata: {
        segment: 1,
        style: 'speed_run_intro',
        emotionalArc: 'explosive_setup_to_rapid_promise',
        purpose: 'hook_audience_with_energy_and_promise'
      }
    };
  }

  // SEGMENTO 2: Rapid Analysis (8s) - Datos rápidos, punchy
  generateSegment2Prompt(lastFrame) {
    return {
      prompt: `Speed run sports analysis, Ana Martinez from reference image, pointing rapidly at multiple data points with quick precise movements, intense focused energy, speaking fast in Spanish: "¡Número uno! Balde, 4.5 millones, 89% de titularidad confirmada", Spanish from Spain accent with rapid-fire delivery, studio with fast-changing statistical overlays, no subtitles.`,

      audioDesign: {
        style: 'rapid_fire_data_delivery',
        emotionalArc: 'focused_intensity_to_rapid_revelation',
        voice: {
          locale: 'es-ES',
          gender: 'female',
          style: 'fast_paced_analytical'
        },
        pace: 'machine_gun_delivery',
        ambient: 'high_energy_data_environment'
      },

      cinematography: {
        movement: 'quick_data_point_transitions',
        lighting: 'dynamic_changing_highlights',
        composition: 'rapid_multi_data_display'
      },

      initialFrame: lastFrame,

      metadata: {
        segment: 2,
        style: 'speed_run_analysis',
        emotionalArc: 'rapid_data_to_punchy_insights',
        purpose: 'deliver_maximum_value_minimum_time'
      }
    };
  }

  // SEGMENTO 3: Explosive Conclusion (8s) - Call to action urgente
  generateSegment3Prompt(lastFrame) {
    return {
      prompt: `Speed run conclusion, Ana Martinez from reference image, explosive celebratory energy with victory gestures, huge excited smile, speaking with urgency in Spanish: "¡Y el tercero te va a volar la cabeza! ¡Ficha YA antes de que explote el precio!", Spanish from Spain accent with explosive enthusiasm, studio with celebration graphics and urgent call-to-action overlays, no subtitles.`,

      audioDesign: {
        style: 'explosive_celebratory_urgency',
        emotionalArc: 'peak_excitement_to_urgent_call_action',
        voice: {
          locale: 'es-ES',
          gender: 'female',
          style: 'celebratory_urgent'
        },
        pace: 'explosive_finale',
        ambient: 'celebration_urgency_environment'
      },

      cinematography: {
        movement: 'explosive_celebration_energy',
        lighting: 'peak_energy_celebration_lighting',
        composition: 'victory_call_to_action_framing'
      },

      initialFrame: lastFrame,

      metadata: {
        segment: 3,
        style: 'speed_run_explosive_conclusion',
        emotionalArc: 'celebration_to_urgent_action',
        purpose: 'maximize_engagement_and_action'
      }
    };
  }

  async generateSpeedRunVideo() {
    logger.info('⚡ GENERANDO VIDEO SPEED RUN ANALYSIS 24s');
    logger.info('========================================');
    logger.info('📊 Características:');
    logger.info('   🎯 Estilo: Speed Run TikTok Style');
    logger.info('   🎭 Tono: Dinámico, energético, atractivo');
    logger.info('   📈 Contenido: Máximo valor en mínimo tiempo');
    logger.info('   🎵 Audio: Rápido, punchy, engaging');
    logger.info('   🎥 Visual: Dinámico, quick-cuts, energético');
    logger.info('');

    try {
      // SEGMENTO 1: Rapid-Fire Intro
      logger.info('📋 SEGMENTO 1: RAPID-FIRE INTRO (8s)');
      const segment1Prompt = this.generateSegment1Prompt();

      logger.info(`⚡ Generando segmento speed run 1/3...`);
      const segment1Result = await this.veo3Client.generateVideo(segment1Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment1Prompt.audioDesign.voice
      });

      const taskId1 = segment1Result.data.taskId;
      logger.info(`✅ Segmento 1 iniciado: ${taskId1}`);

      const completedSegment1 = await this.veo3Client.waitForCompletion(taskId1);

      // SEGMENTO 2: Rapid Analysis
      logger.info('📋 SEGMENTO 2: RAPID ANALYSIS (8s)');
      const segment2Prompt = this.generateSegment2Prompt('frame_placeholder');

      logger.info(`⚡ Generando segmento speed run 2/3...`);
      const segment2Result = await this.veo3Client.generateVideo(segment2Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment2Prompt.audioDesign.voice
      });

      const taskId2 = segment2Result.data.taskId;
      const completedSegment2 = await this.veo3Client.waitForCompletion(taskId2);

      // SEGMENTO 3: Explosive Conclusion
      logger.info('📋 SEGMENTO 3: EXPLOSIVE CONCLUSION (8s)');
      const segment3Prompt = this.generateSegment3Prompt('frame_placeholder');

      logger.info(`⚡ Generando segmento speed run 3/3...`);
      const segment3Result = await this.veo3Client.generateVideo(segment3Prompt.prompt, {
        model: 'veo3_fast',
        aspectRatio: '9:16',
        voice: segment3Prompt.audioDesign.voice
      });

      const taskId3 = segment3Result.data.taskId;
      const completedSegment3 = await this.veo3Client.waitForCompletion(taskId3);

      logger.info('');
      logger.info('⚡ ¡VIDEO SPEED RUN 24s COMPLETADO!');
      logger.info('=================================');
      logger.info('📺 Estilo: High-Energy Speed Run Analysis');
      logger.info('🎯 Público: Gen Z, TikTok audience, quick consumption');
      logger.info('📊 Fortalezas: Engagement máximo, viral potential');
      logger.info('🎵 Audio: Rápido, punchy, adictivo');
      logger.info('');

      return {
        success: true,
        style: 'speed_run_analysis',
        segments: [
          { taskId: taskId1, url: completedSegment1.localPath },
          { taskId: taskId2, url: completedSegment2.localPath },
          { taskId: taskId3, url: completedSegment3.localPath }
        ],
        characteristics: {
          tone: 'Dinámico y energético',
          audience: 'Gen Z, consumo rápido',
          strength: 'Engagement y viralidad',
          audioStyle: 'Rápido y punchy',
          visualStyle: 'Quick-cuts dinámicos',
          useCase: 'Contenido viral social media'
        }
      };

    } catch (error) {
      logger.error('❌ Error generando video speed run:', error.message);
      throw error;
    }
  }
}

// EJECUCIÓN
async function main() {
  const generator = new AnaSpeedRunGenerator();

  try {
    await generator.generateSpeedRunVideo();
  } catch (error) {
    logger.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AnaSpeedRunGenerator;