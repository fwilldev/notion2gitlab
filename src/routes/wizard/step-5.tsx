import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { FileText, GitBranch, Settings2, Tag } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import { updateIssueMapping, wizardStore } from '~/lib/stores/wizard-store'

export const Route = createFileRoute('/wizard/step-5')({
  component: Step5IssueMapping,
})

function Step5IssueMapping() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)

  const parsedData = state.csvMapping.parsedData
  const issueMapping = state.issueMapping
  const headers = parsedData?.headers ?? []
  const projects = state.gitlab.projects

  const handleTitleColumnChange = (value: string) => {
    updateIssueMapping({ titleColumn: value })
  }

  const handleRepositoryColumnChange = (value: string) => {
    updateIssueMapping({ repositoryColumn: value })
  }

  const handleDefaultRepositoryChange = (value: string) => {
    updateIssueMapping({
      defaultRepository: value === '__none__' ? null : value,
    })
  }

  const handleUseMarkdownChange = (checked: boolean) => {
    updateIssueMapping({ useMarkdownDescription: checked })
  }

  const handleSectionHeaderChange = (value: string) => {
    updateIssueMapping({ markdownSectionHeader: value || null })
  }

  const handleLabelColumnToggle = (header: string, checked: boolean) => {
    const current = issueMapping.labelColumns
    if (checked) {
      updateIssueMapping({ labelColumns: [...current, header] })
    } else {
      updateIssueMapping({ labelColumns: current.filter((c) => c !== header) })
    }
  }

  const handleStaticLabelsChange = (value: string) => {
    const labels = value
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean)
    updateIssueMapping({ staticLabels: labels })
  }

  const handleNext = () => {
    navigate({ to: '/wizard/step-6' })
  }

  const canProceed =
    issueMapping.titleColumn !== null &&
    (issueMapping.repositoryColumn !== null ||
      issueMapping.defaultRepository !== null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Issue Mapping</h1>
        <p className="text-muted-foreground mt-1">
          Configure how CSV columns map to GitLab issue fields.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Required Mappings
          </CardTitle>
          <CardDescription>
            These fields are required to create GitLab issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title-column">Issue Title Column</Label>
            <Select
              value={issueMapping.titleColumn ?? ''}
              onValueChange={handleTitleColumnChange}
            >
              <SelectTrigger id="title-column">
                <SelectValue placeholder="Select column for issue title" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The column containing the text to use as the GitLab issue title.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-column" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Repository Column
            </Label>
            <Select
              value={issueMapping.repositoryColumn ?? ''}
              onValueChange={handleRepositoryColumnChange}
            >
              <SelectTrigger id="repo-column">
                <SelectValue placeholder="Select column for target repository" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The column containing the GitLab project path (e.g.,
              "group/project-name").
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-repo" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Default Repository (Fallback)
            </Label>
            <Select
              value={issueMapping.defaultRepository ?? '__none__'}
              onValueChange={handleDefaultRepositoryChange}
            >
              <SelectTrigger id="default-repo">
                <SelectValue placeholder="No default repository" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No default repository</SelectItem>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.path_with_namespace}
                  >
                    {project.path_with_namespace}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Used when a row has an empty repository value. If set, rows
              without a repository will use this as fallback.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Issue Description
          </CardTitle>
          <CardDescription>
            Configure where to get the issue description content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-markdown">Use Markdown Files</Label>
              <p className="text-sm text-muted-foreground">
                Use the content from linked Markdown files as issue description.
              </p>
            </div>
            <Switch
              id="use-markdown"
              checked={issueMapping.useMarkdownDescription}
              onCheckedChange={handleUseMarkdownChange}
            />
          </div>

          {issueMapping.useMarkdownDescription && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label htmlFor="section-header">Section Header (Optional)</Label>
              <Input
                id="section-header"
                value={issueMapping.markdownSectionHeader ?? ''}
                onChange={(e) => handleSectionHeaderChange(e.target.value)}
                placeholder="e.g., Description"
              />
              <p className="text-sm text-muted-foreground">
                If specified, only content under this heading will be used.
                Leave empty to use the entire Markdown file.
              </p>
            </div>
          )}

          {!issueMapping.useMarkdownDescription && (
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              Without Markdown files, the issue description will be generated
              from CSV field values (key: value format).
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Labels (Optional)
          </CardTitle>
          <CardDescription>
            Select columns to use as GitLab issue labels. Multiple values can be
            comma-separated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {headers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {headers.map((header) => (
                <div key={header} className="flex items-center space-x-2">
                  <Checkbox
                    id={`label-${header}`}
                    checked={issueMapping.labelColumns.includes(header)}
                    onCheckedChange={(checked) =>
                      handleLabelColumnToggle(header, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`label-${header}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {header}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No columns available.
            </p>
          )}

          {issueMapping.labelColumns.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">
                Selected label columns:
              </p>
              <p className="text-sm text-muted-foreground">
                {issueMapping.labelColumns.join(', ')}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <Label htmlFor="static-labels">Static Labels</Label>
            <Input
              id="static-labels"
              value={(issueMapping.staticLabels ?? []).join(', ')}
              onChange={(e) => handleStaticLabelsChange(e.target.value)}
              placeholder="e.g., imported, notion-migration"
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated labels to add to all imported issues.
            </p>
            {(issueMapping.staticLabels ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(issueMapping.staticLabels ?? []).map((label, i) => (
                  <Badge key={i} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep={5}
        isNextDisabled={!canProceed}
        onNext={handleNext}
      />
    </div>
  )
}
