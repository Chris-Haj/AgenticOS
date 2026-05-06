import type { Agent, AgentType, LogEntry } from './agent'

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  success: boolean
}

export interface SpawnAgentPayload {
  name: string
  goal: string
  type: AgentType
  model?: string
  context?: string
}

export interface SystemStatus {
  activeAgentCount: number
  totalAgentCount: number
  memorySyncStatus: 'synced' | 'syncing' | 'disconnected'
  backendVersion: string
  uptime: number
}

export type WsMessageType = 'log' | 'status_change' | 'tool_call' | 'task_update' | 'heartbeat'

export interface WsMessage<T = unknown> {
  type: WsMessageType
  agentId: string
  payload: T
  timestamp: string
}

// Re-export for convenience
export type { Agent, LogEntry }
