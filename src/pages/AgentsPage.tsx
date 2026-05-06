import { Plus, Bot } from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'
import { useUiStore } from '@/store/uiStore'
import { AgentCard } from '@/components/agents/AgentCard'
import { Button } from '@/components/ui/Button'

export function AgentsPage() {
  const { agents, agentOrder, removeAgent, updateAgentStatus } = useAgentStore()
  const { openSpawnModal, openConfirmStop } = useUiStore()

  const orderedAgents = agentOrder.map((id) => agents[id]).filter(Boolean)

  const handleStop = (id: string) => {
    openConfirmStop(id)
    // For mock: immediately stop
    updateAgentStatus(id, 'stopped')
  }

  const handlePause = (id: string) => {
    const agent = agents[id]
    if (!agent) return
    if (agent.status === 'running') updateAgentStatus(id, 'idle')
    else if (agent.status === 'idle') updateAgentStatus(id, 'running')
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
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openSpawnModal}>
          New Agent
        </Button>
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
