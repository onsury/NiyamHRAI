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
  id: string;
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
  founderBenchmark?: number;
}

export interface FounderDNA {
  philosophy: string;
  signatureTraits: TraitScore[];
  negativeConstraints: string[];
  riskAppetite?: number;
  innovationBias?: number;
  diagnosticComplete?: boolean;
  updatedAt?: any;
}

export interface EmployeeDNA {
  selectedTraits: TraitScore[];
  synergyScore: number;
  alignmentSummary: string;
  driftAreas: string[];
  userId: string;
  version: number;
  updatedAt: any;
}

export interface CheckIn {
  id: string;
  reflection: string;
  aiMentorship: string;
  alignmentScore: number;
  burnoutFlag: boolean;
  sentiment: string;
  driftUpdate: string;
  nextFocusArea: string;
  createdAt: any;
}

export interface DNASnapshot {
  id: string;
  userId: string;
  dnaSnapshot: Partial<EmployeeDNA>;
  synergyScore: number;
  trigger: string;
  delta: number;
  timestamp: any;
}

export interface HoningScenario {
  scenario: string;
  trait: string;
  difficulty: string;
  options?: string[];
}

export interface HoningSession {
  traitName: string;
  scenario: string;
  response: string;
  feedback: string;
  synergyDelta: number;
  traitGain: number;
}
