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

  const fetchOrCreateProfile = async (user: FirebaseUser): Promise<NiyamUser> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { uid: user.uid, ...userDoc.data() } as NiyamUser;
    }
    // Profile missing — create a basic one so user isn't stuck
    const profile: Omit<NiyamUser, 'uid'> = {
      email: user.email || '',
      displayName: user.email?.split('@')[0] || 'User',
      role: UserRole.FOUNDER,
      organizationId: user.uid,
      level: OrgLevel.TOP,
      onboarded: false,
      createdAt: serverTimestamp(),
    };
    // Also create the org doc
    await setDoc(doc(db, 'organizations', user.uid), {
      name: 'My Organization',
      industry: '',
      founderId: user.uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', user.uid), profile);
    return { uid: user.uid, ...profile };
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
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchOrCreateProfile(cred.user);
        setNiyamUser(profile);
    } catch (err) {
        throw err;
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, orgName?: string) => {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        let organizationId = '';

        if (role === UserRole.FOUNDER && orgName) {
        await setDoc(doc(db, 'organizations', uid), { name: orgName, industry: '', founderId: uid, createdAt: serverTimestamp() });
        organizationId = uid;
        }

        const userProfile: Omit<NiyamUser, 'uid'> = {
        email, displayName: email.split('@')[0], role, organizationId,
        level: role === UserRole.FOUNDER ? OrgLevel.TOP : OrgLevel.MIDDLE,
        onboarded: false, createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', uid), userProfile);
        setNiyamUser({ uid, ...userProfile });
    } catch (err) {
        throw err;
    }
  };

  const signOut = async () => { await firebaseSignOut(auth); setNiyamUser(null); };

  const refreshUser = async () => {
    if (firebaseUser) {
      const profile = await fetchOrCreateProfile(firebaseUser);
      setNiyamUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, niyamUser, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
