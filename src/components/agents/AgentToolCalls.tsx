import { useState } from 'react'
import { ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { ToolCall } from '@/types/agent'
import { formatTimestamp } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface AgentToolCallsProps {
  toolCalls: ToolCall[]
}

function ToolCallRow({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false)

  const statusIcon = {
    success: <CheckCircle2 size={12} className="text-green-vivid" />,
    error:   <XCircle size={12} className="text-red-400" />,
    pending: <Clock size={12} className="text-yellow-300 animate-pulse" />,
  }[call.status]

  return (
    <div
      className={cn(
        'border border-green-dim/20 rounded transition-colors',
        expanded ? 'bg-bg-elevated' : 'hover:bg-bg-muted',
      )}
    >
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <ChevronRight
          size={12}
          className={cn('text-text-dim transition-transform shrink-0', expanded && 'rotate-90')}
        />
        {statusIcon}
        <span className="font-mono text-xs text-green-soft flex-1 truncate">{call.name}</span>
        {call.durationMs !== undefined && (
          <span className="font-mono text-xs text-text-dim shrink-0">{call.durationMs}ms</span>
        )}
        <span className="font-mono text-xs text-text-dim shrink-0">{formatTimestamp(call.timestamp)}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-green-dim/20 pt-2">
          <div>
            <p className="text-xs text-text-dim mb-1 font-semibold uppercase tracking-wider">Input</p>
            <pre className="text-xs font-mono text-text-secondary bg-bg-base rounded p-2 overflow-x-auto">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          {call.output && (
            <div>
              <p className="text-xs text-text-dim mb-1 font-semibold uppercase tracking-wider">Output</p>
              <pre className="text-xs font-mono text-text-secondary bg-bg-base rounded p-2 overflow-x-auto max-h-40 overflow-y-auto">
                {call.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentToolCalls({ toolCalls }: AgentToolCallsProps) {
  if (toolCalls.length === 0) {
    return (
      <p className="text-xs text-text-dim font-mono text-center py-8">
        No tool calls recorded yet
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {toolCalls.map((call) => (
        <ToolCallRow key={call.id} call={call} />
      ))}
    </div>
  )
}
