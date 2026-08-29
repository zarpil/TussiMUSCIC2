'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import Footer from '../../components/Footer';
import { parseMarkdown } from '../../utils/markdown';

export default function PrivacyPolicy() {
  const router = useRouter();
  const [policy, setPolicy] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.privacyPolicy) {
          setPolicy(data.privacyPolicy);
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
              style={{ background: 'hsl(310 85% 55% / 0.2)' }}>
              <Shield className="h-6 w-6" style={{ color: 'hsl(310 85% 55%)' }} />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                Política de Privacidad
              </h1>
              <p className="text-gray-400 text-sm mt-1">Última actualización: 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-300 animate-fade-in">
            {policy ? (
              <div 
                className="leading-relaxed font-sans text-gray-300 text-base glass p-6 md:p-8 rounded-2xl border border-white/5 markdown-content"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(policy) }}
              />
            ) : (
              <>
                <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
              <p className="leading-relaxed mb-2">Podemos recopilar los siguientes datos mínimos necesarios:</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>ID de usuario de Discord</li>
                <li>Nombre de usuario / Tag de Discord</li>
                <li>ID del servidor (Guild ID)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Uso de la Información</h2>
              <p className="leading-relaxed mb-2">Utilizamos estos datos para:</p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>Funcionalidades del bot (reproducción de música, colas, playlists y favoritos)</li>
                <li>Autenticación segura en el panel web mediante Discord OAuth2</li>
                <li>Configuración de servidores y modos 24/7</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Almacenamiento y Seguridad</h2>
              <p className="leading-relaxed">
                Tus datos se almacenan de forma segura en bases de datos MongoDB protegidas. <strong className="text-white">NO</strong> vendemos ni compartimos información con terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Contacto y Soporte</h2>
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
