// NiyamAI Billing Infrastructure
// Razorpay integration placeholder + subscription management

export type PlanId = 'starter' | 'growth' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number; // INR per employee
  annualPrice: number;
  maxEmployees: number; // -1 = unlimited
  features: string[];
}

export interface Subscription {
  orgId: string;
  planId: PlanId;
  billing: 'monthly' | 'annual';
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  trialEndsAt: Date;
  currentPeriodEnd: Date;
  employeeCount: number;
  razorpaySubscriptionId?: string;
  createdAt: Date;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 499,
    annualPrice: 399,
    maxEmployees: 10,
    features: ['founder_dna', 'employee_dna', 'weekly_checkin', 'honing_lab', 'synergy_dashboard', 'monthly_reports'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 1499,
    annualPrice: 1199,
    maxEmployees: 100,
    features: ['all_starter', 'org_insights', 'manager_reports', 'quarterly_reports', 'burnout_detection', 'custom_frameworks', 'api_access'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 999,
    annualPrice: 799,
    maxEmployees: -1,
    features: ['all_growth', 'white_label', 'custom_domain', 'sso', 'twilio_voice', 'dedicated_instance', 'sla', 'data_residency'],
  },
};

// Trial management
export function isTrialActive(subscription: Subscription): boolean {
  return subscription.status === 'trial' && new Date() < subscription.trialEndsAt;
}

export function getTrialDaysRemaining(subscription: Subscription): number {
  const diff = subscription.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function canAddEmployee(subscription: Subscription): boolean {
  const plan = PLANS[subscription.planId];
  return plan.maxEmployees === -1 || subscription.employeeCount < plan.maxEmployees;
}

export function getMonthlyTotal(subscription: Subscription): number {
  const plan = PLANS[subscription.planId];
  const price = subscription.billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  return price * subscription.employeeCount;
}

// Feature gating
export function hasFeature(planId: PlanId, feature: string): boolean {
  const plan = PLANS[planId];
  if (plan.features.includes(feature)) return true;
  if (plan.features.includes('all_growth') && PLANS.growth.features.includes(feature)) return true;
  if (plan.features.includes('all_starter') && PLANS.starter.features.includes(feature)) return true;
  return false;
}

// Cost economics (internal)
export const COST_PER_EMPLOYEE_MONTHLY = {
  ai_api: 24.33,      // Claude + Gemini per employee/month
  infrastructure: 3,   // Firebase per employee/month (amortised)
  overhead: 5,          // Monitoring, support, misc
  total: 32.33,
};

export const MARGINS = {
  starter_monthly: ((499 - 32.33) / 499 * 100).toFixed(1), // 93.5%
  starter_annual: ((399 - 32.33) / 399 * 100).toFixed(1),  // 91.9%
  growth_monthly: ((1499 - 32.33) / 1499 * 100).toFixed(1), // 97.8%
  growth_annual: ((1199 - 32.33) / 1199 * 100).toFixed(1),  // 97.3%
  enterprise_monthly: ((999 - 32.33) / 999 * 100).toFixed(1), // 96.8%
  enterprise_annual: ((799 - 32.33) / 799 * 100).toFixed(1),  // 96.0%
};
