import { create } from 'zustand'
import type { Agent, AgentStatus } from '@/types/agent'
import { mockAgents } from '@/utils/mockData'

interface AgentStore {
  agents: Record<string, Agent>
  agentOrder: string[]
  selectedAgentId: string | null
  loading: boolean
  error: string | null

  setAgents: (agents: Agent[]) => void
  upsertAgent: (agent: Agent) => void
  removeAgent: (id: string) => void
  setSelectedAgent: (id: string | null) => void
  updateAgentStatus: (id: string, status: AgentStatus, msg?: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: Object.fromEntries(mockAgents.map((a) => [a.id, a])),
  agentOrder: mockAgents.map((a) => a.id),
  selectedAgentId: null,
  loading: false,
  error: null,

  setAgents: (agents) =>
    set({
      agents: Object.fromEntries(agents.map((a) => [a.id, a])),
      agentOrder: agents.map((a) => a.id),
    }),

  upsertAgent: (agent) =>
    set((state) => {
      const isNew = !state.agents[agent.id]
      return {
        agents: { ...state.agents, [agent.id]: agent },
        agentOrder: isNew ? [...state.agentOrder, agent.id] : state.agentOrder,
      }
    }),

  removeAgent: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.agents
      return {
        agents: rest,
        agentOrder: state.agentOrder.filter((aid) => aid !== id),
      }
    }),

  setSelectedAgent: (id) => set({ selectedAgentId: id }),

  updateAgentStatus: (id, status, msg) =>
    set((state) => {
      const agent = state.agents[id]
      if (!agent) return state
      return {
        agents: {
          ...state.agents,
          [id]: { ...agent, status, errorMessage: msg ?? agent.errorMessage },
        },
      }
    }),
}))
