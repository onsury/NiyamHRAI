'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || '';
  const { firebaseUser, niyamUser, signUp, signOut, loading: authLoading } = useAuth();

  const [state, setState] = useState<'loading' | 'invalid' | 'wrong-account' | 'ready' | 'submitting'>('loading');
  const [invite, setInvite] = useState<any>(null);
  const [errorCode, setErrorCode] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Validate invite + decide where to route based on auth state
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setState('invalid');
      setErrorCode('MISSING_TOKEN');
      return;
    }

    let cancelled = false;
    fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setState('invalid');
          setErrorCode(data.error || 'UNKNOWN');
          return;
        }
        setInvite(data);

        // If user is already signed in, decide where to send them
        if (firebaseUser) {
          const sameEmail = firebaseUser.email?.toLowerCase() === data.email.toLowerCase();
          if (!sameEmail) {
            setState('wrong-account');
            return;
          }
          if (firebaseUser.emailVerified && niyamUser) {
            router.push('/dashboard');
            return;
          }
          if (!firebaseUser.emailVerified) {
            // Re-stash token in case sessionStorage was cleared between sessions
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('niyamhr_pending_invite_token', token);
              sessionStorage.setItem('niyamhr_pending_invite_display_name', firebaseUser.email!.split('@')[0]);
            }
            router.push('/verify-email');
            return;
          }
        }
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[invite-validate] error:', err);
        setState('invalid');
        setErrorCode('NETWORK');
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, firebaseUser, niyamUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!invite) return;
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setState('submitting');
    try {
      await signUp(invite.email, password, invite.role, { inviteToken: token });
      router.push('/verify-email');
    } catch (err: any) {
      console.error('[invite-signup] error:', err);
      const code = err?.code || err?.message || 'UNKNOWN';
      if (code === 'auth/email-already-in-use') {
        setSubmitError('An account already exists for this email. Please sign in instead, then re-open this invite link.');
      } else if (code === 'auth/weak-password') {
        setSubmitError('Password is too weak. Please use 8 or more characters.');
      } else if (code === 'auth/invalid-email') {
        setSubmitError('The invite email is invalid. Please contact your admin.');
      } else {
        setSubmitError('Could not complete signup. Please try again or contact your admin.');
      }
      setState('ready');
    }
  };

  const handleSignOutAndRetry = async () => {
    await signOut();
    if (typeof window !== 'undefined') window.location.reload();
  };

  // ===== Loading =====
  if (state === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ===== Invalid invite =====
  if (state === 'invalid') {
    const errorMessages: Record<string, string> = {
      MISSING_TOKEN: 'No invite token in the link. Please check the URL you were given.',
      NOT_FOUND: 'This invite link is not valid. It may have been mistyped or revoked.',
      ALREADY_USED: 'This invite has already been accepted. If this is your account, please sign in.',
      EXPIRED: 'This invite has expired. Please ask the person who invited you to send a new one.',
      TOO_MANY_REQUESTS: 'Too many requests from your network. Please wait an hour and try again.',
      SERVER_ERROR: 'Something went wrong on our side. Please try again shortly.',
      NETWORK: 'Could not reach the server. Check your internet connection and try again.',
      UNKNOWN: 'An unexpected error occurred. Please contact your admin.',
    };
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        <button onClick={() => router.push('/')} className="mb-10 sm:mb-12 relative z-10 cursor-pointer">
          <img src="/niyamhr-logo.png" alt="NiyamHR" className="h-20 sm:h-24 w-auto object-contain" />
        </button>
        <div className="max-w-lg w-full text-center relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/20">
            <span className="text-3xl sm:text-4xl text-white font-black">!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Invite Not Valid</h1>
          <p className="text-base text-white/40 mb-8 leading-relaxed px-2">
            {errorMessages[errorCode] || errorMessages.UNKNOWN}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  // ===== Wrong account =====
  if (state === 'wrong-account') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        <button onClick={() => router.push('/')} className="mb-10 sm:mb-12 relative z-10 cursor-pointer">
          <img src="/niyamhr-logo.png" alt="NiyamHR" className="h-20 sm:h-24 w-auto object-contain" />
        </button>
        <div className="max-w-lg w-full text-center relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/20">
            <span className="text-3xl sm:text-4xl text-white font-black">?</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Different Account</h1>
          <p className="text-base text-white/40 mb-2">This invite was sent to</p>
          <p className="text-lg font-bold text-amber-500 mb-4 break-all">{invite?.email}</p>
          <p className="text-base text-white/40 mb-8 px-2">
            You&apos;re currently signed in as <span className="text-white font-bold break-all">{firebaseUser?.email}</span>. To accept this invite, sign out first.
          </p>
          <div className="space-y-3 px-2 sm:px-0">
            <button
              onClick={handleSignOutAndRetry}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95"
            >
              Sign out and continue
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Signup form =====
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />

      <button onClick={() => router.push('/')} className="mb-8 sm:mb-10 relative z-10 cursor-pointer">
        <img src="/niyamhr-logo.png" alt="NiyamHR" className="h-16 sm:h-20 w-auto object-contain" />
      </button>

      <div className="max-w-lg w-full relative z-10">
        <div className="text-center mb-8">
          <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">You&apos;ve been invited</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 px-2">
            Join {invite?.orgName || 'the team'}
          </h1>
          {invite?.invitedByName && (
            <p className="text-base text-white/40">Invited by {invite.invitedByName}</p>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center gap-3">
              <span className="text-white/30 shrink-0">Your email</span>
              <span className="font-bold text-white truncate text-right">{invite?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/30">Your role</span>
              <span className="font-bold text-white">
                {invite?.role}
                {invite?.level ? ` · ${invite.level}` : ''}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Create a password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-white/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            Show password
          </label>

          {submitError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === 'submitting' ? 'Creating account...' : 'Accept invitation'}
          </button>

          <p className="text-xs text-white/30 text-center leading-relaxed px-2">
            We&apos;ll send a verification link to <span className="text-white/50 font-bold break-all">{invite?.email}</span>. Click it to complete setup.
          </p>
        </form>
      </div>
    </div>
  );
}
