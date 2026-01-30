import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanByPriceId, getCreditsForPlan, type PlanType } from '@/lib/stripe/config'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!
}

/**
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret())
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(supabase, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper to safely extract subscription period dates
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: string; end: string } {
  // Access via items for newer Stripe API or direct properties
  const sub = subscription as unknown as {
    current_period_start?: number
    current_period_end?: number
  }

  const start = sub.current_period_start || Math.floor(Date.now() / 1000)
  const end = sub.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  return {
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
  }
}

/**
 * Handle successful checkout - create or update subscription
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id
  const planFromMetadata = (session.metadata?.plan || 'starter') as PlanType

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  // Fetch the subscription to get price details
  const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  const detectedPlan = getPlanByPriceId(priceId) || planFromMetadata
  const creditsLimit = getCreditsForPlan(detectedPlan)
  const period = getSubscriptionPeriod(subscription)

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: priceId,
      plan: detectedPlan,
      status: 'active',
      credits_limit: creditsLimit,
      credits_used: 0, // Reset on new subscription
      current_period_start: period.start,
      current_period_end: period.end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  console.log(`Subscription created/updated for user ${userId}: ${detectedPlan}`)
}

/**
 * Handle subscription updates (plan changes, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const detectedPlan = getPlanByPriceId(priceId) || 'starter'
  const creditsLimit = getCreditsForPlan(detectedPlan as PlanType)
  const period = getSubscriptionPeriod(subscription)

  // Map Stripe status to our status
  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'inactive'

  await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      plan: detectedPlan,
      status,
      credits_limit: creditsLimit,
      current_period_start: period.start,
      current_period_end: period.end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  console.log(`Subscription updated for user ${userId}: ${detectedPlan} (${status})`)
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Downgrade to free plan
  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: null,
      stripe_price_id: null,
      plan: 'free',
      status: 'active', // Still active, just on free tier
      credits_limit: 50,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  console.log(`Subscription canceled for user ${userId}, downgraded to free`)
}

/**
 * Handle successful invoice payment - reset credits for new period
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  // Only handle subscription invoices
  const invoiceWithSub = invoice as unknown as { subscription?: string | null }
  if (!invoiceWithSub.subscription) return

  const subscriptionId = invoiceWithSub.subscription

  // Get subscription details from Stripe
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('No user_id in subscription metadata for invoice')
    return
  }

  const period = getSubscriptionPeriod(subscription)

  // Reset credits and update period
  await supabase
    .from('subscriptions')
    .update({
      credits_used: 0,
      current_period_start: period.start,
      current_period_end: period.end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  console.log(`Credits reset for user ${userId} after invoice payment`)
}
