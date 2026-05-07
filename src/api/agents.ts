import { apiClient } from './client'
import type { Agent, LogEntry, ToolCall } from '@/types/agent'
import type { ApiResponse, SpawnAgentPayload, SystemStatus } from '@/types/api'

export async function fetchAgents(): Promise<Agent[]> {
  const { data } = await apiClient.get<ApiResponse<Agent[]>>('/agents')
  return data.data
}

export async function fetchAgent(id: string): Promise<Agent> {
  const { data } = await apiClient.get<ApiResponse<Agent>>(`/agents/${id}`)
  return data.data
}

export async function spawnAgent(payload: SpawnAgentPayload): Promise<Agent> {
  const { data } = await apiClient.post<ApiResponse<Agent>>('/agents', payload)
  return data.data
}

export async function patchAgent(id: string, action: 'pause' | 'resume'): Promise<Agent> {
  const { data } = await apiClient.patch<ApiResponse<Agent>>(`/agents/${id}`, { action })
  return data.data
}

export async function stopAgent(id: string): Promise<{ id: string; stoppedAt: string }> {
  const { data } = await apiClient.delete<ApiResponse<{ id: string; stoppedAt: string }>>(`/agents/${id}`)
  return data.data
}

export async function fetchAgentLogs(id: string, limit = 200): Promise<LogEntry[]> {
  const { data } = await apiClient.get<ApiResponse<LogEntry[]>>(`/agents/${id}/logs`, { params: { limit } })
  return data.data
}

export async function fetchToolCalls(id: string): Promise<ToolCall[]> {
  const { data } = await apiClient.get<ApiResponse<ToolCall[]>>(`/agents/${id}/toolcalls`)
  return data.data
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const { data } = await apiClient.get<ApiResponse<SystemStatus>>('/system/status')
  return data.data
}

export interface ObsidianStatus {
  enabled: boolean
  connected: boolean
  url: string | null
}

export async function fetchObsidianStatus(): Promise<ObsidianStatus> {
  const { data } = await apiClient.get<ApiResponse<ObsidianStatus>>('/obsidian/status')
  return data.data
}

export async function fetchObsidianNotes(folder = ''): Promise<string[]> {
  const { data } = await apiClient.get<ApiResponse<string[]>>('/obsidian/notes', {
    params: folder ? { folder } : {},
  })
  return data.data
}

export async function fetchObsidianNote(path: string): Promise<{ path: string; content: string }> {
  const { data } = await apiClient.get<ApiResponse<{ path: string; content: string }>>('/obsidian/note', {
    params: { path },
  })
  return data.data
}

export interface ObsidianSearchResult {
  filename: string
  score: number
  matches: string[]
}

export async function searchObsidianNotes(q: string): Promise<ObsidianSearchResult[]> {
  const { data } = await apiClient.get<ApiResponse<ObsidianSearchResult[]>>('/obsidian/search', {
    params: { q },
  })
  return data.data
}
