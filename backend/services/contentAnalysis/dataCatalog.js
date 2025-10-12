/**
 * Data Catalog - Inventario Completo de Datos Disponibles
 *
 * Este catálogo documenta TODOS los datos que tenemos disponibles
 * para enriquecer contenido competitivo con información oficial.
 *
 * El agente analizador usa este catálogo para sugerir qué datos
 * usar en cada oportunidad de contenido.
 */

const DATA_CATALOG = {
    // =============================================
    // 1. DATOS DE JUGADORES (API-Sports)
    // =============================================
    players: {
        description: 'Estadísticas detalladas de jugadores La Liga 2025-26',
        endpoint: 'apiFootball.getPlayers()',
        refresh_rate: 'Cada partido',

        datos_disponibles: {
            // Identificación
            identificacion: {
                id: 'ID único del jugador',
                nombre: 'Nombre completo',
                equipo: 'Equipo actual',
                posicion: 'GK, DEF, MID, FWD',
                nacionalidad: 'País',
                edad: 'Edad',
                foto: 'URL imagen oficial'
            },

            // Estadísticas ofensivas
            ofensivas: {
                goles: 'Goles totales temporada',
                goles_ultimos_5: 'Goles últimos 5 partidos',
                asistencias: 'Asistencias totales',
                remates_totales: 'Total remates',
                remates_a_puerta: 'Remates a portería',
                precision_remates: '% remates a puerta',
                key_passes: 'Pases clave (oportunidades)',
                regates_exitosos: 'Regates completados',
                regates_intentados: 'Regates totales',
                tasa_regates: '% éxito regates'
            },

            // Estadísticas defensivas
            defensivas: {
                entradas: 'Tackles realizados',
                entradas_exitosas: 'Tackles ganados',
                intercepciones: 'Intercepciones',
                despejes: 'Clearances',
                bloqueos: 'Bloqueos de remate',
                duelos_ganados: 'Duelos ganados',
                duelos_perdidos: 'Duelos perdidos',
                recuperaciones: 'Balones recuperados'
            },

            // Porteros específico
            porteros: {
                paradas: 'Paradas totales',
                goles_encajados: 'Goles en contra',
                porterias_cero: 'Clean sheets',
                penaltis_parados: 'Penaltis detenidos',
                rating_paradas: 'Calidad de paradas'
            },

            // Disciplina
            disciplina: {
                tarjetas_amarillas: 'Amarillas totales',
                tarjetas_rojas: 'Rojas totales',
                faltas_cometidas: 'Faltas',
                penaltis_cometidos: 'Penaltis provocados',
                fueras_juego: 'Offsides'
            },

            // Forma y rendimiento
            forma: {
                minutos_jugados: 'Minutos totales',
                partidos_jugados: 'Partidos disputados',
                partidos_titular: 'Partidos de titular',
                rating_promedio: 'Rating medio (0-10)',
                puntos_fantasy: 'Puntos Fantasy acumulados',
                puntos_ultimos_5: 'Puntos últimos 5 partidos',
                precio: 'Precio Fantasy actual',
                tendencia_precio: '↑↓ Evolución precio'
            }
        },

        casos_uso: [
            "Validar claims de competidores ('X jugador está en racha')",
            'Comparaciones entre jugadores',
            'Identificar chollos con datos reales',
            'Proyecciones basadas en forma reciente',
            'Análisis tácticos con stats oficiales'
        ]
    },

    // =============================================
    // 2. PARTIDOS Y JORNADAS (API-Sports)
    // =============================================
    fixtures: {
        description: 'Calendario completo La Liga + resultados',
        endpoint: 'apiFootball.getFixtures()',
        refresh_rate: 'Diario',

        datos_disponibles: {
            // Información del partido
            partido: {
                id: 'ID único del partido',
                jornada: 'Número de jornada',
                fecha: 'Fecha y hora',
                estado: 'Scheduled, Live, Finished',
                estadio: 'Nombre del estadio',
                arbitro: 'Árbitro designado'
            },

            // Equipos
            equipos: {
                local: 'Equipo local',
                visitante: 'Equipo visitante',
                resultado: 'Goles local-visitante',
                ganador: 'Local, Visitante, Empate'
            },

            // Estadísticas del partido
            estadisticas: {
                posesion: '% posesión cada equipo',
                remates_totales: 'Remates por equipo',
                remates_puerta: 'Remates a puerta',
                corners: 'Córners',
                faltas: 'Faltas',
                tarjetas_amarillas: 'Amarillas',
                tarjetas_rojas: 'Rojas',
                fueras_juego: 'Offsides'
            },

            // Análisis táctico
            tactico: {
                formacion_local: 'Formación (ej: 4-3-3)',
                formacion_visitante: 'Formación visitante',
                cambios: 'Sustituciones realizadas',
                eventos: 'Goles, tarjetas, subs con timestamps'
            }
        },

        casos_uso: [
            'Análisis post-partido con datos oficiales',
            'Previa de jornada con stats de enfrentamientos',
            'Identificar partidos clave para Fantasy',
            'Análisis de dificultad de calendarios',
            'Prediciones basadas en históricos'
        ]
    },

    // =============================================
    // 3. EQUIPOS (API-Sports)
    // =============================================
    teams: {
        description: '20 equipos La Liga 2025-26',
        endpoint: 'apiFootball.getTeams()',
        refresh_rate: 'Semanal',

        datos_disponibles: {
            // Identificación
            equipo: {
                id: 'ID único del equipo',
                nombre: 'Nombre oficial',
                codigo: 'Código 3 letras (ej: FCB)',
                logo: 'URL logo oficial',
                estadio: 'Nombre estadio',
                ciudad: 'Ciudad',
                fundacion: 'Año fundación'
            },

            // Estadísticas temporada
            temporada: {
                posicion: 'Posición en tabla',
                puntos: 'Puntos totales',
                partidos_jugados: 'PJ',
                victorias: 'Victorias',
                empates: 'Empates',
                derrotas: 'Derrotas',
                goles_favor: 'GF',
                goles_contra: 'GC',
                diferencia_goles: 'Diferencia',
                forma: 'Últimos 5 (WWDLL)'
            },

            // Estadísticas avanzadas
            avanzadas: {
                goles_promedio_favor: 'Goles por partido',
                goles_promedio_contra: 'Goles encajados por partido',
                porterias_cero_casa: 'Clean sheets local',
                porterias_cero_fuera: 'Clean sheets visitante',
                racha_actual: 'Partidos sin perder/ganar'
            }
        },

        casos_uso: [
            'Análisis de defensas sólidas (porterías a cero)',
            'Identificar ataques prolíficos',
            'Calendario de dificultad',
            'Análisis local vs visitante',
            'Comparaciones entre equipos'
        ]
    },

    // =============================================
    // 4. CHOLLOS Y OPORTUNIDADES (Algoritmo Propio)
    // =============================================
    bargains: {
        description: 'Jugadores infravalorados detectados por algoritmo',
        endpoint: 'bargainAnalyzer.getTopBargains()',
        refresh_rate: 'Cada actualización de datos',

        datos_disponibles: {
            // Métricas de chollo
            metricas: {
                valor_score: 'Score valor/precio (0-100)',
                precio_actual: 'Precio Fantasy',
                puntos_esperados: 'Proyección puntos',
                ratio_puntos_precio: 'Puntos por millón gastado',
                ownership: '% propiedad usuarios',
                tendencia: '↑↓ Últimas jornadas'
            },

            // Contexto
            contexto: {
                motivo: 'Por qué es chollo',
                fixtures_proximos: 'Próximos 3-5 rivales',
                dificultad_calendario: 'Fácil, Medio, Difícil',
                lesiones_equipo: 'Compañeros lesionados',
                momento_forma: 'Forma reciente'
            }
        },

        casos_uso: [
            "Contenido 'TOP 5 CHOLLOS esta jornada'",
            'Validar si jugadores mencionados por competencia son realmente chollos',
            'Alineaciones sugeridas con datos',
            'Comparativas precio/valor'
        ]
    },

    // =============================================
    // 5. ANÁLISIS DE CALENDARIO (Fixture Analyzer)
    // =============================================
    calendar_analysis: {
        description: 'Dificultad de próximos partidos por equipo',
        endpoint: 'fixtureAnalyzer.analyzeNextFixtures()',
        refresh_rate: 'Diario',

        datos_disponibles: {
            // Por equipo
            equipo: {
                proximos_5: 'Próximos 5 rivales',
                dificultad_promedio: 'Score 1-5',
                partidos_casa: 'Cuántos en casa',
                partidos_fuera: 'Cuántos fuera',
                rating_dificultad: 'Fácil/Medio/Difícil'
            },

            // Contexto táctico
            tactico: {
                enfrentamientos_top6: 'Partidos vs top 6',
                enfrentamientos_descenso: 'Partidos vs últimos 3',
                densidad_calendario: 'Partidos en X días'
            }
        },

        casos_uso: [
            "Contenido 'Equipos con mejor calendario'",
            'Identificar doble jornadas favorables',
            'Estrategia de fichajes basada en calendario',
            "'Evita estos equipos por calendario complicado'"
        ]
    },

    // =============================================
    // 6. HISTÓRICOS Y TENDENCIAS (Interno)
    // =============================================
    trends: {
        description: 'Análisis de tendencias históricas',
        endpoint: 'fantasyEvolution.getTrends()',
        refresh_rate: 'Post-jornada',

        datos_disponibles: {
            // Tendencias de precio
            precios: {
                subidas_mas_rapidas: 'TOP jugadores subiendo',
                bajadas_mas_rapidas: 'TOP jugadores cayendo',
                volatilidad: 'Jugadores inestables precio'
            },

            // Tendencias de puntos
            puntos: {
                mas_regulares: 'Jugadores consistentes',
                mas_volatiles: 'Alto riesgo/recompensa',
                mejor_racha: 'En forma últimas 5',
                peor_racha: 'Fuera de forma'
            },

            // Ownership
            propiedad: {
                mas_usados: 'Mayor ownership',
                menos_usados: 'Diferenciales (<5%)',
                trending_up: 'Creciendo en ownership',
                trending_down: 'Bajando en ownership'
            }
        },

        casos_uso: [
            "Contenido 'Jugadores que suben imparables'",
            "'Diferenciales para ganar tu liga'",
            "'No caigas en estas trampas (ownership alto, bajo rendimiento)'",
            'Análisis de mercado Fantasy'
        ]
    },

    // =============================================
    // 7. LESIONES Y NOTICIAS (API-Sports)
    // =============================================
    injuries: {
        description: 'Estado de lesiones/suspensiones',
        endpoint: 'apiFootball.getInjuries()',
        refresh_rate: 'Cada 6 horas',

        datos_disponibles: {
            // Por jugador
            jugador: {
                estado: 'Lesionado, Dudoso, Sancionado',
                tipo_lesion: 'Muscular, Ligamento, etc',
                tiempo_estimado: 'Días/semanas fuera',
                fecha_retorno: 'Fecha estimada vuelta',
                probabilidad_jugar: '% probabilidad próximo partido'
            }
        },

        casos_uso: [
            'Alertas de lesiones last-minute',
            "'Cuidado: X jugador duda para la jornada'",
            'Oportunidades por lesiones (suplentes)',
            'Actualizaciones pre-jornada'
        ]
    },

    // =============================================
    // 8. NUESTRO CONTENIDO HISTÓRICO (Database)
    // =============================================
    our_content: {
        description: 'Contenido que YA publicamos nosotros',
        endpoint: 'Database: instagram_posts, videos_published',
        refresh_rate: 'Real-time',

        datos_disponibles: {
            // Contenido publicado
            publicado: {
                temas_cubiertos: 'Temas de últimos 7 días',
                jugadores_mencionados: 'Jugadores destacados',
                formato: 'Short, Reel, Carousel, Thread',
                engagement: 'Likes, shares, comments',
                fecha_publicacion: 'Timestamp'
            }
        },

        casos_uso: [
            'EVITAR repetir contenido reciente',
            'Identificar GAPS (temas no cubiertos)',
            'Medir qué temas funcionaron mejor',
            'Timing: ¿Hace cuánto no hablamos de X jugador?'
        ]
    }
};

