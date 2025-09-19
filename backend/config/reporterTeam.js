// Configuración del Equipo de Reporteros Fantasy La Liga
// Inspirado en el modelo Odazón - Team uniformado con especialidades

const REPORTER_TEAM = {
  brand: {
    name: "Fantasy La Liga Pro",
    tagline: "El equipo profesional de Fantasy",
    inspiration: "DAZN_model",
    colors: {
      primary: "#0066cc",    // Azul deportivo profesional
      secondary: "#ffffff",  // Blanco limpio
      accent: "#ff3333"      // Rojo para highlights
    },
    uniform: {
      type: "polo_dazn_style",
      color: "#0066cc",      // Azul profesional como DAZN
      logo_position: "chest_left",
      logo_size: "medium",
      style: "reportero_deportivo_profesional",
      details: {
        collar: "polo_classic",
        fit: "profesional_ajustado",
        material: "tejido_deportivo_premium"
      }
    },
    studio_setup: {
      background: "estudio_deportivo_profesional",
      lighting: "profesional_tv",
      graphics: "overlay_estadísticas"
    }
  },

  reporters: {
    ana_martinez: {
      id: "ANA001",
      name: "Ana Martínez",
      nickname: "Ana Fantasy",
      gender: "female",
      age_appearance: 28,

      personality: {
        tone: "profesional_cercana",
        energy: "media_alta",
        expertise: "táctica_y_análisis"
      },

      specialties: [
        "análisis_táctico",
        "preview_partidos",
        "post_match_analysis",
        "tendencias_liga"
      ],

      avatar: {
        version: "2.1",
        voice_profile: {
          id: "es_female_professional_001",
          accent: "español_neutro",
          speed: "media",
          tone: "confiable_experta"
        },
        appearance: {
          style: "profesional_deportiva",
          hair: "castaño_recogido",
          outfit: "polo_azul_la_liga"
        }
      },

      content_schedule: {
        primary: ["martes", "jueves", "sábado"],
        content_types: [
          "preview_jornada",
          "análisis_post_partido",
          "tendencias_semanales"
        ]
      },

      social_persona: {
        instagram_style: "análisis_visual_partidos",
        tiktok_style: "explicaciones_tácticas_rápidas",
        youtube_style: "análisis_profundo_jornada"
      }
    },

    carlos_gonzalez: {
      id: "CAR002",
      name: "Carlos González",
      nickname: "Carlos Stats",
      gender: "male",
      age_appearance: 32,

      personality: {
        tone: "dinámico_entusiasta",
        energy: "alta",
        expertise: "estadísticas_y_datos"
      },

      specialties: [
        "estadísticas_jugadores",
        "consejos_fantasy",
        "alineaciones_optimales",
        "mercado_fichajes"
      ],

      avatar: {
        version: "2.0",
        voice_profile: {
          id: "es_male_energetic_001",
          accent: "español_neutro",
          speed: "media_rápida",
          tone: "entusiasta_experto"
        },
        appearance: {
          style: "deportivo_moderno",
          hair: "corto_moderno",
          outfit: "polo_azul_la_liga"
        }
      },

      content_schedule: {
        primary: ["lunes", "miércoles", "viernes"],
        content_types: [
          "stats_diarias",
          "consejos_fantasy",
          "alineación_jornada"
        ]
      },

      social_persona: {
        instagram_style: "infografías_stats",
        tiktok_style: "tips_fantasy_rápidos",
        youtube_style: "análisis_estadístico_profundo"
      }
    },

    lucia_rodriguez: {
      id: "LUC003",
      name: "Lucía Rodríguez",
      nickname: "Lucía Femenina",
      gender: "female",
      age_appearance: 26,

      personality: {
        tone: "fresca_moderna",
        energy: "alta",
        expertise: "fútbol_femenino_y_cantera"
      },

      specialties: [
        "liga_femenina",
        "jugadores_emergentes",
        "cantera_la_liga",
        "diversidad_fútbol"
      ],

      avatar: {
        version: "2.2",
        voice_profile: {
          id: "es_female_dynamic_001",
          accent: "español_neutro",
          speed: "media",
          tone: "moderna_inspiradora"
        },
        appearance: {
          style: "moderno_deportivo",
          hair: "medio_ondulado",
          outfit: "polo_azul_profesional"
        }
      },

      content_schedule: {
        primary: ["domingo", "miércoles"],
        content_types: [
          "resumen_liga_femenina",
          "talentos_emergentes",
          "diversidad_en_el_fútbol"
        ]
      },

      social_persona: {
        instagram_style: "fútbol_femenino_highlights",
        tiktok_style: "jugadoras_estrella_rápido",
        youtube_style: "análisis_liga_femenina"
      }
    },

    pablo_teen: {
      id: "PAB004",
      name: "Pablo Martín",
      nickname: "Pablo GenZ",
      gender: "male",
      age_appearance: 19,
      target_demographic: "Gen_Z_Fantasy_Players",

      personality: {
        tone: "joven_conectado",
        energy: "muy_alta",
        expertise: "fantasy_trends_y_social_media"
      },

      specialties: [
        "fantasy_hacks",
        "jugadores_sorpresa",
        "memes_fútbol",
        "trends_tiktok",
        "gaming_fantasy",
        "técticas_gen_z"
      ],

      avatar: {
        version: "2.3",
        voice_profile: {
          id: "es_male_young_energetic_001",
          accent: "español_joven",
          speed: "rápida",
          tone: "entusiasta_genz"
        },
        appearance: {
          style: "joven_profesional_casual",
          hair: "moderno_joven",
          outfit: "polo_azul_profesional_estilo_joven",
          accessories: "smartwatch_deportivo"
        }
      },

      content_schedule: {
        primary: ["jueves", "viernes", "domingo"],
        content_types: [
          "fantasy_hacks_rápidos",
          "jugadores_infravalorados",
          "reacciones_jornada",
          "memes_fantasy"
        ]
      },

      social_persona: {
        instagram_style: "stories_rápidas_tips",
        tiktok_style: "fantasy_hacks_viral",
        youtube_style: "reacciones_auténticas_resultados",
        twitch_style: "streaming_fantasy_live"
      },

      unique_value: {
        language_style: "slang_juvenil_controlado",
        content_format: "ultra_rápido_viral",
        audience_connection: "peer_to_peer_genz",
        social_native: true
      }
    }
  },

  content_distribution: {
    daily_rotation: {
      lunes: "carlos_gonzalez",           // Stats inicio semana
      martes: "ana_martinez",             // Análisis táctico
      miércoles: "lucia_rodriguez",       // Liga femenina + cantera
      jueves: ["ana_martinez", "pablo_teen"], // Preview + hacks jóvenes
      viernes: ["carlos_gonzalez", "pablo_teen"], // Fantasy tips + viral content
      sábado: "ana_martinez",             // Análisis pre-partidos
      domingo: ["pablo_teen", "lucia_rodriguez"] // Reacciones Gen Z + resumen femenina
    },

    special_events: {
      clásico: "ana_martinez",
      derbi: "ana_martinez",
      jornada_femenina: "lucia_rodriguez",
      mercado_fichajes: "carlos_gonzalez",
      viral_moment: "pablo_teen",
      meme_trending: "pablo_teen",
      jugador_revelación: "pablo_teen",
      controversy_social: "pablo_teen"
    },

    platform_specialists: {
      youtube_long: "ana_martinez",      // Análisis profundos
      tiktok_viral: "pablo_teen",        // Contenido viral Gen Z
      instagram_stats: "carlos_gonzalez", // Infografías profesionales
      twitch_live: "pablo_teen",         // Streaming en vivo
      stories_quick: "pablo_teen"        // Content rápido y casual
    }
  },

  production_workflow: {
    content_creation: {
      1: "data_extraction",      // API pulls
      2: "script_generation",    // AI content creation
      3: "avatar_assignment",    // Assign to specific reporter
      4: "video_generation",     // HeyGen production
      5: "brand_overlay",        // Add uniform/logo
      6: "quality_check",        // Review
      7: "distribution"          // Social media publish
    },

    quality_standards: {
      uniform_consistency: true,
      voice_coherence: true,
      brand_alignment: true,
      content_accuracy: true
    }
  }
};

