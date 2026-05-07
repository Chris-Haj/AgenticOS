import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAgents, fetchSystemStatus } from '@/api/agents'
import { useAgentStore } from '@/store/agentStore'
import { useSystemStore } from '@/store/systemStore'

export function useAgents() {
  const { setAgents } = useAgentStore()
  const { setSystemStatus } = useSystemStore()

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    refetchInterval: 5000,
  })

  const statusQuery = useQuery({
    queryKey: ['system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (agentsQuery.data) setAgents(agentsQuery.data)
  }, [agentsQuery.data, setAgents])

  useEffect(() => {
    if (statusQuery.data) setSystemStatus(statusQuery.data)
  }, [statusQuery.data, setSystemStatus])

  return {
    loading: agentsQuery.isLoading,
    error: agentsQuery.error,
    refetch: agentsQuery.refetch,
    backendOnline: agentsQuery.isSuccess,
  }
}
