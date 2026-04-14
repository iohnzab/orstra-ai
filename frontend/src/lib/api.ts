import axios, { AxiosError } from 'axios'
import { getToken, clearAuth } from './auth'
import type {
  Agent,
  Connector,
  TaskRun,
  DashboardStats,
  AgentVersion,
  Document,
  ToolDefinition,
  AuthResponse,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  signup: (email: string, password: string, full_name?: string) =>
    api.post<AuthResponse>('/auth/signup', { email, password, full_name }).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}

// Agents
export const agentsApi = {
  list: () => api.get<Agent[]>('/agents').then((r) => r.data),
  get: (id: string) => api.get<Agent>(`/agents/${id}`).then((r) => r.data),
  create: (data: Partial<Agent>) => api.post<Agent>('/agents', data).then((r) => r.data),
  update: (id: string, data: Partial<Agent>) =>
    api.put<Agent>(`/agents/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/agents/${id}`),
  deploy: (id: string) => api.post(`/agents/${id}/deploy`).then((r) => r.data),
  pause: (id: string) => api.post(`/agents/${id}/pause`).then((r) => r.data),
  versions: (id: string) => api.get<AgentVersion[]>(`/agents/${id}/versions`).then((r) => r.data),
  restoreVersion: (id: string, version: number) =>
    api.post<Agent>(`/agents/${id}/versions/${version}/restore`).then((r) => r.data),
  test: (id: string, trigger_data: Record<string, unknown>) =>
    api.post(`/agents/${id}/test`, { trigger_data, dry_run: true }).then((r) => r.data),
}

// Connectors
export const connectorsApi = {
  list: () => api.get<Connector[]>('/connectors').then((r) => r.data),
  create: (data: { service: string; display_name: string; credentials: Record<string, string> }) =>
    api.post<Connector>('/connectors', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/connectors/${id}`),
  verify: (id: string) =>
    api.post<{ verified: boolean; error?: string }>(`/connectors/${id}/verify`).then((r) => r.data),
}

// Runs
export const runsApi = {
  listForAgent: (agentId: string) =>
    api.get<TaskRun[]>(`/agents/${agentId}/runs`).then((r) => r.data),
  get: (runId: string) => api.get<TaskRun>(`/runs/${runId}`).then((r) => r.data),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
}

// Documents
export const documentsApi = {
  list: (agentId: string) => api.get<Document[]>(`/documents/${agentId}`).then((r) => r.data),
  upload: (agentId: string, file: File) => {
    const form = new FormData()
    form.append('agent_id', agentId)
    form.append('file', file)
    return api
      .post<Document>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  delete: (docId: string) => api.delete(`/documents/${docId}`),
}

// Tools
export const toolsApi = {
  list: () => api.get<ToolDefinition[]>('/tools').then((r) => r.data),
}
