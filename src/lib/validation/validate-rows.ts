import type { IssueMappingConfig, PreviewRow } from '~/lib/types/wizard'
import type { GitLabProject } from '~/lib/types/gitlab'
import type { NotionFile } from '~/lib/types/notion'

export interface ValidationContext {
  projects: Array<GitLabProject>
  markdownFiles: Array<NotionFile>
  notionIdColumn: string
  issueMapping: IssueMappingConfig
}

export interface MarkdownMatch {
  file: NotionFile
  content: string
  extractedDescription: string
}

export async function buildMarkdownMap(
  markdownFiles: Array<NotionFile>,
  sectionHeader: string | null,
): Promise<Map<string, MarkdownMatch>> {
  const markdownMap = new Map<string, MarkdownMatch>()

  for (const mdFile of markdownFiles) {
    const content = await mdFile.file.text()
    const extractedDescription = extractSectionContent(content, sectionHeader)

    const match: MarkdownMatch = {
      file: mdFile,
      content,
      extractedDescription,
    }

    // Pattern: Notion hex ID (32 chars) in filename
    const notionIdMatch = mdFile.path.match(/([0-9a-f]{32})/i)
    if (notionIdMatch?.[1]) {
      markdownMap.set(notionIdMatch[1].toLowerCase(), match)
    }

    // Pattern: UUID in filename
    const uuidMatch = mdFile.path.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    )
    if (uuidMatch?.[1]) {
      const normalized = uuidMatch[1].replace(/-/g, '').toLowerCase()
      markdownMap.set(normalized, match)
    }

    // Pattern: Custom ID like "AUF-557" or "TASK-123" in filename
    const filenameIdMatch = mdFile.name.match(/([A-Z]+-\d+)/i)
    if (filenameIdMatch?.[1]) {
      markdownMap.set(filenameIdMatch[1].toUpperCase(), match)
    }

    // Patterns: "Aufgaben-ID: XXX" or similar in content
    const contentIdPatterns = [
      /Aufgaben-ID:\s*([A-Z]+-\d+)/i,
      /Task-ID:\s*([A-Z]+-\d+)/i,
      /Issue-ID:\s*([A-Z]+-\d+)/i,
      /ID:\s*([A-Z]+-\d+)/i,
    ]

    for (const pattern of contentIdPatterns) {
      const contentMatch = content.match(pattern)
      if (contentMatch?.[1]) {
        markdownMap.set(contentMatch[1].toUpperCase(), match)
      }
    }
  }

  return markdownMap
}

function extractSectionContent(
  content: string,
  sectionHeader: string | null,
): string {
  if (!sectionHeader) {
    const lines = content.split('\n')
    let startIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? ''
      const isTitle = line.startsWith('# ') && i === 0
      const isMetadata = line.match(/^[A-Za-zÄÖÜäöü-]+:\s*.+$/) || line === ''

      if (isTitle || isMetadata) {
        startIndex = i + 1
        continue
      }
      break
    }

    return lines.slice(startIndex).join('\n').trim()
  }

  const cleanedHeader = sectionHeader.replace(/^#+\s*/, '').trim()

  const headerPattern = new RegExp(
    `^#{1,6}\\s*${escapeRegex(cleanedHeader)}\\s*$`,
    'mi',
  )
  const match = content.match(headerPattern)

  if (!match || match.index === undefined) {
    return content
  }

  const startIndex = match.index + match[0].length
  const remainingContent = content.slice(startIndex)

  const nextHeaderMatch = remainingContent.match(/^#{1,6}\s/m)
  if (nextHeaderMatch?.index !== undefined) {
    return remainingContent.slice(0, nextHeaderMatch.index).trim()
  }

  return remainingContent.trim()
}

export async function validateRows(
  rows: Array<Record<string, string>>,
  context: ValidationContext,
): Promise<Array<PreviewRow>> {
  const { projects, markdownFiles, notionIdColumn, issueMapping } = context

  const projectMap = new Map<string, GitLabProject>()
  for (const project of projects) {
    projectMap.set(project.path_with_namespace.toLowerCase(), project)
    projectMap.set(project.name.toLowerCase(), project)
    projectMap.set(project.path.toLowerCase(), project)
  }

  const markdownMap = await buildMarkdownMap(
    markdownFiles,
    issueMapping.markdownSectionHeader,
  )

  return rows.map((row, index) => {
    const errors: Array<string> = []
    const notionId = row[notionIdColumn] ?? ''
    const title = issueMapping.titleColumn
      ? (row[issueMapping.titleColumn] ?? '')
      : ''
    const repoValue = issueMapping.repositoryColumn
      ? (row[issueMapping.repositoryColumn] ?? '')
      : ''

    if (!title.trim()) {
      errors.push('Title is empty')
    }

    let repository: string | null = null
    let repositoryId: number | null = null
    if (repoValue) {
      const normalizedRepo = repoValue.toLowerCase().trim()
      const project = projectMap.get(normalizedRepo)
      if (project) {
        repository = project.path_with_namespace
        repositoryId = project.id
      } else {
        errors.push(
          `Repository "${repoValue}" not found in your GitLab projects`,
        )
      }
    } else if (issueMapping.defaultRepository) {
      const normalizedDefault = issueMapping.defaultRepository.toLowerCase()
      const project = projectMap.get(normalizedDefault)
      if (project) {
        repository = project.path_with_namespace
        repositoryId = project.id
      } else {
        errors.push('Default repository not found in your GitLab projects')
      }
    } else {
      errors.push('Repository is empty')
    }

    let markdownFile: string | null = null
    let description: string | null = null

    if (issueMapping.useMarkdownDescription && notionId) {
      let mdMatch = markdownMap.get(notionId.toUpperCase())

      if (!mdMatch) {
        const normalizedId = notionId.replace(/-/g, '').toLowerCase()
        mdMatch = markdownMap.get(normalizedId)
      }

      if (!mdMatch) {
        mdMatch = markdownMap.get(notionId.toLowerCase())
      }

      if (mdMatch) {
        markdownFile = mdMatch.file.path
        description = mdMatch.extractedDescription
      }
    }

    const labels: Array<string> = []

    for (const staticLabel of issueMapping.staticLabels ?? []) {
      if (staticLabel.trim()) {
        labels.push(staticLabel.trim())
      }
    }

    for (const labelCol of issueMapping.labelColumns) {
      const labelValue = row[labelCol]
      if (labelValue?.trim()) {
        labels.push(
          ...labelValue
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean),
        )
      }
    }

    return {
      id: `row-${index}`,
      notionId,
      title,
      repository,
      repositoryId,
      markdownFile,
      description,
      labels,
      isValid: errors.length === 0,
      validationErrors: errors,
      isExcluded: false,
    }
  })
}

export async function extractMarkdownContent(
  file: File,
  sectionHeader: string | null,
): Promise<string> {
  const content = await file.text()
  return extractSectionContent(content, sectionHeader)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
