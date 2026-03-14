'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { PinPad } from '@/components/pin-pad';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';

export default function Home() {
  const { firebaseUser, staffUser, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && firebaseUser && staffUser) {
      if (staffUser.role === 'admin' || staffUser.role === 'manager') {
        router.push('/admin');
      } else if (staffUser.role === 'kitchen') {
        router.push('/kds');
      } else {
        router.push('/pos');
      }
    }
  }, [isAuthReady, firebaseUser, staffUser, router]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar sesión');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">POS System</h1>
          <p className="text-slate-500 mb-8">
            Inicia sesión como administrador para configurar el sistema o acceder al punto de venta.
          </p>
          <button
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  if (!staffUser) {
    return <PinPad />;
  }

  return null; // Will redirect in useEffect
}
