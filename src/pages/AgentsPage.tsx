import { Plus, Bot, RefreshCw, WifiOff } from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'
import { useUiStore } from '@/store/uiStore'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { Button } from '@/components/ui/Button'
import { stopAgent, patchAgent } from '@/api/agents'
import { useQueryClient } from '@tanstack/react-query'

export function AgentsPage() {
  const { agents, agentOrder, updateAgentStatus } = useAgentStore()
  const { openSpawnModal } = useUiStore()
  const { loading, backendOnline, refetch } = useAgents()
  const queryClient = useQueryClient()

  const orderedAgents = agentOrder.map((id) => agents[id]).filter(Boolean)

  const handleStop = async (id: string) => {
    try {
      await stopAgent(id)
      updateAgentStatus(id, 'stopped')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    } catch {
      updateAgentStatus(id, 'stopped')
    }
  }

  const handlePause = async (id: string) => {
    const agent = agents[id]
    if (!agent) return
    const action = agent.status === 'running' ? 'pause' : 'resume'
    const nextStatus = action === 'pause' ? 'idle' : 'running'
    try {
      await patchAgent(id, action)
      updateAgentStatus(id, nextStatus)
    } catch {
      updateAgentStatus(id, nextStatus)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Agents</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {orderedAgents.length} agent{orderedAgents.length !== 1 ? 's' : ''} &mdash;&nbsp;
            {orderedAgents.filter((a) => a.status === 'running').length} running
            {!backendOnline && (
              <span className="ml-2 text-yellow-400 inline-flex items-center gap-1">
                <WifiOff size={10} /> mock data
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />} onClick={() => refetch()} />
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openSpawnModal}>
            New Agent
          </Button>
        </div>
      </div>

      {/* Grid */}
      {orderedAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid #1e4d2b' }}
          >
            <Bot size={28} className="text-green-dim" />
          </div>
          <p className="text-sm text-text-secondary">No agents yet</p>
          <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={openSpawnModal}>
            Spawn your first agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orderedAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStop={handleStop}
              onPause={handlePause}
            />
          ))}
        </div>
      )}
    </div>
  )
}
