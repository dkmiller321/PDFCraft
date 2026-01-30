import { NextResponse } from 'next/server'
import { z } from 'zod'
import Handlebars from 'handlebars'
import { validateApiKey, apiError } from '@/lib/api/auth'
import { generatePdf, type PdfOptions } from '@/lib/pdf/generator'
import { createAdminClient } from '@/lib/supabase/admin'

// Request validation schema
const generateFromTemplateSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional().default({}),
  options: z
    .object({
      format: z.enum(['A4', 'Letter', 'Legal', 'Tabloid', 'A3', 'A5']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
      margin: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
      headerTemplate: z.string().optional(),
      footerTemplate: z.string().optional(),
      printBackground: z.boolean().optional(),
      scale: z.number().min(0.1).max(2.0).optional(),
    })
    .optional(),
})

export const maxDuration = 60 // Allow up to 60 seconds for PDF generation

/**
 * POST /api/v1/templates/[id]/generate - Generate PDF from template with data
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: templateId } = await params

  // 1. Authenticate using API key
  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  const { userId, apiKeyId } = authResult

  // 2. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const validationResult = generateFromTemplateSchema.safeParse(body)
  if (!validationResult.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      { errors: validationResult.error.flatten().fieldErrors }
    )
  }

  const { data, options } = validationResult.data
  const supabase = createAdminClient()

  // 3. Fetch template (must belong to user or be public)
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  // Check ownership or public access
  if (template.user_id !== userId && !template.is_public) {
    return apiError('NOT_FOUND', 'Template not found', 404)
  }

  // 4. Check usage limits
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('credits_used, credits_limit')
    .eq('user_id', userId)
    .single()

  if (subError || !subscription) {
    return apiError('SUBSCRIPTION_ERROR', 'Could not fetch subscription data', 500)
  }

  if (subscription.credits_used >= subscription.credits_limit) {
    return apiError(
      'LIMIT_EXCEEDED',
      'You have reached your monthly PDF generation limit',
      402,
      {
        credits_used: subscription.credits_used,
        credits_limit: subscription.credits_limit,
        upgrade_url: '/pricing',
      }
    )
  }

  // 5. Compile template and substitute variables using Handlebars
  let html: string
  try {
    const compiledTemplate = Handlebars.compile(template.html)
    html = compiledTemplate(data)

    // If template has CSS, wrap HTML with style tag
    if (template.css) {
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${template.css}</style>
</head>
<body>
${html}
</body>
</html>`
    }
  } catch (error) {
    return apiError(
      'TEMPLATE_ERROR',
      'Failed to render template',
      400,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    )
  }

  // 6. Create generation record (pending)
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      api_key_id: apiKeyId,
      template_id: templateId,
      input_type: 'template',
      options: options || {},
      status: 'processing',
    })
    .select('id')
    .single()

  if (genError || !generation) {
    console.error('Error creating generation record:', genError)
    return apiError('DATABASE_ERROR', 'Failed to create generation record', 500)
  }

  // 7. Generate PDF
  const pdfOptions: PdfOptions = options || {}
  const pdfResult = await generatePdf(html, pdfOptions)

  if (!pdfResult.success) {
    // Update generation record with failure
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: pdfResult.error.message,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)

    return apiError(pdfResult.error.code, pdfResult.error.message, 500)
  }

  // 8. Upload PDF to Supabase Storage
  const fileName = `${userId}/${generation.id}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(fileName, pdfResult.buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading PDF:', uploadError)

    // Update generation record with failure
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Failed to upload PDF to storage',
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)

    return apiError('UPLOAD_ERROR', 'Failed to upload PDF to storage', 500)
  }

  // 9. Get public URL for the PDF
  const { data: urlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(fileName)

  const outputUrl = urlData.publicUrl

  // 10. Update generation record with success
  const durationMs = Date.now() - startTime
  await supabase
    .from('generations')
    .update({
      status: 'completed',
      output_url: outputUrl,
      output_size_bytes: pdfResult.sizeBytes,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id)

  // 11. Increment credits_used
  await supabase
    .from('subscriptions')
    .update({ credits_used: subscription.credits_used + 1 })
    .eq('user_id', userId)

  // 12. Return success response (same format as /api/v1/generate)
  return NextResponse.json({
    success: true,
    data: {
      generation_id: generation.id,
      template_id: templateId,
      url: outputUrl,
      size_bytes: pdfResult.sizeBytes,
      duration_ms: durationMs,
    },
  })
}
