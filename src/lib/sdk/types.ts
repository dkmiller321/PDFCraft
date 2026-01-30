/**
 * PDFCraft SDK Types
 */

// Generation Options
export interface PdfOptions {
  format?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'A3' | 'A5'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
  scale?: number
}

export interface GenerateOptions extends PdfOptions {
  html?: string
  url?: string
}

export interface GenerateFromTemplateOptions extends PdfOptions {
  data?: Record<string, unknown>
}

// Response Types
export interface GenerationResult {
  generation_id: string
  url: string
  size_bytes: number
  duration_ms: number
  template_id?: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  html: string
  css: string | null
  sample_data: Record<string, unknown>
  variables: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface TemplateListItem {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CreateTemplateOptions {
  name: string
  description?: string
  html: string
  css?: string
  sample_data?: Record<string, unknown>
}

export interface UpdateTemplateOptions {
  name?: string
  description?: string | null
  html?: string
  css?: string | null
  sample_data?: Record<string, unknown>
  is_public?: boolean
}

export interface AIGenerateTemplateOptions {
  prompt: string
  style?: 'minimal' | 'corporate' | 'creative' | 'bold'
  primaryColor?: string
}

export interface AIGeneratedTemplate {
  template_id: string
  name: string
  html: string
  variables: string[]
  preview_url: string
}

// Error Types
export interface ApiErrorDetails {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success?: false
  error: ApiErrorDetails
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
