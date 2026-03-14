'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { PinPad } from '@/components/pin-pad';

export default function Home() {
  const { firebaseUser, staffUser, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Si ya tenemos un usuario del staff identificado, lo mandamos a su panel
    if (isAuthReady && staffUser) {
      if (staffUser.role === 'admin' || staffUser.role === 'manager') {
        router.push('/admin');
      } else if (staffUser.role === 'kitchen') {
        router.push('/kds');
      } else {
        router.push('/pos');
      }
    }
  }, [isAuthReady, staffUser, router]);

  // Pantalla de carga inicial
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // AQUÍ ESTÁ EL CAMBIO CLAVE:
  // Si no hay un staffUser (alguien que haya metido su PIN), 
  // mostramos el PinPad directamente, saltándonos a Google.
  if (!staffUser) {
    return <PinPad />;
  }

  return null; // El useEffect se encarga de redireccionar si ya está autenticado
}
