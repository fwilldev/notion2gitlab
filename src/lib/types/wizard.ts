import type { GitLabProject } from './gitlab'
import type { NotionFile, ParsedCsvData } from './notion'

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface GitLabConfig {
  domain: string
  token: string
  isConnected: boolean
  isValidating: boolean
  username: string | null
  projects: Array<GitLabProject>
  error: string | null
}

export interface NotionExportConfig {
  files: Array<NotionFile>
  csvFiles: Array<NotionFile>
  markdownFiles: Array<NotionFile>
  selectedCsvFileName: string | null
  isLoading: boolean
  error: string | null
}

export interface CsvMappingConfig {
  parsedData: ParsedCsvData | null
  notionIdColumn: string | null
  previewRows: number
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'

export interface FilterRule {
  id: string
  column: string
  operator: FilterOperator
  value: string
  enabled: boolean
}

export interface IssueMappingConfig {
  titleColumn: string | null
  repositoryColumn: string | null
  defaultRepository: string | null
  useMarkdownDescription: boolean
  markdownSectionHeader: string | null
  labelColumns: Array<string>
  staticLabels: Array<string>
}

export interface PreviewRow {
  id: string
  notionId: string
  title: string
  repository: string | null
  repositoryId: number | null
  markdownFile: string | null
  description: string | null
  labels: Array<string>
  isValid: boolean
  validationErrors: Array<string>
  isExcluded: boolean
}

export type ProcessingStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'

export interface ProcessingResult {
  rowId: string
  notionId: string
  title: string
  status: 'success' | 'failed' | 'skipped'
  issueUrl: string | null
  issueIid: number | null
  error: string | null
  timestamp: Date
}

export interface ProcessingState {
  status: ProcessingStatus
  currentIndex: number
  totalCount: number
  results: Array<ProcessingResult>
  startedAt: Date | null
  completedAt: Date | null
}

export interface WizardState {
  currentStep: WizardStep
  gitlab: GitLabConfig
  notionExport: NotionExportConfig
  csvMapping: CsvMappingConfig
  filters: Array<FilterRule>
  issueMapping: IssueMappingConfig
  preview: {
    rows: Array<PreviewRow>
    isProcessing: boolean
  }
  processing: ProcessingState
}

export const defaultWizardState: WizardState = {
  currentStep: 1,
  gitlab: {
    domain: '',
    token: '',
    isConnected: false,
    isValidating: false,
    username: null,
    projects: [],
    error: null,
  },
  notionExport: {
    files: [],
    csvFiles: [],
    markdownFiles: [],
    selectedCsvFileName: null,
    isLoading: false,
    error: null,
  },
  csvMapping: {
    parsedData: null,
    notionIdColumn: null,
    previewRows: 5,
  },
  filters: [],
  issueMapping: {
    titleColumn: null,
    repositoryColumn: null,
    defaultRepository: null,
    useMarkdownDescription: true,
    markdownSectionHeader: null,
    labelColumns: [],
    staticLabels: [],
  },
  preview: {
    rows: [],
    isProcessing: false,
  },
  processing: {
    status: 'idle',
    currentIndex: 0,
    totalCount: 0,
    results: [],
    startedAt: null,
    completedAt: null,
  },
}
