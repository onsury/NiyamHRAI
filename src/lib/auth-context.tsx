'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { NiyamUser, UserRole, OrgLevel } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  niyamUser: NiyamUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, orgName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [niyamUser, setNiyamUser] = useState<NiyamUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNiyamUser = async (uid: string): Promise<NiyamUser | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) return { uid, ...userDoc.data() } as NiyamUser;
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await fetchNiyamUser(user.uid);
        setNiyamUser(profile);
      } else {
        setNiyamUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchNiyamUser(cred.user.uid);
    setNiyamUser(profile);
  };

  const signUp = async (email: string, password: string, role: UserRole, orgName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    let organizationId = '';

    if (role === UserRole.FOUNDER && orgName) {
      const orgRef = doc(db, 'organizations', uid);
      await setDoc(orgRef, { name: orgName, industry: '', founderId: uid, createdAt: serverTimestamp() });
      organizationId = uid;
    }

    const userProfile: Omit<NiyamUser, 'uid'> = {
      email, displayName: email.split('@')[0], role, organizationId,
      level: role === UserRole.FOUNDER ? OrgLevel.TOP : OrgLevel.MIDDLE,
      onboarded: false, createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), userProfile);
    setNiyamUser({ uid, ...userProfile });
  };

  const signOut = async () => { await firebaseSignOut(auth); setNiyamUser(null); };

  const refreshUser = async () => {
    if (firebaseUser) { const profile = await fetchNiyamUser(firebaseUser.uid); setNiyamUser(profile); }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, niyamUser, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
