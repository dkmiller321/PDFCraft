'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Copy, Edit, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { Json } from '@/types/database'

interface Template {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
      fetchTemplates()
    }
    init()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredTemplates(
        templates.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, templates])

  async function fetchTemplates() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, description, is_public, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
    } else {
      setTemplates(data || [])
    }
    setIsLoading(false)
  }

  async function handleCreate() {
    if (!newTemplateName.trim() || !userId) return

    setIsCreating(true)
    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: userId,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        html: '<h1>Hello, {{name}}!</h1>\n<p>Welcome to your new template.</p>',
        css: null,
        sample_data: { name: 'World' } as Json,
        variables: ['name'] as Json,
        is_public: false,
      })
      .select('id')
      .single()

    setIsCreating(false)

    if (error) {
      console.error('Error creating template:', error)
      return
    }

    setIsCreateOpen(false)
    setNewTemplateName('')
    setNewTemplateDescription('')

    // Navigate to the new template editor
    if (data) {
      window.location.href = `/dashboard/templates/${data.id}`
    }
  }

  async function handleDuplicate(template: Template) {
    if (!userId) return
    setIsDuplicating(template.id)

    // Fetch the full template
    const { data: fullTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', template.id)
      .single()

    if (fetchError || !fullTemplate) {
      console.error('Error fetching template:', fetchError)
      setIsDuplicating(null)
      return
    }

    // Create the duplicate
    const { error: createError } = await supabase.from('templates').insert({
      user_id: userId,
      name: `${fullTemplate.name} (Copy)`,
      description: fullTemplate.description,
      html: fullTemplate.html,
      css: fullTemplate.css,
      sample_data: fullTemplate.sample_data,
      variables: fullTemplate.variables,
      is_public: false,
    })

    if (createError) {
      console.error('Error duplicating template:', createError)
    } else {
      fetchTemplates()
    }

    setIsDuplicating(null)
  }

  async function handleDelete() {
    if (!templateToDelete) return

    const { error } = await supabase.from('templates').delete().eq('id', templateToDelete.id)

    if (error) {
      console.error('Error deleting template:', error)
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id))
    }

    setIsDeleteOpen(false)
    setTemplateToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your PDF templates
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No matching templates' : 'No templates yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Templates let you create reusable PDF designs with dynamic variables. Create your first template to get started!'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                  {template.is_public && (
                    <Badge variant="secondary">Public</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Updated {formatDate(template.updated_at)}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm" className="flex-1">
                    <Link href={`/dashboard/templates/${template.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                    disabled={isDuplicating === template.id}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTemplateToDelete(template)
                      setIsDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Give your template a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Invoice Template"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Standard invoice for clients"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTemplateName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
