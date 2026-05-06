import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Code2, Search, GitBranch, Wrench } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAgentStore } from '@/store/agentStore'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { AgentType } from '@/types/agent'
import type { Agent } from '@/types/agent'
import { cn } from '@/utils/cn'

const agentTypes: {
  id: AgentType
  label: string
  desc: string
  icon: React.ReactNode
  model: string
}[] = [
  {
    id: 'code',
    label: 'Code Agent',
    desc: 'Writes, edits, and tests code. Has full tool access.',
    icon: <Code2 size={18} />,
    model: 'claude-sonnet-4-6',
  },
  {
    id: 'research',
    label: 'Research Agent',
    desc: 'Web search, synthesis, and knowledge building.',
    icon: <Search size={18} />,
    model: 'claude-sonnet-4-6',
  },
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    desc: 'Coordinates other agents, delegates tasks.',
    icon: <GitBranch size={18} />,
    model: 'claude-opus-4-7',
  },
  {
    id: 'custom',
    label: 'Custom',
    desc: 'Define your own goal and behavior.',
    icon: <Wrench size={18} />,
    model: 'claude-sonnet-4-6',
  },
]

function createMockAgent(name: string, goal: string, type: AgentType, model: string): Agent {
  const now = new Date().toISOString()
  return {
    id: `agt-${Date.now()}`,
    name,
    goal,
    type,
    status: 'spawning',
    currentTask: 'Initializing environment...',
    spawnedAt: now,
    lastActiveAt: now,
    uptimeSeconds: 0,
    toolCallCount: 0,
    memoryReads: 0,
    memoryWrites: 0,
    model,
    taskSteps: [
      { id: 'init', label: 'Initialize workspace', status: 'active' },
      { id: 'run', label: 'Execute goal', status: 'pending' },
    ],
  }
}

export function SpawnModal() {
  const { openModal, closeModal } = useUiStore()
  const { upsertAgent } = useAgentStore()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedType, setSelectedType] = useState<AgentType>('code')
  const [errors, setErrors] = useState<{ name?: string; goal?: string }>({})
  const [spawning, setSpawning] = useState(false)

  const validate = () => {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'Agent name is required'
    if (!goal.trim()) errs.goal = 'Goal is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSpawn = async () => {
    if (!validate()) return
    setSpawning(true)

    const typeConfig = agentTypes.find((t) => t.id === selectedType)!
    const agent = createMockAgent(name.trim(), goal.trim(), selectedType, typeConfig.model)

    await new Promise((r) => setTimeout(r, 800))

    upsertAgent(agent)
    setSpawning(false)
    closeModal()
    setName('')
    setGoal('')
    setSelectedType('code')
    setErrors({})
    navigate(`/agents/${agent.id}`)
  }

  const isOpen = openModal === 'spawn'

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Spawn New Agent"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={closeModal} disabled={spawning}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Bot size={13} />}
            loading={spawning}
            onClick={handleSpawn}
          >
            Spawn Agent
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Agent type selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Agent Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {agentTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded border text-left transition-all',
                  selectedType === t.id
                    ? 'border-green-vivid/50 bg-green-dim/15'
                    : 'border-green-dim/30 bg-bg-base hover:border-green-dim/60 hover:bg-bg-muted',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0',
                    selectedType === t.id ? 'text-green-vivid' : 'text-text-dim',
                  )}
                >
                  {t.icon}
                </span>
                <div>
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      selectedType === t.id ? 'text-green-vivid' : 'text-text-primary',
                    )}
                  >
                    {t.label}
                  </p>
                  <p className="text-xs text-text-dim mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
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

        {/* Model info */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-dim">
          <span>Model:</span>
          <span className="text-green-soft">
            {agentTypes.find((t) => t.id === selectedType)?.model}
          </span>
        </div>
      </div>
    </Modal>
  )
}
