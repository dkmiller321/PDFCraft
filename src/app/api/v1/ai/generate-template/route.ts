import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { validateApiKey, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Request validation schema
const generateTemplateSchema = z.object({
  prompt: z.string().min(10).max(2000),
  style: z.enum(['minimal', 'corporate', 'creative', 'bold']).optional().default('minimal'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const maxDuration = 60 // Allow up to 60 seconds for AI generation

/**
 * POST /api/v1/ai/generate-template - Generate template using Claude AI
 */
export async function POST(request: Request) {
  // 1. Authenticate using API key
  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return apiError(authResult.error.code, authResult.error.message, authResult.status)
  }

  const { userId } = authResult

  // 2. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const validationResult = generateTemplateSchema.safeParse(body)
  if (!validationResult.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      { errors: validationResult.error.flatten().fieldErrors }
    )
  }

  const { prompt, style, primaryColor } = validationResult.data
  const supabase = createAdminClient()

  // 3. Check AI generation limits (Pro and Enterprise only)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()

  const plan = subscription?.plan || 'free'

  // Only Pro and Enterprise can use AI generation
  if (plan !== 'pro' && plan !== 'enterprise') {
    return apiError(
      'PLAN_REQUIRED',
      'AI template generation requires Pro or Enterprise plan',
      402,
      { upgrade_url: '/pricing' }
    )
  }

  // 4. Generate HTML using Claude
  const systemPrompt = `You are an expert HTML/CSS template designer for PDFCraft, a PDF generation service.
Your task is to create beautiful, professional HTML templates that will be converted to PDFs.

IMPORTANT RULES:
1. Use Handlebars syntax for variables: {{variableName}}
2. Create self-contained HTML with inline styles or a <style> block
3. Use web-safe fonts (Arial, Helvetica, Georgia, Times New Roman)
4. Design for A4 paper size (210mm x 297mm)
5. Include appropriate margins and padding for PDF printing
6. Make the design visually appealing and professional

STYLE GUIDE (${style}):
${style === 'minimal' ? '- Clean, simple design with lots of whitespace\n- Neutral colors, simple typography\n- Focus on content readability' : ''}
${style === 'corporate' ? '- Professional business style\n- Structured layout with clear sections\n- Use of tables for data presentation' : ''}
${style === 'creative' ? '- More expressive design\n- Interesting typography and color combinations\n- Visual elements and decorative touches' : ''}
${style === 'bold' ? '- Strong visual impact\n- Large typography, bold colors\n- Eye-catching design elements' : ''}

${primaryColor ? `Use ${primaryColor} as the primary accent color.` : ''}

OUTPUT FORMAT:
Return ONLY valid HTML code. No explanations or markdown.
Include a <style> block with all CSS.
The template should be complete and ready to use.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create an HTML template for: ${prompt}`,
        },
      ],
    })

    // Extract text content from response
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return apiError('AI_ERROR', 'Failed to generate template', 500)
    }

    let generatedHtml = textContent.text

    // Clean up HTML if wrapped in code blocks
    generatedHtml = generatedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

    // 5. Extract variables from generated HTML
    const variables = extractVariables(generatedHtml)

    // 6. Create sample data from variables
    const sampleData: Record<string, string> = {}
    variables.forEach(v => {
      sampleData[v] = `Sample ${v}`
    })

    // 7. Save as new template
    const templateName = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt

    const { data: template, error: createError } = await supabase
      .from('templates')
      .insert({
        user_id: userId,
        name: `AI: ${templateName}`,
        description: `Generated from prompt: "${prompt}"`,
        html: generatedHtml,
        css: null,
        sample_data: sampleData as Json,
        variables: variables as Json,
        is_public: false,
      })
      .select('id, name, variables')
      .single()

    if (createError || !template) {
      console.error('Error saving template:', createError)
      return apiError('DATABASE_ERROR', 'Failed to save generated template', 500)
    }

    // 8. Return response
    return NextResponse.json({
      success: true,
      data: {
        template_id: template.id,
        name: template.name,
        html: generatedHtml,
        variables,
        preview_url: `/dashboard/templates/${template.id}`,
      },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return apiError('AI_ERROR', 'Failed to generate template. Please try again.', 500)
  }
}

/**
 * Extract Handlebars variables from HTML
 */
function extractVariables(html: string): string[] {
  const regex = /\{\{([^{}]+)\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(html)) !== null) {
    const variable = match[1].trim()
    // Skip helpers and built-in keywords
    if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
      const varName = variable.split(/[\s.]/)[0]
      if (varName && !['if', 'unless', 'each', 'with', 'else'].includes(varName)) {
        variables.add(varName)
      }
    }
  }

  return Array.from(variables)
}
