import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  AlertCircle,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Info,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  setNotionFiles,
  updateNotionExport,
  wizardStore,
} from '~/lib/stores/wizard-store'
import {
  categorizeFiles,
  collectAllFiles,
  isFileSystemAccessSupported,
  pickDirectory,
} from '~/lib/file-system/directory-picker'

export const Route = createFileRoute('/wizard/step-2')({
  component: Step2NotionExport,
})

function Step2NotionExport() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectFolder = async () => {
    setIsLoading(true)
    updateNotionExport({ isLoading: true, error: null })

    try {
      const result = await pickDirectory()
      const allFiles = await collectAllFiles(result)
      const { csvFiles, markdownFiles } = categorizeFiles(allFiles)

      if (csvFiles.length === 0) {
        updateNotionExport({
          isLoading: false,
          error:
            'No CSV files found. Please select a valid Notion database export folder.',
        })
        setIsLoading(false)
        return
      }

      setNotionFiles(allFiles, csvFiles, markdownFiles)
      updateNotionExport({ isLoading: false })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to read folder'
      if (!message.includes('cancelled')) {
        updateNotionExport({ isLoading: false, error: message })
      } else {
        updateNotionExport({ isLoading: false })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (state.notionExport.csvFiles.length > 0) {
      navigate({ to: '/wizard/step-3' })
    }
  }

  const hasFiles = state.notionExport.files.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Select Notion Export</h1>
        <p className="text-muted-foreground mt-1">
          Choose the folder containing your exported Notion database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Export Folder
          </CardTitle>
          <CardDescription>
            Select the root folder of your Notion export. It should contain CSV
            file(s) and subfolders with Markdown files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSelectFolder}
            disabled={isLoading}
            variant={hasFiles ? 'outline' : 'default'}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning files...
              </>
            ) : hasFiles ? (
              <>
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Different Folder
              </>
            ) : (
              <>
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Folder
              </>
            )}
          </Button>

          {state.notionExport.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.notionExport.error}</AlertDescription>
            </Alert>
          )}

          {hasFiles && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Files Found</span>
                <Badge variant="secondary">
                  {state.notionExport.files.length} total
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-medium">
                      {state.notionExport.csvFiles.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      CSV Files
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium">
                      {state.notionExport.markdownFiles.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Markdown Files
                    </div>
                  </div>
                </div>
              </div>

              {state.notionExport.csvFiles.length > 1 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Multiple CSV files found. You'll select which one to use in
                    the next step.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep={2}
        isNextDisabled={state.notionExport.csvFiles.length === 0}
        onNext={handleNext}
      />
    </div>
  )
}
