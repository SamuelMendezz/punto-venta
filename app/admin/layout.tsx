'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { 
  LayoutDashboard, 
  MenuSquare, 
  Grid, 
  Users, 
  Settings, 
  LogOut,
  ChefHat
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { staffUser, logoutStaff, isAuthReady } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthReady && (!staffUser || (staffUser.role !== 'admin' && staffUser.role !== 'manager'))) {
      router.push('/');
    }
  }, [isAuthReady, staffUser, router]);

  if (!staffUser) return null;

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/menu', label: 'Menú', icon: MenuSquare },
    { href: '/admin/tables', label: 'Mesas y Zonas', icon: Grid },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3 text-white font-bold text-xl border-b border-slate-800">
          <ChefHat className="w-8 h-8 text-indigo-500" />
          POS Admin
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {staffUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{staffUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{staffUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logoutStaff();
              router.push('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
