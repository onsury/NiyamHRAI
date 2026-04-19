'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const { niyamUser } = useAuth();
  const isFounder = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';

  const [orgStats, setOrgStats] = useState({
    employees: 0,
    avgSynergy: 0,
    criticalDrift: 0,
    onboarded: 0,
    pendingCheckIns: 0,
  });
  const [mySynergy, setMySynergy] = useState<number | null>(null);
  const [myDrift, setMyDrift] = useState<string>('Not yet assessed');
  const [myLastCheckIn, setMyLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    if (!niyamUser) return;

    (async () => {
      if (isFounder) {
        try {
          const orgId = niyamUser.organizationId || niyamUser.uid;
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('organizationId', '==', orgId));
          const snap = await getDocs(q);
          const userDocs = snap.docs;

          // Pull employeeDNA for each member to compute avg synergy & drift counts
          let synergies: number[] = [];
          let critical = 0;
          let onboarded = 0;

          await Promise.all(userDocs.map(async (u) => {
            if (u.data().onboarded) onboarded += 1;
            try {
              const ds = await getDoc(doc(db, 'users', u.id, 'employeeDNA', 'current'));
              if (ds.exists()) {
                const s = ds.data().synergyScore;
                if (typeof s === 'number') {
                  synergies.push(s);
                  if (s < 40) critical += 1;
                }
              }
            } catch {}
          }));

          const avg = synergies.length ? Math.round(synergies.reduce((a, x) => a + x, 0) / synergies.length) : 0;

          setOrgStats({
            employees: userDocs.length,
            avgSynergy: avg,
            criticalDrift: critical,
            onboarded,
            pendingCheckIns: 0, // reserved for future rollup
          });
        } catch (err) { console.error(err); }
      } else {
        // Employee/manager view — pull my own synergy
        try {
          const ds = await getDoc(doc(db, 'users', niyamUser.uid, 'employeeDNA', 'current'));
          if (ds.exists()) {
            setMySynergy(ds.data().synergyScore ?? null);
            const drifts: string[] = ds.data().driftAreas || [];
            if (drifts.length) setMyDrift(drifts[0]);
          }
          const ciq = query(
            collection(db, 'users', niyamUser.uid, 'checkIns'),
            orderBy('timestamp', 'desc'),
            limit(1),
          );
          const ci = await getDocs(ciq);
          if (!ci.empty) {
            const t = ci.docs[0].data().timestamp?.toDate?.();
            if (t) setMyLastCheckIn(t);
          }
        } catch (err) { console.error(err); }
      }
    })();
  }, [niyamUser, isFounder]);

  if (!niyamUser) return null;

  // Founder / HR dashboard
  if (isFounder) return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">{niyamUser.role} · {niyamUser.level}</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome back, {niyamUser.displayName}.</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
        <Stat value={orgStats.employees} label="Team size" />
        <Stat value={`${orgStats.avgSynergy}%`} label="Avg synergy" color={orgStats.avgSynergy >= 70 ? 'text-emerald-500' : orgStats.avgSynergy >= 40 ? 'text-amber-500' : 'text-red-500'} />
        <Stat value={orgStats.criticalDrift} label="Critical drift" color={orgStats.criticalDrift > 0 ? 'text-red-500' : 'text-slate-400'} />
        <Stat value={orgStats.onboarded} label="Onboarded" color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Tile
          onClick={() => router.push('/dashboard/team')}
          title="Team Members"
          subtitle="Invite, assign managers, review assessments"
          icon="👥"
          gradient="from-slate-800 to-slate-900"
          textMuted="text-white/50"
        />
        <Tile
          onClick={() => router.push('/dashboard/performance')}
          title="Performance Timeline"
          subtitle="Daily to yearly alignment trends"
          icon="📈"
          gradient="from-indigo-600 to-violet-700"
          textMuted="text-white/50"
        />
        <Tile
          onClick={() => router.push('/dashboard/hr')}
          title="Org Neural Insights"
          subtitle="AI-generated organisation-wide analysis"
          icon="📊"
          gradient="from-amber-500 to-orange-600"
          textMuted="text-black/50"
          textBase="text-black"
        />
      </div>
    </div>
  );

  // Employee / manager dashboard
  const synergyPct = mySynergy ?? 0;
  const synergyColor = mySynergy == null ? 'text-white/50' : mySynergy >= 70 ? 'text-emerald-400' : mySynergy >= 40 ? 'text-amber-400' : 'text-red-400';
  return (
    <div>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-6 sm:mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 sm:w-60 h-40 sm:h-60 bg-amber-500/10 rounded-full -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
            <span className="px-3 py-1 bg-amber-500 text-black rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest">Active Session</span>
            <span className={`text-xs sm:text-sm font-bold ${synergyColor}`}>
              · Synergy: {mySynergy != null ? `${synergyPct}%` : 'Not yet assessed'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 sm:mb-3">Welcome back, {niyamUser.displayName}.</h1>
          <p className="text-white/50 text-sm sm:text-base italic">
            {mySynergy == null
              ? 'Complete your first weekly check-in to begin.'
              : <>Your primary drift area is <strong className="text-white/70">{myDrift}</strong></>}
          </p>
          {myLastCheckIn && (
            <p className="text-white/30 text-xs mt-2">Last check-in {myLastCheckIn.toLocaleDateString()}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-5 sm:mt-6">
            <button onClick={() => router.push('/dashboard/honing')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 text-black rounded-full font-bold text-xs sm:text-sm hover:bg-amber-400 transition-all active:scale-95 flex items-center gap-2">
              <span>⚡</span> Enter Honing Lab
            </button>
            <button onClick={() => router.push('/dashboard/checkin')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white rounded-full font-bold text-xs sm:text-sm hover:bg-white/15 transition-all">
              Weekly Check-in
            </button>
            <button onClick={() => router.push('/dashboard/performance')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white rounded-full font-bold text-xs sm:text-sm hover:bg-white/15 transition-all">
              My Timeline
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Growth Vector</p>
          <p className="text-base sm:text-lg font-bold text-white italic">&ldquo;{mySynergy == null ? 'Complete your first weekly check-in to unlock personalised growth insights.' : 'Submit a reflection to refresh your synergy score.'}&rdquo;</p>
        </div>
        <button onClick={() => router.push('/dashboard/checkin')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-700 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex-shrink-0 active:scale-95">
          Start Now
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label, color = 'text-slate-900' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-sm">
      <div className={`text-2xl sm:text-3xl font-black ${color} mb-1`}>{value}</div>
      <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Tile({ onClick, title, subtitle, icon, gradient, textMuted, textBase = 'text-white' }: {
  onClick: () => void; title: string; subtitle: string; icon: string;
  gradient: string; textMuted: string; textBase?: string;
}) {
  return (
    <button onClick={onClick} className={`bg-gradient-to-br ${gradient} ${textBase} rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left hover:shadow-xl transition-all active:scale-[0.98]`}>
      <span className="text-2xl sm:text-3xl mb-3 sm:mb-4 block">{icon}</span>
      <h3 className="text-lg sm:text-xl font-black mb-2">{title}</h3>
      <p className={`${textMuted} text-xs sm:text-sm`}>{subtitle}</p>
    </button>
  );
}
