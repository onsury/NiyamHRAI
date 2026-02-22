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
  }, [firebaseUser, niyamUser, loading]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!firebaseUser?.emailVerified || !niyamUser?.onboarded) return null;

  return (
    <div className="min-h-screen bg-[#f8f8fa] flex">
      <Sidebar />
      <main className="flex-1 p-8 lg:p-12 ml-0 lg:ml-[240px]">{children}</main>
    </div>
  );
}
