'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const ROLES = ['FOUNDER', 'EMPLOYEE', 'HR_ADMIN', 'MANAGER'];

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, firebaseUser, niyamUser, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>('FOUNDER');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invite state
  const [inviteToken, setInviteToken] = useState<string>('');
  const [invite, setInvite] = useState<{ orgName: string; role: string; invitedByName: string } | null>(null);
  const [inviteError, setInviteError] = useState<string>('');
  const [validating, setValidating] = useState(false);

  // Read invite token from URL
  useEffect(() => {
    const token = searchParams?.get('invite');
    if (!token) return;
    setInviteToken(token);
    setIsSignUp(true);
    setValidating(true);
    (async () => {
      try {
        const res = await fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setInviteError(
            data.error === 'EXPIRED' ? 'This invite has expired.'
              : data.error === 'ALREADY_USED' ? 'This invite has already been used.'
              : data.error === 'NOT_FOUND' ? 'Invite not found.'
              : 'Invite could not be loaded.'
          );
          return;
        }
        setInvite({ orgName: data.orgName, role: data.role, invitedByName: data.invitedByName });
        setEmail(data.email);
        setRole(data.role);
      } catch (err: any) {
        setInviteError('Could not validate invite. Please check the link.');
      } finally { setValidating(false); }
    })();
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && firebaseUser && firebaseUser.emailVerified && niyamUser) {
      router.push(
        niyamUser.onboarded
          ? '/dashboard'
          : niyamUser.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee'
      );
    }
  }, [loading, firebaseUser, niyamUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, role, {
          orgName: role === 'FOUNDER' ? orgName : undefined,
          inviteToken: inviteToken || undefined,
        });
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
      else if (code === 'auth/user-not-found') setError('No account found with this email.');
      else if (err.message === 'INVITE_REQUIRED') setError('You need an invitation link to sign up with this role. Ask your admin to send one.');
      else if (err.message === 'EMAIL_MISMATCH') setError('This invite is for a different email address.');
      else if (err.message === 'EXPIRED' || err.message === 'ALREADY_USED') setError('This invitation is no longer valid.');
      else if (err.message !== 'EMAIL_NOT_VERIFIED') setError(err.message || 'An unexpected error occurred.');
    } finally { setSubmitting(false); }
  };

  const inviteLocked = Boolean(invite);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-3xl sm:rounded-[40px] shadow-2xl p-6 sm:p-10 md:p-12 relative z-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-3 mb-8 sm:mb-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shadow-amber-500/20">N</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">NIYAM</h1>
            <p className="text-[10px] font-bold text-amber-500 tracking-widest">NEURAL CLOUD</p>
          </div>
        </button>

        {/* Invite banner */}
        {validating && (
          <div className="mb-5 p-4 bg-white/5 rounded-xl text-white/60 text-xs">Validating invitation…</div>
        )}
        {inviteError && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-bold">{inviteError}</div>
        )}
        {invite && !inviteError && (
          <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Invited by {invite.invitedByName}</p>
            <p className="text-sm text-white font-semibold">Join <span className="text-amber-400">{invite.orgName}</span> as <span className="text-amber-400">{invite.role.replace('_', ' ')}</span></p>
          </div>
        )}

        {/* Sign in / Sign up toggle — hidden when invite forces signup */}
        {!inviteLocked && (
          <div className="flex bg-white/5 rounded-full p-1 mb-6 sm:mb-8">
            <button onClick={() => { setIsSignUp(false); setError(''); }} className={`flex-1 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all ${!isSignUp ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>Sign In</button>
            <button onClick={() => { setIsSignUp(true); setError(''); }} className={`flex-1 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all ${isSignUp ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>Create Account</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && !inviteLocked && (
            <>
              <div className="mb-5">
                <label className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Your Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button type="button" key={r} onClick={() => setRole(r)} className={`py-2.5 sm:py-3 rounded-xl border-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${role === r ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>{r.replace('_', ' ')}</button>
                  ))}
                </div>
                {role !== 'FOUNDER' && (
                  <p className="mt-3 text-[11px] text-white/40 leading-relaxed">
                    Non-founder signups require an invitation link from an admin. Ask your founder or HR admin to send you one.
                  </p>
                )}
              </div>
              {role === 'FOUNDER' && (
                <div className="mb-5">
                  <label className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Organisation Name</label>
                  <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. SmartDNA" className="w-full p-3 sm:p-4 bg-white/5 border-2 border-white/10 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none" />
                </div>
              )}
            </>
          )}

          <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
            <div>
              <label className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => !inviteLocked && setEmail(e.target.value)}
                placeholder="founder@company.com"
                required
                readOnly={inviteLocked}
                className={`w-full p-3 sm:p-4 bg-white/5 border-2 border-white/10 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none ${inviteLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="w-full p-3 sm:p-4 pr-14 bg-white/5 border-2 border-white/10 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.543-7z" /></svg>)}</button></div>
            </div>
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl text-red-400 text-xs sm:text-sm font-bold mb-5 sm:mb-6">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password || (isSignUp && role === 'FOUNDER' && !inviteLocked && !orgName) || Boolean(inviteError)}
            className="w-full py-4 sm:py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {submitting ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Processing...</> : isSignUp ? (inviteLocked ? 'Accept invite' : 'Create Account') : 'Sign In'}
          </button>
        </form>

        {isSignUp && (
          <p className="text-center text-white/20 text-[10px] sm:text-xs mt-5 sm:mt-6">A verification email will be sent to confirm your identity.</p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <LoginPageInner />
    </Suspense>
  );
}
