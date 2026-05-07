import { useState } from 'react'
import { Bot, Code2, Search, GitBranch, Wrench, AlertCircle, Terminal } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useSpawnAgent } from '@/hooks/useSpawnAgent'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { AgentType } from '@/types/agent'
import type { AgentRunnerType } from '@/types/api'
import { cn } from '@/utils/cn'

const agentTypes: {
  id: AgentType
  label: string
  desc: string
  icon: React.ReactNode
}[] = [
  { id: 'code',         label: 'Code',         desc: 'Write, edit, and test code',           icon: <Code2 size={16} /> },
  { id: 'research',     label: 'Research',      desc: 'Search, synthesize, and report',       icon: <Search size={16} /> },
  { id: 'orchestrator', label: 'Orchestrator',  desc: 'Coordinate multi-step workflows',      icon: <GitBranch size={16} /> },
  { id: 'custom',       label: 'Custom',        desc: 'Any goal you define',                  icon: <Wrench size={16} /> },
]

const runners: {
  id: AgentRunnerType
  label: string
  desc: string
  defaultModel: string
  color: string
}[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    desc: 'Full tool access — bash, files, web',
    defaultModel: 'sonnet',
    color: 'text-green-vivid',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    desc: 'Copilot CLI with Claude model',
    defaultModel: '',
    color: 'text-blue-400',
  },
]

export function SpawnModal() {
  const { openModal, closeModal } = useUiStore()
  const { spawn, isSpawning, error: spawnError } = useSpawnAgent()

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedType, setSelectedType] = useState<AgentType>('code')
  const [selectedRunner, setSelectedRunner] = useState<AgentRunnerType>('claude')
  const [errors, setErrors] = useState<{ name?: string; goal?: string }>({})

  const validate = () => {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'Agent name is required'
    if (!goal.trim()) errs.goal = 'Goal is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSpawn = async () => {
    if (!validate()) return
    const runnerConfig = runners.find((r) => r.id === selectedRunner)!
    try {
      await spawn({
        name: name.trim(),
        goal: goal.trim(),
        type: selectedType,
        runner: selectedRunner,
        model: runnerConfig.defaultModel,
      })
      setName('')
      setGoal('')
      setSelectedType('code')
      setSelectedRunner('claude')
      setErrors({})
    } catch {
      // error shown via spawnError
    }
  }

  const handleClose = () => {
    if (isSpawning) return
    closeModal()
    setName('')
    setGoal('')
    setErrors({})
  }

  return (
    <Modal
      isOpen={openModal === 'spawn'}
      onClose={handleClose}
      title="Spawn New Agent"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSpawning}>Cancel</Button>
          <Button variant="primary" icon={<Bot size={13} />} loading={isSpawning} onClick={handleSpawn}>
            Spawn Agent
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {spawnError && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded bg-red-950/20 border border-red-900/40">
            <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs font-mono text-red-400">{spawnError}</p>
          </div>
        )}

        {/* Runner selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Runner
          </label>
          <div className="grid grid-cols-2 gap-2">
            {runners.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRunner(r.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded border text-left transition-all',
                  selectedRunner === r.id
                    ? 'border-green-vivid/40 bg-green-dim/10'
                    : 'border-green-dim/30 bg-bg-base hover:border-green-dim/50 hover:bg-bg-muted',
                )}
              >
                <Terminal
                  size={16}
                  className={cn('shrink-0', selectedRunner === r.id ? r.color : 'text-text-dim')}
                />
                <div>
                  <p className={cn('text-xs font-semibold', selectedRunner === r.id ? r.color : 'text-text-primary')}>
                    {r.label}
                  </p>
                  <p className="text-xs text-text-dim mt-0.5">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Agent type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Type
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {agentTypes.map((t) => (
              <button
                key={t.id}
                title={t.desc}
                onClick={() => setSelectedType(t.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded border text-center transition-all',
                  selectedType === t.id
                    ? 'border-green-vivid/50 bg-green-dim/15 text-green-vivid'
                    : 'border-green-dim/30 bg-bg-base hover:border-green-dim/60 hover:bg-bg-muted text-text-dim hover:text-text-primary',
                )}
              >
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Agent Name"
          placeholder="e.g. Frontend Builder, Research Scout..."
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((v) => ({ ...v, name: undefined })) }}
          error={errors.name}
        />

        <Textarea
          label="Goal"
          placeholder="Describe what this agent should accomplish..."
          value={goal}
          onChange={(e) => { setGoal(e.target.value); setErrors((v) => ({ ...v, goal: undefined })) }}
          error={errors.goal}
          rows={4}
        />

        <div className="flex items-center justify-between text-xs font-mono text-text-dim border-t border-green-dim/20 pt-3">
          <span>{runners.find(r => r.id === selectedRunner)?.label}{(() => { const m = runners.find(r => r.id === selectedRunner)?.defaultModel; return m ? ` · ${m}` : '' })()}</span>
          <span className="text-text-muted">workspace isolated per agent</span>
        </div>
      </div>
    </Modal>
  )
}
