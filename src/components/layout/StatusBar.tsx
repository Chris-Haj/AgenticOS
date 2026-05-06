import { Plus, Activity, Database, Cpu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useSystemStore } from '@/store/systemStore'
import { useAgentStore } from '@/store/agentStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const memorySyncColors = {
  synced:       'text-green-vivid',
  syncing:      'text-yellow-300',
  disconnected: 'text-text-dim',
}

const memorySyncLabels = {
  synced:       'Memory Synced',
  syncing:      'Syncing...',
  disconnected: 'Memory Offline',
}

export function StatusBar() {
  const { openSpawnModal } = useUiStore()
  const { status } = useSystemStore()
  const { agents } = useAgentStore()

  const runningCount = Object.values(agents).filter((a) => a.status === 'running').length
  const errorCount   = Object.values(agents).filter((a) => a.status === 'error').length
  const totalCount   = Object.values(agents).length

  const syncStatus = status?.memorySyncStatus ?? 'disconnected'

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-green-dim/40"
      style={{ background: 'var(--color-bg-surface)' }}
    >
      {/* Left: system stats */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-text-dim" />
          <span className="text-xs font-mono text-text-secondary">
            <span className="text-green-vivid font-semibold">{runningCount}</span>
            <span className="text-text-dim">/{totalCount}</span>
            <span className="ml-1 text-text-dim">agents</span>
          </span>
        </div>

        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs font-mono text-red-400">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Activity size={13} className={memorySyncColors[syncStatus]} />
          <span className={cn('text-xs font-mono', memorySyncColors[syncStatus])}>
            {memorySyncLabels[syncStatus]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Database size={13} className="text-text-dim" />
          <span className="text-xs font-mono text-text-dim">Obsidian</span>
          <span className="text-xs font-mono text-text-dim">—</span>
          <span className="text-xs font-mono text-yellow-600">not connected</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-text-dim hidden sm:block">
          {status?.backendVersion ?? 'no backend'}
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={openSpawnModal}
        >
          New Agent
        </Button>
      </div>
    </header>
  )
}
