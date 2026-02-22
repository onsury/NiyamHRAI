'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { firebaseUser, niyamUser, resendVerification, refreshUser, signOut } = useAuth();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  // Poll for verification every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          clearInterval(interval);
          await refreshUser();
          router.push(niyamUser?.onboarded ? '/dashboard' : niyamUser?.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
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
    try {
      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          await refreshUser();
          router.push(niyamUser?.onboarded ? '/dashboard' : niyamUser?.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee');
        }
      }
    } catch (err) { console.error(err); }
    finally { setChecking(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-lg w-full text-center relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-amber-500/20">
          <span className="text-4xl">✉️</span>
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Check Your Inbox</h1>
        
        <p className="text-lg text-white/40 mb-2">We&apos;ve sent a verification link to</p>
        <p className="text-xl font-bold text-amber-500 mb-8">{firebaseUser?.email}</p>
        
        <p className="text-white/30 mb-10 leading-relaxed">Click the link in the email to verify your account. This page will automatically redirect once verified.</p>

        <div className="space-y-4">
          <button onClick={handleCheckNow} disabled={checking} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
            {checking ? 'Checking...' : 'I\'ve Verified — Continue'}
          </button>
          
          <button onClick={handleResend} disabled={resent} className="w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-40">
            {resent ? '✓ Verification Email Sent!' : 'Resend Verification Email'}
          </button>
          
          <button onClick={signOut} className="w-full py-3 text-white/20 font-medium text-sm hover:text-white/40 transition-all">
            Use a different email
          </button>
        </div>

        <div className="mt-12 p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-left">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Didn&apos;t receive it?</p>
          <ul className="text-sm text-white/30 space-y-2">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you entered a valid email</li>
            <li>• Wait 1-2 minutes and try resending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
