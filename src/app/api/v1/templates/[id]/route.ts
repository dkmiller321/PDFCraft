import { NextResponse } from 'next/server'
import { z } from 'zod'
import Handlebars from 'handlebars'
import { validateApiKey, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Request validation schema for updating templates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  html: z.string().min(1).optional(),
  css: z.string().optional().nullable(),
  sample_data: z.record(z.string(), z.unknown()).optional(),
  is_public: z.boolean().optional(),
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
    if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
      const varName = variable.split(/[\s.]/)[0]
      if (varName && !['if', 'unless', 'each', 'with', 'else'].includes(varName)) {
        variables.add(varName)
      }
    }
  }

  return Array.from(variables)
}

/**
 * GET /api/v1/templates/[id] - Get a single template
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  const supabase = createAdminClient()

  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !template) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  // Check ownership (allow public templates to be viewed by anyone)
  if (template.user_id !== authResult.userId && !template.is_public) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  return NextResponse.json({ template })
}

/**
 * PUT /api/v1/templates/[id] - Update a template
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const validationResult = updateTemplateSchema.safeParse(body)
  if (!validationResult.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      { errors: validationResult.error.flatten().fieldErrors }
    )
  }

  const supabase = createAdminClient()

  // Check ownership
  const { data: existingTemplate, error: fetchError } = await supabase
    .from('templates')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingTemplate) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  if (existingTemplate.user_id !== authResult.userId) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  const updateData = validationResult.data

  // If HTML is being updated, validate and extract variables
  if (updateData.html) {
    const handlebarsValidation = validateHandlebars(updateData.html)
    if (!handlebarsValidation.valid) {
      return apiError(
        'INVALID_TEMPLATE',
        'Invalid Handlebars syntax in HTML',
        400,
        { details: handlebarsValidation.error }
      )
    }
  }

  // Build update object
  const updateObj: Record<string, unknown> = {
    ...updateData,
    updated_at: new Date().toISOString(),
  }

  // Extract variables if HTML is updated
  if (updateData.html) {
    updateObj.variables = extractVariables(updateData.html)
  }

  const { data: template, error: updateError } = await supabase
    .from('templates')
    .update(updateObj)
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    console.error('Error updating template:', updateError)
    return apiError('DATABASE_ERROR', 'Failed to update template', 500)
  }

  return NextResponse.json({ template })
}

/**
 * DELETE /api/v1/templates/[id] - Delete a template
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  const supabase = createAdminClient()

  // Check ownership
  const { data: existingTemplate, error: fetchError } = await supabase
    .from('templates')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingTemplate) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  if (existingTemplate.user_id !== authResult.userId) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  const { error: deleteError } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting template:', deleteError)
    return apiError('DATABASE_ERROR', 'Failed to delete template', 500)
  }

  return NextResponse.json({ success: true, message: 'Template deleted' })
}
