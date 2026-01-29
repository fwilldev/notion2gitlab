import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Loader2,
  Pencil,
  Tag,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Textarea } from '~/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  excludeInvalidRows,
  includeAllRows,
  setPreviewRows,
  toggleRowExclusion,
  updatePreviewRow,
  wizardStore,
} from '~/lib/stores/wizard-store'
import { applyFilters } from '~/lib/filters/apply-filters'
import { validateRows } from '~/lib/validation/validate-rows'
import type { PreviewRow } from '~/lib/types/wizard'

export const Route = createFileRoute('/wizard/step-6')({
  component: Step6Preview,
})

function Step6Preview() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingRow, setEditingRow] = useState<PreviewRow | null>(null)
  const [editMode, setEditMode] = useState<
    'repository' | 'description' | 'labels' | null
  >(null)
  const [editValue, setEditValue] = useState('')
  const [repoSearch, setRepoSearch] = useState('')

  const parsedData = state.csvMapping.parsedData
  const previewRows = Array.isArray(state.preview?.rows)
    ? state.preview.rows
    : []
  const notionIdColumn = state.csvMapping.notionIdColumn
  const projects = Array.isArray(state.gitlab?.projects)
    ? state.gitlab.projects
    : []

  const filteredProjects = repoSearch
    ? projects.filter((p) =>
        p.path_with_namespace.toLowerCase().includes(repoSearch.toLowerCase()),
      )
    : projects

  useEffect(() => {
    if (!parsedData || !notionIdColumn) return

    setIsProcessing(true)

    const runValidation = async () => {
      const filteredRows = applyFilters(parsedData.rows, state.filters)

      const validated = await validateRows(filteredRows, {
        projects: state.gitlab.projects,
        markdownFiles: state.notionExport.markdownFiles,
        notionIdColumn,
        issueMapping: state.issueMapping,
      })

      setPreviewRows(validated)
      setIsProcessing(false)
    }

    runValidation()
  }, [
    parsedData,
    notionIdColumn,
    state.filters,
    state.gitlab.projects,
    state.notionExport.markdownFiles,
    state.issueMapping,
  ])

  const validCount = previewRows.filter(
    (r) => r.isValid && !r.isExcluded,
  ).length
  const invalidCount = previewRows.filter((r) => !r.isValid).length
  const excludedCount = previewRows.filter((r) => r.isExcluded).length
  const totalCount = previewRows.length

  const handleToggleRow = (rowId: string) => {
    toggleRowExclusion(rowId)
  }

  const handleExcludeInvalid = () => {
    excludeInvalidRows()
  }

  const handleIncludeAll = () => {
    includeAllRows()
  }

  const handleEditRepository = (row: PreviewRow) => {
    setEditingRow(row)
    setEditMode('repository')
    setEditValue(row.repository ?? '')
    setRepoSearch('')
  }

  const handleEditDescription = (row: PreviewRow) => {
    setEditingRow(row)
    setEditMode('description')
    setEditValue(row.description ?? '')
  }

  const handleEditLabels = (row: PreviewRow) => {
    setEditingRow(row)
    setEditMode('labels')
    setEditValue(row.labels.join(', '))
  }

  const handleSaveEdit = () => {
    if (!editingRow || !editMode) return

    if (editMode === 'repository') {
      const project = projects.find(
        (p) =>
          p.path_with_namespace.toLowerCase() === editValue.toLowerCase() ||
          p.name.toLowerCase() === editValue.toLowerCase(),
      )

      const currentErrors = editingRow.validationErrors.filter(
        (e) => !e.includes('Repository'),
      )
      const hasRepoError = editValue && !project
      const newErrors = hasRepoError
        ? [...currentErrors, `Repository "${editValue}" not found`]
        : currentErrors

      updatePreviewRow(editingRow.id, {
        repository: project?.path_with_namespace ?? editValue,
        repositoryId: project?.id ?? null,
        validationErrors: newErrors,
        isValid: newErrors.length === 0 && !!editingRow.title,
      })
    } else if (editMode === 'description') {
      updatePreviewRow(editingRow.id, {
        description: editValue,
      })
    } else if (editMode === 'labels') {
      const labels = editValue
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
      updatePreviewRow(editingRow.id, {
        labels,
      })
    }

    toast.success('Row updated')
    setEditingRow(null)
    setEditMode(null)
    setEditValue('')
  }

  const handleCloseDialog = () => {
    setEditingRow(null)
    setEditMode(null)
    setEditValue('')
    setRepoSearch('')
  }

  const handleNext = () => {
    navigate({ to: '/wizard/step-7' })
  }

  const canProceed = validCount > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preview & Validation</h1>
        <p className="text-muted-foreground mt-1">
          Review the data before creating GitLab issues. Click edit icons to
          modify repository or description.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Validation Summary
              </CardTitle>
              <CardDescription>
                Overview of rows and their validation status.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExcludeInvalid}
                disabled={invalidCount === 0}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Exclude Invalid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleIncludeAll}
                disabled={excludedCount === 0}
              >
                Include All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Validating rows...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ready to Import
                </div>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {invalidCount}
                </div>
                <div className="text-sm text-muted-foreground">Invalid</div>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {excludedCount}
                </div>
                <div className="text-sm text-muted-foreground">Excluded</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row Details</CardTitle>
          <CardDescription>
            Click the edit icons to modify repository or description for each
            row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Include</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Labels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={row.isExcluded ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={!row.isExcluded}
                        onCheckedChange={() => handleToggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {row.isValid ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {row.isValid ? (
                              'Valid - ready to import'
                            ) : (
                              <div className="space-y-1">
                                {row.validationErrors.map((err, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    {err}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {row.title || (
                        <span className="text-muted-foreground italic">
                          No title
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.repository ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded max-w-[120px] truncate block">
                            {row.repository}
                          </code>
                        ) : (
                          <span className="text-red-600 text-sm">Missing</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEditRepository(row)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground max-w-[150px] truncate block cursor-help">
                                  {row.description.slice(0, 50)}
                                  {row.description.length > 50 ? '...' : ''}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <pre className="text-xs whitespace-pre-wrap">
                                  {row.description.slice(0, 500)}
                                  {row.description.length > 500 ? '...' : ''}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEditDescription(row)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.labels.slice(0, 2).map((label, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {label}
                              </Badge>
                            ))}
                            {row.labels.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{row.labels.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEditLabels(row)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog
        open={editMode === 'repository'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Edit Repository
            </DialogTitle>
            <DialogDescription>
              Select a repository for "{editingRow?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Repository</Label>
              <Input
                placeholder="Search repositories..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setEditValue(project.path_with_namespace)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        editValue === project.path_with_namespace
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {project.path_with_namespace}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No repositories found
                  </div>
                )}
              </div>
            </ScrollArea>
            {editValue && (
              <div className="text-sm">
                Selected:{' '}
                <code className="bg-muted px-1 py-0.5 rounded">
                  {editValue}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editValue}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editMode === 'description'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edit Description
            </DialogTitle>
            <DialogDescription>
              Edit the description for "{editingRow?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Description (Markdown)</Label>
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter issue description..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editMode === 'labels'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Edit Labels
            </DialogTitle>
            <DialogDescription>
              Edit the labels for "{editingRow?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Labels (comma-separated)</Label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="bug, enhancement, priority:high"
              />
              <p className="text-sm text-muted-foreground">
                Enter labels separated by commas.
              </p>
            </div>
            {editValue && (
              <div className="flex flex-wrap gap-1">
                {editValue
                  .split(',')
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((label, i) => (
                    <Badge key={i} variant="secondary">
                      {label}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!canProceed && !isProcessing && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Cannot proceed</span>
          </div>
          <p className="text-sm mt-1">
            There are no valid rows ready to import. Please fix validation
            errors or adjust your mappings.
          </p>
        </div>
      )}

      <WizardNavigation
        currentStep={6}
        isNextDisabled={!canProceed}
        onNext={handleNext}
      />
    </div>
  )
}
