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
  JUNIOR = 'JUNIOR',
}

export interface NiyamUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | string;
  organizationId: string;
  level: OrgLevel | string;
  onboarded: boolean;
  managerId?: string;
  createdAt?: any;
}

export interface Organization {
  name: string;
  industry: string;
  founderId: string;
  createdAt?: any;
}

export interface TraitScore {
  name: string;
  cluster: string;
  score: number;
  description?: string;
}

export interface FounderDNA {
  philosophy: string;
  signatureTraits: TraitScore[];
  negativeConstraints: string[];
  riskAppetite: number;
  innovationBias: number;
  diagnosticComplete: boolean;
  voiceCaptures?: Record<string, string>;
  rawAnswers?: Record<string, number>;
}

export interface EmployeeDNA {
  traits: TraitScore[];
  synergyScore: number;
  driftAreas: string[];
  strengths: string[];
  lastUpdated?: any;
}

export interface CheckIn {
  reflection: string;
  timestamp: any;
  aiResponse?: string;
  synergyDelta?: number;
}

export interface DNASnapshot {
  traits: TraitScore[];
  synergyScore: number;
  timestamp: any;
  trigger: string;
}

export interface HoningScenario {
  scenario: string;
  trait: string;
  difficulty: string;
  options?: string[];
}

export interface HoningSession {
  scenario: string;
  response: string;
  evaluation: string;
  traitTargeted: string;
  scoreChange?: number;
  timestamp: any;
}
