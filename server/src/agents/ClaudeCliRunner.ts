import { spawn } from 'child_process'
import { createInterface } from 'readline'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import type { AgentManager } from './AgentManager.js'
import type { SpawnAgentPayload } from '../types/index.js'
import { obsidianClient } from '../obsidian/ObsidianClient.js'

// claude stream-json event shapes (subset we care about)
interface AssistantContent {
  type: 'text' | 'tool_use'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
}
interface ToolResultContent {
  type: 'tool_result'
  tool_use_id?: string
  content?: string
  is_error?: boolean
}
interface ClaudeEvent {
  type: 'system' | 'assistant' | 'user' | 'result' | string
  subtype?: string
  message?: {
    content?: (AssistantContent | ToolResultContent)[]
  }
  result?: string
  is_error?: boolean
  total_cost_usd?: number
}

export class ClaudeCliRunner {
  private manager: AgentManager
  private workspacesDir: string
  private abortControllers = new Map<string, AbortController>()

  constructor(manager: AgentManager, workspacesDir: string) {
    this.manager = manager
    this.workspacesDir = workspacesDir
  }

  async spawn(agentId: string, payload: SpawnAgentPayload): Promise<void> {
    const ctrl = new AbortController()
    this.abortControllers.set(agentId, ctrl)

    const workDir = path.join(this.workspacesDir, agentId)
    await fs.mkdir(workDir, { recursive: true })

    this.manager.addLog(agentId, 'info', `[claude] Starting | model: ${payload.model ?? 'sonnet'} | workspace: ${workDir}`)
    this.manager.activateStep(agentId, 'init')
    this.manager.updateStatus(agentId, 'running')
    this.manager.updateCurrentTask(agentId, 'Initializing...')

    // Build system prompt: user context + Obsidian instructions
    const systemParts: string[] = []
    if (payload.context) systemParts.push(payload.context)
    const obsidianPrompt = obsidianClient.systemPromptFragment()
    if (obsidianPrompt) systemParts.push(obsidianPrompt)

    const args = [
      '-p', payload.goal,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--model', payload.model ?? 'sonnet',
    ]

    if (systemParts.length > 0) {
      args.push('--append-system-prompt', systemParts.join('\n\n'))
    }

    const proc = spawn('claude', args, {
      cwd: workDir,
      env: {
        ...process.env,
        OBSIDIAN_URL: obsidianClient.baseUrl,
        OBSIDIAN_API_KEY: obsidianClient.apiKey,
      },
      windowsHide: true,
    })

    // Map tool_use_id → our internal call id for matching results
    const pendingToolCalls = new Map<string, string>()

    const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity })

    rl.on('line', (line) => {
      if (!line.trim()) return
      let event: ClaudeEvent
      try { event = JSON.parse(line) } catch { return }

      if (ctrl.signal.aborted) return

      switch (event.type) {
        case 'system': {
          this.manager.addLog(agentId, 'debug', `[claude] Session started`)
          this.manager.activateStep(agentId, 'plan')
          break
        }

        case 'assistant': {
          const content = event.message?.content ?? []
          for (const block of content) {
            if (block.type === 'text' && block.text?.trim()) {
              // Emit each non-empty line as a log entry
              for (const line of block.text.split('\n')) {
                if (line.trim()) this.manager.addLog(agentId, 'info', line)
              }
            } else if (block.type === 'tool_use' && block.id && block.name) {
              const callId = uuid()
              pendingToolCalls.set(block.id, callId)
              const inputPreview = JSON.stringify(block.input ?? {}).slice(0, 120)
              this.manager.addLog(agentId, 'tool', `→ ${block.name}(${inputPreview})`)
              this.manager.addToolCall(agentId, {
                id: callId,
                name: block.name,
                input: block.input ?? {},
                timestamp: new Date().toISOString(),
                status: 'pending',
              })
              // Update current task from Bash commands
              if (block.name === 'Bash' && block.input?.command) {
                this.manager.updateCurrentTask(agentId, String(block.input.command).slice(0, 80))
              }
            }
          }
          this.manager.activateStep(agentId, 'execute')
          break
        }

        case 'user': {
          const content = event.message?.content ?? []
          for (const block of content) {
            if (block.type === 'tool_result' && block.tool_use_id) {
              const callId = pendingToolCalls.get(block.tool_use_id)
              if (callId) {
                pendingToolCalls.delete(block.tool_use_id)
                const output = block.content ?? ''
                const preview = output.slice(0, 300)
                this.manager.addLog(agentId, 'debug', `← ${preview}${output.length > 300 ? '…' : ''}`)
                // Update the tool call record with its result
                const calls = this.manager.getToolCalls(agentId)
                const tc = calls.find(c => c.id === callId)
                if (tc) {
                  tc.output = output
                  tc.status = block.is_error ? 'error' : 'success'
                  if (block.is_error) this.manager.addLog(agentId, 'error', `✗ Tool error: ${output.slice(0, 200)}`)
                }
              }
            }
          }
          break
        }

        case 'result': {
          if (event.is_error) {
            this.manager.addLog(agentId, 'error', `Agent failed: ${event.result ?? 'unknown error'}`)
            this.manager.updateStatus(agentId, 'error', event.result)
          } else {
            const cost = event.total_cost_usd ? ` | cost: $${event.total_cost_usd.toFixed(4)}` : ''
            this.manager.addLog(agentId, 'info', `✓ Complete${cost}`)
            this.manager.completeStep(agentId, 'execute')
            this.manager.completeStep(agentId, 'verify')
            this.manager.updateStatus(agentId, 'idle')
            this.manager.updateCurrentTask(agentId, '')
          }
          break
        }
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString().trim()
      if (text) this.manager.addLog(agentId, 'debug', `[stderr] ${text}`)
    })

    proc.on('close', (code) => {
      this.abortControllers.delete(agentId)
      const agent = this.manager.get(agentId)
      if (agent && agent.status === 'running') {
        if (code !== 0) {
          this.manager.updateStatus(agentId, 'error', `Process exited with code ${code}`)
        } else {
          this.manager.updateStatus(agentId, 'idle')
        }
      }
    })

    proc.on('error', (err) => {
      this.manager.addLog(agentId, 'error', `Failed to start claude CLI: ${err.message}`)
      this.manager.updateStatus(agentId, 'error', err.message)
    })

    ctrl.signal.addEventListener('abort', () => {
      proc.kill('SIGTERM')
    })
  }

  stop(agentId: string): void {
    this.abortControllers.get(agentId)?.abort()
    this.abortControllers.delete(agentId)
  }
}
