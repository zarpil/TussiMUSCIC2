'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import Footer from '../../components/Footer';
import { parseMarkdown } from '../../utils/markdown';

export default function TermsOfService() {
  const router = useRouter();
  const [terms, setTerms] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.termsOfService) {
          setTerms(data.termsOfService);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <CursorGlow />
      
      <button
        onClick={() => router.push('/')}
        className="fixed top-6 left-6 z-50 text-gray-400 hover:text-white transition-colors flex items-center gap-2 glass-strong px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Inicio
      </button>

      <div className="relative z-10 px-6 py-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-3xl p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(330 90% 60% / 0.2)' }}>
              <FileText className="h-6 w-6" style={{ color: 'hsl(330 90% 60%)' }} />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                Términos del Servicio
              </h1>
              <p className="text-gray-400 text-sm mt-1">Última actualización: 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-300 animate-fade-in">
            {terms ? (
              <div 
                className="leading-relaxed font-sans text-gray-300 text-base glass p-6 md:p-8 rounded-2xl border border-white/5 markdown-content"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(terms) }}
              />
            ) : (
              <>
                <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
              <p className="leading-relaxed">
                Al utilizar Tussi Music ("el Bot" o "el Servicio"), aceptas estos Términos de Servicio. Si no estás de acuerdo, debes dejar de usar el bot y el panel inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
              <p className="leading-relaxed">
                Tussi Music es un bot y panel de música para Discord que proporciona reproducción de audio de alta calidad desde diversas fuentes públicas. Incluye funciones de reproducción continua, letras sincronizadas, filtros de sonido e integración web.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Reglas de Uso</h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>No debes abusar, explotar errores ni hacer un mal uso del bot o su infraestructura.</li>
                <li>Debes cumplir las Condiciones de Servicio de Discord.</li>
                <li>No debes utilizar el bot para actividades ilegales o perjudiciales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Disponibilidad</h2>
              <p className="leading-relaxed">
                No garantizamos que el servicio esté disponible en todo momento sin interrupciones. Las funciones pueden modificarse o actualizarse en cualquier momento para mejorar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Contacto</h2>
              <div className="space-y-2 leading-relaxed">
                <p>
                  <strong className="text-white">Servidor de Soporte:</strong>{' '}
                  <a 
                    href="https://discord.gg/jhag8t57eH" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-tussi-pink hover:underline"
                  >
                    https://discord.gg/jhag8t57eH
                  </a>
                </p>
              </div>
            </section>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
