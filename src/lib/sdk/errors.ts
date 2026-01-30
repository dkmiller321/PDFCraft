/**
 * PDFCraft SDK Error Classes
 */

import type { ApiErrorDetails } from './types'

/**
 * Base error class for all PDFCraft errors
 */
export class PDFCraftError extends Error {
  public readonly code: string
  public readonly details?: Record<string, unknown>

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'PDFCraftError'
    this.code = code
    this.details = details
  }

  static fromApiError(error: ApiErrorDetails): PDFCraftError {
    switch (error.code) {
      case 'MISSING_API_KEY':
      case 'INVALID_API_KEY_FORMAT':
      case 'INVALID_API_KEY':
      case 'API_KEY_REVOKED':
        return new AuthenticationError(error.code, error.message, error.details)
      case 'LIMIT_EXCEEDED':
        return new LimitExceededError(error.code, error.message, error.details)
      case 'VALIDATION_ERROR':
      case 'INVALID_JSON':
        return new ValidationError(error.code, error.message, error.details)
      case 'NOT_FOUND':
        return new NotFoundError(error.code, error.message, error.details)
      case 'PLAN_REQUIRED':
        return new PlanRequiredError(error.code, error.message, error.details)
      default:
        return new PDFCraftError(error.code, error.message, error.details)
    }
  }
}

/**
 * Authentication error (invalid/missing API key)
 */
export class AuthenticationError extends PDFCraftError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, details)
    this.name = 'AuthenticationError'
  }
}

/**
 * Validation error (invalid request parameters)
 */
export class ValidationError extends PDFCraftError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, details)
    this.name = 'ValidationError'
  }
}

/**
 * Rate limit or usage limit exceeded
 */
export class LimitExceededError extends PDFCraftError {
  public readonly creditsUsed?: number
  public readonly creditsLimit?: number
  public readonly upgradeUrl?: string

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, details)
    this.name = 'LimitExceededError'
    this.creditsUsed = details?.credits_used as number | undefined
    this.creditsLimit = details?.credits_limit as number | undefined
    this.upgradeUrl = details?.upgrade_url as string | undefined
  }
}

/**
 * Resource not found
 */
export class NotFoundError extends PDFCraftError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, details)
    this.name = 'NotFoundError'
  }
}

/**
 * Feature requires plan upgrade
 */
export class PlanRequiredError extends PDFCraftError {
  public readonly upgradeUrl?: string

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, details)
    this.name = 'PlanRequiredError'
    this.upgradeUrl = details?.upgrade_url as string | undefined
  }
}
