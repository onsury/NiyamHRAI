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
  signUp: (email: string, password: string, role: string, orgName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [niyamUser, setNiyamUser] = useState<NiyamUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (user: FirebaseUser): Promise<NiyamUser> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { uid: user.uid, ...userDoc.data() } as NiyamUser;
    }
    const profile = {
      email: user.email || '',
      displayName: user.email?.split('@')[0] || 'User',
      role: 'FOUNDER',
      organizationId: user.uid,
      level: 'TOP',
      onboarded: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'organizations', user.uid), {
      name: 'My Organization', industry: '', founderId: user.uid, createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', user.uid), profile);
    return { uid: user.uid, ...profile } as NiyamUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await fetchOrCreateProfile(user);
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
    const profile = await fetchOrCreateProfile(cred.user);
    setNiyamUser(profile);
  };

  const signUp = async (email: string, password: string, role: string, orgName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    let organizationId = '';

    if (role === 'FOUNDER' && orgName) {
      await setDoc(doc(db, 'organizations', uid), { name: orgName, industry: '', founderId: uid, createdAt: serverTimestamp() });
      organizationId = uid;
    }

    const userProfile = {
      email, displayName: email.split('@')[0], role, organizationId,
      level: role === 'FOUNDER' ? 'TOP' : 'MIDDLE',
      onboarded: false, createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), userProfile);
    setNiyamUser({ uid, ...userProfile } as NiyamUser);

    // Send verification email
    await sendEmailVerification(cred.user);
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
      const profile = await fetchOrCreateProfile(firebaseUser);
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
