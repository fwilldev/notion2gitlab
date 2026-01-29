import type { ParsedCsvData } from '~/lib/types/notion'

export function parseCsv(content: string): ParsedCsvData {
  const lines = content.split(/\r?\n/)
  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0 }
  }

  let startIndex = 0
  if (content.charCodeAt(0) === 0xfeff) {
    startIndex = 1
  }
  const cleanContent = content.slice(startIndex)
  const cleanLines = cleanContent
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')

  if (cleanLines.length === 0) {
    return { headers: [], rows: [], rowCount: 0 }
  }

  const headers = parseRow(cleanLines[0] ?? '')
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < cleanLines.length; i++) {
    const line = cleanLines[i]
    if (!line || line.trim() === '') continue

    const values = parseRow(line)
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    rows.push(row)
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
  }
}

function parseRow(line: string): Array<string> {
  const result: Array<string> = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current.trim())
  return result
}

export async function readCsvFromFile(file: File): Promise<ParsedCsvData> {
  const content = await file.text()
  return parseCsv(content)
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NOTION_ID_PATTERN = /^[0-9a-f]{32}$/i

export function detectNotionIdColumn(
  headers: Array<string>,
  rows: Array<Record<string, string>>,
): string | null {
  if (rows.length === 0) return null

  for (const header of headers) {
    const lowerHeader = header.toLowerCase()
    if (
      lowerHeader.includes('notion') ||
      lowerHeader.includes('id') ||
      lowerHeader === 'key' ||
      lowerHeader === 'uid'
    ) {
      const sampleValue = rows[0]?.[header]
      if (
        sampleValue &&
        (UUID_PATTERN.test(sampleValue) || NOTION_ID_PATTERN.test(sampleValue))
      ) {
        return header
      }
    }
  }

  for (const header of headers) {
    const sampleValue = rows[0]?.[header]
    if (
      sampleValue &&
      (UUID_PATTERN.test(sampleValue) || NOTION_ID_PATTERN.test(sampleValue))
    ) {
      return header
    }
  }

  return null
}
