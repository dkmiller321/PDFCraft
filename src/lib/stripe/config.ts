/**
 * Stripe Configuration for PDFCraft
 *
 * SETUP REQUIRED: Create these products in Stripe Dashboard
 * https://dashboard.stripe.com/products
 *
 * Products to create:
 * 1. PDFCraft Free - $0/month (no price needed, just for tracking)
 * 2. PDFCraft Starter - $19/month recurring
 * 3. PDFCraft Pro - $49/month recurring
 * 4. PDFCraft Enterprise - $149/month recurring
 *
 * After creating, update the IDs below with actual Stripe IDs.
 */

export const STRIPE_PRODUCTS = {
  free: {
    name: 'PDFCraft Free',
    productId: 'prod_TODO_FREE', // Update with actual product ID
    priceId: null, // Free tier has no price
    price: 0,
    credits: 50,
    features: [
      '50 PDFs per month',
      'Basic templates',
      'Community support',
    ],
  },
  starter: {
    name: 'PDFCraft Starter',
    productId: 'prod_TODO_STARTER', // Update with actual product ID
    priceId: 'price_TODO_STARTER', // Update with actual price ID
    price: 1900, // $19.00 in cents
    credits: 500,
    features: [
      '500 PDFs per month',
      'Custom templates',
      'API access',
      'Email support',
    ],
  },
  pro: {
    name: 'PDFCraft Pro',
    productId: 'prod_TODO_PRO', // Update with actual product ID
    priceId: 'price_TODO_PRO', // Update with actual price ID
    price: 4900, // $49.00 in cents
    credits: 2000,
    features: [
      '2,000 PDFs per month',
      'AI template generation',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
  },
  enterprise: {
    name: 'PDFCraft Enterprise',
    productId: 'prod_TODO_ENTERPRISE', // Update with actual product ID
    priceId: 'price_TODO_ENTERPRISE', // Update with actual price ID
    price: 14900, // $149.00 in cents
    credits: 10000,
    features: [
      '10,000 PDFs per month',
      'Unlimited AI generations',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'SSO/SAML',
    ],
  },
} as const;

export type PlanType = keyof typeof STRIPE_PRODUCTS;

export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 50,
  starter: 500,
  pro: 2000,
  enterprise: 10000,
};

/**
 * Get plan details by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [plan, config] of Object.entries(STRIPE_PRODUCTS)) {
    if (config.priceId === priceId) {
      return plan as PlanType;
    }
  }
  return null;
}

/**
 * Get credits limit for a plan
 */
export function getCreditsForPlan(plan: PlanType): number {
  return STRIPE_PRODUCTS[plan]?.credits ?? 50;
}
