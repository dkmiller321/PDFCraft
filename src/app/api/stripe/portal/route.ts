import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

/**
 * POST /api/stripe/portal - Create Stripe Customer Portal session
 */
export async function POST() {
  // Get authenticated user
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const adminSupabase = createAdminClient()

  // Get user's Stripe customer ID
  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found. Please upgrade your plan first.' } },
      { status: 400 }
    )
  }

  // Get the app URL for return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create billing portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
