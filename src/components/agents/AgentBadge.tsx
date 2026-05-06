import type { AgentStatus } from '@/types/agent'
import { cn } from '@/utils/cn'

interface AgentBadgeProps {
  status: AgentStatus
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const config: Record<AgentStatus, { dot: string; label: string; text: string; pulse?: string }> = {
  running:  { dot: 'bg-status-running',  label: 'Running',  text: 'text-green-vivid', pulse: 'animate-pulse-green' },
  idle:     { dot: 'bg-status-idle',     label: 'Idle',     text: 'text-text-secondary' },
  error:    { dot: 'bg-status-error',    label: 'Error',    text: 'text-red-400' },
  stopped:  { dot: 'bg-status-stopped',  label: 'Stopped',  text: 'text-text-dim' },
  spawning: { dot: 'bg-status-spawning', label: 'Spawning', text: 'text-yellow-300', pulse: 'animate-pulse-yellow' },
}

const statusColors: Record<AgentStatus, string> = {
  running:  '#22c55e',
  idle:     '#6b8f7a',
  error:    '#f87171',
  stopped:  '#374a3f',
  spawning: '#fbbf24',
}

export function AgentBadge({ status, showLabel = true, size = 'md' }: AgentBadgeProps) {
  const { dot, label, text, pulse } = config[status]
  const color = statusColors[status]
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const fontSize = size === 'sm' ? 'text-xs' : 'text-xs'

  return (
    <span className={cn('inline-flex items-center gap-1.5', text, fontSize, 'font-mono font-medium')}>
      <span
        className={cn('rounded-full shrink-0', dot, dotSize, pulse)}
        style={{ boxShadow: `0 0 4px ${color}80` }}
      />
      {showLabel && label}
    </span>
  )
}
