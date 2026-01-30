import { NextResponse } from 'next/server'
import { z } from 'zod'
import Handlebars from 'handlebars'
import { validateApiKey, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Request validation schema for creating templates
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  html: z.string().min(1),
  css: z.string().optional(),
  sample_data: z.record(z.unknown()).optional(),
})

/**
 * Validate Handlebars syntax in HTML
 */
function validateHandlebars(html: string): { valid: boolean; error?: string } {
  try {
    Handlebars.compile(html)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid Handlebars syntax',
    }
  }
}

/**
 * Extract variables from Handlebars template
 */
function extractVariables(html: string): string[] {
  const regex = /\{\{([^{}]+)\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(html)) !== null) {
    const variable = match[1].trim()
    // Skip helpers and built-in keywords
    if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
      // Get the first part of the variable path
      const varName = variable.split(/[\s.]/)[0]
      if (varName && !['if', 'unless', 'each', 'with', 'else'].includes(varName)) {
        variables.add(varName)
      }
    }
  }

  return Array.from(variables)
}

/**
 * GET /api/v1/templates - List user's templates
 */
export async function GET(request: Request) {
  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  const supabase = createAdminClient()

  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, name, description, is_public, created_at, updated_at')
    .eq('user_id', authResult.userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    return apiError('DATABASE_ERROR', 'Failed to fetch templates', 500)
  }

  return NextResponse.json({ templates })
}

/**
 * POST /api/v1/templates - Create a new template
 */
export async function POST(request: Request) {
  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const validationResult = createTemplateSchema.safeParse(body)
  if (!validationResult.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      { errors: validationResult.error.flatten().fieldErrors }
    )
  }

  const { name, description, html, css, sample_data } = validationResult.data

  // Validate Handlebars syntax
  const handlebarsValidation = validateHandlebars(html)
  if (!handlebarsValidation.valid) {
    return apiError(
      'INVALID_TEMPLATE',
      'Invalid Handlebars syntax in HTML',
      400,
      { details: handlebarsValidation.error }
    )
  }

  // Extract variables from template
  const variables = extractVariables(html)

  const supabase = createAdminClient()

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      user_id: authResult.userId,
      name,
      description: description || null,
      html,
      css: css || null,
      sample_data: sample_data || {},
      variables,
      is_public: false,
    })
    .select('id, name, description, html, css, sample_data, variables, is_public, created_at, updated_at')
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return apiError('DATABASE_ERROR', 'Failed to create template', 500)
  }

  return NextResponse.json({ template }, { status: 201 })
}
