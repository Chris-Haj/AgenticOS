import { useEffect, useRef, useState } from 'react'
import { AgentWebSocket } from '@/api/websocket'
import { useAgentStore } from '@/store/agentStore'
import { useSystemStore } from '@/store/systemStore'
import type { AgentStatus } from '@/types/agent'
import type { LogEntry, ToolCall } from '@/types/agent'

export function useLogStream(agentId: string) {
  const wsRef = useRef<AgentWebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const { updateAgentStatus, upsertAgent, agents } = useAgentStore()
  const { appendLog, appendToolCall } = useSystemStore()

  useEffect(() => {
    const ws = new AgentWebSocket(agentId)
    wsRef.current = ws

    const unsubLog = ws.on('log', (msg) => {
      appendLog(agentId, msg.payload as LogEntry)
    })

    const unsubStatus = ws.on('status_change', (msg) => {
      updateAgentStatus(agentId, msg.payload as AgentStatus)
    })

    const unsubTool = ws.on('tool_call', (msg) => {
      appendToolCall(agentId, msg.payload as ToolCall)
    })

    const unsubTask = ws.on('task_update', (msg) => {
      const agent = agents[agentId]
      if (agent) {
        upsertAgent({ ...agent, taskSteps: msg.payload as typeof agent.taskSteps })
      }
    })

    const unsubAll = ws.on('*', () => {
      setConnected(ws.connected)
    })

    ws.connect()
    setConnected(ws.connected)

    return () => {
      unsubLog(); unsubStatus(); unsubTool(); unsubTask(); unsubAll()
      ws.disconnect()
      wsRef.current = null
      setConnected(false)
    }
  }, [agentId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
