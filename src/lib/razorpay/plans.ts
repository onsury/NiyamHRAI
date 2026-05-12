export type PlanId = 'starter' | 'growth';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanDef {
  id: PlanId;
  name: string;
  maxEmployees: number;
  rates: {
    monthly: number;  // paise per employee per month
    annual: number;   // paise per employee per year (already discounted)
  };
}

/**
 * NiyamHR pricing - source: niyamhr.in pricing page.
 *
 * Starter: Rs 1,249/emp/mo  OR  Rs 999 x 12 = Rs 11,988/emp/yr (~20% off annual)
 * Growth:  Rs 2,499/emp/mo  OR  Rs 1,999 x 12 = Rs 23,988/emp/yr (~20% off annual)
 *
 * Enterprise: Custom - NOT routed through Razorpay (Contact Sales flow).
 */
export const PLANS: Record<PlanId, PlanDef> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    maxEmployees: 10,
    rates: {
      monthly: 124900,
      annual: 1198800,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    maxEmployees: 100,
    rates: {
      monthly: 249900,
      annual: 2398800,
    },
  },
};

export function computeAmount(
  planId: PlanId,
  cycle: BillingCycle,
  employeeCount: number
): number {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  if (!Number.isInteger(employeeCount) || employeeCount < 1) {
    throw new Error('employeeCount must be a positive integer');
  }
  if (employeeCount > plan.maxEmployees) {
    throw new Error(
      `${plan.name} plan caps at ${plan.maxEmployees} employees. Upgrade tier or contact sales.`
    );
  }
  return plan.rates[cycle] * employeeCount;
}
