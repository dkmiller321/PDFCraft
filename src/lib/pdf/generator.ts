import puppeteer, { type Browser, type PDFOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

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

export interface GeneratePdfResult {
  success: true
  buffer: Buffer
  sizeBytes: number
}

export interface GeneratePdfError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type PdfGenerationResult = GeneratePdfResult | GeneratePdfError

/**
 * Check if we're running in a serverless environment (Vercel)
 */
function isServerless(): boolean {
  return !!process.env.AWS_LAMBDA_FUNCTION_VERSION || !!process.env.VERCEL
}

/**
 * Get the browser executable path based on environment
 */
async function getBrowserPath(): Promise<string> {
  if (isServerless()) {
    // Use @sparticuz/chromium for serverless
    return await chromium.executablePath()
  }

  // For local development, try common Chrome/Chromium paths
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    // Mac
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]

  // Return the first path that exists (we'll let puppeteer handle validation)
  for (const path of possiblePaths) {
    if (path) {
      return path
    }
  }

  // Fallback - let puppeteer try to find it
  return await chromium.executablePath()
}

/**
 * Launch a browser instance
 */
async function launchBrowser(): Promise<Browser> {
  const executablePath = await getBrowserPath()

  const args = isServerless()
    ? chromium.args
    : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]

  return puppeteer.launch({
    args,
    executablePath,
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 800,
    },
  })
}

/**
 * Generate a PDF from HTML content
 *
 * @param html - The HTML content to render as PDF
 * @param options - PDF generation options
 * @returns A result object with the PDF buffer or error
 */
export async function generatePdf(
  html: string,
  options: PdfOptions = {}
): Promise<PdfGenerationResult> {
  let browser: Browser | null = null

  try {
    // Validate input
    if (!html || typeof html !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_HTML',
          message: 'HTML content is required and must be a string',
        },
      }
    }

    // Launch browser
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Prepare PDF options
    const pdfOptions: PDFOptions = {
      format: options.format || 'A4',
      landscape: options.orientation === 'landscape',
      printBackground: options.printBackground ?? true,
      margin: options.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
    }

    // Add optional header/footer templates
    if (options.headerTemplate || options.footerTemplate) {
      pdfOptions.displayHeaderFooter = true
      pdfOptions.headerTemplate = options.headerTemplate || '<span></span>'
      pdfOptions.footerTemplate = options.footerTemplate || '<span></span>'
    }

    // Add scale if provided (must be between 0.1 and 2.0)
    if (options.scale !== undefined) {
      const scale = Math.max(0.1, Math.min(2.0, options.scale))
      pdfOptions.scale = scale
    }

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions)

    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(pdfBuffer)

    return {
      success: true,
      buffer,
      sizeBytes: buffer.length,
    }
  } catch (error) {
    console.error('PDF generation error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'PDF generation timed out. The HTML content may be too complex or include slow-loading resources.',
          },
        }
      }

      if (error.message.includes('executablePath')) {
        return {
          success: false,
          error: {
            code: 'BROWSER_NOT_FOUND',
            message: 'Chrome/Chromium browser not found. Please ensure it is installed.',
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: error.message,
        },
      }
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during PDF generation',
      },
    }
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close().catch(console.error)
    }
  }
}

/**
 * Generate a PDF from a URL
 *
 * @param url - The URL to render as PDF
 * @param options - PDF generation options
 * @returns A result object with the PDF buffer or error
 */
export async function generatePdfFromUrl(
  url: string,
  options: PdfOptions = {}
): Promise<PdfGenerationResult> {
  let browser: Browser | null = null

  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL is required and must be a string',
        },
      }
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'The provided URL is not valid',
        },
      }
    }

    // Launch browser
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Prepare PDF options (same as generatePdf)
    const pdfOptions: PDFOptions = {
      format: options.format || 'A4',
      landscape: options.orientation === 'landscape',
      printBackground: options.printBackground ?? true,
      margin: options.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
    }

    if (options.headerTemplate || options.footerTemplate) {
      pdfOptions.displayHeaderFooter = true
      pdfOptions.headerTemplate = options.headerTemplate || '<span></span>'
      pdfOptions.footerTemplate = options.footerTemplate || '<span></span>'
    }

    if (options.scale !== undefined) {
      const scale = Math.max(0.1, Math.min(2.0, options.scale))
      pdfOptions.scale = scale
    }

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions)
    const buffer = Buffer.from(pdfBuffer)

    return {
      success: true,
      buffer,
      sizeBytes: buffer.length,
    }
  } catch (error) {
    console.error('PDF generation from URL error:', error)

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'PDF generation timed out. The page may be too slow to load.',
          },
        }
      }

      if (error.message.includes('net::ERR')) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Failed to load the URL. Please check if the URL is accessible.',
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: error.message,
        },
      }
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during PDF generation',
      },
    }
  } finally {
    if (browser) {
      await browser.close().catch(console.error)
    }
  }
}
