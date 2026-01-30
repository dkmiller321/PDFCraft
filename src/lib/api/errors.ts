/**
 * PDFCraft API Error Codes
 *
 * Standardized error codes used across all API endpoints.
 * All API errors return: { error: { code, message, details? } }
 */

/**
 * Authentication Errors (401)
 */
export const AUTH_ERRORS = {
  MISSING_API_KEY: 'No API key provided in Authorization header',
  INVALID_API_KEY_FORMAT: 'API key format is invalid. Expected: pk_live_...',
  INVALID_API_KEY: 'API key not found or invalid',
  API_KEY_REVOKED: 'This API key has been revoked',
  UNAUTHORIZED: 'Not authenticated',
} as const

/**
 * Validation Errors (400)
 */
export const VALIDATION_ERRORS = {
  INVALID_JSON: 'Request body must be valid JSON',
  VALIDATION_ERROR: 'Invalid request body',
  INVALID_TEMPLATE: 'Invalid Handlebars syntax in HTML',
  TEMPLATE_ERROR: 'Failed to render template',
} as const

/**
 * Resource Errors (404)
 */
export const RESOURCE_ERRORS = {
  NOT_FOUND: 'Resource not found',
} as const

/**
 * Limit Errors (402, 429)
 */
export const LIMIT_ERRORS = {
  LIMIT_EXCEEDED: 'You have reached your monthly PDF generation limit',
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const

/**
 * Plan Errors (402)
 */
export const PLAN_ERRORS = {
  PLAN_REQUIRED: 'This feature requires a higher plan',
  PLAN_NOT_CONFIGURED: 'This plan is not yet configured',
} as const

/**
 * Server Errors (500)
 */
export const SERVER_ERRORS = {
  DATABASE_ERROR: 'An internal error occurred. Please try again.',
  SUBSCRIPTION_ERROR: 'An internal error occurred. Please try again.',
  UPLOAD_ERROR: 'Failed to store generated file. Please try again.',
  AI_ERROR: 'AI generation failed. Please try again.',
} as const

/**
 * All error codes combined
 */
export const ERROR_CODES = {
  ...AUTH_ERRORS,
  ...VALIDATION_ERRORS,
  ...RESOURCE_ERRORS,
  ...LIMIT_ERRORS,
  ...PLAN_ERRORS,
  ...SERVER_ERRORS,
} as const

export type ErrorCode = keyof typeof ERROR_CODES

/**
 * Get appropriate HTTP status code for an error code
 */
export function getStatusForError(code: ErrorCode): number {
  if (code in AUTH_ERRORS) return 401
  if (code in VALIDATION_ERRORS) return 400
  if (code in RESOURCE_ERRORS) return 404
  if (code === 'LIMIT_EXCEEDED' || code === 'PLAN_REQUIRED' || code === 'PLAN_NOT_CONFIGURED') return 402
  if (code === 'RATE_LIMITED') return 429
  if (code in SERVER_ERRORS) return 500
  return 400
}

/**
 * Server-side logger for errors
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(JSON.stringify({
    timestamp,
    context,
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    ...(additionalInfo && { ...additionalInfo }),
  }))
}

/**
 * Create a safe error message that doesn't leak internal details
 */
export function getSafeErrorMessage(code: ErrorCode): string {
  return ERROR_CODES[code] || 'An error occurred. Please try again.'
}
