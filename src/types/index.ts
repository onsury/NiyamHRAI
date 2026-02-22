export enum UserRole {
  FOUNDER = 'FOUNDER',
  HR_ADMIN = 'HR_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum OrgLevel {
  TOP = 'TOP',
  SENIOR = 'SENIOR',
  MIDDLE = 'MIDDLE',
  KEY = 'KEY',
  GENERAL = 'GENERAL',
}

export interface Trait {
  name: string;
  cluster: string;
  description?: string;
  score: number;
  founderBenchmark: number;
}

export interface FounderDNA {
  philosophy: string;
  signatureTraits: {
    name: string;
    cluster: string;
    score: number;
    description: string;
  }[];
  negativeConstraints?: string[];
}

export interface EmployeeDNA {
  selectedTraits: Trait[];
  synergyScore: number;
  alignmentSummary: string;
  driftAreas: string[];
}

export interface CheckIn {
  id?: string;
  reflection: string;
  aiMentorship: string;
  alignmentScore: number;
  burnoutFlag: boolean;
  sentiment: string;
  driftUpdate: string;
  nextFocusArea: string;
  createdAt: any;
}

export interface HoningScenario {
  scenario: string;
  challenge: string;
  founderTip: string;
}

export interface HoningResult {
  feedback: string;
  synergyDelta: number;
  traitGain: number;
  traitName: string;
}

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

export interface Organization {
  id: string;
  name: string;
  industry: string;
  founderId: string;
  createdAt?: any;
}

export interface DNASnapshot {
  id?: string;
  userId: string;
  dnaSnapshot: EmployeeDNA;
  synergyScore: number;
  trigger: string;
  delta: number;
  timestamp: any;
}
