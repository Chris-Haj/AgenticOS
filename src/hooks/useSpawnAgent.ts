import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { spawnAgent } from '@/api/agents'
import { useAgentStore } from '@/store/agentStore'
import { useUiStore } from '@/store/uiStore'
import type { SpawnAgentPayload } from '@/types/api'

export function useSpawnAgent() {
  const [isSpawning, setIsSpawning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { upsertAgent } = useAgentStore()
  const { closeModal } = useUiStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const spawn = async (payload: SpawnAgentPayload) => {
    setIsSpawning(true)
    setError(null)

    // Don't send empty model string — let backend use runner default
    const cleaned: SpawnAgentPayload = { ...payload }
    if (!cleaned.model) delete cleaned.model

    try {
      const agent = await spawnAgent(cleaned)
      upsertAgent(agent)
      await queryClient.invalidateQueries({ queryKey: ['agents'] })
      closeModal()
      navigate(`/agents/${agent.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to spawn agent'
      setError(msg)
      throw err
    } finally {
      setIsSpawning(false)
    }
  }

  return { spawn, isSpawning, error }
}
