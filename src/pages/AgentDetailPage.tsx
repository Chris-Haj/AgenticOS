import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Square, Cpu, BookOpen, Clock } from 'lucide-react'
import { useState } from 'react'
import { useAgentStore } from '@/store/agentStore'
import { useSystemStore } from '@/store/systemStore'
import { AgentBadge } from '@/components/agents/AgentBadge'
import { AgentTaskProgress } from '@/components/agents/AgentTaskProgress'
import { AgentLogStream } from '@/components/agents/AgentLogStream'
import { AgentToolCalls } from '@/components/agents/AgentToolCalls'
import { Button } from '@/components/ui/Button'
import { formatUptime, formatDate } from '@/utils/formatters'

type Tab = 'logs' | 'tasks' | 'tools'

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { agents, updateAgentStatus } = useAgentStore()
  const { logBuffers, toolCallBuffers } = useSystemStore()
  const [activeTab, setActiveTab] = useState<Tab>('logs')

  const agent = id ? agents[id] : undefined

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-text-secondary">Agent not found</p>
        <Button variant="ghost" onClick={() => navigate('/agents')}>Back to agents</Button>
      </div>
    )
  }

  const logs = logBuffers[agent.id] ?? []
  const toolCalls = toolCallBuffers[agent.id] ?? []

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'logs',  label: 'Logs',       count: logs.length },
    { id: 'tasks', label: 'Tasks',      count: agent.taskSteps.length },
    { id: 'tools', label: 'Tool Calls', count: agent.toolCallCount },
  ]

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-5xl">
      {/* Back nav */}
      <button
        onClick={() => navigate('/agents')}
        className="flex items-center gap-2 text-xs text-text-dim hover:text-text-secondary transition-colors w-fit"
      >
        <ArrowLeft size={12} />
        All agents
      </button>

      {/* Header */}
      <div className="card-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <AgentBadge status={agent.status} />
              <span className="text-xs font-mono text-text-dim">{agent.id}</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight mb-1">
              {agent.name}
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">{agent.goal}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(agent.status === 'running' || agent.status === 'idle' || agent.status === 'spawning') && (
              <Button
                variant="danger"
                size="sm"
                icon={<Square size={12} />}
                onClick={() => updateAgentStatus(agent.id, 'stopped')}
              >
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-green-dim/20">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-text-dim" />
            <span className="text-xs font-mono text-text-secondary">
              {formatUptime(agent.uptimeSeconds)} uptime
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-text-dim" />
            <span className="text-xs font-mono text-text-secondary">
              {agent.toolCallCount} tool calls
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={12} className="text-text-dim" />
            <span className="text-xs font-mono text-text-secondary">
              {agent.memoryReads}r / {agent.memoryWrites}w memory
            </span>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-mono text-text-dim">
              Spawned {formatDate(agent.spawnedAt)}
            </span>
          </div>
        </div>

        {/* Error banner */}
        {agent.errorMessage && (
          <div className="mt-3 px-3 py-2.5 rounded bg-red-950/20 border border-red-900/40">
            <p className="text-xs font-mono text-red-400">{agent.errorMessage}</p>
          </div>
        )}

        {/* Model badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-text-dim">Model</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded border border-green-dim/40 text-green-soft bg-green-dim/10">
            {agent.model}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-0">
        <div className="flex border-b border-green-dim/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold font-display transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-green-vivid text-green-vivid'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                    activeTab === tab.id ? 'bg-green-dim/40 text-green-vivid' : 'bg-bg-muted text-text-dim'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card-panel p-4" style={{ minHeight: '320px' }}>
          {activeTab === 'logs' && <AgentLogStream logs={logs} />}
          {activeTab === 'tasks' && (
            <AgentTaskProgress steps={agent.taskSteps} currentTask={agent.currentTask} />
          )}
          {activeTab === 'tools' && <AgentToolCalls toolCalls={toolCalls} />}
        </div>
      </div>
    </div>
  )
}
