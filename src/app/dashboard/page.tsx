'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const { niyamUser } = useAuth();
  const isFounder = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';
  const [stats, setStats] = useState({ employees: 0, avgSynergy: 50, criticalDrift: 0 });

  useEffect(() => {
    if (!isFounder || !niyamUser) return;
    const fetchStats = async () => {
      try {
        const orgId = niyamUser.organizationId || niyamUser.uid;
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('organizationId', '==', orgId), where('role', '==', 'EMPLOYEE'));
        const snap = await getDocs(q);
        setStats(prev => ({ ...prev, employees: snap.size }));
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [niyamUser, isFounder]);

  if (!niyamUser) return null;

  // Founder/HR Dashboard
  if (isFounder) return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">FOUNDER · {niyamUser.level}</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome back, {niyamUser.displayName}.</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center shadow-sm">
          <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{stats.employees}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Employees</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center shadow-sm">
          <div className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">{stats.avgSynergy}%</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Synergy</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center shadow-sm">
          <div className="text-3xl sm:text-4xl font-black text-red-500 mb-1">{stats.criticalDrift}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Critical Drift</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <button onClick={() => router.push('/dashboard/founder-compass')} className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left hover:shadow-xl transition-all active:scale-[0.98]">
          <span className="text-2xl sm:text-3xl mb-3 sm:mb-4 block">🧭</span>
          <h3 className="text-lg sm:text-xl font-black mb-2">Founder Compass</h3>
          <p className="text-white/50 text-xs sm:text-sm">View your CorePersonaDNA benchmark</p>
        </button>
        <button onClick={() => router.push('/dashboard/hr')} className="bg-gradient-to-br from-amber-500 to-orange-600 text-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left hover:shadow-xl transition-all active:scale-[0.98]">
          <span className="text-2xl sm:text-3xl mb-3 sm:mb-4 block">📊</span>
          <h3 className="text-lg sm:text-xl font-black mb-2">Org Neural Insights</h3>
          <p className="text-black/50 text-xs sm:text-sm">Organisation-wide alignment analytics</p>
        </button>
      </div>
    </div>
  );

  // Employee Dashboard
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-6 sm:mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 sm:w-60 h-40 sm:h-60 bg-amber-500/10 rounded-full -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="px-3 py-1 bg-amber-500 text-black rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest">Active Session</span>
            <span className="text-white/40 text-xs sm:text-sm">· Synergy: 50%</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 sm:mb-3">Welcome back, {niyamUser.displayName}.</h1>
          <p className="text-white/50 text-sm sm:text-base italic">Your primary drift area is <strong className="text-white/70">Awaiting first assessment</strong></p>
          <div className="flex flex-wrap gap-3 mt-5 sm:mt-6">
            <button onClick={() => router.push('/dashboard/honing')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 text-black rounded-full font-bold text-xs sm:text-sm hover:bg-amber-400 transition-all active:scale-95 flex items-center gap-2">
              <span>⚡</span> Enter Honing Lab
            </button>
            <button onClick={() => router.push('/dashboard/checkin')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white rounded-full font-bold text-xs sm:text-sm hover:bg-white/15 transition-all">
              Weekly Check-in
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Growth Vector</p>
          <p className="text-base sm:text-lg font-bold text-white italic">&ldquo;Complete your first weekly check-in to unlock personalised growth insights.&rdquo;</p>
        </div>
        <button onClick={() => router.push('/dashboard/checkin')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-700 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex-shrink-0 active:scale-95">
          Start Now
        </button>
      </div>
    </div>
  );
}
