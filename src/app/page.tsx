import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Zap, Code2, Sparkles, Layout, Lock, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">PDFCraft</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
                Docs
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Now with AI-powered templates
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Generate{' '}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Beautiful PDFs
                </span>{' '}
                in Seconds
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg">
                The simplest API for generating professional PDFs from HTML.
                Perfect for invoices, reports, certificates, and more.
                No complex setup required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/signup">
                    Get 50 Free PDFs
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <a href="#features">View Features</a>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-muted-foreground">Free PDFs/mo</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold">&lt;2s</div>
                  <div className="text-sm text-muted-foreground">Avg. generation</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Column - Code Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-sm text-slate-400 font-mono">generate.js</span>
                </div>
                <pre className="text-sm text-slate-300 overflow-x-auto">
                  <code>{`// Generate a PDF in 3 lines of code
const response = await fetch(
  'https://api.pdfcraft.com/v1/generate',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer pk_live_xxx...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: \`
        <h1>Invoice #1234</h1>
        <p>Amount: $99.00</p>
        <p>Due: January 30, 2026</p>
      \`
    })
  }
);

const { url } = await response.json();
// => https://files.pdfcraft.com/abc123.pdf`}</code>
                </pre>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">PDF Generated</div>
                    <div className="text-xs text-muted-foreground">1.2s</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Simple REST API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 scroll-mt-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need for PDF generation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From simple HTML to complex templates, PDFCraft handles it all with a clean, developer-friendly API.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Simple API */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Simple API</h3>
              <p className="text-muted-foreground mb-4">
                Generate PDFs with a single API call. No complex setup, no headless browsers to manage.
              </p>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
{`fetch('/api/v1/generate', {
  body: JSON.stringify({
    html: '<h1>Hello!</h1>'
  })
})`}
              </pre>
            </div>

            {/* AI Templates */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Templates</h3>
              <p className="text-muted-foreground mb-4">
                Describe what you need and let AI create professional templates for you instantly.
              </p>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
{`fetch('/api/v1/ai/generate-template', {
  body: JSON.stringify({
    prompt: 'Professional invoice'
  })
})`}
              </pre>
            </div>

            {/* Lightning Fast */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground mb-4">
                Generate PDFs in under 2 seconds on average. Built for high-volume production use.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>&lt;2s average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>99.9% uptime</span>
                </div>
              </div>
            </div>

            {/* Reusable Templates */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reusable Templates</h3>
              <p className="text-muted-foreground mb-4">
                Create templates with Handlebars variables and generate PDFs with dynamic data.
              </p>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
{`<h1>Invoice for {{name}}</h1>
<p>Amount: {{amount}}</p>`}
              </pre>
            </div>

            {/* Secure by Default */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure by Default</h3>
              <p className="text-muted-foreground mb-4">
                API key authentication, encrypted storage, and your data is never shared or used for training.
              </p>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
{`Authorization: Bearer pk_live_xxx
Content-Type: application/json`}
              </pre>
            </div>

            {/* Developer Tools */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Developer Tools</h3>
              <p className="text-muted-foreground mb-4">
                TypeScript SDK, usage dashboard, generation history, and comprehensive documentation.
              </p>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
{`import { PDFCraft } from 'pdfcraft'
const pdf = new PDFCraft(apiKey)`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start generating PDFs for free. No credit card required.
            Upgrade when you need more.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/signup">
              Get 50 Free PDFs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold">PDFCraft</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
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
