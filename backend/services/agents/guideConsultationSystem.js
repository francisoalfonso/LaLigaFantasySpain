// Sistema de Consulta Obligatoria de Guías para Agentes
// Garantiza que Script Agent y Art Director consulten VEO3-MAESTRA antes de producción

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class GuideConsultationSystem {
  constructor() {
    this.guideBasePath = path.join(__dirname, '../../../docs/super-guias');
    this.consultationCache = new Map();
    this.mandatoryGuides = {
      'script_agent': ['VEO3-MAESTRA.md'],
      'art_director': ['VEO3-MAESTRA.md'],
      'video_producer': ['VEO3-MAESTRA.md']
    };
  }

  // Consulta obligatoria antes de cualquier producción
  async mandatoryConsultation(agentType, projectId) {
    logger.info(`🔍 Consulta obligatoria iniciada - Agent: ${agentType}, Project: ${projectId}`);

    const requiredGuides = this.mandatoryGuides[agentType];
    if (!requiredGuides) {
      throw new Error(`Agent type '${agentType}' not recognized`);
    }

    const consultationRecord = {
      agentType,
      projectId,
      timestamp: new Date().toISOString(),
      guidesConsulted: [],
      validationsPassed: [],
      warnings: [],
      errors: []
    };

    // Consultar cada guía obligatoria
    for (const guide of requiredGuides) {
      const guideConsultation = await this.consultGuide(guide, agentType);
      consultationRecord.guidesConsulted.push({
        guide,
        sections: guideConsultation.sections,
        keyPoints: guideConsultation.keyPoints
      });
    }

    // Almacenar consulta
    this.consultationCache.set(`${agentType}_${projectId}`, consultationRecord);

    logger.info(`✅ Consulta completada - ${consultationRecord.guidesConsulted.length} guías revisadas`);
    return consultationRecord;
  }

  // Consultar guía específica y extraer información relevante
  async consultGuide(guideName, agentType) {
    try {
      const guidePath = path.join(this.guideBasePath, guideName);
      const guideContent = await fs.readFile(guidePath, 'utf8');

      logger.info(`📖 Consultando guía: ${guideName} para ${agentType}`);

      // Extraer secciones relevantes según el tipo de agente
      const relevantSections = this.extractRelevantSections(guideContent, agentType);
      const keyPoints = this.extractKeyPoints(guideContent, agentType);

      return {
        guide: guideName,
        sections: relevantSections,
        keyPoints: keyPoints,
        fullContent: guideContent,
        consultedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error consultando guía ${guideName}:`, error.message);
      throw new Error(`No se pudo consultar la guía ${guideName}: ${error.message}`);
    }
  }

  // Extraer secciones relevantes según el tipo de agente
  extractRelevantSections(content, agentType) {
    const sections = {};

    switch (agentType) {
      case 'script_agent':
        // Script Agent necesita estas secciones críticas
        sections.anaCharacterBible = this.extractSection(content, 'ANA CHARACTER BIBLE');
        sections.dialogueManagement = this.extractSection(content, 'GESTIÓN DE DIÁLOGOS');
        sections.formatosVirales = this.extractSection(content, '8 FORMATOS VIRALES');
        sections.promptLibrary = this.extractSection(content, 'BIBLIOTECA DE PROMPTS');
        sections.scriptChecklist = this.extractSection(content, 'PARA AGENTE REDACTOR DE SCRIPTS');
        break;

      case 'art_director':
        // Art Director necesita estas secciones técnicas
        sections.anaCharacterBible = this.extractSection(content, 'ANA CHARACTER BIBLE');
        sections.cameraControl = this.extractSection(content, 'CONTROL DE CÁMARA');
        sections.narrativeChaining = this.extractSection(content, 'NARRATIVE CHAINING');
        sections.promptLibrary = this.extractSection(content, 'BIBLIOTECA DE PROMPTS');
        sections.artDirectorChecklist = this.extractSection(content, 'PARA DIRECTOR DE ARTE');
        break;

      case 'video_producer':
        // Video Producer necesita visión general
        sections.anaCharacterBible = this.extractSection(content, 'ANA CHARACTER BIBLE');
        sections.formatosVirales = this.extractSection(content, '8 FORMATOS VIRALES');
        sections.qualityMetrics = this.extractSection(content, 'QUALITY METRICS');
        sections.productionWorkflow = this.extractSection(content, 'PRODUCTION WORKFLOW');
        break;
    }

    return sections;
  }

  // Extraer puntos clave específicos para cada agente
  extractKeyPoints(content, agentType) {
    const keyPoints = [];

    // Puntos críticos universales
    keyPoints.push({
      category: 'ANA_CONSISTENCY',
      point: 'SEED 30001 - NUNCA cambiar',
      criticality: 'CRITICAL'
    });

    keyPoints.push({
      category: 'ANA_CONSISTENCY',
      point: 'Descripción Character Bible exacta - copiar/pegar completo',
      criticality: 'CRITICAL'
    });

    keyPoints.push({
      category: 'VOICE',
      point: 'Español de España (es-ES) - NO mexicano',
      criticality: 'CRITICAL'
    });

    switch (agentType) {
      case 'script_agent':
        keyPoints.push({
          category: 'TIMING',
          point: 'Máximo 18 palabras para 8 segundos de diálogo',
          criticality: 'HIGH'
        });

        keyPoints.push({
          category: 'DIALOGUE',
          point: 'Usar ":" no comillas para evitar subtítulos',
          criticality: 'MEDIUM'
        });

        keyPoints.push({
          category: 'STRUCTURE',
          point: 'Consultar formato viral apropiado antes de escribir',
          criticality: 'HIGH'
        });
        break;

      case 'art_director':
        keyPoints.push({
          category: 'TECHNICAL',
          point: 'Model: veo3_fast, Aspect: 9:16, Duration: 8s',
          criticality: 'HIGH'
        });

        keyPoints.push({
          category: 'CAMERA',
          point: 'Describir movimiento de cámara en detalle, no solo adjetivos',
          criticality: 'MEDIUM'
        });

        keyPoints.push({
          category: 'PROMPT',
          point: 'Incluir Ana Character Bible completo en cada prompt',
          criticality: 'CRITICAL'
        });
        break;
    }

    return keyPoints;
  }

  // Extraer sección específica del contenido
  extractSection(content, sectionTitle) {
    const sectionRegex = new RegExp(`#{1,6}.*${sectionTitle}.*?(?=#{1,6}|$)`, 'gis');
    const match = content.match(sectionRegex);

    if (match && match[0]) {
      // Extraer hasta la siguiente sección
      const fullMatch = match[0];
      const nextSectionIndex = content.indexOf(fullMatch) + fullMatch.length;
      const nextSectionMatch = content.slice(nextSectionIndex).match(/^#{1,6}/m);

      if (nextSectionMatch) {
        const endIndex = nextSectionIndex + nextSectionMatch.index;
        return content.slice(content.indexOf(fullMatch), endIndex).trim();
      } else {
        return content.slice(content.indexOf(fullMatch)).trim();
      }
    }

    return null;
  }

  // Validar que la consulta fue realizada antes de producción
  async validateConsultation(agentType, projectId) {
    const consultationKey = `${agentType}_${projectId}`;
    const consultation = this.consultationCache.get(consultationKey);

    if (!consultation) {
      throw new Error(`❌ ${agentType} debe consultar la guía VEO3-MAESTRA antes de proceder con el proyecto ${projectId}`);
    }

    // Verificar que la consulta no sea muy antigua (max 24 horas)
    const consultationTime = new Date(consultation.timestamp);
    const now = new Date();
    const hoursDiff = (now - consultationTime) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      throw new Error(`❌ Consulta de guía expirada para ${agentType}. Se requiere nueva consulta (${hoursDiff.toFixed(1)}h antigua)`);
    }

    logger.info(`✅ Consulta válida para ${agentType} - Proyecto ${projectId}`);
    return consultation;
  }

  // Aplicar checklist específico del agente
  async applyChecklist(agentType, productionData) {
    logger.info(`📋 Aplicando checklist para ${agentType}`);

    const checklistResults = {
      agentType,
      timestamp: new Date().toISOString(),
      checks: [],
      passed: 0,
      failed: 0,
      warnings: [],
      errors: []
    };

    switch (agentType) {
      case 'script_agent':
        await this.scriptAgentChecklist(productionData, checklistResults);
        break;
      case 'art_director':
        await this.artDirectorChecklist(productionData, checklistResults);
        break;
    }

    logger.info(`📊 Checklist ${agentType}: ${checklistResults.passed}/${checklistResults.checks.length} passed`);
    return checklistResults;
  }

  // Checklist específico para Script Agent
  async scriptAgentChecklist(scriptData, results) {
    const checks = [
      {
        name: 'Ana Character Bible Applied',
        check: () => scriptData.characterDescription &&
               scriptData.characterDescription.includes('32-year-old Spanish sports analyst'),
        criticality: 'CRITICAL'
      },
      {
        name: 'Dialogue Timing Valid',
        check: () => {
          if (!scriptData.dialogue) return false;
          const wordCount = scriptData.dialogue.split(' ').length;
          return wordCount <= 18; // 8 seconds max
        },
        criticality: 'HIGH'
      },
      {
        name: 'Format Selected',
        check: () => scriptData.format && [
          'analisis_tactico', 'selfie_vlog', 'entrevista_calle',
          'breaking_news', 'cinematico'
        ].includes(scriptData.format),
        criticality: 'HIGH'
      },
      {
        name: 'Spanish Spain Locale',
        check: () => scriptData.voiceLocale === 'es-ES',
        criticality: 'CRITICAL'
      },
      {
        name: 'Fantasy Context Included',
        check: () => scriptData.fantasyContext &&
               (scriptData.fantasyContext.includes('jornada') ||
                scriptData.fantasyContext.includes('jugador') ||
                scriptData.fantasyContext.includes('Fantasy')),
        criticality: 'MEDIUM'
      }
    ];

    for (const check of checks) {
      const passed = check.check();
      results.checks.push({
        name: check.name,
        passed,
        criticality: check.criticality
      });

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
        if (check.criticality === 'CRITICAL') {
          results.errors.push(`CRITICAL: ${check.name} failed`);
        } else {
          results.warnings.push(`${check.criticality}: ${check.name} failed`);
        }
      }
    }
  }

  // Checklist específico para Art Director
  async artDirectorChecklist(productionData, results) {
    const checks = [
      {
        name: 'VEO3 Configuration Correct',
        check: () => productionData.model === 'veo3_fast' &&
               productionData.seed === 30001 &&
               productionData.aspectRatio === '9:16',
        criticality: 'CRITICAL'
      },
      {
        name: 'Ana Reference Image Set',
        check: () => productionData.referenceImageUrl &&
               productionData.referenceImageUrl.includes('Ana-001.jpeg'),
        criticality: 'CRITICAL'
      },
      {
        name: 'Prompt Includes Ana Bible',
        check: () => productionData.prompt &&
               productionData.prompt.includes('32-year-old Spanish sports analyst'),
        criticality: 'CRITICAL'
      },
      {
        name: 'Camera Movement Specified',
        check: () => productionData.prompt &&
               (productionData.prompt.includes('camera') ||
                productionData.prompt.includes('dolly') ||
                productionData.prompt.includes('tracking')),
        criticality: 'HIGH'
      },
      {
        name: 'Audio Context Defined',
        check: () => productionData.prompt &&
               (productionData.prompt.includes('studio') ||
                productionData.prompt.includes('lighting') ||
                productionData.prompt.includes('audio')),
        criticality: 'MEDIUM'
      }
    ];

    for (const check of checks) {
      const passed = check.check();
      results.checks.push({
        name: check.name,
        passed,
        criticality: check.criticality
      });

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
        if (check.criticality === 'CRITICAL') {
          results.errors.push(`CRITICAL: ${check.name} failed`);
        } else {
          results.warnings.push(`${check.criticality}: ${check.name} failed`);
        }
      }
    }
  }

  // Obtener estadísticas de consultas
  getConsultationStats() {
    const stats = {
      totalConsultations: this.consultationCache.size,
      byAgentType: {},
      recentConsultations: []
    };

    for (const [key, consultation] of this.consultationCache.entries()) {
      const agentType = consultation.agentType;
      stats.byAgentType[agentType] = (stats.byAgentType[agentType] || 0) + 1;

      // Últimas 10 consultas
      if (stats.recentConsultations.length < 10) {
        stats.recentConsultations.push({
          agent: agentType,
          project: consultation.projectId,
          timestamp: consultation.timestamp
        });
      }
    }

    return stats;
  }

  // Limpiar consultas expiradas
  cleanExpiredConsultations() {
    const now = new Date();
    let cleaned = 0;

    for (const [key, consultation] of this.consultationCache.entries()) {
      const consultationTime = new Date(consultation.timestamp);
      const hoursDiff = (now - consultationTime) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        this.consultationCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Limpiadas ${cleaned} consultas expiradas`);
    }

    return cleaned;
  }
}

module.exports = GuideConsultationSystem;