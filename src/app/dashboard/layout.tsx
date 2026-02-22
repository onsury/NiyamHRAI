'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/sidebar';
import { UserRole } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { niyamUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !niyamUser) router.push('/login');
  }, [loading, niyamUser, router]);

  useEffect(() => {
    if (niyamUser && niyamUser.role === UserRole.FOUNDER && !niyamUser.onboarded) router.push('/setup/founder');
    if (niyamUser && niyamUser.role !== UserRole.FOUNDER && !niyamUser.onboarded) router.push('/setup/employee');
  }, [niyamUser, router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center"><div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" /><p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Initializing...</p></div>
    </div>
  );
  if (!niyamUser) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-8 xl:px-12 py-5 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{niyamUser.role} • {niyamUser.level}</p>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block"><p className="text-sm font-bold text-slate-900 leading-none">{niyamUser.displayName}</p><p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Authenticated</p></div>
            <div className="relative"><div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg">{niyamUser.displayName[0].toUpperCase()}</div><div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" /></div>
          </div>
        </header>
        <div className="p-8 xl:p-12 max-w-[1600px] mx-auto pb-32">{children}</div>
      </main>
    </div>
  );
}
