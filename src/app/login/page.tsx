'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { getFirebaseAuthErrorMessage } from '@/firebase/errors';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (mode === 'signup' && role === UserRole.FOUNDER && (!orgName || orgName.length < 4)) {
      setError('Organization name must be at least 4 characters long.');
      return;
    }
    setLoading(true); setError('');
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password, role, role === UserRole.FOUNDER ? orgName : undefined);
      router.push('/dashboard');
    } catch (err: any) { setError(getFirebaseAuthErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <button onClick={() => router.push('/')} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-[10px] uppercase tracking-[0.2em] z-10">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>Back
      </button>

      <div className="max-w-lg w-full bg-white rounded-[40px] shadow-2xl p-12 md:p-16 relative z-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">N</div>
          <div><h1 className="text-2xl font-black tracking-tighter">NIYAM</h1><p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Neural Cloud</p></div>
        </div>

        <div className="flex gap-2 mb-10 bg-slate-50 rounded-2xl p-1.5">
          {(['login','signup'] as const).map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError('');}} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode===m?'bg-slate-900 text-white shadow-lg':'text-slate-400 hover:text-slate-900'}`}>{m==='login'?'Sign In':'Create Account'}</button>
          ))}
        </div>

        {mode === 'signup' && (
          <div className="mb-8 animate-fade-in-up">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              {[{v:UserRole.FOUNDER,l:'Founder'},{v:UserRole.HR_ADMIN,l:'HR Admin'},{v:UserRole.MANAGER,l:'Manager'},{v:UserRole.EMPLOYEE,l:'Employee'}].map(r=>(
                <button key={r.v} onClick={()=>setRole(r.v)} className={`py-4 px-4 rounded-2xl border-2 text-left transition-all ${role===r.v?'bg-slate-900 border-slate-900 text-white shadow-xl':'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
                  <p className="text-xs font-black uppercase">{r.l}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'signup' && role === UserRole.FOUNDER && (
          <div className="mb-6 animate-fade-in-up">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Organization Name</label>
            <input type="text" value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="e.g. Acme Corp" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
          </div>
        )}

        <div className="mb-5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
        </div>
        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold animate-fade-in">{error}</div>}

        <button onClick={handleSubmit} disabled={loading||!email||!password} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : mode==='login' ? 'Sign In' : 'Create Neural Signature'}
        </button>
      </div>
    </div>
  );
}
