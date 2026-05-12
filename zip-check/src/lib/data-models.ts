// NiyamAI Complete Data Model Reference
// This file documents the Firestore schema

/*
COLLECTIONS & SUBCOLLECTIONS:

users/{uid}
├── email: string
├── displayName: string
├── role: 'FOUNDER' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE'
├── organizationId: string
├── level: 'TOP' | 'SENIOR' | 'MIDDLE' | 'JUNIOR'
├── onboarded: boolean
├── managerId?: string
├── createdAt: timestamp
│
├── /employeeDNA/current
│   ├── traits: TraitScore[]
│   ├── synergyScore: number (0-100)
│   ├── driftAreas: string[]
│   ├── strengths: string[]
│   └── lastUpdated: timestamp
│
├── /dnaHistory/{id} (IMMUTABLE)
│   ├── traits: TraitScore[]
│   ├── synergyScore: number
│   ├── trigger: string ('onboarding'|'checkin'|'honing'|'monthly')
│   └── timestamp: timestamp
│
├── /checkIns/{id} (IMMUTABLE)
│   ├── reflection: string
│   ├── aiResponse: string
│   ├── synergyDelta: number (-5 to +5)
│   ├── driftAreas: string[]
│   ├── strengths: string[]
│   └── timestamp: timestamp
│
├── /honingSessions/{id} (IMMUTABLE)
│   ├── scenario: string
│   ├── response: string
│   ├── evaluation: string
│   ├── traitTargeted: string
│   ├── alignmentScore: number (0-100)
│   └── timestamp: timestamp
│
└── /reports/{id} (IMMUTABLE)
    ├── reportType: 'employee_monthly'|'manager_monthly'|'founder_quarterly'
    ├── title: string
    ├── summary: string
    ├── sections: { heading: string, content: string }[]
    ├── keyMetric: string
    ├── actionItem: string
    └── generatedAt: timestamp

organizations/{orgId}
├── name: string
├── industry: string
├── founderId: string
├── createdAt: timestamp
│
├── /founderDNA/current
│   ├── signatureTraits: TraitScore[] (67 traits)
│   ├── philosophy: string
│   ├── voiceCaptures: Record<string, string>
│   ├── rawAnswers: Record<string, number>
│   ├── negativeConstraints: string[]
│   ├── founderArchetype: string
│   ├── riskAppetite: number
│   ├── innovationBias: number
│   ├── diagnosticComplete: boolean
│   └── updatedAt: timestamp
│
├── /competencyFramework/{id}
│   ├── name: string
│   ├── traits: TraitDefinition[]
│   └── updatedAt: timestamp
│
├── /orgAnalytics/{id} (SERVER-ONLY WRITE)
│   ├── avgSynergy: number
│   ├── employeeCount: number
│   ├── criticalDriftCount: number
│   ├── topPerformers: string[]
│   ├── atRiskEmployees: string[]
│   └── generatedAt: timestamp
│
└── /settings/whiteLabel
    ├── enabled: boolean
    ├── branding: { companyName, logoUrl, colors... }
    ├── domain: { customDomain, ssl }
    ├── auth: { ssoEnabled, ssoProvider, ssoConfig }
    ├── features: { hideNiyamBranding, customReportLogo... }
    └── reports: { headerLogoUrl, footerText... }

SECURITY RULES SUMMARY:
- Users can read/write own data only
- Admins (FOUNDER + HR_ADMIN) can read org members' data
- DNA history, check-ins, honing sessions, reports are IMMUTABLE
- Role field cannot be changed by users (prevents privilege escalation)
- Org analytics is server-write only
- White-label settings: founder-only write
- Everything else: deny by default

PERIODICITY:
- Weekly: Check-ins → Claude Haiku mentorship
- On-demand: Honing Lab → Gemini scenario + Claude evaluation
- Monthly: DNA recalibration + Employee reports
- Quarterly: Founder org report
- Continuous: Burnout detection (rule-based + Claude Haiku)

AI MODEL ROUTING:
- Claude Haiku 4.5: Check-ins, honing eval, quick assessments (₹0.25/call)
- Claude Sonnet 4.5: Monthly reports, deep analysis (₹5/call)
- Gemini Flash 2.0: Honing scenarios, HR insights (free/low-cost)
- Founder DNA extraction: Claude Haiku for enrichment (one-time ₹25)
- Employee DNA mapping: Claude Haiku (one-time ₹3)
*/

export {}; // Make this a module
