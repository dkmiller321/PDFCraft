import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * DELETE /api/keys/[id] - Revoke an API key
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // First, verify the key belongs to the user
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, user_id, revoked_at')
      .eq('id', id)
      .single()

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      )
    }

    if (existingKey.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this API key' } },
        { status: 403 }
      )
    }

    if (existingKey.revoked_at) {
      return NextResponse.json(
        { error: { code: 'ALREADY_REVOKED', message: 'This API key is already revoked' } },
        { status: 400 }
      )
    }

    // Revoke the key by setting revoked_at
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Error revoking API key:', updateError)
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to revoke API key' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
