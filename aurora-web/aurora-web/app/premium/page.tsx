'use client';

import { useState, useEffect } from 'react';
import PremiumView from '../../components/PremiumView';
import Footer from '../../components/Footer';

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setUser(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white overflow-x-hidden">
      <main className="pt-20 sm:pt-28 pb-20 sm:pb-16 px-2 sm:px-4 w-full max-w-full overflow-x-hidden">
        <PremiumView guildId="" userId={user?.id || ''} />
      </main>
      <Footer />
    </div>
  );
}
