export interface NotionFile {
  name: string
  path: string
  file: File
  type: 'csv' | 'markdown' | 'other'
}

export interface NotionExportDirectory {
  handle: FileSystemDirectoryHandle | null
  files: Array<NotionFile>
  csvFiles: Array<NotionFile>
  markdownFiles: Array<NotionFile>
}

export interface ParsedCsvData {
  headers: Array<string>
  rows: Array<Record<string, string>>
  rowCount: number
}

export interface MarkdownContent {
  notionId: string
  filePath: string
  fullContent: string
  extractedSection: string | null
}
