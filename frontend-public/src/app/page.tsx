export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-brand-red shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Fantasy La Liga Pro"
                className="w-24 h-24"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">FANTASY</span>
                <span className="text-sm font-bold text-white/90">LA LIGA PRO</span>
              </div>
            </div>
            <button className="px-6 py-2 bg-white hover:bg-gray-100 text-brand-red rounded-lg font-semibold transition-colors shadow-md">
              Comenzar
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full text-brand-green-dark font-medium text-sm">
            <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
            Temporada 2025-26 en vivo
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Domina <span className="text-brand-green">La Liga</span>{' '}
            <span className="text-brand-orange">Fantasy</span>{' '}
            con Datos Reales
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Análisis profesional con IA, estadísticas en tiempo real y predicciones precisas
            para llevarte a la cima de tu liga
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-brand-green hover:bg-brand-green-dark text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg">
              Explorar Análisis
            </button>
            <button className="px-8 py-4 border-2 border-brand-green text-brand-green-dark hover:bg-brand-green/10 rounded-lg font-bold text-lg transition-all">
              Ver Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-brand-green to-brand-green-dark text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">600+</div>
              <div className="text-green-100">Jugadores Analizados</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">75K</div>
              <div className="text-green-100">Requests/Día API</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-green-100">Datos en Tiempo Real</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-green-100">Datos Oficiales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mejora tu Once - Hero Feature */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-green-darker rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Herramienta Estrella</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Mejora tu Once con IA
              </h2>

              <div className="space-y-4 text-green-50">
                <p className="text-xl leading-relaxed">
                  <span className="font-semibold text-white">¿Te preguntas qué jugadores cambiar cada jornada?</span> Nuestro
                  sistema de optimización con IA analiza tu plantilla completa en segundos y te da respuestas concretas.
                </p>

                <p className="text-lg leading-relaxed">
                  El algoritmo evalúa <span className="font-semibold text-white">más de 50 variables por jugador</span>: forma reciente,
                  dificultad de rivales, minutos jugados, lesiones, precio de mercado y predicciones de puntos.
                  Luego compara tu plantilla con miles de combinaciones posibles para encontrar las mejoras óptimas.
                </p>

                <p className="text-lg leading-relaxed">
                  Recibes <span className="font-semibold text-white">recomendaciones priorizadas</span>: qué jugadores vender primero,
                  fichajes con mejor relación valor/precio, y alertas sobre jugadores con bajo rendimiento o partidos difíciles.
                  Todo respetando tu presupuesto y transferencias disponibles.
                </p>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Impacto Real
                  </p>
                  <p className="text-sm">
                    Los usuarios que siguen las recomendaciones de "Mejora tu Once" ganan de media
                    <span className="font-bold text-white"> +8-15 puntos por jornada</span> vs sus plantillas anteriores.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Análisis Instantáneo</p>
                    <p className="text-green-100">Sube tu plantilla y recibe recomendaciones en segundos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Cambios Priorizados</p>
                    <p className="text-green-100">Te decimos exactamente qué jugadores fichar y vender</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Presupuesto Optimizado</p>
                    <p className="text-green-100">Respetamos tu budget y transferencias disponibles</p>
                  </div>
                </div>
              </div>

              <button className="px-8 py-4 bg-white text-brand-green-dark hover:bg-gray-100 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-2xl">
                Probar Ahora Gratis
              </button>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <h3 className="font-bold text-lg">Análisis de tu Plantilla</h3>
                    <span className="px-3 py-1 bg-brand-orange rounded-full text-sm font-semibold">
                      +12 pts predichos
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                      <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Vender: Benzema</p>
                        <p className="text-xs text-red-100">Bajo rendimiento últimas 3 jornadas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                      <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Fichar: Lewandowski</p>
                        <p className="text-xs text-green-100">Alto valor: 8.5 pts predichos próxima jornada</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                      <div className="w-10 h-10 bg-yellow-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Alerta: Pedri</p>
                        <p className="text-xs text-yellow-100">Rival difícil próxima jornada (Real Madrid)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commentator Team */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Nuestro Equipo de <span className="text-brand-green">Comentaristas</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Análisis profesional diario con avatares IA especializados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Ana Martínez - Completed */}
          <div className="group relative p-6 rounded-2xl border-2 border-brand-green bg-gradient-to-br from-white to-brand-green/5 hover:shadow-2xl transition-all">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-brand-green text-white text-xs font-bold rounded-full">
                ACTIVA
              </span>
            </div>

            <div className="w-24 h-24 bg-brand-green/20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center text-white text-3xl font-bold">
                AM
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-1">Ana Martínez</h3>
            <p className="text-sm text-brand-green font-semibold text-center mb-3">"Ana Fantasy"</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Análisis Táctico</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Preview Partidos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Post-Match Analysis</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <span className="font-semibold">Calendario:</span> Martes, Jueves, Sábado
              </p>
            </div>
          </div>

          {/* Carlos González - Placeholder */}
          <div className="group relative p-6 rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all opacity-75">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                PRÓXIMAMENTE
              </span>
            </div>

            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-3xl font-bold">
                CG
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-1 text-gray-700">Carlos González</h3>
            <p className="text-sm text-gray-500 font-semibold text-center mb-3">"Carlos Stats"</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Estadísticas Jugadores</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Consejos Fantasy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Alineaciones Óptimas</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-400 text-center">
                <span className="font-semibold">Calendario:</span> Lunes, Miércoles, Viernes
              </p>
            </div>
          </div>

          {/* Lucía Rodríguez - Placeholder */}
          <div className="group relative p-6 rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all opacity-75">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                PRÓXIMAMENTE
              </span>
            </div>

            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-3xl font-bold">
                LR
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-1 text-gray-700">Lucía Rodríguez</h3>
            <p className="text-sm text-gray-500 font-semibold text-center mb-3">"Lucía Femenina"</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Liga Femenina</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Jugadores Emergentes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cantera La Liga</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-400 text-center">
                <span className="font-semibold">Calendario:</span> Domingo, Miércoles
              </p>
            </div>
          </div>

          {/* Pablo Martín - Placeholder */}
          <div className="group relative p-6 rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all opacity-75">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                PRÓXIMAMENTE
              </span>
            </div>

            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-3xl font-bold">
                PM
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-1 text-gray-700">Pablo Martín</h3>
            <p className="text-sm text-gray-500 font-semibold text-center mb-3">"Pablo GenZ"</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Fantasy Hacks</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Jugadores Sorpresa</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Contenido Viral GenZ</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-400 text-center">
                <span className="font-semibold">Calendario:</span> Jueves, Viernes, Domingo
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-brand-orange">¿Tienes contenido para nuestros comentaristas?</span>{' '}
            Estamos buscando colaboradores para completar el equipo profesional.
          </p>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            ¿Por qué Fantasy La Liga <span className="text-brand-orange">Pro</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Herramientas profesionales que te dan ventaja competitiva real
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Feature 1 */}
          <div className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-green transition-all hover:shadow-xl bg-white">
            <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Estadísticas Avanzadas</h3>
            <p className="text-gray-600 leading-relaxed">
              Análisis profundo de más de 100 variables por jugador. Rendimiento, tendencias,
              forma física y métricas clave actualizadas en tiempo real.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-orange transition-all hover:shadow-xl bg-white">
            <div className="w-14 h-14 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Chollos de la Jornada</h3>
            <p className="text-gray-600 leading-relaxed">
              Algoritmo inteligente que identifica jugadores baratos con alto potencial de puntos.
              Análisis de valor real vs precio de mercado.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-green transition-all hover:shadow-xl bg-white">
            <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Predicciones con IA</h3>
            <p className="text-gray-600 leading-relaxed">
              Inteligencia artificial que predice puntuación próxima jornada con 85% de precisión.
              Basado en machine learning y análisis de patrones históricos.
            </p>
          </div>

          {/* Feature 4 - Mejora tu Once */}
          <div className="group p-8 rounded-2xl border-2 border-brand-orange hover:border-brand-orange transition-all hover:shadow-xl bg-gradient-to-br from-brand-orange/5 to-white">
            <div className="w-14 h-14 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-2xl font-bold">Mejora tu Once</h3>
              <span className="px-2 py-1 bg-brand-orange text-white text-xs font-bold rounded-full">DESTACADO</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Sube tu plantilla actual y recibe recomendaciones instantáneas de cambios.
              El algoritmo identifica jugadores a vender, fichajes prioritarios y maximiza tu presupuesto.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-green transition-all hover:shadow-xl bg-white">
            <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Sistema Oficial de Puntos</h3>
            <p className="text-gray-600 leading-relaxed">
              Calculadora exacta según reglas oficiales La Liga Fantasy. Validación en tiempo real
              de puntuación de tus jugadores.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-orange transition-all hover:shadow-xl bg-white">
            <div className="w-14 h-14 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Contenido Experto con IA</h3>
            <p className="text-gray-600 leading-relaxed">
              Análisis diarios creados por avatares AI expertos. Insights profesionales,
              breaking news y recomendaciones personalizadas.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-green via-brand-green-dark to-brand-green text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para Dominar tu Liga?
          </h2>
          <p className="text-xl mb-10 text-green-100 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya están usando datos profesionales para ganar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-4 bg-white text-brand-green-dark hover:bg-gray-100 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-xl">
              Comenzar Gratis
            </button>
            <button className="px-10 py-4 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-xl">
              Ver Precios
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.svg"
                  alt="Fantasy La Liga Pro"
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-orange">FANTASY</span>
                  <span className="text-xs font-bold text-brand-green">LA LIGA PRO</span>
                </div>
              </div>
              <p className="text-sm mb-4">
                Análisis profesional con IA para La Liga Fantasy. Datos en tiempo real,
                predicciones precisas y ventaja competitiva real.
              </p>
              <p className="text-xs text-gray-500">
                Temporada 2025-26 • API-Sports Ultra Plan • Datos Oficiales
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-green transition-colors">Análisis</a></li>
                <li><a href="#" className="hover:text-brand-green transition-colors">Chollos</a></li>
                <li><a href="#" className="hover:text-brand-green transition-colors">Predicciones</a></li>
                <li><a href="#" className="hover:text-brand-green transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-green transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-green transition-colors">Guías</a></li>
                <li><a href="#" className="hover:text-brand-green transition-colors">Documentación</a></li>
                <li><a href="http://localhost:3000" className="hover:text-brand-orange transition-colors">Dashboard</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2025 Fantasy La Liga Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
