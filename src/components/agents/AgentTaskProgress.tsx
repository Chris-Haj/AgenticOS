import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import type { TaskStep } from '@/types/agent'
import { cn } from '@/utils/cn'

interface AgentTaskProgressProps {
  steps: TaskStep[]
  currentTask?: string
}

const icons = {
  done:    <CheckCircle2 size={14} className="text-green-vivid shrink-0" />,
  active:  <Loader2 size={14} className="text-yellow-300 shrink-0 animate-spin" />,
  pending: <Circle size={14} className="text-text-dim shrink-0" />,
  failed:  <XCircle size={14} className="text-red-400 shrink-0" />,
}

const textColors = {
  done:    'text-text-secondary',
  active:  'text-text-primary',
  pending: 'text-text-dim',
  failed:  'text-red-400',
}

export function AgentTaskProgress({ steps, currentTask }: AgentTaskProgressProps) {
  const doneCount = steps.filter((s) => s.status === 'done').length
  const progress = steps.length > 0 ? (doneCount / steps.length) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary font-mono">Task Progress</span>
          <span className="text-xs text-text-dim font-mono">{doneCount}/{steps.length}</span>
        </div>
        <div className="h-1 bg-bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1e5a2e, #22c55e)',
              boxShadow: progress > 0 ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Current task pill */}
      {currentTask && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-bg-muted border border-green-dim/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-vivid animate-pulse-green shrink-0" />
          <span className="text-xs font-mono text-text-secondary">{currentTask}</span>
        </div>
      )}

      {/* Step list */}
      <ol className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <li key={step.id} className="flex items-start gap-3 group">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              {icons[step.status]}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-px mt-0.5 mb-0.5 flex-1',
                    step.status === 'done' ? 'bg-green-dim' : 'bg-bg-muted',
                  )}
                  style={{ minHeight: '20px' }}
                />
              )}
            </div>
            <div className="flex-1 pb-3">
              <p className={cn('text-xs font-medium leading-[14px]', textColors[step.status])}>
                {step.label}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
