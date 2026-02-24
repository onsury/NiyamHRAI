import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, addDoc, serverTimestamp,
  orderBy, limit,
} from 'firebase/firestore';

// === USER OPERATIONS ===
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function updateUser(uid: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'users', uid), data);
}

// === ORGANIZATION OPERATIONS ===
export async function getOrganization(orgId: string) {
  const snap = await getDoc(doc(db, 'organizations', orgId));
  return snap.exists() ? snap.data() : null;
}

export async function updateOrganization(orgId: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'organizations', orgId), data);
}

// === FOUNDER DNA OPERATIONS ===
export async function saveFounderDNA(orgId: string, dna: Record<string, any>) {
  await setDoc(doc(db, 'organizations', orgId, 'founderDNA', 'current'), {
    ...dna,
    updatedAt: serverTimestamp(),
  });
}

export async function getFounderDNA(orgId: string) {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'founderDNA', 'current'));
  return snap.exists() ? snap.data() : null;
}

// === EMPLOYEE DNA OPERATIONS ===
export async function saveEmployeeDNA(uid: string, dna: Record<string, any>) {
  await setDoc(doc(db, 'users', uid, 'employeeDNA', 'current'), {
    ...dna,
    lastUpdated: serverTimestamp(),
  });
}

export async function getEmployeeDNA(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid, 'employeeDNA', 'current'));
  return snap.exists() ? snap.data() : null;
}

// === DNA HISTORY (Immutable) ===
export async function addDNASnapshot(uid: string, snapshot: Record<string, any>) {
  await addDoc(collection(db, 'users', uid, 'dnaHistory'), {
    ...snapshot,
    timestamp: serverTimestamp(),
  });
}

export async function getDNAHistory(uid: string) {
  const q = query(
    collection(db, 'users', uid, 'dnaHistory'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// === CHECK-INS ===
export async function saveCheckIn(uid: string, checkIn: Record<string, any>) {
  await addDoc(collection(db, 'users', uid, 'checkIns'), {
    ...checkIn,
    timestamp: serverTimestamp(),
  });
}

export async function getCheckIns(uid: string, max = 10) {
  const q = query(
    collection(db, 'users', uid, 'checkIns'),
    orderBy('timestamp', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// === HONING SESSIONS ===
export async function saveHoningSession(uid: string, session: Record<string, any>) {
  await addDoc(collection(db, 'users', uid, 'honingSessions'), {
    ...session,
    timestamp: serverTimestamp(),
  });
}

export async function getHoningSessions(uid: string, max = 10) {
  const q = query(
    collection(db, 'users', uid, 'honingSessions'),
    orderBy('timestamp', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// === ORG-WIDE QUERIES ===
export async function getOrgEmployees(orgId: string) {
  const q = query(
    collection(db, 'users'),
    where('organizationId', '==', orgId),
    where('role', '==', 'EMPLOYEE')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function getOrgUsers(orgId: string) {
  const q = query(
    collection(db, 'users'),
    where('organizationId', '==', orgId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// === REPORTS ===
export async function saveReport(uid: string, report: Record<string, any>) {
  await addDoc(collection(db, 'users', uid, 'reports'), {
    ...report,
    generatedAt: serverTimestamp(),
  });
}

export async function getReports(uid: string) {
  const q = query(
    collection(db, 'users', uid, 'reports'),
    orderBy('generatedAt', 'desc'),
    limit(12)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
