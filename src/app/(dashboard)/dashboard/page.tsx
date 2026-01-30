import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FileText, Key, Sparkles, Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusIcons = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
}

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch subscription data
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, credits_used, credits_limit')
    .eq('user_id', user.id)
    .single()

  // Fetch template count
  const { count: templateCount } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch API key (just the prefix for display)
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('key_prefix')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .limit(1)

  // Fetch recent generations
  const { data: recentGenerations } = await supabase
    .from('generations')
    .select('id, status, output_size_bytes, created_at, input_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const plan = subscription?.plan || 'free'
  const creditsUsed = subscription?.credits_used || 0
  const creditsLimit = subscription?.credits_limit || 50
  const usagePercentage = Math.min((creditsUsed / creditsLimit) * 100, 100)
  const apiKeyPrefix = apiKeys?.[0]?.key_prefix || null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your PDFCraft overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/templates/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/ai-template">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Template
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PDFs This Month</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditsUsed} / {creditsLimit}
            </div>
            <Progress value={usagePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {creditsLimit - creditsUsed} PDFs remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <Link href="/dashboard/templates" className="text-primary hover:underline">
                View all templates
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Key className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{plan}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {plan === 'free' || plan === 'starter' ? (
                <Link href="/pricing" className="text-primary hover:underline">
                  Upgrade for more
                </Link>
              ) : (
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Manage subscription
                </Link>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick start and recent generations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick start code snippet */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Generate your first PDF with a single API call
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeyPrefix ? (
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-xs md:text-sm">
{`curl -X POST https://pdfcraft.dev/api/v1/generate \\
  -H "Authorization: Bearer ${apiKeyPrefix}..." \\
  -H "Content-Type: application/json" \\
  -d '{"html": "<h1>Hello World</h1>"}'`}
                </pre>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Create an API key to get started
                </p>
                <Button asChild>
                  <Link href="/dashboard/api-keys">
                    <Key className="w-4 h-4 mr-2" />
                    Create API Key
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent generations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>Your latest PDF generations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGenerations && recentGenerations.length > 0 ? (
              <div className="space-y-3">
                {recentGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcons[gen.status as keyof typeof statusIcons]}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {gen.input_type} generation
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(gen.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gen.output_size_bytes && (
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(gen.output_size_bytes)}
                        </span>
                      )}
                      <Badge
                        variant={
                          gen.status === 'completed'
                            ? 'default'
                            : gen.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {gen.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No generations yet</p>
                <p className="text-sm text-muted-foreground">
                  Generate your first PDF using the API
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