// =============================================
// CAPABILITIES - Qué podemos hacer con estos datos
// =============================================
const DATA_CAPABILITIES = {
    // Tipo 1: Validación de claims
    validation: {
        description: 'Validar afirmaciones de competidores con datos oficiales',
        ejemplo: {
            competitor_claim: "'Lewandowski está imparable, 5 goles en 3 partidos'",
            our_validation:
                'apiFootball.getPlayerStats(lewandowski_id) → Verificar goles últimos 3 partidos',
            content_angle: {
                if_true: 'Confirmar + añadir datos adicionales (asistencias, remates, xG)',
                if_false: 'Desmentir con datos reales + ofrecer alternativa correcta',
                if_partial: "Matizar ('Sí, pero...' + contexto)"
            }
        }
    },

    // Tipo 2: Enriquecimiento
    enrichment: {
        description: 'Añadir datos oficiales a temas trending',
        ejemplo: {
            competitor_topic: "'Los mejores chollos para la jornada 8'",
            our_enrichment: [
                'bargainAnalyzer.getTopBargains() → Chollos con algoritmo',
                'fixtureAnalyzer.analyzeNextFixtures() → Dificultad calendario',
                'playerStats → Forma reciente con números'
            ],
            content_angle: 'Versión mejorada con datos objetivos vs opinión'
        }
    },

    // Tipo 3: Diferenciación
    differentiation: {
        description: 'Crear contenido único que ellos NO pueden hacer',
        ejemplos: [
            'Algoritmo de chollos propietario',
            'Proyecciones matemáticas de puntos',
            'Análisis de calendario automatizado',
            'Comparativas multi-variable',
            'Tracking de evolución de precios'
        ]
    },

    // Tipo 4: Timing
    timing: {
        description: 'Publicar antes con datos en tiempo real',
        ejemplos: [
            'Alertas de lesiones (API actualizada cada 6h)',
            'Cambios de precio inmediatos',
            'Post-partido con stats oficiales (1h después)',
            'Previa jornada con datos actualizados (viernes)'
        ]
    }
};

