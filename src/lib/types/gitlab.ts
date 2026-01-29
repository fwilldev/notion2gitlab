export interface GitLabUser {
  id: number
  username: string
  name: string
  email: string
  avatar_url: string
  web_url: string
}

export interface GitLabProject {
  id: number
  name: string
  name_with_namespace: string
  path: string
  path_with_namespace: string
  web_url: string
  description: string | null
  visibility: 'private' | 'internal' | 'public'
  archived: boolean
}

export interface GitLabIssue {
  id: number
  iid: number
  project_id: number
  title: string
  description: string | null
  state: 'opened' | 'closed'
  web_url: string
  created_at: string
  updated_at: string
  labels: Array<string>
}

export interface CreateIssuePayload {
  title: string
  description?: string
  labels?: string
  assignee_ids?: Array<number>
  milestone_id?: number
  due_date?: string
}

export interface GitLabError {
  message: string
  error?: string
  error_description?: string
}

export interface ProjectListParams {
  search?: string
  per_page?: number
  page?: number
  membership?: boolean
  archived?: boolean
}
