'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, niyamUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { router.push('/login'); return; }
    if (!firebaseUser.emailVerified) { router.push('/verify-email'); return; }
    if (!niyamUser?.onboarded) {
      router.push(niyamUser?.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee');
    }
  }, [firebaseUser, niyamUser, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8f8fa] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (!firebaseUser?.emailVerified || !niyamUser?.onboarded) return null;

  return (
    <div className="min-h-screen bg-[#f8f8fa]">
      <Sidebar />
      <main className="p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 lg:pl-[272px] lg:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
