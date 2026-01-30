import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pdfcraft.dev'

export const metadata: Metadata = {
  title: {
    default: 'PDFCraft - Generate Beautiful PDFs from HTML',
    template: '%s | PDFCraft',
  },
  description:
    'The simplest API for generating professional PDFs from HTML. Perfect for invoices, reports, certificates, and more. Start free with 50 PDFs per month.',
  keywords: [
    'PDF generation',
    'HTML to PDF',
    'PDF API',
    'invoice generator',
    'report generator',
    'document generation',
    'PDF templates',
    'AI templates',
  ],
  authors: [{ name: 'PDFCraft' }],
  creator: 'PDFCraft',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'PDFCraft',
    title: 'PDFCraft - Generate Beautiful PDFs from HTML',
    description:
      'The simplest API for generating professional PDFs from HTML. Perfect for invoices, reports, certificates, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDFCraft - PDF Generation API',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFCraft - Generate Beautiful PDFs from HTML',
    description:
      'The simplest API for generating professional PDFs from HTML. Start free with 50 PDFs per month.',
    images: ['/og-image.png'],
    creator: '@pdfcraft',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
