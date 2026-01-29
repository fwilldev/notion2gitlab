import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
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
import { Progress } from '~/components/ui/progress'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  addProcessingResult,
  completeProcessing,
  resetWizard,
  setProcessingStatus,
  startProcessing,
  wizardStore,
} from '~/lib/stores/wizard-store'
import { createGitLabClient } from '~/lib/api/gitlab-client'
import {
  createIssuesFromRows,
  downloadCsv,
  exportResultsToCsv,
} from '~/lib/processing/create-issues'
import { applyFilters } from '~/lib/filters/apply-filters'

export const Route = createFileRoute('/wizard/step-7')({
  component: Step7Processing,
})

function Step7Processing() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)
  const [isPaused, setIsPaused] = useState(false)

  const processing = state.processing
  const previewRows = state.preview.rows

  const rowsToProcess = useMemo(
    () => previewRows.filter((r) => r.isValid && !r.isExcluded),
    [previewRows],
  )

  const progressPercent =
    processing.totalCount > 0
      ? Math.round((processing.currentIndex / processing.totalCount) * 100)
      : 0

  const successCount = processing.results.filter(
    (r) => r.status === 'success',
  ).length
  const failedCount = processing.results.filter(
    (r) => r.status === 'failed',
  ).length

  const handleStart = useCallback(async () => {
    if (processing.status === 'running') return

    const client = createGitLabClient(state.gitlab.domain, state.gitlab.token)
    const csvRows = applyFilters(
      state.csvMapping.parsedData?.rows ?? [],
      state.filters,
    )

    startProcessing(rowsToProcess.length)
    toast.info('Import started', {
      description: `Creating ${rowsToProcess.length} issues...`,
    })

    try {
      await createIssuesFromRows(rowsToProcess, csvRows, {
        client,
        issueMapping: state.issueMapping,
        onProgress: (result) => {
          addProcessingResult(result)
        },
        onComplete: () => {
          completeProcessing()
          const results = wizardStore.state.processing.results
          const successCount = results.filter(
            (r) => r.status === 'success',
          ).length
          const failedCount = results.filter(
            (r) => r.status === 'failed',
          ).length
          if (failedCount === 0) {
            toast.success('Import completed!', {
              description: `Successfully created ${successCount} issues`,
            })
          } else {
            toast.warning('Import completed with errors', {
              description: `${successCount} succeeded, ${failedCount} failed`,
            })
          }
        },
        rateLimitMs: 1000,
      })
    } catch (error) {
      setProcessingStatus('failed')
      toast.error('Import failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      })
      console.error('Processing failed:', error)
    }
  }, [
    processing.status,
    rowsToProcess,
    state.gitlab.domain,
    state.gitlab.token,
    state.csvMapping.parsedData?.rows,
    state.filters,
    state.issueMapping,
    state.notionExport.markdownFiles,
  ])

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      setProcessingStatus('running')
    } else {
      setIsPaused(true)
      setProcessingStatus('paused')
    }
  }, [isPaused])

  const handleExportResults = useCallback(() => {
    const csv = exportResultsToCsv(processing.results)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadCsv(csv, `gitlab-import-results-${timestamp}.csv`)
  }, [processing.results])

  const handleStartOver = useCallback(() => {
    resetWizard()
    navigate({ to: '/wizard/step-1' })
  }, [navigate])

  const isIdle = processing.status === 'idle'
  const isRunning = processing.status === 'running'
  const isCompleted = processing.status === 'completed'
  const isFailed = processing.status === 'failed'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create GitLab Issues</h1>
        <p className="text-muted-foreground mt-1">
          {isIdle
            ? `Ready to create ${rowsToProcess.length} issues in GitLab.`
            : isCompleted
              ? 'Import completed!'
              : `Processing ${processing.currentIndex} of ${processing.totalCount} issues...`}
        </p>
      </div>

      {isIdle && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Import</CardTitle>
            <CardDescription>
              Review the summary below and click "Start Import" when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{rowsToProcess.length}</div>
                <div className="text-sm text-muted-foreground">
                  Issues to Create
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {new Set(rowsToProcess.map((r) => r.repository)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  Target Repositories
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">
                  ~{Math.ceil(rowsToProcess.length / 60)} min
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimated Time
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600 font-medium">
                <AlertTriangle className="h-5 w-5" />
                Before you start
              </div>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Issues will be created immediately in GitLab</li>
                <li>• This action cannot be undone automatically</li>
                <li>• Rate limited to 1 request per second</li>
              </ul>
            </div>

            <Button size="lg" className="w-full" onClick={handleStart}>
              <Play className="h-5 w-5 mr-2" />
              Start Import
            </Button>
          </CardContent>
        </Card>
      )}

      {(isRunning || isCompleted || isFailed) && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {isRunning
                      ? 'Import in Progress'
                      : isCompleted
                        ? 'Import Completed'
                        : 'Import Failed'}
                  </CardTitle>
                  <CardDescription>
                    {processing.currentIndex} of {processing.totalCount} issues
                    processed
                  </CardDescription>
                </div>
                {isRunning && (
                  <Button variant="outline" onClick={handlePauseResume}>
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-bold">{successCount}</div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-bold">{failedCount}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Loader2
                    className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''} text-muted-foreground`}
                  />
                  <div>
                    <div className="font-bold">
                      {processing.totalCount - processing.currentIndex}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Remaining
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results Log</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportResults}
                  disabled={processing.results.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processing.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.status === 'success' ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Fail
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          <div className="font-medium">{result.title}</div>
                          {result.error && (
                            <div className="text-xs text-red-600 truncate">
                              {result.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.issueUrl && (
                            <a
                              href={result.issueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              #{result.issueIid}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {isCompleted && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold">Import Complete!</h3>
                    <p className="text-muted-foreground">
                      Successfully created {successCount} issues
                      {failedCount > 0 && ` (${failedCount} failed)`}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handleExportResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Results
                    </Button>
                    <Button onClick={handleStartOver}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <WizardNavigation currentStep={7} isNextDisabled={true} hideNext={true} />
    </div>
  )
}
