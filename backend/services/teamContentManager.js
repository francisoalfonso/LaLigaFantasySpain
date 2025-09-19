// Sistema de Gestión de Contenido para Equipo de Reporteros
// Maneja rotación, asignación y personalización de contenido

const { REPORTER_TEAM, TEAM_FUNCTIONS } = require('../config/reporterTeam');

class TeamContentManager {
  constructor() {
    this.team = REPORTER_TEAM;
    this.functions = TEAM_FUNCTIONS;
  }

  // Planificar contenido semanal con rotación de equipo
  generateWeeklySchedule(startDate) {
    const schedule = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dayName = this.getDayName(currentDate.getDay());
      const dateStr = currentDate.toISOString().split('T')[0];

      // Contenido principal del día
      const primaryReporter = this.team.content_distribution.daily_rotation[dayName];

      const daySchedule = {
        date: dateStr,
        day: dayName,
        primary_reporter: primaryReporter,
        content_plan: this.generateDayContentPlan(dayName, primaryReporter),
        backup_reporter: this.getBackupReporter(primaryReporter)
      };

      schedule.push(daySchedule);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      week_start: startDate,
      schedule: schedule,
      team_workload: this.calculateTeamWorkload(schedule)
    };
  }

  // Generar plan de contenido específico por día
  generateDayContentPlan(dayName, reporterId) {
    const reporter = this.team.reporters[reporterId];
    if (!reporter) return [];

    const contentTypes = {
      'lunes': [
        { type: 'weekly_preview', duration: '2-3min', specialty: 'match_analysis' },
        { type: 'fantasy_tips', duration: '1-2min', specialty: 'player_stats' }
      ],
      'martes': [
        { type: 'tactical_breakdown', duration: '3-4min', specialty: 'análisis_táctico' },
        { type: 'team_news', duration: '1min', specialty: 'tendencias_liga' }
      ],
      'miércoles': [
        { type: 'midweek_stats', duration: '2min', specialty: 'estadísticas_jugadores' },
        { type: 'women_league_update', duration: '2-3min', specialty: 'liga_femenina' }
      ],
      'jueves': [
        { type: 'match_preview', duration: '3-4min', specialty: 'preview_partidos' },
        { type: 'injury_updates', duration: '1-2min', specialty: 'análisis_táctico' }
      ],
      'viernes': [
        { type: 'lineup_predictions', duration: '2-3min', specialty: 'alineaciones_optimales' },
        { type: 'fantasy_captain_choice', duration: '1min', specialty: 'consejos_fantasy' }
      ],
      'sábado': [
        { type: 'pre_match_analysis', duration: '3-5min', specialty: 'análisis_táctico' },
        { type: 'last_minute_tips', duration: '1min', specialty: 'consejos_fantasy' }
      ],
      'domingo': [
        { type: 'post_match_review', duration: '4-5min', specialty: 'post_match_analysis' },
        { type: 'women_league_highlights', duration: '2-3min', specialty: 'liga_femenina' }
      ]
    };

    const dayContent = contentTypes[dayName] || [];

    // Filtrar contenido por especialidades del reportero
    return dayContent
      .filter(content => reporter.specialties.some(specialty =>
        content.specialty.includes(specialty.replace('_', ' '))
      ))
      .map(content => ({
        ...content,
        reporter: reporterId,
        reporter_name: reporter.name,
        voice_config: reporter.avatar.voice_profile,
        uniform_style: this.team.brand.uniform
      }));
  }

  // Asignar reportero específico para contenido especial
  assignSpecialContent(contentType, eventData) {
    const specialAssignments = {
      'clásico': 'ana_martinez',
      'derbi_madrid': 'ana_martinez',
      'derbi_sevilla': 'ana_martinez',
      'liga_femenina_clásico': 'lucia_rodriguez',
      'mercado_fichajes': 'carlos_gonzalez',
      'lesión_estrella': 'carlos_gonzalez',
      'debut_juvenil': 'lucia_rodriguez',
      'récord_estadístico': 'carlos_gonzalez'
    };

    const assignedReporter = specialAssignments[contentType] || 'ana_martinez';
    const reporter = this.team.reporters[assignedReporter];

    return {
      content_type: contentType,
      assigned_reporter: assignedReporter,
      reporter_details: {
        name: reporter.name,
        nickname: reporter.nickname,
        specialties: reporter.specialties,
        voice_profile: reporter.avatar.voice_profile
      },
      content_angle: this.getContentAngle(contentType, assignedReporter),
      estimated_duration: this.estimateContentDuration(contentType),
      priority: this.getContentPriority(contentType)
    };
  }

  // Personalizar script según reportero
  personalizeScript(baseScript, reporterId, contentType) {
    const reporter = this.team.reporters[reporterId];
    if (!reporter) return baseScript;

    const personality = reporter.personality;
    const nickname = reporter.nickname;

    // Adaptaciones por personalidad
    const adaptations = {
      intro: this.generatePersonalizedIntro(nickname, contentType),
      tone_adjustments: this.adjustToneForReporter(baseScript, personality.tone),
      expertise_focus: this.highlightExpertise(baseScript, reporter.specialties),
      closing: this.generatePersonalizedClosing(nickname, personality.energy)
    };

    return {
      original_script: baseScript,
      personalized_script: this.applyPersonalizations(baseScript, adaptations),
      reporter_config: {
        voice_instructions: this.generateVoiceInstructions(reporter),
        visual_style: this.generateVisualStyle(reporter),
        energy_level: personality.energy
      }
    };
  }

  // Generar instrucciones para HeyGen
  generateHeyGenInstructions(reporterId, contentData) {
    const reporter = this.team.reporters[reporterId];

    return {
      avatar_id: reporter.id,
      voice_config: {
        voice_id: reporter.avatar.voice_profile.id,
        speed: reporter.avatar.voice_profile.speed,
        tone: reporter.avatar.voice_profile.tone,
        accent: reporter.avatar.voice_profile.accent
      },
      visual_config: {
        outfit: reporter.avatar.appearance.outfit,
        style: reporter.avatar.appearance.style,
        background: "fantasy_laliga_studio",
        branding: {
          logo_overlay: true,
          uniform_visible: true,
          team_colors: this.team.brand.colors
        }
      },
      content_metadata: {
        reporter_name: reporter.name,
        content_type: contentData.type,
        duration_target: contentData.duration,
        specialty_tags: reporter.specialties
      }
    };
  }

  // Funciones auxiliares
  getDayName(dayNumber) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[dayNumber];
  }

  getBackupReporter(primaryReporter) {
    const backups = {
      'ana_martinez': 'carlos_gonzalez',
      'carlos_gonzalez': 'ana_martinez',
      'lucia_rodriguez': 'ana_martinez'
    };
    return backups[primaryReporter] || 'ana_martinez';
  }

  calculateTeamWorkload(schedule) {
    const workload = {};

    schedule.forEach(day => {
      const reporter = day.primary_reporter;
      if (!workload[reporter]) {
        workload[reporter] = { days: 0, content_pieces: 0 };
      }
      workload[reporter].days += 1;
      workload[reporter].content_pieces += day.content_plan.length;
    });

    return workload;
  }

  getContentAngle(contentType, reporterId) {
    const reporter = this.team.reporters[reporterId];
    const angles = {
      'ana_martinez': 'enfoque_táctico_profesional',
      'carlos_gonzalez': 'enfoque_estadístico_dinámico',
      'lucia_rodriguez': 'enfoque_inclusivo_moderno'
    };
    return angles[reporterId] || 'enfoque_general';
  }

  estimateContentDuration(contentType) {
    const durations = {
      'clásico': '5-7min',
      'derbi': '4-6min',
      'mercado_fichajes': '3-4min',
      'liga_femenina': '3-4min',
      'debut_juvenil': '2-3min',
      'default': '2-3min'
    };
    return durations[contentType] || durations.default;
  }

  getContentPriority(contentType) {
    const priorities = {
      'clásico': 'muy_alta',
      'derbi': 'alta',
      'mercado_fichajes': 'alta',
      'liga_femenina': 'media_alta',
      'lesión_estrella': 'media_alta',
      'default': 'media'
    };
    return priorities[contentType] || priorities.default;
  }

  generatePersonalizedIntro(nickname, contentType) {
    const intros = {
      'Ana Fantasy': `¡Hola! Soy ${nickname}, y hoy vamos a analizar...`,
      'Carlos Stats': `¡Qué tal! ${nickname} aquí con los datos que necesitas...`,
      'Lucía Femenina': `¡Buenas! ${nickname} al habla, y hoy hablamos de...`
    };
    return intros[nickname] || `Hola, soy ${nickname}...`;
  }

  adjustToneForReporter(script, tone) {
    // Lógica para ajustar el tono del script
    const adjustments = {
      'profesional_cercana': 'más_técnico_pero_accesible',
      'dinámico_entusiasta': 'más_energético_y_directo',
      'fresca_moderna': 'más_inclusivo_y_actual'
    };
    return adjustments[tone] || 'neutral';
  }

  highlightExpertise(script, specialties) {
    // Resalta las áreas de expertise del reportero en el script
    return specialties.join(', ');
  }

  generatePersonalizedClosing(nickname, energy) {
    const closings = {
      'alta': `¡Nos vemos pronto con más análisis! ${nickname} se despide.`,
      'media_alta': `Hasta la próxima, soy ${nickname}. ¡A por la jornada!`,
      'media': `Esto ha sido todo por hoy. ${nickname}, hasta pronto.`
    };
    return closings[energy] || `Hasta pronto, ${nickname}.`;
  }

  applyPersonalizations(baseScript, adaptations) {
    // Aplica todas las personalizaciones al script base
    return `${adaptations.intro}\n\n${baseScript}\n\n${adaptations.closing}`;
  }

  generateVoiceInstructions(reporter) {
    return {
      speaking_style: reporter.personality.tone,
      energy_level: reporter.personality.energy,
      expertise_authority: reporter.specialties[0],
      accent: reporter.avatar.voice_profile.accent
    };
  }

  generateVisualStyle(reporter) {
    return {
      appearance: reporter.avatar.appearance,
      uniform: this.team.brand.uniform,
      background_style: "professional_sports_studio"
    };
  }
}

module.exports = TeamContentManager;