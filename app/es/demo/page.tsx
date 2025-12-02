import Script from "next/script";
import { Brain, Target, Calendar, Zap, MessageSquare, TrendingUp, ArrowRight, Check } from "lucide-react";

export default function DemoEspanol() {
  return (
    <>
      <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50">
        {/* Navigation */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-900">Soluciones de Chat IA</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">Características</a>
                <a href="#demo" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">Demo en Vivo</a>
                <a href="#pricing" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">Precios</a>
              </nav>
              <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-semibold border-2 border-indigo-600 hover:border-indigo-700">
                Obtén Tu Bot
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-indigo-100">
              <Zap className="h-4 w-4" />
              <span>Generación de Leads 24/7 en Piloto Automático</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              Deja de Perder Visitantes.<br />
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Captura Leads 24/7.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Convierte tráfico pasivo en reuniones agendadas. Nuestra IA aprende todo tu sitio web en minutos 
              para responder preguntas, calificar leads y llenar tu calendario—mientras duermes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#demo" className="group bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-3 scroll-smooth">
                Probar Demo en Vivo
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-1 transition-transform">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </a>
              <button className="bg-white text-slate-700 px-8 py-4 rounded-xl hover:bg-slate-50 transition-all font-semibold text-lg border-2 border-slate-200 hover:border-slate-300">
                Ver Características
              </button>
            </div>
            
            {/* Stats */}
            <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">10min</div>
                <div className="text-slate-500 font-medium">Tiempo de Configuración</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">Zero</div>
                <div className="text-slate-500 font-medium">Tiempo de Espera</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">Higher</div>
                <div className="text-slate-500 font-medium">Conversión</div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Lo Que Este Bot Puede Hacer</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Mira las capacidades en acción con nuestra demo en vivo abajo
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="group bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Aprende Tu Negocio al Instante</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Sube el contenido de tu sitio web (como hicimos con NY English Teacher). 
                  El bot aprende tus precios, servicios y biografía en minutos.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Califica Leads en Piloto Automático</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  El bot hace las preguntas correctas para filtrar clientes potenciales antes de que 
                  lleguen a tu calendario.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Agenda Reuniones Directamente</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Guía sin problemas a los visitantes desde "Solo estoy mirando" hasta "Consulta Agendada" 
                  con enlaces directos al calendario.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Context Section */}
        <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-indigo-500/30">
                  <TrendingUp className="h-4 w-4" />
                  <span>Demo en Vivo</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Ejemplo del Mundo Real:<br />
                  El Coach de Inglés
                </h2>
                <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                  Alimentamos este bot con el sitio web de un profesor de inglés real de Nueva York. En menos de 10 minutos, 
                  aprendió sus precios, estilo de enseñanza y biografía. Adelante—intenta confundirlo.
                </p>
                
                <div className="space-y-5 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300 text-lg">
                      Pregunta: <span className="text-white font-bold">"¿Cuánto cuestan las lecciones?"</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300 text-lg">
                      Pregunta: <span className="text-white font-bold">"¿Puedes ayudarme con una entrevista de trabajo?"</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300 text-lg">
                      Pregunta: <span className="text-white font-bold">"¿Por qué debería contratar a Robert?"</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                  <p className="text-sm text-slate-400 mb-2 font-medium">Persona de IA</p>
                  <p className="text-white font-bold text-xl mb-1">Robert Cushman</p>
                  <p className="text-indigo-300 font-medium">NY English Teacher</p>
                  <p className="text-slate-400 text-sm mt-3">Entrenado con más de 50 páginas de contenido</p>
                </div>
              </div>

              {/* Visual Element */}
              <div className="relative">
                <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl p-1">
                  <div className="bg-slate-900 rounded-3xl p-8">
                    <div className="bg-slate-800 rounded-2xl p-6 mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">Asistente de IA</div>
                          <div className="text-slate-400 text-sm">Siempre en línea</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-700/50 rounded-lg p-3 text-slate-300 text-sm">
                          ¿Cuáles son los precios de las clases?
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-slate-300 text-sm">
                          ¿Cómo reservo una sesión?
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-slate-300 text-sm">
                          ¿Qué servicios ofreces?
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-indigo-400 font-bold text-base">
                        👉 Haz clic en la burbuja de chat para probarlo en vivo
                      </p>
                    </div>
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/20 to-purple-600/20 rounded-3xl blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-indigo-600 to-purple-700">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para Convertir Tu Sitio Web en una Máquina de Ventas?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
              No se requiere programación. Solo pega tu URL y tu representante de ventas de IA estará listo para trabajar.
            </p>
            <button className="bg-white text-indigo-600 px-10 py-5 rounded-xl hover:bg-slate-50 transition-all font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105">
              Construir Mi Chatbot Ahora
            </button>
            <p className="text-indigo-200 mt-6 text-sm">No se requiere tarjeta de crédito • Prueba gratuita de 14 días</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-400">© 2025 Soluciones de Chat IA. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Embed Widget Script - Spanish */}
      <Script
        src="/api/embed?v=8"
        id="demo-bot-es"
        strategy="afterInteractive"
        data-welcome-message="👋 ¡Hola! Pregunta lo que quieras aquí"
        data-language="es"
        data-button-color="#4f46e5"
        data-position="bottom-right"
        data-open="false"
        data-show-welcome-message="true"
      />
    </>
  );
}
