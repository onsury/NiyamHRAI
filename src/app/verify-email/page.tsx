'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { firebaseUser, niyamUser, resendVerification, refreshUser, signOut, loading, hasPendingInvite, resumePendingInvite } = useAuth();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const pending = hasPendingInvite();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/login');
  }, [loading, firebaseUser, router]);

  // Redirect if already verified AND has a profile
  useEffect(() => {
    if (firebaseUser?.emailVerified && niyamUser) {
      router.push(niyamUser.onboarded ? '/dashboard' : niyamUser.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee');
    }
  }, [firebaseUser, niyamUser, router]);

  // After verification, run the right post-verify action:
  //   - If there's a pending invite, complete it server-side (H-1 flow)
  //   - Otherwise, refresh the profile (founder flow, already has profile)
  const handlePostVerify = async () => {
    setErrorMsg('');
    try {
      if (pending) {
        await resumePendingInvite();
      } else {
        await refreshUser();
      }
    } catch (err: any) {
      console.error('post-verify error:', err);
      const code = err?.message || 'UNKNOWN';
      if (code === 'NOT_YET_VERIFIED') {
        setErrorMsg('Email not verified yet. Please click the link in your email first.');
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        setErrorMsg('Server rejected the request because your email is not yet verified.');
      } else if (code === 'EMAIL_MISMATCH') {
        setErrorMsg('The invite was sent to a different email address.');
      } else if (code === 'EXPIRED') {
        setErrorMsg('This invite has expired. Please ask your admin to send a new one.');
      } else if (code === 'ALREADY_USED') {
        setErrorMsg('This invite link has already been used.');
      } else {
        setErrorMsg('Something went wrong. Please try again or contact your admin.');
      }
    }
  };

  // Poll for verification every 3 seconds
  useEffect(() => {
    if (!firebaseUser || firebaseUser.emailVerified) return;
    const interval = setInterval(async () => {
      try {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          clearInterval(interval);
          await handlePostVerify();
        }
      } catch (err) { console.error(err); }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const handleResend = async () => {
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) { console.error(err); }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setErrorMsg('');
    try {
      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          await handlePostVerify();
        } else {
          setErrorMsg('Not verified yet. Please click the link in your email, then come back here.');
        }
      }
    } catch (err) { console.error(err); }
    finally { setChecking(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />

      {/* NiyamHR Logo Header */}
      <button onClick={() => router.push('/')} className="mb-10 sm:mb-12 relative z-10 cursor-pointer">
        <img
          src="/niyamhr-logo.png"
          alt="NiyamHR"
          className="h-20 sm:h-24 w-auto object-contain"
        />
      </button>

      <div className="max-w-lg w-full text-center relative z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 sm:mb-10 shadow-2xl shadow-amber-500/20">
          <span className="text-3xl sm:text-4xl">&#9993;</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Check Your Inbox</h1>

        <p className="text-base sm:text-lg text-white/40 mb-2">We&apos;ve sent a verification link to</p>
        <p className="text-lg sm:text-xl font-bold text-amber-500 mb-6 sm:mb-8 break-all">{firebaseUser?.email}</p>

        <p className="text-white/30 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base px-2">
          Click the link in the email to verify your account.
          {pending ? ' Once verified, we\u2019ll complete your team setup.' : ' This page will automatically redirect once verified.'}
        </p>

        {errorMsg ? (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-left mx-2 sm:mx-0">
            <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
          </div>
        ) : null}

        <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
          <button onClick={handleCheckNow} disabled={checking} className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
            {checking ? 'Checking...' : (pending ? 'I\u2019ve Verified \u2014 Complete Setup' : 'I\u2019ve Verified \u2014 Continue')}
          </button>

          <button onClick={handleResend} disabled={resent} className="w-full py-3.5 sm:py-4 bg-white/5 border border-white/10 text-white/60 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-40">
            {resent ? '\u2713 Verification Email Sent!' : 'Resend Verification Email'}
          </button>

          <button onClick={() => signOut()} className="w-full py-3 text-white/20 font-medium text-xs sm:text-sm hover:text-white/40 transition-all">
            Use a different email
          </button>
        </div>

        <div className="mt-10 sm:mt-12 p-4 sm:p-6 bg-white/[0.03] border border-white/[0.06] rounded-xl sm:rounded-2xl text-left mx-2 sm:mx-0">
          <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Didn&apos;t receive it?</p>
          <ul className="text-xs sm:text-sm text-white/30 space-y-2">
            <li>&bull; Check your spam/junk folder</li>
            <li>&bull; Make sure you entered a valid email</li>
            <li>&bull; Wait 1-2 minutes and try resending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
