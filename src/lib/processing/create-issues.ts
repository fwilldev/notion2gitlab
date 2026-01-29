import type {
  IssueMappingConfig,
  PreviewRow,
  ProcessingResult,
} from '~/lib/types/wizard'
import type { GitLabClient } from '~/lib/api/gitlab-client'

export interface ProcessingContext {
  client: GitLabClient
  issueMapping: IssueMappingConfig
  onProgress: (result: ProcessingResult) => void
  onComplete: () => void
  rateLimitMs?: number
}

export async function createIssuesFromRows(
  rows: Array<PreviewRow>,
  csvRows: Array<Record<string, string>>,
  context: ProcessingContext,
): Promise<void> {
  const {
    client,
    issueMapping,
    onProgress,
    onComplete,
    rateLimitMs = 1000,
  } = context

  const validRows = rows.filter((r) => r.isValid && !r.isExcluded)

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]
    if (!row) continue

    try {
      let description = row.description ?? ''

      if (!description) {
        const csvRow = csvRows[i]
        if (csvRow) {
          description = Object.entries(csvRow)
            .filter(([key]) => key !== issueMapping.titleColumn)
            .map(([key, value]) => `**${key}:** ${value}`)
            .join('\n\n')
        }
      }

      if (!row.repositoryId) {
        throw new Error('Repository ID is missing')
      }

      const issue = await client.createIssue(row.repositoryId, {
        title: row.title,
        description: description || undefined,
        labels: row.labels.length > 0 ? row.labels.join(',') : undefined,
      })

      onProgress({
        rowId: row.id,
        notionId: row.notionId,
        title: row.title,
        status: 'success',
        issueUrl: issue.web_url,
        issueIid: issue.iid,
        error: null,
        timestamp: new Date(),
      })
    } catch (error) {
      onProgress({
        rowId: row.id,
        notionId: row.notionId,
        title: row.title,
        status: 'failed',
        issueUrl: null,
        issueIid: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      })
    }

    if (i < validRows.length - 1) {
      await sleep(rateLimitMs)
    }
  }

  onComplete()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function exportResultsToCsv(results: Array<ProcessingResult>): string {
  const headers = [
    'Notion ID',
    'Title',
    'Status',
    'Issue URL',
    'Error',
    'Timestamp',
  ]
  const rows = results.map((r) => [
    r.notionId,
    r.title,
    r.status,
    r.issueUrl ?? '',
    r.error ?? '',
    r.timestamp.toISOString(),
  ])

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n')

  return csvContent
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
