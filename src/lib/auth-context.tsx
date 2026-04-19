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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [niyamUser, setNiyamUser] = useState<NiyamUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch the NiyamUser profile. Unlike before, this never auto-creates a
   * FOUNDER profile — if no profile exists, we return null and let the caller
   * decide what to do (typically: direct the user to sign up properly).
   */
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

    // Founder signup — creates a new org with themselves as the root
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

    // Invite-based signup — profile is created server-side via /api/invite/accept
    if (inviteToken) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token: inviteToken, displayName: email.split('@')[0] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Surface specific messages so the signup UI can react
        throw new Error(data.error || 'INVITE_ACCEPT_FAILED');
      }
      await sendEmailVerification(cred.user);
      // Profile will be readable on next fetch
      const profile = await fetchProfile(cred.user);
      setNiyamUser(profile);
      return;
    }

    // Anyone else (e.g. EMPLOYEE / MANAGER / HR_ADMIN without a token) cannot self-signup
    throw new Error('INVITE_REQUIRED');
  };

  const signOut = async () => { await firebaseSignOut(auth); setNiyamUser(null); };

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

  return (
    <AuthContext.Provider value={{ firebaseUser, niyamUser, loading, signIn, signUp, signOut, refreshUser, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
