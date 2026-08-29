'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.siteName) {
          setSiteName(data.siteName);
        }
      })
      .catch(() => {});

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.siteName) {
        setSiteName(customEvent.detail.siteName);
      }
    };

    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <footer className="relative mt-12 px-4 sm:px-6 py-6">
      <div className="relative mx-auto max-w-7xl">
        {/* Simple bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName ? `${siteName}` : 'Tussi Music'}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green rounded px-1"
            >
              Política de Privacidad
            </a>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green rounded px-1"
            >
              Términos del Servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
