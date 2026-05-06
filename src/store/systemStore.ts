import { create } from 'zustand'
import type { LogEntry, ToolCall } from '@/types/agent'
import type { SystemStatus } from '@/types/api'
import { mockLogs } from '@/utils/mockData'

const MAX_LOG_ENTRIES = 500

interface SystemStore {
  status: SystemStatus | null
  logBuffers: Record<string, LogEntry[]>
  toolCallBuffers: Record<string, ToolCall[]>

  setSystemStatus: (s: SystemStatus) => void
  appendLog: (agentId: string, entry: LogEntry) => void
  appendToolCall: (agentId: string, call: ToolCall) => void
  clearAgentBuffers: (agentId: string) => void
  initAgentLogs: (agentId: string, logs: LogEntry[]) => void
}

const initialLogs: Record<string, LogEntry[]> = {
  'agt-001': mockLogs.filter((l) => l.agentId === 'agt-001'),
}

export const useSystemStore = create<SystemStore>((set) => ({
  status: {
    activeAgentCount: 2,
    totalAgentCount: 5,
    memorySyncStatus: 'disconnected',
    backendVersion: '0.1.0-dev',
    uptime: 7200,
  },
  logBuffers: initialLogs,
  toolCallBuffers: {},

  setSystemStatus: (status) => set({ status }),

  appendLog: (agentId, entry) =>
    set((state) => {
      const existing = state.logBuffers[agentId] ?? []
      const updated = [...existing, entry]
      return {
        logBuffers: {
          ...state.logBuffers,
          [agentId]: updated.length > MAX_LOG_ENTRIES ? updated.slice(-MAX_LOG_ENTRIES) : updated,
        },
      }
    }),

  appendToolCall: (agentId, call) =>
    set((state) => {
      const existing = state.toolCallBuffers[agentId] ?? []
      return {
        toolCallBuffers: {
          ...state.toolCallBuffers,
          [agentId]: [...existing, call],
        },
      }
    }),

  clearAgentBuffers: (agentId) =>
    set((state) => ({
      logBuffers: { ...state.logBuffers, [agentId]: [] },
      toolCallBuffers: { ...state.toolCallBuffers, [agentId]: [] },
    })),

  initAgentLogs: (agentId, logs) =>
    set((state) => ({
      logBuffers: { ...state.logBuffers, [agentId]: logs },
    })),
}))
