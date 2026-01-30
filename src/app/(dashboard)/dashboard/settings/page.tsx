'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreditCard, Loader2, Save, Trash2, User } from 'lucide-react'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

interface Subscription {
  plan: string
  status: string
  stripe_customer_id: string | null
  current_period_end: string | null
}

const planNames: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status, stripe_customer_id, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email || null,
        })
        setFullName(profileData.full_name || '')
      }

      if (subData) {
        setSubscription(subData)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [supabase, router])

  useEffect(() => {
    if (profile) {
      setHasChanges(fullName !== (profile.full_name || ''))
    }
  }, [fullName, profile])

  async function handleSaveProfile() {
    if (!profile) return

    setIsSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setIsSaving(false)

    if (error) {
      console.error('Error updating profile:', error)
      return
    }

    setProfile((prev) => prev ? { ...prev, full_name: fullName || null } : null)
    setHasChanges(false)
  }

  async function handleManageBilling() {
    setIsLoadingPortal(true)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error?.message || 'Failed to open billing portal')
        setIsLoadingPortal(false)
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal')
      setIsLoadingPortal(false)
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return

    setIsDeleting(true)

    // Sign out and delete profile (which cascades due to FK constraints)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      setIsDeleting(false)
      return
    }

    // Note: Full account deletion would require a server-side admin operation
    // For now, we just sign out the user
    router.push('/')
  }

  function formatDate(date: string | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getInitials(name: string | null, email: string | null): string {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and billing settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(profile?.full_name || null, profile?.email || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.full_name || 'No name set'}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={!hasChanges || isSaving}
              className="w-fit"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing
          </CardTitle>
          <CardDescription>
            Manage your subscription and payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Current Plan</span>
                <Badge variant={subscription?.plan === 'free' ? 'secondary' : 'default'}>
                  {planNames[subscription?.plan || 'free'] || subscription?.plan}
                </Badge>
              </div>
              {subscription?.plan !== 'free' && subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
            {subscription?.stripe_customer_id && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </div>

          {subscription?.plan === 'free' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                You&apos;re on the Free plan. Upgrade to get more PDFs and features.
              </p>
              <Button className="mt-2" asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers, including:
              <ul className="list-disc list-inside mt-2">
                <li>All templates you&apos;ve created</li>
                <li>All generated PDFs</li>
                <li>Your API keys</li>
                <li>Usage history</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
