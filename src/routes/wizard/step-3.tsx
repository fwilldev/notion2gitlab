import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { FileSpreadsheet, KeyRound, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  setParsedCsvData,
  updateCsvMapping,
  updateNotionExport,
  wizardStore,
} from '~/lib/stores/wizard-store'
import { detectNotionIdColumn, readCsvFromFile } from '~/lib/csv/parser'

export const Route = createFileRoute('/wizard/step-3')({
  component: Step3CsvMapping,
})

function Step3CsvMapping() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)
  const [isLoading, setIsLoading] = useState(false)

  const selectedFileName = state.notionExport.selectedCsvFileName
  const parsedData = state.csvMapping.parsedData
  const notionIdColumn = state.csvMapping.notionIdColumn

  useEffect(() => {
    if (!selectedFileName && state.notionExport.csvFiles.length === 1) {
      const file = state.notionExport.csvFiles[0]
      if (file) {
        updateNotionExport({ selectedCsvFileName: file.name })
      }
    }
  }, [selectedFileName, state.notionExport.csvFiles])

  useEffect(() => {
    const loadCsv = async () => {
      if (!selectedFileName) return

      const csvFile = state.notionExport.csvFiles.find(
        (f) => f.name === selectedFileName,
      )
      if (!csvFile) return

      setIsLoading(true)
      try {
        const data = await readCsvFromFile(csvFile.file)
        setParsedCsvData(data)

        if (!notionIdColumn) {
          const detected = detectNotionIdColumn(data.headers, data.rows)
          if (detected) {
            updateCsvMapping({ notionIdColumn: detected })
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCsv()
  }, [selectedFileName, state.notionExport.csvFiles, notionIdColumn])

  const handleCsvSelect = (value: string) => {
    updateNotionExport({ selectedCsvFileName: value })
    setParsedCsvData(null)
    updateCsvMapping({ notionIdColumn: null })
  }

  const handleNotionIdColumnSelect = (value: string) => {
    updateCsvMapping({ notionIdColumn: value })
  }

  const handleNext = () => {
    if (parsedData && notionIdColumn) {
      navigate({ to: '/wizard/step-4' })
    }
  }

  const previewRows =
    parsedData?.rows.slice(0, state.csvMapping.previewRows) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSV Field Mapping</h1>
        <p className="text-muted-foreground mt-1">
          Select the CSV file and identify the Notion ID column to link records
          with Markdown files.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV File Selection
          </CardTitle>
          <CardDescription>
            Choose which CSV file contains the database you want to import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.notionExport.csvFiles.length > 1 ? (
            <div className="space-y-2">
              <Label>Select CSV File</Label>
              <Select
                value={selectedFileName ?? ''}
                onValueChange={handleCsvSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a CSV file" />
                </SelectTrigger>
                <SelectContent>
                  {state.notionExport.csvFiles.map((file) => (
                    <SelectItem key={file.path} value={file.name}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-medium">{selectedFileName}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Parsing CSV...</span>
            </div>
          )}

          {parsedData && !isLoading && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Parsed Data</span>
                <Badge variant="secondary">
                  {parsedData.rowCount} rows, {parsedData.headers.length}{' '}
                  columns
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedData && !isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Notion ID Column
              </CardTitle>
              <CardDescription>
                Select the column containing the Notion ID. This is used to
                match CSV rows with their corresponding Markdown files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={notionIdColumn ?? ''}
                onValueChange={handleNotionIdColumnSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Notion ID column" />
                </SelectTrigger>
                <SelectContent>
                  {parsedData.headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                First {previewRows.length} rows of the CSV file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsedData.headers.map((header) => (
                        <TableHead
                          key={header}
                          className={
                            header === notionIdColumn ? 'bg-primary/10' : ''
                          }
                        >
                          {header}
                          {header === notionIdColumn && (
                            <Badge variant="secondary" className="ml-2">
                              ID
                            </Badge>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        {parsedData.headers.map((header) => (
                          <TableCell
                            key={header}
                            className={`max-w-[200px] truncate ${header === notionIdColumn ? 'bg-primary/5 font-mono text-xs' : ''}`}
                          >
                            {row[header] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <WizardNavigation
        currentStep={3}
        isNextDisabled={!parsedData || !notionIdColumn}
        onNext={handleNext}
      />
    </div>
  )
}
