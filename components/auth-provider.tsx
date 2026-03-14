'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/use-auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setAuthReady } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setAuthReady]);

  return <>{children}</>;
}
