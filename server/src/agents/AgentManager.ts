import { v4 as uuid } from 'uuid'
import type { Agent, AgentStatus, AgentType, LogEntry, SpawnAgentPayload, TaskStep, ToolCall } from '../types/index.js'
import { WsBroadcaster } from '../ws/broadcaster.js'

const DEFAULT_TASK_STEPS: Record<AgentType, TaskStep[]> = {
  code: [
    { id: 'init', label: 'Initialize workspace', status: 'pending' },
    { id: 'plan', label: 'Plan implementation', status: 'pending' },
    { id: 'execute', label: 'Execute tasks', status: 'pending' },
    { id: 'verify', label: 'Verify results', status: 'pending' },
  ],
  research: [
    { id: 'scope', label: 'Define research scope', status: 'pending' },
    { id: 'gather', label: 'Gather information', status: 'pending' },
    { id: 'synthesize', label: 'Synthesize findings', status: 'pending' },
    { id: 'report', label: 'Write report', status: 'pending' },
  ],
  orchestrator: [
    { id: 'init', label: 'Initialize agent registry', status: 'pending' },
    { id: 'assign', label: 'Assign tasks to sub-agents', status: 'pending' },
    { id: 'monitor', label: 'Monitor progress loop', status: 'pending' },
    { id: 'aggregate', label: 'Aggregate results', status: 'pending' },
  ],
  custom: [
    { id: 'start', label: 'Start', status: 'pending' },
    { id: 'run', label: 'Execute goal', status: 'pending' },
    { id: 'finish', label: 'Finish', status: 'pending' },
  ],
}

export class AgentManager {
  private agents: Map<string, Agent> = new Map()
  private logs: Map<string, LogEntry[]> = new Map()
  private toolCalls: Map<string, ToolCall[]> = new Map()
  private uptimeTimers: Map<string, NodeJS.Timeout> = new Map()
  private startTime = Date.now()
  private broadcaster: WsBroadcaster

  constructor(broadcaster: WsBroadcaster) {
    this.broadcaster = broadcaster
  }

  create(payload: SpawnAgentPayload): Agent {
    const id = `agt-${uuid().slice(0, 8)}`
    const now = new Date().toISOString()
    const model = payload.model ?? 'claude-sonnet-4-6'
    const steps = DEFAULT_TASK_STEPS[payload.type].map((s) => ({ ...s }))

    const agent: Agent = {
      id,
      name: payload.name,
      type: payload.type,
      status: 'spawning',
      goal: payload.goal,
      currentTask: 'Initializing...',
      spawnedAt: now,
      lastActiveAt: now,
      uptimeSeconds: 0,
      toolCallCount: 0,
      taskSteps: steps,
      memoryReads: 0,
      memoryWrites: 0,
      model,
    }

    this.agents.set(id, agent)
    this.logs.set(id, [])
    this.toolCalls.set(id, [])

    this.startUptimeTimer(id)
    return agent
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id)
  }

  list(): Agent[] {
    return Array.from(this.agents.values())
  }

  getLogs(id: string): LogEntry[] {
    return this.logs.get(id) ?? []
  }

  getToolCalls(id: string): ToolCall[] {
    return this.toolCalls.get(id) ?? []
  }

  updateStatus(id: string, status: AgentStatus, errorMessage?: string): boolean {
    const agent = this.agents.get(id)
    if (!agent) return false

    const prev = agent.status
    agent.status = status
    agent.lastActiveAt = new Date().toISOString()
    if (errorMessage) agent.errorMessage = errorMessage

    if (status === 'stopped' || status === 'error') {
      this.stopUptimeTimer(id)
    }

    if (prev !== status) {
      this.broadcaster.toAgent(id, { type: 'status_change', agentId: id, payload: status, timestamp: new Date().toISOString() })
    }

    return true
  }

  updateCurrentTask(id: string, task: string): void {
    const agent = this.agents.get(id)
    if (!agent) return
    agent.currentTask = task
    agent.lastActiveAt = new Date().toISOString()
  }

  completeStep(id: string, stepId: string): void {
    const agent = this.agents.get(id)
    if (!agent) return
    const step = agent.taskSteps.find((s) => s.id === stepId)
    if (step) {
      step.status = 'done'
      step.completedAt = new Date().toISOString()
    }
    this.broadcaster.toAgent(id, {
      type: 'task_update',
      agentId: id,
      payload: agent.taskSteps,
      timestamp: new Date().toISOString(),
    })
  }

  activateStep(id: string, stepId: string): void {
    const agent = this.agents.get(id)
    if (!agent) return
    // Deactivate all first
    agent.taskSteps.forEach((s) => { if (s.status === 'active') s.status = 'pending' })
    const step = agent.taskSteps.find((s) => s.id === stepId)
    if (step) {
      step.status = 'active'
      step.startedAt = new Date().toISOString()
    }
    this.broadcaster.toAgent(id, {
      type: 'task_update',
      agentId: id,
      payload: agent.taskSteps,
      timestamp: new Date().toISOString(),
    })
  }

  addLog(id: string, level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      id: uuid(),
      agentId: id,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    }
    const buf = this.logs.get(id) ?? []
    buf.push(entry)
    if (buf.length > 2000) buf.splice(0, buf.length - 2000)
    this.logs.set(id, buf)

    const agent = this.agents.get(id)
    if (agent) agent.lastActiveAt = entry.timestamp

    this.broadcaster.toAgent(id, { type: 'log', agentId: id, payload: entry, timestamp: entry.timestamp })
    return entry
  }

  addToolCall(id: string, call: ToolCall): void {
    const buf = this.toolCalls.get(id) ?? []
    buf.push(call)
    this.toolCalls.set(id, buf)

    const agent = this.agents.get(id)
    if (agent) {
      agent.toolCallCount = buf.length
      agent.lastActiveAt = new Date().toISOString()
    }

    this.broadcaster.toAgent(id, { type: 'tool_call', agentId: id, payload: call, timestamp: new Date().toISOString() })
  }

  remove(id: string): boolean {
    this.stopUptimeTimer(id)
    return this.agents.delete(id)
  }

  systemStatus(): { activeAgentCount: number; totalAgentCount: number; uptime: number } {
    const all = this.list()
    return {
      activeAgentCount: all.filter((a) => a.status === 'running').length,
      totalAgentCount: all.length,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  private startUptimeTimer(id: string) {
    const timer = setInterval(() => {
      const agent = this.agents.get(id)
      if (!agent) { clearInterval(timer); return }
      if (agent.status !== 'stopped') agent.uptimeSeconds += 1
    }, 1000)
    this.uptimeTimers.set(id, timer)
  }

  private stopUptimeTimer(id: string) {
    const timer = this.uptimeTimers.get(id)
    if (timer) { clearInterval(timer); this.uptimeTimers.delete(id) }
  }
}
