import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateApiKey, apiError } from '@/lib/api/auth'
import { generatePdf, generatePdfFromUrl, type PdfOptions } from '@/lib/pdf/generator'
import { createAdminClient } from '@/lib/supabase/admin'

// Request validation schema
const generateRequestSchema = z.object({
  html: z.string().min(1).optional(),
  url: z.string().url().optional(),
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
}).refine(data => data.html || data.url, {
  message: 'Either html or url must be provided',
})

export const maxDuration = 60 // Allow up to 60 seconds for PDF generation

/**
 * POST /api/v1/generate - Generate a PDF from HTML or URL
 */
export async function POST(request: Request) {
  const startTime = Date.now()

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

  const validationResult = generateRequestSchema.safeParse(body)
  if (!validationResult.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      { errors: validationResult.error.flatten().fieldErrors }
    )
  }

  const { html, url, options } = validationResult.data
  const inputType = html ? 'html' : 'url'

  // 3. Check usage limits
  const supabase = createAdminClient()

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

  // 4. Create generation record (pending)
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      api_key_id: apiKeyId,
      input_type: inputType,
      options: options || {},
      status: 'processing',
    })
    .select('id')
    .single()

  if (genError || !generation) {
    console.error('Error creating generation record:', genError)
    return apiError('DATABASE_ERROR', 'Failed to create generation record', 500)
  }

  // 5. Generate PDF
  const pdfOptions: PdfOptions = options || {}
  const pdfResult = html
    ? await generatePdf(html, pdfOptions)
    : await generatePdfFromUrl(url!, pdfOptions)

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

  // 6. Upload PDF to Supabase Storage
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

  // 7. Get public URL for the PDF
  const { data: urlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(fileName)

  const outputUrl = urlData.publicUrl

  // 8. Update generation record with success
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

  // 9. Increment credits_used
  await supabase
    .from('subscriptions')
    .update({ credits_used: subscription.credits_used + 1 })
    .eq('user_id', userId)

  // 10. Return success response
  return NextResponse.json({
    success: true,
    data: {
      generation_id: generation.id,
      url: outputUrl,
      size_bytes: pdfResult.sizeBytes,
      duration_ms: durationMs,
    },
  })
}
