import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { STRIPE_PRODUCTS, type PlanType } from '@/lib/stripe/config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'enterprise']),
})

/**
 * POST /api/stripe/checkout - Create Stripe Checkout session
 */
export async function POST(request: Request) {
  // Get authenticated user
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    )
  }

  const validationResult = checkoutSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid plan selected' } },
      { status: 400 }
    )
  }

  const { plan } = validationResult.data
  const planConfig = STRIPE_PRODUCTS[plan as PlanType]

  if (!planConfig.priceId || planConfig.priceId.startsWith('price_TODO')) {
    return NextResponse.json(
      { error: { code: 'PLAN_NOT_CONFIGURED', message: 'This plan is not yet configured. Please contact support.' } },
      { status: 400 }
    )
  }

  const adminSupabase = createAdminClient()

  // Get or create Stripe customer
  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = subscription?.stripe_customer_id

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    })
    customerId = customer.id

    // Update subscription with customer ID
    await adminSupabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  // Get the app URL for redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?success=true&plan=${plan}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: {
      user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
