import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

/**
 * Generate a new API key
 * Format: pk_live_[32 random chars]
 */
function generateApiKey(): string {
  const randomPart = randomBytes(24).toString('base64url').slice(0, 32)
  return `pk_live_${randomPart}`
}

/**
 * Hash an API key using SHA-256
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * GET /api/keys - List all API keys for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch API keys' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/keys - Create a new API key
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = body.name || 'Untitled Key'

    // Generate a new API key
    const fullKey = generateApiKey()
    const keyHash = hashApiKey(fullKey)
    const keyPrefix = fullKey.slice(0, 16) // pk_live_XXXXXXXX

    // Store the hashed key in the database
    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
      })
      .select('id, name, key_prefix, created_at')
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create API key' } },
        { status: 500 }
      )
    }

    // Return the full key ONLY ONCE - it cannot be retrieved again
    return NextResponse.json({
      key: {
        ...newKey,
        full_key: fullKey, // This is the only time the full key is returned
      },
      warning: 'Save this key now. It will not be shown again.',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
