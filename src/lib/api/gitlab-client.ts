import type {
  CreateIssuePayload,
  GitLabError,
  GitLabIssue,
  GitLabProject,
  GitLabUser,
  ProjectListParams,
} from '~/lib/types/gitlab'

export class GitLabApiError extends Error {
  constructor(
    public statusCode: number,
    public errorBody: GitLabError,
  ) {
    super(errorBody.message || errorBody.error || 'Unknown GitLab API error')
    this.name = 'GitLabApiError'
  }
}

export interface GitLabClient {
  validateConnection: () => Promise<GitLabUser>
  listProjects: (params?: ProjectListParams) => Promise<Array<GitLabProject>>
  searchProjects: (search: string) => Promise<Array<GitLabProject>>
  getProjectByPath: (pathWithNamespace: string) => Promise<GitLabProject | null>
  createIssue: (
    projectId: number,
    issue: CreateIssuePayload,
  ) => Promise<GitLabIssue>
}

export function createGitLabClient(
  domain: string,
  token: string,
): GitLabClient {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`
  const apiUrl = `${baseUrl}/api/v4`

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${apiUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let errorBody: GitLabError
      try {
        errorBody = await response.json()
      } catch {
        errorBody = { message: response.statusText }
      }
      throw new GitLabApiError(response.status, errorBody)
    }

    return response.json()
  }

  return {
    validateConnection: () => request<GitLabUser>('/user'),

    listProjects: async (params?: ProjectListParams) => {
      const searchParams = new URLSearchParams()
      searchParams.set('membership', 'true')
      searchParams.set('per_page', String(params?.per_page ?? 100))
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.search) searchParams.set('search', params.search)
      if (params?.archived !== undefined)
        searchParams.set('archived', String(params.archived))
      return request<Array<GitLabProject>>(`/projects?${searchParams.toString()}`)
    },

    searchProjects: (search: string) =>
      request<Array<GitLabProject>>(
        `/projects?membership=true&search=${encodeURIComponent(search)}&per_page=20`,
      ),

    getProjectByPath: async (pathWithNamespace: string) => {
      try {
        return await request<GitLabProject>(
          `/projects/${encodeURIComponent(pathWithNamespace)}`,
        )
      } catch (error) {
        if (error instanceof GitLabApiError && error.statusCode === 404) {
          return null
        }
        throw error
      }
    },

    createIssue: (projectId: number, issue: CreateIssuePayload) =>
      request<GitLabIssue>(`/projects/${projectId}/issues`, {
        method: 'POST',
        body: JSON.stringify(issue),
      }),
  }
}

export function createProxiedGitLabClient(
  domain: string,
  token: string,
): GitLabClient {
  async function proxyRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch('/api/gitlab-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, token, method, path, body }),
    })

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: response.statusText }))
      throw new GitLabApiError(response.status, errorBody)
    }

    return response.json()
  }

  return {
    validateConnection: () => proxyRequest<GitLabUser>('GET', '/user'),

    listProjects: async (params?: ProjectListParams) => {
      const searchParams = new URLSearchParams()
      searchParams.set('membership', 'true')
      searchParams.set('per_page', String(params?.per_page ?? 100))
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.search) searchParams.set('search', params.search)
      return proxyRequest<Array<GitLabProject>>(
        'GET',
        `/projects?${searchParams.toString()}`,
      )
    },

    searchProjects: (search: string) =>
      proxyRequest<Array<GitLabProject>>(
        'GET',
        `/projects?membership=true&search=${encodeURIComponent(search)}&per_page=20`,
      ),

    getProjectByPath: async (pathWithNamespace: string) => {
      try {
        return await proxyRequest<GitLabProject>(
          'GET',
          `/projects/${encodeURIComponent(pathWithNamespace)}`,
        )
      } catch (error) {
        if (error instanceof GitLabApiError && error.statusCode === 404) {
          return null
        }
        throw error
      }
    },

    createIssue: (projectId: number, issue: CreateIssuePayload) =>
      proxyRequest<GitLabIssue>(
        'POST',
        `/projects/${projectId}/issues`,
        issue as unknown as Record<string, unknown>,
      ),
  }
}
