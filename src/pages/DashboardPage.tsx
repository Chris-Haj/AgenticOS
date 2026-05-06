import { useNavigate } from 'react-router-dom'
import { Bot, CheckCircle2, AlertCircle, Activity, Plus, ArrowRight } from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'
import { useUiStore } from '@/store/uiStore'
import { AgentBadge } from '@/components/agents/AgentBadge'
import { Button } from '@/components/ui/Button'
import { formatRelative } from '@/utils/formatters'

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'green' | 'red' | 'yellow' | 'default'
}) {
  const colors = {
    green:   'text-green-vivid',
    red:     'text-red-400',
    yellow:  'text-yellow-300',
    default: 'text-text-primary',
  }
  return (
    <div className="card-panel p-4 flex flex-col gap-1">
      <p className="text-xs text-text-dim uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-3xl font-bold font-mono ${colors[accent ?? 'default']}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { agents, agentOrder } = useAgentStore()
  const { openSpawnModal } = useUiStore()
  const navigate = useNavigate()

  const all = agentOrder.map((id) => agents[id]).filter(Boolean)
  const running  = all.filter((a) => a.status === 'running')
  const errors   = all.filter((a) => a.status === 'error')
  const recent   = [...all].sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()).slice(0, 5)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-xs text-text-secondary mt-0.5">System overview</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openSpawnModal}>
          New Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Agents"   value={all.length}     sub="across all sessions" />
        <StatCard label="Running"        value={running.length} accent="green" sub="active right now" />
        <StatCard label="Errors"         value={errors.length}  accent={errors.length > 0 ? 'red' : 'default'} sub="need attention" />
        <StatCard
          label="Tool Calls"
          value={all.reduce((sum, a) => sum + a.toolCallCount, 0)}
          sub="total this session"
        />
      </div>

      {/* Active agents */}
      {running.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2">
              <Activity size={12} className="text-green-vivid" />
              Active Now
            </h2>
          </div>
          <div className="flex flex-col gap-1.5">
            {running.map((agent) => (
              <div
                key={agent.id}
                className="card-panel px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-green-dim"
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-vivid animate-pulse-green shrink-0" />
                <span className="text-sm font-medium text-text-primary flex-1 truncate">{agent.name}</span>
                {agent.currentTask && (
                  <span className="text-xs text-text-dim font-mono truncate max-w-xs hidden md:block">
                    {agent.currentTask}
                  </span>
                )}
                <ArrowRight size={12} className="text-text-dim shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400/80 flex items-center gap-2">
              <AlertCircle size={12} className="text-red-400" />
              Needs Attention
            </h2>
          </div>
          <div className="flex flex-col gap-1.5">
            {errors.map((agent) => (
              <div
                key={agent.id}
                className="px-4 py-3 rounded border border-red-900/40 bg-red-950/10 flex items-center gap-3 cursor-pointer hover:border-red-500/40 transition-colors"
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-sm font-medium text-text-primary flex-1 truncate">{agent.name}</span>
                {agent.errorMessage && (
                  <span className="text-xs text-red-400/70 font-mono truncate max-w-xs hidden md:block">
                    {agent.errorMessage}
                  </span>
                )}
                <ArrowRight size={12} className="text-text-dim shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent agents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <Bot size={12} />
            Recent Agents
          </h2>
          <button
            onClick={() => navigate('/agents')}
            className="text-xs text-text-dim hover:text-green-vivid transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={10} />
          </button>
        </div>
        <div className="card-panel overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-green-dim/20 text-text-dim">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider hidden md:table-cell">Last Active</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider hidden md:table-cell">Tools</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b border-green-dim/10 last:border-0 hover:bg-bg-muted cursor-pointer transition-colors"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">{agent.name}</td>
                  <td className="px-4 py-3 font-mono text-text-dim capitalize hidden sm:table-cell">{agent.type}</td>
                  <td className="px-4 py-3"><AgentBadge status={agent.status} size="sm" /></td>
                  <td className="px-4 py-3 text-text-dim hidden md:table-cell">{formatRelative(agent.lastActiveAt)}</td>
                  <td className="px-4 py-3 font-mono text-text-dim text-right hidden md:table-cell">{agent.toolCallCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <CheckCircle2 size={32} className="text-green-dim" />
          <p className="text-sm text-text-secondary">No agents yet — spawn one to get started</p>
          <Button variant="outline" icon={<Plus size={13} />} onClick={openSpawnModal}>
            Spawn Agent
          </Button>
        </div>
      )}
    </div>
  )
}
