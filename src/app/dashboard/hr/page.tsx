'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOrgUsers, getEmployeeDNA } from '@/lib/firestore-service';
import { useRouter } from 'next/navigation';

interface EmployeeRow {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  level: string;
  synergyScore: number;
  driftAreas: string[];
  strengths: string[];
  onboarded: boolean;
  hrScore?: number;
  mgrScore?: number;
}

export default function HRDashboardPage() {
  const { niyamUser, firebaseUser } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const orgId = niyamUser.organizationId || niyamUser.uid;
        const users = await getOrgUsers(orgId);

        const enriched = await Promise.all(
          users.map(async (u: any) => {
            const dna = await getEmployeeDNA(u.uid).catch(() => null);
            return {
              uid: u.uid,
              displayName: u.displayName || u.email?.split('@')[0] || 'User',
              email: u.email || '',
              role: u.role || 'EMPLOYEE',
              level: u.level || 'MIDDLE',
              synergyScore: dna?.synergyScore || 50,
              driftAreas: dna?.driftAreas || [],
              strengths: dna?.strengths || [],
              onboarded: u.onboarded || false,
              hrScore: u.hrRating?.score,
              mgrScore: u.managerRating?.score,
            };
          })
        );

        setEmployees(enriched);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [niyamUser]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const avgSynergy = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.synergyScore, 0) / employees.length) : 50;
      const topPerformer = [...employees].sort((a, b) => b.synergyScore - a.synergyScore)[0];

      const idToken = await firebaseUser?.getIdToken();
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reportType: 'founder_quarterly',
          data: {
            orgSize: employees.length,
            overallSynergy: avgSynergy,
            departments: [...new Set(employees.map(e => e.level))],
            hiringGaps: employees.flatMap(e => e.driftAreas).slice(0, 5),
            culturalTrend: avgSynergy >= 60 ? 'Positive' : 'Needs Attention',
            topPerformer: topPerformer?.displayName || 'N/A',
            atRisk: employees.filter(e => e.synergyScore < 40).map(e => e.displayName).join(', ') || 'None',
          },
        }),
      });
      const data = await res.json();
      setReport(data);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const avgSynergy = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.synergyScore, 0) / employees.length) : 0;
  const criticalDrift = employees.filter(e => e.synergyScore < 40).length;
  const onboarded = employees.filter(e => e.onboarded).length;

  // Variance alerts â€” where AI disagrees with HR or Manager by >25 points
  const varianceAlerts = employees
    .map(e => {
      const vHR = e.hrScore != null ? Math.abs(e.synergyScore - e.hrScore) : null;
      const vMgr = e.mgrScore != null ? Math.abs(e.synergyScore - e.mgrScore) : null;
      const worst = Math.max(vHR || 0, vMgr || 0);
      return { ...e, vHR, vMgr, worst };
    })
    .filter(e => (e.vHR != null && e.vHR > 25) || (e.vMgr != null && e.vMgr > 25))
    .sort((a, b) => b.worst - a.worst);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Org Neural Insights</h1>
          <p className="text-slate-500 text-sm mt-1">Organisation-wide alignment analytics.</p>
        </div>
        <button onClick={generateReport} disabled={generating} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 flex items-center gap-2 self-start">
          {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generatingâ€¦</> : 'ðŸ“Š Generate Report'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{employees.length}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Total Team</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-amber-500">{avgSynergy}%</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Synergy</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-red-500">{criticalDrift}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Critical Drift</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-emerald-500">{onboarded}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Onboarded</div>
        </div>
      </div>

      {/* Variance alerts â€” the three-way differentiator */}
      {varianceAlerts.length > 0 && (
        <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">Three-way Variance Alert</p>
              <h2 className="text-lg sm:text-xl font-black">{varianceAlerts.length} {varianceAlerts.length === 1 ? 'assessment disagrees' : 'assessments disagree'} â€” investigate</h2>
              <p className="text-white/70 text-sm mt-1">AI synergy differs from HR rating or Manager rating by more than 25 points.</p>
            </div>
            <button onClick={() => router.push('/dashboard/team')} className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              Team page â†’
            </button>
          </div>
          <div className="space-y-2">
            {varianceAlerts.slice(0, 5).map(e => (
              <div key={e.uid} className="bg-white/10 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{e.displayName}</p>
                  <p className="text-[11px] text-white/60">{e.role.replace('_', ' ')} Â· {e.level}</p>
                </div>
                <div className="flex gap-3 text-center">
                  <Pill label="AI" value={e.synergyScore} />
                  <Pill label="HR" value={e.hrScore} />
                  <Pill label="Mgr" value={e.mgrScore} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Report */}
      {report && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-black mb-2">{report.title}</h2>
          <p className="text-white/70 text-sm mb-4">{report.summary}</p>
          {(report.sections || []).map((s: any, i: number) => (
            <div key={i} className="mb-4">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-widest mb-1">{s.heading}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
          {report.actionItem && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">#1 Action Item</p>
              <p className="text-sm font-bold text-white">{report.actionItem}</p>
            </div>
          )}
        </div>
      )}

      {/* Employee Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900">Employee Grid</h2>
          <button onClick={() => router.push('/dashboard/team')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            Manage team â†’
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No employees yet. Invite team members from the Team page.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {employees.map(emp => (
              <div key={emp.uid} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-slate-50 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{emp.displayName}</p>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{emp.role}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{emp.level}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                  {emp.driftAreas.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {emp.driftAreas.slice(0, 3).map((d, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-bold">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-xl font-black ${emp.synergyScore >= 70 ? 'text-emerald-500' : emp.synergyScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{emp.synergyScore}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">AI Synergy</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${emp.onboarded ? 'bg-emerald-500' : 'bg-amber-400'}`} title={emp.onboarded ? 'Onboarded' : 'Pending'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="min-w-[48px]">
      <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</div>
      <div className="text-base font-black">{value != null ? `${value}%` : 'â€”'}</div>
    </div>
  );
}
