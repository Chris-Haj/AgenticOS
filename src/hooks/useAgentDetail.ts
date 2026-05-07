import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAgent, fetchAgentLogs, fetchToolCalls } from '@/api/agents'
import { useAgentStore } from '@/store/agentStore'
import { useSystemStore } from '@/store/systemStore'

export function useAgentDetail(agentId: string) {
  const { upsertAgent } = useAgentStore()
  const { initAgentLogs, appendToolCall, toolCallBuffers } = useSystemStore()

  const agentQuery = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => fetchAgent(agentId),
    refetchInterval: 3000,
  })

  const logsQuery = useQuery({
    queryKey: ['agent-logs', agentId],
    queryFn: () => fetchAgentLogs(agentId),
    // Don't refetch logs — WebSocket handles updates
    staleTime: Infinity,
  })

  const toolCallsQuery = useQuery({
    queryKey: ['agent-toolcalls', agentId],
    queryFn: () => fetchToolCalls(agentId),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (agentQuery.data) upsertAgent(agentQuery.data)
  }, [agentQuery.data, upsertAgent])

  useEffect(() => {
    if (logsQuery.data) initAgentLogs(agentId, logsQuery.data)
  }, [logsQuery.data, agentId, initAgentLogs])

  useEffect(() => {
    if (!toolCallsQuery.data) return
    const existing = toolCallBuffers[agentId] ?? []
    // Only append truly new tool calls (by id)
    const existingIds = new Set(existing.map((t) => t.id))
    const newCalls = toolCallsQuery.data.filter((t) => !existingIds.has(t.id))
    newCalls.forEach((call) => appendToolCall(agentId, call))
  }, [toolCallsQuery.data, agentId, appendToolCall, toolCallBuffers])

  return {
    loading: agentQuery.isLoading,
    error: agentQuery.error,
    backendOnline: agentQuery.isSuccess,
  }
}
