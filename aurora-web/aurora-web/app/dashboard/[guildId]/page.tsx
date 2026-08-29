'use client';

import ModernPlayer from '../../../components/ModernPlayer';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  
  const [userId, setUserId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get authenticated user from session
        const userRes = await fetch('/api/auth/user', { credentials: 'include' });
        const userData = await userRes.json();
        
        if (userData.id) {
          setUserId(userData.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('discordUserId', userData.id);
            if (guildId) localStorage.setItem('aurora_active_guildId', guildId);
            window.dispatchEvent(new CustomEvent('aurora_guild_changed', { detail: { guildId } }));
          }
          setIsReady(true);
        } else {
          // Not authenticated - redirect to home
          setError('Por favor, inicia sesión con Discord primero');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Error de autenticación. Redirigiendo...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    };

    checkAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <div className="text-gray-400">Redirigiendo a la página principal...</div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando reproductor...</div>
      </div>
    );
  }

  return <ModernPlayer guildId={guildId} userId={userId} />;
}
