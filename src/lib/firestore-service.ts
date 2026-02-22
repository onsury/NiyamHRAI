import {
  doc, getDoc, setDoc, updateDoc, collection, query,
  orderBy, limit, getDocs, addDoc, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FounderDNA, EmployeeDNA, CheckIn, NiyamUser, Organization, DNASnapshot } from '@/types';

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, 'organizations', orgId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Organization : null;
}

export async function updateOrganization(orgId: string, data: Partial<Organization>) {
  await updateDoc(doc(db, 'organizations', orgId), data);
}

export async function getFounderDNA(orgId: string): Promise<FounderDNA | null> {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'founderDNA', 'current'));
  return snap.exists() ? snap.data() as FounderDNA : null;
}

export async function saveFounderDNA(orgId: string, dna: FounderDNA) {
  await setDoc(doc(db, 'organizations', orgId, 'founderDNA', 'current'), { ...dna, updatedAt: serverTimestamp() });
}

export async function getCompetencyFramework(orgId: string) {
  const snap = await getDocs(collection(db, 'organizations', orgId, 'competencyFramework'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUser(uid: string): Promise<NiyamUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } as NiyamUser : null;
}

export async function updateUser(uid: string, data: Partial<NiyamUser>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getOrgEmployees(orgId: string): Promise<NiyamUser[]> {
  const q = query(collection(db, 'users'), where('organizationId', '==', orgId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as NiyamUser));
}

export async function getEmployeeDNA(userId: string): Promise<EmployeeDNA | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'employeeDNA', 'current'));
  return snap.exists() ? snap.data() as EmployeeDNA : null;
}

export async function saveEmployeeDNA(userId: string, dna: EmployeeDNA) {
  await setDoc(doc(db, 'users', userId, 'employeeDNA', 'current'), { ...dna, userId, updatedAt: serverTimestamp() });
}

export async function getDNAHistory(userId: string, max = 10): Promise<DNASnapshot[]> {
  const q = query(collection(db, 'users', userId, 'dnaHistory'), orderBy('timestamp', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DNASnapshot));
}

export async function addDNASnapshot(userId: string, snapshot: Omit<DNASnapshot, 'id'>) {
  await addDoc(collection(db, 'users', userId, 'dnaHistory'), { ...snapshot, timestamp: serverTimestamp() });
}

export async function getCheckIns(userId: string, max = 6): Promise<CheckIn[]> {
  const q = query(collection(db, 'users', userId, 'checkIns'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckIn));
}

export async function saveCheckIn(userId: string, checkIn: Omit<CheckIn, 'id'>) {
  await addDoc(collection(db, 'users', userId, 'checkIns'), { ...checkIn, createdAt: serverTimestamp() });
}

export async function saveHoningSession(userId: string, session: any) {
  await addDoc(collection(db, 'users', userId, 'honingSessions'), { ...session, createdAt: serverTimestamp() });
}

export async function getOrgAnalytics(orgId: string) {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'orgAnalytics', 'current'));
  return snap.exists() ? snap.data() : null;
}
