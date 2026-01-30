/**
 * PDFCraft SDK Client
 *
 * A TypeScript SDK for the PDFCraft PDF generation API.
 *
 * @example
 * ```typescript
 * import { PDFCraft } from '@/lib/sdk'
 *
 * const pdfcraft = new PDFCraft('pk_live_your_api_key')
 *
 * // Generate a PDF from HTML
 * const result = await pdfcraft.generate({
 *   html: '<h1>Hello, World!</h1>'
 * })
 * console.log(result.url)
 *
 * // Generate from a template
 * const pdf = await pdfcraft.templates.generate('template-id', {
 *   data: { name: 'John', amount: '$99.00' }
 * })
 * ```
 */

import type {
  GenerateOptions,
  GenerateFromTemplateOptions,
  GenerationResult,
  Template,
  TemplateListItem,
  CreateTemplateOptions,
  UpdateTemplateOptions,
  AIGenerateTemplateOptions,
  AIGeneratedTemplate,
  ApiResponse,
} from './types'
import { PDFCraftError } from './errors'

export interface PDFCraftConfig {
  apiKey: string
  baseUrl?: string
}

/**
 * Templates API client
 */
class TemplatesClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string
  ) {}

  /**
   * List all templates
   */
  async list(): Promise<TemplateListItem[]> {
    const response = await this.request<{ templates: TemplateListItem[] }>('GET', '/templates')
    return response.templates
  }

  /**
   * Get a single template by ID
   */
  async get(id: string): Promise<Template> {
    const response = await this.request<{ template: Template }>('GET', `/templates/${id}`)
    return response.template
  }

  /**
   * Create a new template
   */
  async create(options: CreateTemplateOptions): Promise<Template> {
    const response = await this.request<{ template: Template }>('POST', '/templates', options)
    return response.template
  }

  /**
   * Update an existing template
   */
  async update(id: string, options: UpdateTemplateOptions): Promise<Template> {
    const response = await this.request<{ template: Template }>('PUT', `/templates/${id}`, options)
    return response.template
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    await this.request<{ success: boolean }>('DELETE', `/templates/${id}`)
  }

  /**
   * Generate a PDF from a template
   */
  async generate(id: string, options: GenerateFromTemplateOptions = {}): Promise<GenerationResult> {
    const response = await this.request<GenerationResult>('POST', `/templates/${id}/generate`, options)
    return response
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, fetchOptions)
    const data = (await response.json()) as ApiResponse<T>

    if (!response.ok || ('error' in data && data.error)) {
      const error = 'error' in data && data.error ? data.error : { code: 'UNKNOWN', message: 'Unknown error' }
      throw PDFCraftError.fromApiError(error)
    }

    if ('data' in data) {
      return data.data
    }

    // For responses that don't wrap in { success, data }
    return data as unknown as T
  }
}

/**
 * AI API client
 */
class AIClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string
  ) {}

  /**
   * Generate a template using AI
   */
  async generateTemplate(options: AIGenerateTemplateOptions): Promise<AIGeneratedTemplate> {
    const response = await this.request<AIGeneratedTemplate>('POST', '/ai/generate-template', options)
    return response
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, fetchOptions)
    const data = (await response.json()) as ApiResponse<T>

    if (!response.ok || ('error' in data && data.error)) {
      const error = 'error' in data && data.error ? data.error : { code: 'UNKNOWN', message: 'Unknown error' }
      throw PDFCraftError.fromApiError(error)
    }

    if ('data' in data) {
      return data.data
    }

    return data as unknown as T
  }
}

/**
 * PDFCraft SDK Client
 */
export class PDFCraft {
  private readonly apiKey: string
  private readonly baseUrl: string

  /**
   * Templates API
   */
  public readonly templates: TemplatesClient

  /**
   * AI API
   */
  public readonly ai: AIClient

  /**
   * Create a new PDFCraft client
   *
   * @param apiKeyOrConfig - API key string or configuration object
   *
   * @example
   * ```typescript
   * // With just an API key
   * const client = new PDFCraft('pk_live_your_api_key')
   *
   * // With configuration
   * const client = new PDFCraft({
   *   apiKey: 'pk_live_your_api_key',
   *   baseUrl: 'https://custom-domain.com/api/v1'
   * })
   * ```
   */
  constructor(apiKeyOrConfig: string | PDFCraftConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig
      this.baseUrl = '/api/v1'
    } else {
      this.apiKey = apiKeyOrConfig.apiKey
      this.baseUrl = apiKeyOrConfig.baseUrl || '/api/v1'
    }

    this.templates = new TemplatesClient(this.apiKey, this.baseUrl)
    this.ai = new AIClient(this.apiKey, this.baseUrl)
  }

  /**
   * Generate a PDF from HTML or URL
   *
   * @param options - Generation options
   * @returns Generation result with PDF URL
   *
   * @example
   * ```typescript
   * // From HTML
   * const result = await pdfcraft.generate({
   *   html: '<h1>Hello, World!</h1>',
   *   options: { format: 'A4' }
   * })
   *
   * // From URL
   * const result = await pdfcraft.generate({
   *   url: 'https://example.com'
   * })
   * ```
   */
  async generate(options: GenerateOptions): Promise<GenerationResult> {
    if (!options.html && !options.url) {
      throw new PDFCraftError('VALIDATION_ERROR', 'Either html or url must be provided')
    }

    const url = `${this.baseUrl}/generate`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    const data = (await response.json()) as ApiResponse<GenerationResult>

    if (!response.ok || ('error' in data && data.error)) {
      const error = 'error' in data && data.error ? data.error : { code: 'UNKNOWN', message: 'Unknown error' }
      throw PDFCraftError.fromApiError(error)
    }

    if ('data' in data) {
      return data.data
    }

    return data as unknown as GenerationResult
  }
}

// Default export
export default PDFCraft
