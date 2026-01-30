import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, FileText, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    credits: '50 PDFs',
    features: [
      '50 PDFs per month',
      'Basic templates',
      'API access',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/month',
    description: 'For growing projects',
    credits: '500 PDFs',
    features: [
      '500 PDFs per month',
      'Custom templates',
      'API access',
      'Email support',
      'Usage analytics',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=starter',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For professional teams',
    credits: '2,000 PDFs',
    features: [
      '2,000 PDFs per month',
      'AI template generation',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'Team collaboration',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$149',
    period: '/month',
    description: 'For large organizations',
    credits: '10,000 PDFs',
    features: [
      '10,000 PDFs per month',
      'Unlimited AI generations',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'SSO/SAML',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    href: '/signup?plan=enterprise',
    popular: false,
  },
]

const faqs = [
  {
    question: 'How do PDF credits work?',
    answer: 'Each PDF generation counts as one credit. Credits reset at the start of each billing cycle. Unused credits do not roll over.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. When upgrading, you\'ll have immediate access to the new features. When downgrading, changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'The Free plan is available forever with 50 PDFs per month. For paid plans, you can upgrade and get a prorated refund if you\'re not satisfied within the first 14 days.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. Enterprise customers can also pay by invoice.',
  },
  {
    question: 'What happens if I exceed my PDF limit?',
    answer: 'If you reach your monthly limit, you\'ll receive an error response when trying to generate more PDFs. You can either wait for your credits to reset or upgrade to a higher plan.',
  },
  {
    question: 'Do you offer volume discounts?',
    answer: 'For organizations requiring more than 10,000 PDFs per month, please contact our sales team for custom pricing.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">PDFCraft</span>
            </Link>
            <div className="flex items-center gap-4">
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

      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg ring-2 ring-primary'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <div className="mb-6">
                    <Badge variant="secondary" className="text-sm">
                      {plan.credits}/month
                    </Badge>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start generating PDFs for free. No credit card required.
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
            <Link href="/" className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold">PDFCraft</span>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
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
