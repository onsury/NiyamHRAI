'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, firebaseUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('FOUNDER');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, role, orgName);
        // After signup, redirect to verify email
        router.push('/verify-email');
      } else {
        try {
          await signIn(email, password);
          router.push('/dashboard');
        } catch (err: any) {
          if (err.message === 'EMAIL_NOT_VERIFIED') {
            router.push('/verify-email');
            return;
          }
          throw err;
        }
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('This email is already registered. Please sign in.');
      else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setError('Invalid email or password.');
      else if (code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else if (code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else if (err.message === 'EMAIL_NOT_VERIFIED') { /* handled above */ }
      else setError(err.message || 'An unexpected error occurred.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-[40px] shadow-2xl p-10 md:p-12 relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-500/20">N</div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">NIYAM</h1>
            <p className="text-xs font-bold text-amber-500 tracking-widest">NEURAL CLOUD</p>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-full p-1 mb-8">
          <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${!isSignUp ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>Sign In</button>
          <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${isSignUp ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>Create Account</button>
        </div>

        {isSignUp && (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 block">Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(UserRole).map(r => (
                  <button key={r} onClick={() => setRole(r)} className={`py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${role === r ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>{r.replace('_', ' ')}</button>
                ))}
              </div>
            </div>
            {role === 'FOUNDER' && (
              <div className="mb-6">
                <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 block">Organisation Name</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. SmartDNA" className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-bold placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none" />
              </div>
            )}
          </>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="founder@company.com" className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-bold placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-bold placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none" />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold mb-6">{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading || !email || !password || (isSignUp && role === 'FOUNDER' && !orgName)} className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3">
          {loading ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Processing...</> : isSignUp ? 'Create Neural Signature' : 'Sign In'}
        </button>

        {isSignUp && (
          <p className="text-center text-white/20 text-xs mt-6">A verification email will be sent to confirm your identity.</p>
        )}
      </div>
    </div>
  );
}
