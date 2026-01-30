import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Calendar, FileText, HardDrive, TrendingUp } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const planDetails: Record<string, { name: string; price: string }> = {
  free: { name: 'Free', price: '$0/month' },
  starter: { name: 'Starter', price: '$19/month' },
  pro: { name: 'Pro', price: '$49/month' },
  enterprise: { name: 'Enterprise', price: '$149/month' },
}

export default async function UsagePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch total generations and average size
  const { data: stats } = await supabase
    .from('generations')
    .select('output_size_bytes, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  // Calculate stats
  const totalGenerations = stats?.length || 0
  const totalSize = stats?.reduce((sum, g) => sum + (g.output_size_bytes || 0), 0) || 0
  const averageSize = totalGenerations > 0 ? totalSize / totalGenerations : 0

  // Get daily usage for current period
  const periodStart = subscription?.current_period_start || new Date().toISOString()
  const { data: periodGenerations } = await supabase
    .from('generations')
    .select('created_at, output_size_bytes')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', periodStart)
    .order('created_at', { ascending: true })

  // Group by day
  const dailyUsage: Record<string, number> = {}
  periodGenerations?.forEach((gen) => {
    const day = new Date(gen.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    dailyUsage[day] = (dailyUsage[day] || 0) + 1
  })

  const plan = subscription?.plan || 'free'
  const creditsUsed = subscription?.credits_used || 0
  const creditsLimit = subscription?.credits_limit || 50
  const usagePercentage = Math.min((creditsUsed / creditsLimit) * 100, 100)
  const showUpgrade = plan === 'free' || plan === 'starter'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage</h1>
          <p className="text-muted-foreground">
            Track your PDF generation usage and limits
          </p>
        </div>
        {showUpgrade && (
          <Button asChild>
            <Link href="/pricing">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>

      {/* Current Period Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Current Period Usage
          </CardTitle>
          <CardDescription>
            {formatDate(subscription?.current_period_start || new Date().toISOString())} -{' '}
            {formatDate(subscription?.current_period_end || new Date().toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {creditsUsed} / {creditsLimit} PDFs
            </span>
            <Badge variant={usagePercentage >= 90 ? 'destructive' : 'secondary'}>
              {Math.round(usagePercentage)}% used
            </Badge>
          </div>
          <Progress value={usagePercentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {creditsLimit - creditsUsed} PDFs remaining this period
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planDetails[plan]?.name || plan}</div>
            <p className="text-xs text-muted-foreground">
              {planDetails[plan]?.price || '$0/month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGenerations}</div>
            <p className="text-xs text-muted-foreground">PDFs all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Size</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(averageSize)}</div>
            <p className="text-xs text-muted-foreground">per PDF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Renews On</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(subscription?.current_period_end || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.ceil(
                (new Date(subscription?.current_period_end || Date.now()).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days left
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage This Period</CardTitle>
          <CardDescription>PDFs generated per day</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(dailyUsage).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(dailyUsage).map(([day, count]) => (
                <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{day}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-primary rounded"
                      style={{ width: `${Math.min(count * 20, 200)}px` }}
                    />
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No generations yet this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