// =============================================
// EXPORT
// =============================================
module.exports = {
    DATA_CATALOG,
    DATA_CAPABILITIES,

    /**
     * Get available data sources for a content topic
     * @param {string} topic - Content topic (ej: "chollos", "lesiones", "calendario")
     * @returns {Array} Relevant data sources
     */
    getRelevantDataSources(topic) {
        const topicMap = {
            chollos: ['players', 'bargains', 'fixtures', 'calendar_analysis'],
            lesiones: ['injuries', 'players', 'teams'],
            calendario: ['fixtures', 'calendar_analysis', 'teams'],
            jugadores: ['players', 'trends', 'bargains'],
            equipos: ['teams', 'fixtures'],
            jornada: ['fixtures', 'players', 'teams'],
            predicciones: ['players', 'trends', 'fixtures', 'calendar_analysis']
        };

        return topicMap[topic.toLowerCase()] || [];
    },

    /**
     * Get data enrichment suggestions for competitor content
     * @param {string} competitorTopic - Topic from competitor
     * @param {Array} competitorClaims - Claims made by competitor
     * @returns {Object} Enrichment plan
     */
    suggestEnrichment(competitorTopic, competitorClaims) {
        // Esta función será llamada por el agente analizador
        // para sugerir qué datos usar
        return {
            data_sources: this.getRelevantDataSources(competitorTopic),
            validation_needed: competitorClaims.map(claim => ({
                claim,
                validation_endpoint: this._suggestValidationMethod(claim)
            })),
            additional_data: this._suggestAdditionalData(competitorTopic)
        };
    },

    _suggestValidationMethod(claim) {
        // Lógica simple para sugerir qué endpoint usar
        if (claim.includes('gol') || claim.includes('marca')) {
            return 'players.ofensivas.goles';
        }
        if (claim.includes('asist')) {
            return 'players.ofensivas.asistencias';
        }
        if (claim.includes('chollo') || claim.includes('barato')) {
            return 'bargains.metricas.valor_score';
        }
        if (claim.includes('calendari') || claim.includes('rival')) {
            return 'calendar_analysis.equipo.proximos_5';
        }
        return 'players.forma.rating_promedio';
    },

    _suggestAdditionalData(topic) {
        // Sugerir datos adicionales relevantes
        const suggestions = {
            chollos: ['Precio actual', 'Puntos últimos 5', 'Dificultad próximos rivales'],
            lesiones: ['Tiempo estimado fuera', 'Impacto en equipo', 'Alternativas disponibles'],
            calendario: ['Partidos casa/fuera', 'Enfrentamientos históricos', 'Forma actual'],
            predicciones: ['Stats recientes', 'Histórico vs rival', 'Condiciones del partido']
        };

        return suggestions[topic.toLowerCase()] || [];
    }
};
