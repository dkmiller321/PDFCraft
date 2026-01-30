/**
 * PDFCraft SDK
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
 *
 * // Generate from a template
 * const pdf = await pdfcraft.templates.generate('template-id', {
 *   data: { name: 'John' }
 * })
 * ```
 */

export { PDFCraft, type PDFCraftConfig } from './client'
export * from './types'
export * from './errors'

// Default export
export { default } from './client'
