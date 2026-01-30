'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Handlebars from 'handlebars'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ArrowLeft, Code, Eye, FileText, Loader2, Save } from 'lucide-react'
import type { Json } from '@/types/database'

interface Template {
  id: string
  name: string
  description: string | null
  html: string
  css: string | null
  sample_data: Json
  variables: Json
  is_public: boolean
  created_at: string
  updated_at: string
}

type EditorTab = 'html' | 'css' | 'data'

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createBrowserClient()

  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('html')
  const [hasChanges, setHasChanges] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Editor state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [sampleDataJson, setSampleDataJson] = useState('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Preview state
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Fetch template
  useEffect(() => {
    async function fetchTemplate() {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error('Error fetching template:', error)
        router.push('/dashboard/templates')
        return
      }

      setTemplate(data)
      setName(data.name)
      setDescription(data.description || '')
      setHtml(data.html)
      setCss(data.css || '')
      setSampleDataJson(JSON.stringify((data.sample_data as Record<string, unknown>) || {}, null, 2))
      setIsLoading(false)
    }

    fetchTemplate()
  }, [id, supabase, router])

  // Update preview when html, css, or sample data changes
  const updatePreview = useCallback(() => {
    try {
      let data = {}
      try {
        data = JSON.parse(sampleDataJson)
        setJsonError(null)
      } catch {
        setJsonError('Invalid JSON')
        return
      }

      const compiled = Handlebars.compile(html)
      const rendered = compiled(data)

      // Build full HTML with CSS
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; margin: 0; }
    ${css}
  </style>
</head>
<body>
${rendered}
</body>
</html>`

      setPreviewHtml(fullHtml)
      setPreviewError(null)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Template error')
    }
  }, [html, css, sampleDataJson])

  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // Track changes
  useEffect(() => {
    if (!template) return
    const changed =
      name !== template.name ||
      description !== (template.description || '') ||
      html !== template.html ||
      css !== (template.css || '') ||
      sampleDataJson !== JSON.stringify((template.sample_data as Record<string, unknown>) || {}, null, 2)
    setHasChanges(changed)
  }, [name, description, html, css, sampleDataJson, template])

  async function handleSave() {
    if (!template) return

    let sampleData = {}
    try {
      sampleData = JSON.parse(sampleDataJson)
    } catch {
      setJsonError('Invalid JSON - cannot save')
      return
    }

    // Extract variables from HTML
    const variables = extractVariables(html)

    setIsSaving(true)
    const { error } = await supabase
      .from('templates')
      .update({
        name,
        description: description || null,
        html,
        css: css || null,
        sample_data: sampleData as Json,
        variables: variables as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setIsSaving(false)

    if (error) {
      console.error('Error saving template:', error)
      return
    }

    // Update local template state
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            name,
            description: description || null,
            html,
            css: css || null,
            sample_data: sampleData as Json,
            variables: variables as Json,
            updated_at: new Date().toISOString(),
          }
        : null
    )
    setHasChanges(false)
  }

  async function handlePreviewPdf() {
    // Get API key
    const { data: keys } = await supabase
      .from('api_keys')
      .select('id')
      .is('revoked_at', null)
      .limit(1)

    if (!keys || keys.length === 0) {
      alert('You need an API key to generate PDFs. Create one in the API Keys section.')
      return
    }

    setIsGenerating(true)

    try {
      let data = {}
      try {
        data = JSON.parse(sampleDataJson)
      } catch {
        // Use empty object if JSON is invalid
      }

      const response = await fetch(`/api/v1/templates/${id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank')
      } else {
        alert(result.error?.message || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    }

    setIsGenerating(false)
  }

  function extractVariables(html: string): string[] {
    const regex = /\{\{([^{}]+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(html)) !== null) {
      const variable = match[1].trim()
      if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
        const varName = variable.split(/[\s.]/)[0]
        if (varName && !['if', 'unless', 'each', 'with', 'else'].includes(varName)) {
          variables.add(varName)
        }
      }
    }

    return Array.from(variables)
  }

  function handleBack() {
    if (hasChanges) {
      setPendingNavigation('/dashboard/templates')
      setShowLeaveDialog(true)
    } else {
      router.push('/dashboard/templates')
    }
  }

  function confirmLeave() {
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
    setShowLeaveDialog(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-bold h-auto py-1 px-2 border-transparent hover:border-input focus:border-input"
              />
              {hasChanges && <Badge variant="secondary">Unsaved</Badge>}
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="text-sm text-muted-foreground h-auto py-0.5 px-2 mt-1 border-transparent hover:border-input focus:border-input"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviewPdf} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Preview PDF
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor Panel */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-2">
            <div className="flex gap-1">
              <Button
                variant={activeTab === 'html' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('html')}
              >
                <Code className="w-4 h-4 mr-1" />
                HTML
              </Button>
              <Button
                variant={activeTab === 'css' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('css')}
              >
                <Code className="w-4 h-4 mr-1" />
                CSS
              </Button>
              <Button
                variant={activeTab === 'data' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('data')}
              >
                <Code className="w-4 h-4 mr-1" />
                Sample Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {activeTab === 'html' && (
              <div className="space-y-2">
                <Label>HTML Template (Handlebars syntax)</Label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="w-full h-[500px] font-mono text-sm p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="<h1>Hello, {{name}}!</h1>"
                />
              </div>
            )}
            {activeTab === 'css' && (
              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <textarea
                  value={css}
                  onChange={(e) => setCss(e.target.value)}
                  className="w-full h-[500px] font-mono text-sm p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="h1 { color: #333; }"
                />
              </div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sample Data (JSON)</Label>
                  {jsonError && <span className="text-sm text-destructive">{jsonError}</span>}
                </div>
                <textarea
                  value={sampleDataJson}
                  onChange={(e) => setSampleDataJson(e.target.value)}
                  className={`w-full h-[500px] font-mono text-sm p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
                    jsonError ? 'border-destructive' : ''
                  }`}
                  placeholder='{"name": "World"}'
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {previewError ? (
              <div className="h-[500px] flex items-center justify-center border rounded-md bg-muted/50">
                <div className="text-center text-destructive">
                  <p className="font-medium">Template Error</p>
                  <p className="text-sm mt-1">{previewError}</p>
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[530px] border rounded-md bg-white"
                title="Template Preview"
                sandbox="allow-same-origin"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>Leave Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
