export type AgentStatus = 'running' | 'idle' | 'error' | 'stopped' | 'spawning'
export type AgentType = 'code' | 'research' | 'orchestrator' | 'custom'

export interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'done' | 'failed'
  startedAt?: string
  completedAt?: string
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
  durationMs?: number
  timestamp: string
  status: 'pending' | 'success' | 'error'
}

export interface Agent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  goal: string
  currentTask?: string
  spawnedAt: string
  lastActiveAt: string
  uptimeSeconds: number
  toolCallCount: number
  taskSteps: TaskStep[]
  memoryReads: number
  memoryWrites: number
  errorMessage?: string
  model: string
  pid?: number
}

export interface LogEntry {
  id: string
  agentId: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'tool'
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export type AgentRunner = 'claude' | 'copilot'

export interface SpawnAgentPayload {
  name: string
  goal: string
  type: AgentType
  runner?: AgentRunner
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

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: string
}
