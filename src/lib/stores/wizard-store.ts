import { Store } from '@tanstack/store'
import type {
  CsvMappingConfig,
  FilterRule,
  GitLabConfig,
  IssueMappingConfig,
  NotionExportConfig,
  PreviewRow,
  ProcessingResult,
  ProcessingStatus,
  WizardState,
  WizardStep,
} from '~/lib/types/wizard'
import type { GitLabProject } from '~/lib/types/gitlab'
import type { NotionFile, ParsedCsvData } from '~/lib/types/notion'
import { defaultWizardState } from '~/lib/types/wizard'

const STORAGE_KEY = 'notion2gitlab-wizard'

function loadFromStorage(): WizardState | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as WizardState
    if (parsed.processing.startedAt) {
      parsed.processing.startedAt = new Date(parsed.processing.startedAt)
    }
    if (parsed.processing.completedAt) {
      parsed.processing.completedAt = new Date(parsed.processing.completedAt)
    }
    parsed.processing.results = parsed.processing.results.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }))
    parsed.notionExport.files = []
    parsed.notionExport.csvFiles = []
    parsed.notionExport.markdownFiles = []
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state: WizardState): void {
  if (typeof window === 'undefined') return
  try {
    const toSave = {
      ...state,
      notionExport: {
        ...state.notionExport,
        files: [],
        csvFiles: [],
        markdownFiles: [],
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    console.error('Failed to save wizard state to localStorage')
  }
}

const initialState = loadFromStorage() ?? defaultWizardState

export const wizardStore = new Store<WizardState>(initialState)

wizardStore.subscribe(() => {
  saveToStorage(wizardStore.state)
})

export function setCurrentStep(step: WizardStep): void {
  wizardStore.setState((state) => ({ ...state, currentStep: step }))
}

export function updateGitLabConfig(updates: Partial<GitLabConfig>): void {
  wizardStore.setState((state) => ({
    ...state,
    gitlab: { ...state.gitlab, ...updates },
  }))
}

export function setGitLabProjects(projects: Array<GitLabProject>): void {
  wizardStore.setState((state) => ({
    ...state,
    gitlab: { ...state.gitlab, projects },
  }))
}

export function updateNotionExport(updates: Partial<NotionExportConfig>): void {
  wizardStore.setState((state) => ({
    ...state,
    notionExport: { ...state.notionExport, ...updates },
  }))
}

export function setNotionFiles(
  files: Array<NotionFile>,
  csvFiles: Array<NotionFile>,
  markdownFiles: Array<NotionFile>,
): void {
  wizardStore.setState((state) => ({
    ...state,
    notionExport: {
      ...state.notionExport,
      files,
      csvFiles,
      markdownFiles,
      error: null,
    },
  }))
}

export function updateCsvMapping(updates: Partial<CsvMappingConfig>): void {
  wizardStore.setState((state) => ({
    ...state,
    csvMapping: { ...state.csvMapping, ...updates },
  }))
}

export function setParsedCsvData(data: ParsedCsvData | null): void {
  wizardStore.setState((state) => ({
    ...state,
    csvMapping: { ...state.csvMapping, parsedData: data },
  }))
}

export function addFilterRule(rule: FilterRule): void {
  wizardStore.setState((state) => ({
    ...state,
    filters: [...state.filters, rule],
  }))
}

export function updateFilterRule(
  id: string,
  updates: Partial<FilterRule>,
): void {
  wizardStore.setState((state) => ({
    ...state,
    filters: state.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
  }))
}

export function removeFilterRule(id: string): void {
  wizardStore.setState((state) => ({
    ...state,
    filters: state.filters.filter((f) => f.id !== id),
  }))
}

export function updateIssueMapping(updates: Partial<IssueMappingConfig>): void {
  wizardStore.setState((state) => ({
    ...state,
    issueMapping: { ...state.issueMapping, ...updates },
  }))
}

export function setPreviewRows(rows: Array<PreviewRow>): void {
  wizardStore.setState((state) => ({
    ...state,
    preview: { ...state.preview, rows },
  }))
}

export function toggleRowExclusion(rowId: string): void {
  wizardStore.setState((state) => ({
    ...state,
    preview: {
      ...state.preview,
      rows: state.preview.rows.map((r) =>
        r.id === rowId ? { ...r, isExcluded: !r.isExcluded } : r,
      ),
    },
  }))
}

export function excludeInvalidRows(): void {
  wizardStore.setState((state) => ({
    ...state,
    preview: {
      ...state.preview,
      rows: state.preview.rows.map((r) => ({
        ...r,
        isExcluded: r.isExcluded || !r.isValid,
      })),
    },
  }))
}

export function includeAllRows(): void {
  wizardStore.setState((state) => ({
    ...state,
    preview: {
      ...state.preview,
      rows: state.preview.rows.map((r) => ({ ...r, isExcluded: false })),
    },
  }))
}

export function updatePreviewRow(
  rowId: string,
  updates: Partial<PreviewRow>,
): void {
  wizardStore.setState((state) => ({
    ...state,
    preview: {
      ...state.preview,
      rows: state.preview.rows.map((r) =>
        r.id === rowId ? { ...r, ...updates } : r,
      ),
    },
  }))
}

export function setProcessingStatus(status: ProcessingStatus): void {
  wizardStore.setState((state) => ({
    ...state,
    processing: { ...state.processing, status },
  }))
}

export function startProcessing(totalCount: number): void {
  wizardStore.setState((state) => ({
    ...state,
    processing: {
      status: 'running',
      currentIndex: 0,
      totalCount,
      results: [],
      startedAt: new Date(),
      completedAt: null,
    },
  }))
}

export function addProcessingResult(result: ProcessingResult): void {
  wizardStore.setState((state) => ({
    ...state,
    processing: {
      ...state.processing,
      currentIndex: state.processing.currentIndex + 1,
      results: [...state.processing.results, result],
    },
  }))
}

export function completeProcessing(): void {
  wizardStore.setState((state) => ({
    ...state,
    processing: {
      ...state.processing,
      status: 'completed',
      completedAt: new Date(),
    },
  }))
}

export function resetWizard(): void {
  wizardStore.setState(() => defaultWizardState)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function canProceedToStep(step: WizardStep): boolean {
  const state = wizardStore.state
  switch (step) {
    case 1:
      return true
    case 2:
      return state.gitlab.isConnected
    case 3:
      return state.gitlab.isConnected && state.notionExport.csvFiles.length > 0
    case 4:
      return (
        state.gitlab.isConnected &&
        state.csvMapping.parsedData !== null &&
        state.csvMapping.notionIdColumn !== null
      )
    case 5:
      return canProceedToStep(4)
    case 6:
      return (
        canProceedToStep(5) &&
        state.issueMapping.titleColumn !== null &&
        state.issueMapping.repositoryColumn !== null
      )
    case 7:
      return (
        canProceedToStep(6) &&
        state.preview.rows.some((r) => !r.isExcluded && r.isValid)
      )
    default:
      return false
  }
}