// Funciones auxiliares para gestión del equipo
const TEAM_FUNCTIONS = {
  // Seleccionar reportero para contenido específico
  selectReporterForContent(contentType, date) {
    const dayOfWeek = new Date(date).toLocaleLowerCase();

    // Reglas de asignación por tipo de contenido
    const assignmentRules = {
      'tactical_analysis': 'ana_martinez',
      'player_stats': 'carlos_gonzalez',
      'fantasy_tips': 'carlos_gonzalez',
      'women_league': 'lucia_rodriguez',
      'match_preview': 'ana_martinez',
      'young_talents': 'lucia_rodriguez'
    };

    return assignmentRules[contentType] ||
           REPORTER_TEAM.content_distribution.daily_rotation[dayOfWeek] ||
           'ana_martinez'; // Default
  },

  // Obtener configuración de avatar para reportero
  getAvatarConfig(reporterId) {
    const reporter = REPORTER_TEAM.reporters[reporterId];
    if (!reporter) return null;

    return {
      voice: reporter.avatar.voice_profile,
      appearance: reporter.avatar.appearance,
      personality: reporter.personality,
      uniform: REPORTER_TEAM.brand.uniform
    };
  },

  // Generar script personalizado por reportero
  generatePersonalizedScript(reporterId, contentData) {
    const reporter = REPORTER_TEAM.reporters[reporterId];
    const personality = reporter.personality;

    // Adaptar tono y estilo según el reportero
    const styleGuide = {
      tone: personality.tone,
      energy: personality.energy,
      expertise_focus: reporter.specialties,
      intro_style: `Hola, soy ${reporter.nickname}`
    };

    return styleGuide;
  }
};

module.exports = {
  REPORTER_TEAM,
  TEAM_FUNCTIONS
};