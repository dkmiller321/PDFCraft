'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, FileText, ArrowRight, Book, Code2, Key, Zap } from 'lucide-react'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-300 text-sm p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">PDFCraft</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Sign In
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">Documentation</Badge>
          <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
          <p className="text-xl text-muted-foreground">
            Get started with PDFCraft in under 5 minutes. Generate your first PDF with a single API call.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-12">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Book className="w-5 h-5" />
            On this page
          </h2>
          <ul className="space-y-2">
            <li>
              <a href="#get-api-key" className="text-primary hover:underline flex items-center gap-2">
                <Key className="w-4 h-4" />
                1. Get your API key
              </a>
            </li>
            <li>
              <a href="#first-request" className="text-primary hover:underline flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                2. Make your first request
              </a>
            </li>
            <li>
              <a href="#response" className="text-primary hover:underline flex items-center gap-2">
                <Zap className="w-4 h-4" />
                3. Understanding the response
              </a>
            </li>
          </ul>
        </div>

        {/* Step 1: Get API Key */}
        <section id="get-api-key" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
            Get your API key
          </h2>
          <p className="text-muted-foreground mb-6">
            To use the PDFCraft API, you&apos;ll need an API key. Here&apos;s how to get one:
          </p>
          <ol className="list-decimal list-inside space-y-3 mb-6 text-muted-foreground">
            <li><Link href="/signup" className="text-primary hover:underline">Create a free account</Link> or <Link href="/login" className="text-primary hover:underline">sign in</Link></li>
            <li>Go to the <strong className="text-foreground">API Keys</strong> section in your dashboard</li>
            <li>Click <strong className="text-foreground">Create New Key</strong> and give it a name</li>
            <li>Copy your API key - it will only be shown once!</li>
          </ol>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Keep your API key secret. Never commit it to version control or expose it in client-side code.
            </p>
          </div>
          <p className="text-muted-foreground mb-4">Your API key will look like this:</p>
          <CodeBlock code="pk_live_abc123def456ghi789jkl012mno345" />
        </section>

        {/* Step 2: First Request */}
        <section id="first-request" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
            Make your first request
          </h2>
          <p className="text-muted-foreground mb-6">
            Use the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/api/v1/generate</code> endpoint to generate a PDF from HTML.
          </p>

          <h3 className="text-lg font-semibold mb-3">Using cURL</h3>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://your-app.vercel.app/api/v1/generate \\
  -H "Authorization: Bearer pk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hello, World!</h1><p>This is my first PDF.</p>",
    "options": {
      "format": "A4",
      "margin": {
        "top": "1cm",
        "bottom": "1cm"
      }
    }
  }'`}
          />

          <h3 className="text-lg font-semibold mt-8 mb-3">Using JavaScript/TypeScript</h3>
          <CodeBlock
            language="javascript"
            code={`const response = await fetch('https://your-app.vercel.app/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer pk_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<h1>Hello, World!</h1><p>This is my first PDF.</p>',
    options: {
      format: 'A4',
      margin: { top: '1cm', bottom: '1cm' }
    }
  }),
});

const data = await response.json();
console.log(data.data.url); // URL to your generated PDF`}
          />

          <h3 className="text-lg font-semibold mt-8 mb-3">Request Parameters</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="text-left p-3 font-semibold">Parameter</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3"><code className="text-primary">html</code></td>
                  <td className="p-3">string</td>
                  <td className="p-3">The HTML content to convert to PDF</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">url</code></td>
                  <td className="p-3">string</td>
                  <td className="p-3">Alternative: URL to render as PDF</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">options.format</code></td>
                  <td className="p-3">string</td>
                  <td className="p-3">Page size: A4, Letter, Legal, etc.</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">options.orientation</code></td>
                  <td className="p-3">string</td>
                  <td className="p-3">portrait or landscape</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">options.margin</code></td>
                  <td className="p-3">object</td>
                  <td className="p-3">Page margins (top, right, bottom, left)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 3: Response */}
        <section id="response" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
            Understanding the response
          </h2>
          <p className="text-muted-foreground mb-6">
            A successful response returns a JSON object with the PDF details:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "data": {
    "generation_id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://your-bucket.supabase.co/storage/v1/object/public/pdfs/...",
    "size_bytes": 15234,
    "duration_ms": 1250
  }
}`}
          />

          <h3 className="text-lg font-semibold mt-8 mb-3">Response Fields</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="text-left p-3 font-semibold">Field</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3"><code className="text-primary">generation_id</code></td>
                  <td className="p-3">Unique identifier for this generation</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">url</code></td>
                  <td className="p-3">Public URL to download the generated PDF</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">size_bytes</code></td>
                  <td className="p-3">File size in bytes</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="text-primary">duration_ms</code></td>
                  <td className="p-3">Time taken to generate the PDF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-3">Error Responses</h3>
          <p className="text-muted-foreground mb-4">If something goes wrong, you&apos;ll receive an error response:</p>
          <CodeBlock
            language="json"
            code={`{
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "You have reached your monthly PDF generation limit",
    "details": {
      "credits_used": 50,
      "credits_limit": 50,
      "upgrade_url": "/pricing"
    }
  }
}`}
          />
        </section>

        {/* Next Steps */}
        <section className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <p className="text-muted-foreground mb-6">
            Now that you&apos;ve generated your first PDF, here&apos;s what to explore next:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/dashboard/templates" className="bg-white dark:bg-slate-800 p-4 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-1">Create Templates</h3>
              <p className="text-sm text-muted-foreground">Build reusable templates with Handlebars variables</p>
            </Link>
            <Link href="/dashboard/ai-template" className="bg-white dark:bg-slate-800 p-4 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-1">AI Templates</h3>
              <p className="text-sm text-muted-foreground">Let AI generate templates from descriptions</p>
            </Link>
            <Link href="/dashboard/api-keys" className="bg-white dark:bg-slate-800 p-4 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-1">Manage API Keys</h3>
              <p className="text-sm text-muted-foreground">Create and manage multiple API keys</p>
            </Link>
            <Link href="/dashboard/usage" className="bg-white dark:bg-slate-800 p-4 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-1">View Usage</h3>
              <p className="text-sm text-muted-foreground">Track your PDF generation usage</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Ready to build?</h2>
          <p className="text-muted-foreground mb-6">
            Start generating PDFs for free with 50 credits per month.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold">PDFCraft</span>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; 2026 PDFCraft. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
