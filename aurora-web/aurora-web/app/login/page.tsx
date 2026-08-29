'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, LogIn, ArrowLeft } from 'lucide-react';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import Footer from '../../components/Footer';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground />
      <CursorGlow />
      
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-50 text-gray-400 hover:text-white transition-colors flex items-center gap-2 glass-strong px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Inicio
      </button>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 glow-pink"
                style={{ background: 'hsl(330 90% 60% / 0.2)' }}>
                <Music className="h-8 w-8" style={{ color: 'hsl(330 90% 60%)' }} />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white mb-2">
                Bienvenido
              </h1>
              <p className="text-gray-400 text-center">
                Inicia sesión para acceder a tu panel de Tussi Music
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-white/90 text-sm font-medium">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tussi-pink transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-white/90 text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tussi-pink transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tussi-pink focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
                style={{
                  background: 'hsl(330 90% 60%)',
                  color: 'white',
                  boxShadow: '0 0 20px hsl(330 90% 60% / 0.4), 0 0 60px hsl(330 90% 60% / 0.15)',
                  animation: 'pulse_glow 2s ease-in-out infinite',
                }}
              >
                <LogIn className="inline mr-2 h-5 w-5" style={{ verticalAlign: 'middle' }} />
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-[hsl(330_90%_60%)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tussi-pink rounded"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
