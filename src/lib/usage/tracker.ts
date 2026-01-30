import { createAdminClient } from '@/lib/supabase/admin'

export interface UsageInfo {
  creditsUsed: number
  creditsLimit: number
  creditsRemaining: number
  plan: string
  periodStart: string
  periodEnd: string
  isLimitReached: boolean
  percentageUsed: number
}

/**
 * Get current usage information for a user
 */
export async function getCurrentUsage(userId: string): Promise<UsageInfo | null> {
  const supabase = createAdminClient()

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan, credits_used, credits_limit, current_period_start, current_period_end')
    .eq('user_id', userId)
    .single()

  if (error || !subscription) {
    console.error('Error fetching subscription:', error)
    return null
  }

  // Check if we need to reset the period
  const now = new Date()
  const periodEnd = new Date(subscription.current_period_end)

  if (now > periodEnd) {
    // Period has ended, reset usage
    await resetUsagePeriod(userId)
    // Fetch updated subscription
    const { data: updatedSub } = await supabase
      .from('subscriptions')
      .select('plan, credits_used, credits_limit, current_period_start, current_period_end')
      .eq('user_id', userId)
      .single()

    if (updatedSub) {
      return formatUsageInfo(updatedSub)
    }
  }

  return formatUsageInfo(subscription)
}

/**
 * Format subscription data into UsageInfo
 */
function formatUsageInfo(subscription: {
  plan: string
  credits_used: number
  credits_limit: number
  current_period_start: string
  current_period_end: string
}): UsageInfo {
  const remaining = Math.max(0, subscription.credits_limit - subscription.credits_used)
  const percentage = Math.min(100, (subscription.credits_used / subscription.credits_limit) * 100)

  return {
    creditsUsed: subscription.credits_used,
    creditsLimit: subscription.credits_limit,
    creditsRemaining: remaining,
    plan: subscription.plan,
    periodStart: subscription.current_period_start,
    periodEnd: subscription.current_period_end,
    isLimitReached: subscription.credits_used >= subscription.credits_limit,
    percentageUsed: Math.round(percentage),
  }
}

/**
 * Reset usage period for a user (called when period ends)
 */
export async function resetUsagePeriod(userId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const now = new Date()
  const periodStart = now.toISOString()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  const { error } = await supabase
    .from('subscriptions')
    .update({
      credits_used: 0,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error resetting usage period:', error)
    return false
  }

  return true
}

/**
 * Check if a user can generate a PDF (has credits remaining)
 */
export async function canGenerate(userId: string): Promise<{
  allowed: boolean
  usage: UsageInfo | null
  error?: string
}> {
  const usage = await getCurrentUsage(userId)

  if (!usage) {
    return {
      allowed: false,
      usage: null,
      error: 'Could not fetch usage information',
    }
  }

  if (usage.isLimitReached) {
    return {
      allowed: false,
      usage,
      error: `You have reached your ${usage.plan} plan limit of ${usage.creditsLimit} PDFs per month`,
    }
  }

  return {
    allowed: true,
    usage,
  }
}

/**
 * Increment usage for a user (called after successful generation)
 */
export async function incrementUsage(userId: string): Promise<boolean> {
  const supabase = createAdminClient()

  // Get current usage first to check period
  const usage = await getCurrentUsage(userId)
  if (!usage) {
    return false
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ credits_used: usage.creditsUsed + 1 })
    .eq('user_id', userId)

  if (error) {
    console.error('Error incrementing usage:', error)
    return false
  }

  return true
}
