import { useNavigate } from 'react-router-dom'
import { Square, Pause, Play, ExternalLink, Cpu, BookOpen, Code2, Search, GitBranch, Wrench } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { AgentBadge } from './AgentBadge'
import { Button } from '@/components/ui/Button'
import { formatUptime, formatRelative } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface AgentCardProps {
  agent: Agent
  onStop?: (id: string) => void
  onPause?: (id: string) => void
}

const typeIcons = {
  code:         <Code2 size={12} />,
  research:     <Search size={12} />,
  orchestrator: <GitBranch size={12} />,
  custom:       <Wrench size={12} />,
}

const typeLabels = {
  code:         'Code',
  research:     'Research',
  orchestrator: 'Orchestrator',
  custom:       'Custom',
}

export function AgentCard({ agent, onStop, onPause }: AgentCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'card-panel p-4 cursor-pointer group flex flex-col gap-3',
        agent.status === 'error' && 'border-red-900/50 hover:border-red-500/40',
        agent.status === 'stopped' && 'opacity-60',
      )}
      onClick={() => navigate(`/agents/${agent.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-text-dim">{typeIcons[agent.type]}</span>
            <span className="text-xs font-mono text-text-dim uppercase tracking-wider">
              {typeLabels[agent.type]}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-green-vivid transition-colors">
            {agent.name}
          </h3>
        </div>
        <AgentBadge status={agent.status} />
      </div>

      {/* Goal */}
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
        {agent.goal}
      </p>

      {/* Current task */}
      {agent.currentTask && agent.status !== 'stopped' && (
        <div className="flex items-center gap-1.5 py-1.5 px-2 rounded bg-bg-muted border border-green-dim/30">
          <span className="w-1 h-1 rounded-full bg-green-vivid shrink-0 animate-pulse-green" />
          <p className="text-xs font-mono text-text-secondary truncate">{agent.currentTask}</p>
        </div>
      )}

      {/* Error message */}
      {agent.errorMessage && (
        <div className="py-1.5 px-2 rounded bg-red-950/20 border border-red-900/30">
          <p className="text-xs font-mono text-red-400 line-clamp-2">{agent.errorMessage}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-text-dim font-mono">
        <span className="flex items-center gap-1">
          <Cpu size={10} />
          {agent.toolCallCount} calls
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={10} />
          {agent.memoryReads}r/{agent.memoryWrites}w
        </span>
        <span className="ml-auto">{formatUptime(agent.uptimeSeconds)}</span>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2 border-t border-green-dim/20"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-text-dim">{formatRelative(agent.lastActiveAt)}</span>
        <div className="flex items-center gap-1">
          {agent.status === 'running' && onPause && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Pause size={11} />}
              onClick={() => onPause(agent.id)}
            />
          )}
          {agent.status === 'idle' && onPause && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Play size={11} />}
              onClick={() => onPause(agent.id)}
            />
          )}
          {(agent.status === 'running' || agent.status === 'idle' || agent.status === 'spawning') && onStop && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Square size={11} />}
              className="hover:text-red-400"
              onClick={() => onStop(agent.id)}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalLink size={11} />}
            onClick={() => navigate(`/agents/${agent.id}`)}
          />
        </div>
      </div>
    </div>
  )
}
