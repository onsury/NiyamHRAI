'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface NiyamUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  level: string;
  onboarded: boolean;
  managerId?: string;
  createdAt?: any;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  niyamUser: NiyamUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: string,
    opts?: { orgName?: string; inviteToken?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerification: () => Promise<void>;
  resumePendingInvite: () => Promise<void>;
  hasPendingInvite: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// sessionStorage keys for the invite-accept deferred flow (H-1)
const PENDING_INVITE_TOKEN_KEY = 'niyamhr_pending_invite_token';
const PENDING_INVITE_DISPLAY_NAME_KEY = 'niyamhr_pending_invite_display_name';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [niyamUser, setNiyamUser] = useState<NiyamUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: FirebaseUser): Promise<NiyamUser | null> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) return { uid: user.uid, ...userDoc.data() } as NiyamUser;
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await fetchProfile(user);
          setNiyamUser(profile);
        } catch (err) {
          console.error('Profile fetch error:', err);
          setNiyamUser(null);
        }
      } else {
        setNiyamUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    const profile = await fetchProfile(cred.user);
    setNiyamUser(profile);
  };

  const signUp = async (
    email: string,
    password: string,
    role: string,
    opts?: { orgName?: string; inviteToken?: string }
  ) => {
    const orgName = opts?.orgName;
    const inviteToken = opts?.inviteToken;

    // Founder signup -- creates a new org with themselves as the root
    if (role === 'FOUNDER' && !inviteToken) {
      if (!orgName?.trim()) throw new Error('Organisation name required for founder signup.');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, 'organizations', uid), {
        name: orgName, industry: '', founderId: uid, createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', uid), {
        email, displayName: email.split('@')[0], role: 'FOUNDER',
        organizationId: uid, level: 'TOP', onboarded: false, createdAt: serverTimestamp(),
      });
      await sendEmailVerification(cred.user);
      setNiyamUser({
        uid, email, displayName: email.split('@')[0], role: 'FOUNDER',
        organizationId: uid, level: 'TOP', onboarded: false,
      } as NiyamUser);
      return;
    }

    // Invite-based signup (H-1 hardening)
    // Previously: created Auth account, called /api/invite/accept IMMEDIATELY, then sent verification email.
    // That meant /api/invite/accept was always hit with email_verified=false, which opened an attack path
    // where an attacker could claim a victim's invited email without owning the inbox.
    //
    // New flow:
    //   1. Create Auth account
    //   2. sendEmailVerification (fires the email)
    //   3. Stash the invite token in sessionStorage
    //   4. Return -- UI will route to /verify-email
    //   5. On /verify-email, once the user has verified, resumePendingInvite() is called, which
    //      refreshes the ID token (to pick up the new email_verified claim) and calls /api/invite/accept
    if (inviteToken) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, inviteToken);
        sessionStorage.setItem(PENDING_INVITE_DISPLAY_NAME_KEY, email.split('@')[0]);
      }
      // Do NOT setNiyamUser -- profile will be created after verification
      return;
    }

    // Anyone else (e.g. EMPLOYEE / MANAGER / HR_ADMIN without a token) cannot self-signup
    throw new Error('INVITE_REQUIRED');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setNiyamUser(null);
    // Clear any stale pending-invite state so a different user signing up next isn't affected
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_INVITE_DISPLAY_NAME_KEY);
    }
  };

  const resendVerification = async () => {
    if (firebaseUser && !firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await firebaseUser.reload();
      setFirebaseUser({ ...firebaseUser });
      const profile = await fetchProfile(firebaseUser);
      setNiyamUser(profile);
    }
  };

  /**
   * Check if the current session has a pending invite that needs to be resumed
   * after email verification.
   */
  const hasPendingInvite = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  };

  /**
   * Resume an invite that was deferred because email was not yet verified.
   * Call this from /verify-email once firebaseUser.emailVerified === true.
   *
   * Steps:
   *   1. Read the stashed invite token
   *   2. Reload firebaseUser + force-refresh ID token so the email_verified claim is present
   *   3. POST /api/invite/accept with the fresh token
   *   4. On success: clear sessionStorage, load profile, set niyamUser
   */
  const resumePendingInvite = async () => {
    if (typeof window === 'undefined') throw new Error('NO_WINDOW');
    const pendingToken = sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY);
    const displayName = sessionStorage.getItem(PENDING_INVITE_DISPLAY_NAME_KEY) || '';
    if (!pendingToken) throw new Error('NO_PENDING_INVITE');
    if (!firebaseUser) throw new Error('NOT_SIGNED_IN');

    // Sync the latest emailVerified state from Firebase
    await firebaseUser.reload();
    if (!firebaseUser.emailVerified) throw new Error('NOT_YET_VERIFIED');

    // Force-refresh the ID token so it carries the updated email_verified claim
    const idToken = await firebaseUser.getIdToken(true);

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ token: pendingToken, displayName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'INVITE_ACCEPT_FAILED');
    }

    // Success -- clear the pending state and load the profile that was just created
    sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
    sessionStorage.removeItem(PENDING_INVITE_DISPLAY_NAME_KEY);

    setFirebaseUser({ ...firebaseUser });
    const profile = await fetchProfile(firebaseUser);
    setNiyamUser(profile);
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      niyamUser,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      resendVerification,
      resumePendingInvite,
      hasPendingInvite,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
