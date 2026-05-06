import { useRef, useState, useCallback } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { ArrowDown, Search } from 'lucide-react'
import type { LogEntry } from '@/types/agent'
import { formatTimestamp } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface AgentLogStreamProps {
  logs: LogEntry[]
}

const levelClass: Record<LogEntry['level'], string> = {
  error: 'log-error',
  warn:  'log-warn',
  tool:  'log-tool',
  info:  'log-info',
  debug: 'log-debug',
}

const levelLabel: Record<LogEntry['level'], string> = {
  error: 'ERR ',
  warn:  'WARN',
  tool:  'TOOL',
  info:  'INFO',
  debug: 'DBG ',
}

export function AgentLogStream({ logs }: AgentLogStreamProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? logs.filter((l) => l.message.toLowerCase().includes(filter.toLowerCase()))
    : logs

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: filtered.length - 1, behavior: 'smooth' })
    setAutoScroll(true)
  }, [filtered.length])

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <span className="text-text-dim font-mono text-xs animate-blink">▮</span>
        <p className="text-xs text-text-dim font-mono">Waiting for output...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            className="input-base pl-7 py-1.5 text-xs"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-text-dim font-mono">{filtered.length} lines</span>
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={cn(
              'text-xs font-mono px-2 py-1 rounded border transition-colors',
              autoScroll
                ? 'border-green-dim/60 text-green-vivid bg-green-dim/10'
                : 'border-bg-muted text-text-dim hover:text-text-secondary',
            )}
          >
            auto
          </button>
        </div>
      </div>

      {/* Log container */}
      <div
        className="flex-1 rounded bg-bg-base border border-green-dim/20 overflow-hidden relative"
        style={{ minHeight: '200px' }}
      >
        <Virtuoso
          ref={virtuosoRef}
          data={filtered}
          followOutput={autoScroll ? 'smooth' : false}
          atBottomStateChange={(atBottom) => {
            if (atBottom) setAutoScroll(true)
          }}
          itemContent={(_, log) => (
            <div className={cn('log-line', levelClass[log.level])}>
              <span className="text-text-dim mr-2">{formatTimestamp(log.timestamp)}</span>
              <span className="mr-2 opacity-60">{levelLabel[log.level]}</span>
              {log.message}
            </div>
          )}
        />

        {/* Scroll-to-bottom button */}
        {!autoScroll && filtered.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono bg-bg-elevated border border-green-dim text-green-vivid hover:bg-bg-muted transition-colors shadow-lg"
          >
            <ArrowDown size={10} />
            Jump to bottom
          </button>
        )}
      </div>
    </div>
  )
}
