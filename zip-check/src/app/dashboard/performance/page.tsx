'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, orderBy, limit,
} from 'firebase/firestore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year';

const PERIODS: { key: Period; label: string; bucketMs: number; bucketCount: number; format: (d: Date) => string }[] = [
  { key: 'day',     label: 'Daily',       bucketMs: 86_400_000,         bucketCount: 30, format: (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
  { key: 'week',    label: 'Weekly',      bucketMs: 7 * 86_400_000,     bucketCount: 12, format: (d) => `W${getWeek(d)}` },
  { key: 'month',   label: 'Monthly',     bucketMs: 30 * 86_400_000,    bucketCount: 12, format: (d) => d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) },
  { key: 'quarter', label: 'Quarterly',   bucketMs: 91 * 86_400_000,    bucketCount: 8,  format: (d) => `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(-2)}` },
  { key: 'half',    label: 'Half-yearly', bucketMs: 182 * 86_400_000,   bucketCount: 6,  format: (d) => `H${d.getMonth() < 6 ? 1 : 2} '${String(d.getFullYear()).slice(-2)}` },
  { key: 'year',    label: 'Yearly',      bucketMs: 365 * 86_400_000,   bucketCount: 5,  format: (d) => String(d.getFullYear()) },
];

function getWeek(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

type Snapshot = { timestamp: any; synergyScore: number; uid: string; userName: string };

export default function PerformancePage() {
  const { niyamUser } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [checkInsPerPeriod, setCheckInsPerPeriod] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const isAdmin = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';
  const orgId = niyamUser?.organizationId || niyamUser?.uid;

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      setLoading(true);

      // Figure out which users' histories to load
      let uids: { uid: string; name: string }[] = [];
      if (isAdmin && orgId) {
        const q = query(collection(db, 'users'), where('organizationId', '==', orgId));
        const snap = await getDocs(q);
        uids = snap.docs.map((d) => ({
          uid: d.id,
          name: d.data().displayName || d.data().email?.split('@')[0] || 'User',
        }));
      } else {
        uids = [{ uid: niyamUser.uid, name: niyamUser.displayName }];
      }

      // Load last 100 dnaHistory entries per user
      const allSnaps: Snapshot[] = [];
      const ciCounts: Record<string, number> = {};

      await Promise.all(uids.map(async ({ uid, name }) => {
        try {
          const q = query(
            collection(db, 'users', uid, 'dnaHistory'),
            orderBy('timestamp', 'desc'),
            limit(100),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            allSnaps.push({
              timestamp: data.timestamp,
              synergyScore: data.synergyScore || 50,
              uid,
              userName: name,
            });
          });
        } catch {}

        try {
          const q = query(
            collection(db, 'users', uid, 'checkIns'),
            orderBy('timestamp', 'desc'),
            limit(200),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const t = d.data().timestamp?.toDate?.() || new Date();
            const key = bucketKeyFor(t, period);
            ciCounts[key] = (ciCounts[key] || 0) + 1;
          });
        } catch {}
      }));

      setSnapshots(allSnaps);
      setCheckInsPerPeriod(ciCounts);
      setLoading(false);
    };
    load();
  }, [niyamUser, period, isAdmin, orgId]);

  // Build bucketed time series
  const chartData = useMemo(() => {
    const conf = PERIODS.find((p) => p.key === period)!;
    const now = Date.now();
    const buckets: { key: string; label: string; start: number; end: number; values: number[] }[] = [];

    for (let i = conf.bucketCount - 1; i >= 0; i--) {
      const end = now - i * conf.bucketMs;
      const start = end - conf.bucketMs;
      buckets.push({
        key: bucketKeyFor(new Date(end), period),
        label: conf.format(new Date(end)),
        start, end,
        values: [],
      });
    }

    snapshots.forEach((s) => {
      const t = s.timestamp?.toDate?.()?.getTime?.() || 0;
      if (!t) return;
      const b = buckets.find((b) => t >= b.start && t < b.end);
      if (b) b.values.push(s.synergyScore);
    });

    return buckets.map((b) => ({
      label: b.label,
      avg: b.values.length ? Math.round(b.values.reduce((a, x) => a + x, 0) / b.values.length) : null,
      checkIns: checkInsPerPeriod[b.key] || 0,
      count: b.values.length,
    }));
  }, [snapshots, period, checkInsPerPeriod]);

  // Per-employee trends (for admins) — top 5 by most recent snapshot
  const perUserSeries = useMemo(() => {
    if (!isAdmin) return [];
    const conf = PERIODS.find((p) => p.key === period)!;
    const now = Date.now();
    const buckets: { label: string; start: number; end: number }[] = [];
    for (let i = conf.bucketCount - 1; i >= 0; i--) {
      const end = now - i * conf.bucketMs;
      buckets.push({ label: conf.format(new Date(end)), start: end - conf.bucketMs, end });
    }

    const byUser: Record<string, { name: string; values: Record<string, number[]> }> = {};
    snapshots.forEach((s) => {
      const t = s.timestamp?.toDate?.()?.getTime?.() || 0;
      if (!t) return;
      const b = buckets.find((b) => t >= b.start && t < b.end);
      if (!b) return;
      if (!byUser[s.uid]) byUser[s.uid] = { name: s.userName, values: {} };
      if (!byUser[s.uid].values[b.label]) byUser[s.uid].values[b.label] = [];
      byUser[s.uid].values[b.label].push(s.synergyScore);
    });

    // Merge into rechart-friendly data
    return buckets.map((b) => {
      const row: any = { label: b.label };
      Object.values(byUser).slice(0, 5).forEach((u) => {
        const arr = u.values[b.label] || [];
        row[u.name] = arr.length ? Math.round(arr.reduce((a, x) => a + x, 0) / arr.length) : null;
      });
      return row;
    });
  }, [snapshots, period, isAdmin]);

  const userNames = useMemo(() => {
    const set = new Set<string>();
    snapshots.forEach((s) => set.add(s.userName));
    return Array.from(set).slice(0, 5);
  }, [snapshots]);

  const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#06b6d4'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Performance Timeline</h1>
        <p className="text-slate-500 text-sm mt-1">{isAdmin ? 'Organisation-wide alignment and check-in activity over time.' : 'Your alignment trajectory over time.'}</p>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              period === p.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">Loading timeline…</div>
      ) : snapshots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-slate-500 text-sm font-semibold mb-2">No synergy history yet</p>
          <p className="text-slate-400 text-xs">Employees build history by submitting weekly check-ins and honing sessions. Once data accumulates, this page will show alignment trends.</p>
        </div>
      ) : (
        <>
          {/* Org/self average trend */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900">{isAdmin ? 'Org-average synergy' : 'Your synergy'}</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{PERIODS.find(p => p.key === period)?.label}</p>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Check-in activity */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Check-in activity</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Reflections submitted</p>
            </div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="checkIns" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-employee lines (admin only) */}
          {isAdmin && userNames.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm mb-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base sm:text-lg font-black text-slate-900">Individual trajectories</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Top 5 by recent activity</p>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={perUserSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {userNames.map((n, i) => (
                      <Line key={n} type="monotone" dataKey={n} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function bucketKeyFor(d: Date, p: Period): string {
  switch (p) {
    case 'day':     return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    case 'week':    return `${d.getFullYear()}-W${getWeek(d)}`;
    case 'month':   return `${d.getFullYear()}-${d.getMonth()}`;
    case 'quarter': return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3)}`;
    case 'half':    return `${d.getFullYear()}-H${d.getMonth() < 6 ? 1 : 2}`;
    case 'year':    return String(d.getFullYear());
  }
}
