import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'POS System',
  description: 'No-Code Point of Sale System',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
