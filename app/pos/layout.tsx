'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { LogOut, ChefHat } from 'lucide-react';
import Link from 'next/link';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { staffUser, logoutStaff, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !staffUser) {
      router.push('/');
    }
  }, [isAuthReady, staffUser, router]);

  if (!staffUser) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/pos" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ChefHat className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-xl tracking-tight">POS System</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/pos/checkout" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Caja
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
              {staffUser.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none">{staffUser.name}</p>
              <p className="text-xs text-slate-400 capitalize mt-1">{staffUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logoutStaff();
              router.push('/');
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
