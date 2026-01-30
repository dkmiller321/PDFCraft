import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ApiKeyValidationResult {
  success: true
  userId: string
  apiKeyId: string
}

export interface ApiKeyValidationError {
  success: false
  error: {
    code: string
    message: string
  }
  status: number
}

export type ValidateApiKeyResult = ApiKeyValidationResult | ApiKeyValidationError

/**
 * Hash an API key using SHA-256
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Extract the API key from the Authorization header
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}

/**
 * Validate an API key from the request Authorization header.
 *
 * Usage:
 * ```ts
 * const authResult = await validateApiKey(request)
 * if (!authResult.success) {
 *   return Response.json({ error: authResult.error }, { status: authResult.status })
 * }
 * const { userId, apiKeyId } = authResult
 * ```
 */
export async function validateApiKey(request: Request): Promise<ValidateApiKeyResult> {
  // Extract the Bearer token from the Authorization header
  const apiKey = extractBearerToken(request)

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required. Include it in the Authorization header as: Bearer YOUR_API_KEY',
      },
      status: 401,
    }
  }

  // Validate the key format
  if (!apiKey.startsWith('pk_live_') || apiKey.length < 40) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY_FORMAT',
        message: 'Invalid API key format. Keys should start with pk_live_',
      },
      status: 401,
    }
  }

  // Hash the provided key
  const keyHash = hashApiKey(apiKey)

  // Use admin client to bypass RLS and look up the key
  const supabase = createAdminClient()

  // Find the API key by hash
  const { data: apiKeyRecord, error: fetchError } = await supabase
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', keyHash)
    .single()

  if (fetchError || !apiKeyRecord) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or does not exist',
      },
      status: 401,
    }
  }

  // Check if the key is revoked
  if (apiKeyRecord.revoked_at) {
    return {
      success: false,
      error: {
        code: 'API_KEY_REVOKED',
        message: 'This API key has been revoked and is no longer valid',
      },
      status: 401,
    }
  }

  // Update last_used_at timestamp (non-blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id)
    .then(() => {}) // Fire and forget
    .catch((err) => console.error('Error updating last_used_at:', err))

  return {
    success: true,
    userId: apiKeyRecord.user_id,
    apiKeyId: apiKeyRecord.id,
  }
}

/**
 * Helper to create a standardized API error response
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  )
}
