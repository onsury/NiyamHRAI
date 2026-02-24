// NiyamAI Enterprise White-Label Configuration
// Stored per-org in Firestore: organizations/{orgId}/settings/whiteLabel

export interface WhiteLabelConfig {
  enabled: boolean;
  branding: {
    companyName: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;    // hex e.g. '#F59E0B'
    secondaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  domain: {
    customDomain: string;    // e.g. 'dna.mycompany.com'
    sslCertificate: 'managed' | 'custom';
  };
  auth: {
    ssoEnabled: boolean;
    ssoProvider: 'saml' | 'oidc' | 'none';
    ssoConfig: {
      entityId?: string;
      ssoUrl?: string;
      certificate?: string;
      clientId?: string;
      issuer?: string;
    };
  };
  features: {
    hideNiyamBranding: boolean;
    customReportLogo: boolean;
    customEmailTemplates: boolean;
    customDashboardWidgets: boolean;
  };
  reports: {
    headerLogoUrl: string;
    footerText: string;
    companyAddress: string;
    confidentialityNotice: string;
  };
}

export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  enabled: false,
  branding: {
    companyName: 'NiyamAI',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#F59E0B',
    secondaryColor: '#0F172A',
    accentColor: '#6366F1',
    darkMode: true,
  },
  domain: {
    customDomain: '',
    sslCertificate: 'managed',
  },
  auth: {
    ssoEnabled: false,
    ssoProvider: 'none',
    ssoConfig: {},
  },
  features: {
    hideNiyamBranding: false,
    customReportLogo: false,
    customEmailTemplates: false,
    customDashboardWidgets: false,
  },
  reports: {
    headerLogoUrl: '',
    footerText: 'Powered by NiyamAI — Neural Alignment Engine',
    companyAddress: '',
    confidentialityNotice: 'This report is confidential and intended only for the named recipient.',
  },
};

// Apply white-label theme to CSS variables
export function applyTheme(config: WhiteLabelConfig) {
  if (!config.enabled) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', config.branding.primaryColor);
  root.style.setProperty('--secondary', config.branding.secondaryColor);
  root.style.setProperty('--accent', config.branding.accentColor);
}
