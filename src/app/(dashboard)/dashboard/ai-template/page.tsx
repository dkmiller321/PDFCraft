'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Edit, Loader2, Sparkles, Wand2 } from 'lucide-react'

type StyleType = 'minimal' | 'corporate' | 'creative' | 'bold'

const styleOptions: { value: StyleType; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: 'Clean, simple design with lots of whitespace' },
  { value: 'corporate', label: 'Corporate', description: 'Professional business style with structure' },
  { value: 'creative', label: 'Creative', description: 'Expressive design with visual flair' },
  { value: 'bold', label: 'Bold', description: 'Strong visual impact with large typography' },
]

const suggestedPrompts = [
  'Professional invoice for freelance services',
  'Modern resume/CV with sections for experience and skills',
  'Event ticket with QR code placeholder',
  'Product shipping label with address fields',
  'Certificate of completion for online course',
  'Restaurant menu with categories and prices',
]

const colorPresets = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
]

interface GeneratedTemplate {
  template_id: string
  name: string
  html: string
  variables: string[]
  preview_url: string
}

export default function AITemplatePage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StyleType>('minimal')
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedTemplate(null)

    try {
      // Get API key
      const { data: keys } = await supabase
        .from('api_keys')
        .select('id')
        .is('revoked_at', null)
        .limit(1)

      if (!keys || keys.length === 0) {
        setError('You need an API key to generate templates. Create one in the API Keys section.')
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/v1/ai/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          ...(primaryColor && { primaryColor }),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.code === 'PLAN_REQUIRED') {
          setShowUpgradeDialog(true)
        } else {
          setError(result.error?.message || 'Failed to generate template')
        }
        setIsGenerating(false)
        return
      }

      setGeneratedTemplate(result.data)
    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate template. Please try again.')
    }

    setIsGenerating(false)
  }

  function handleEdit() {
    if (generatedTemplate) {
      router.push(generatedTemplate.preview_url)
    }
  }

  function handleStartOver() {
    setGeneratedTemplate(null)
    setPrompt('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Template Generator
        </h1>
        <p className="text-muted-foreground">
          Describe what you need and let AI create a beautiful template for you
        </p>
      </div>

      {!generatedTemplate ? (
        <>
          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle>What do you want to create?</CardTitle>
              <CardDescription>
                Describe your template in detail. Include information about layout, content, and purpose.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A professional invoice template for a design agency with company logo placeholder, itemized services table, payment terms, and a modern blue color scheme..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Suggested Prompts */}
              <div>
                <Label className="text-sm text-muted-foreground">Or try a suggestion:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedPrompts.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose a Style</CardTitle>
              <CardDescription>
                Select the visual style for your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {styleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStyle(option.value)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      style === option.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Color (Optional)</CardTitle>
              <CardDescription>
                Choose a primary color for your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-center">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(primaryColor === color ? null : color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      primaryColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
                  <input
                    id="custom-color"
                    type="color"
                    value={primaryColor || '#3b82f6'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                </div>
                {primaryColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrimaryColor(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Template
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Generated Template Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Template Generated!
                  </CardTitle>
                  <CardDescription>{generatedTemplate.name}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {generatedTemplate.variables.length} variables
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatedTemplate.html}
                  className="w-full h-[500px] bg-white"
                  title="Template Preview"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Variables */}
              {generatedTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Detected Variables:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {generatedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" onClick={handleStartOver}>
                  Start Over
                </Button>
                <Button onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade to Pro</AlertDialogTitle>
            <AlertDialogDescription>
              AI template generation is available on Pro and Enterprise plans.
              Upgrade to unlock this powerful feature and create beautiful templates
              with just a description!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href="/pricing">View Plans</a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
