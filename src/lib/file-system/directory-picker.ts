import type { NotionFile } from '~/lib/types/notion'

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
    }) => Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>
  }
}

export type DirectoryPickerResult =
  | { type: 'modern'; handle: FileSystemDirectoryHandle }
  | { type: 'legacy'; files: Array<File> }

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickDirectory(): Promise<DirectoryPickerResult> {
  if (isFileSystemAccessSupported() && window.showDirectoryPicker) {
    const handle = await window.showDirectoryPicker({ mode: 'read' })
    return { type: 'modern', handle }
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.multiple = true

    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve({ type: 'legacy', files: Array.from(input.files) })
      } else {
        reject(new Error('No files selected'))
      }
    }

    input.oncancel = () => {
      reject(new Error('Directory selection cancelled'))
    }

    input.click()
  })
}

function getFileType(name: string): NotionFile['type'] {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv')) return 'csv'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  return 'other'
}

export async function* readFilesFromHandle(
  handle: FileSystemDirectoryHandle,
  basePath = '',
): AsyncGenerator<NotionFile> {
  for await (const entry of handle.values()) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      const type = getFileType(entry.name)

      yield {
        name: entry.name,
        path: entryPath,
        file,
        type,
      }
    } else if (entry.kind === 'directory') {
      const dirHandle = entry as FileSystemDirectoryHandle
      yield* readFilesFromHandle(dirHandle, entryPath)
    }
  }
}

export function readFilesFromFileList(files: Array<File>): Array<NotionFile> {
  return files.map((file) => ({
    name: file.name,
    path: file.webkitRelativePath || file.name,
    file,
    type: getFileType(file.name),
  }))
}

export async function collectAllFiles(
  result: DirectoryPickerResult,
): Promise<Array<NotionFile>> {
  if (result.type === 'legacy') {
    return readFilesFromFileList(result.files)
  }

  const files: Array<NotionFile> = []
  for await (const file of readFilesFromHandle(result.handle)) {
    files.push(file)
  }
  return files
}

export function categorizeFiles(files: Array<NotionFile>): {
  csvFiles: Array<NotionFile>
  markdownFiles: Array<NotionFile>
  otherFiles: Array<NotionFile>
} {
  const csvFiles: Array<NotionFile> = []
  const markdownFiles: Array<NotionFile> = []
  const otherFiles: Array<NotionFile> = []

  for (const file of files) {
    switch (file.type) {
      case 'csv':
        csvFiles.push(file)
        break
      case 'markdown':
        markdownFiles.push(file)
        break
      default:
        otherFiles.push(file)
    }
  }

  return { csvFiles, markdownFiles, otherFiles }
}
