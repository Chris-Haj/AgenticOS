export type AgentStatus = 'running' | 'idle' | 'error' | 'stopped' | 'spawning'

export type AgentType = 'code' | 'research' | 'orchestrator' | 'custom'

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
  durationMs?: number
  timestamp: string
  status: 'pending' | 'success' | 'error'
}

export interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'done' | 'failed'
  startedAt?: string
  completedAt?: string
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
