import { spawn } from 'child_process'
import { createInterface } from 'readline'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import type { AgentManager } from './AgentManager.js'
import type { SpawnAgentPayload } from '../types/index.js'
import { obsidianClient } from '../obsidian/ObsidianClient.js'

// Copilot JSON event shapes (subset we care about)
interface CopilotEvent {
  type: string
  data?: {
    messageId?: string
    deltaContent?: string
    content?: string
    toolRequests?: Array<{ id: string; name: string; parameters?: Record<string, unknown> }>
    tool?: { name?: string; parameters?: Record<string, unknown> }
    result?: string
    isError?: boolean
    serverName?: string
    status?: string
  }
  ephemeral?: boolean
  exitCode?: number
  timestamp?: string
}

export class CopilotCliRunner {
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

    this.manager.addLog(agentId, 'info', `[copilot] Starting | workspace: ${workDir}`)
    this.manager.activateStep(agentId, 'init')
    this.manager.updateStatus(agentId, 'running')
    this.manager.updateCurrentTask(agentId, 'Initializing...')

    // Prepend Obsidian instructions to the goal since Copilot doesn't have --append-system-prompt
    const obsidianPrompt = obsidianClient.systemPromptFragment()
    const fullGoal = obsidianPrompt
      ? `${obsidianPrompt}\n\n---\n\nYour task:\n${payload.goal}`
      : payload.goal

    const args = [
      '-p', fullGoal,
      '--output-format', 'json',
      '--allow-all',
      '--no-ask-user',
    ]

    if (payload.model) args.push('--model', payload.model)

    const proc = spawn('copilot', args, {
      cwd: workDir,
      env: {
        ...process.env,
        OBSIDIAN_URL: obsidianClient.baseUrl,
        OBSIDIAN_API_KEY: obsidianClient.apiKey,
      },
      windowsHide: true,
    })

    // Accumulate delta chunks between message boundaries
    let deltaBuffer = ''
    let currentMessageId = ''
    const pendingToolCalls = new Map<string, string>()

    const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity })

    rl.on('line', (line) => {
      if (!line.trim()) return
      let event: CopilotEvent
      try { event = JSON.parse(line) } catch { return }

      if (ctrl.signal.aborted) return
      // Skip ephemeral init noise
      if (event.ephemeral && event.type.startsWith('session.')) return

      switch (event.type) {
        case 'session.tools_updated': {
          this.manager.addLog(agentId, 'debug', `[copilot] Tools loaded`)
          this.manager.activateStep(agentId, 'plan')
          break
        }

        case 'assistant.turn_start': {
          deltaBuffer = ''
          currentMessageId = ''
          this.manager.activateStep(agentId, 'execute')
          break
        }

        case 'assistant.message_delta': {
          if (!event.data?.deltaContent) break
          const msgId = event.data.messageId ?? ''
          // New message — flush previous buffer
          if (currentMessageId && currentMessageId !== msgId && deltaBuffer.trim()) {
            this.flushText(agentId, deltaBuffer)
            deltaBuffer = ''
          }
          currentMessageId = msgId
          deltaBuffer += event.data.deltaContent
          // Flush at natural line breaks to keep logs readable
          if (deltaBuffer.includes('\n')) {
            const lines = deltaBuffer.split('\n')
            const toFlush = lines.slice(0, -1).join('\n')
            deltaBuffer = lines[lines.length - 1]
            if (toFlush.trim()) this.flushText(agentId, toFlush)
          }
          break
        }

        case 'assistant.message': {
          // Flush remaining delta
          if (deltaBuffer.trim()) {
            this.flushText(agentId, deltaBuffer)
            deltaBuffer = ''
          }
          // Handle tool requests embedded in the message
          const toolRequests = event.data?.toolRequests ?? []
          for (const req of toolRequests) {
            const callId = uuid()
            if (req.id) pendingToolCalls.set(req.id, callId)
            const inputPreview = JSON.stringify(req.parameters ?? {}).slice(0, 120)
            this.manager.addLog(agentId, 'tool', `→ ${req.name}(${inputPreview})`)
            this.manager.addToolCall(agentId, {
              id: callId,
              name: req.name,
              input: req.parameters ?? {},
              timestamp: new Date().toISOString(),
              status: 'pending',
            })
            if (req.name === 'shell' && req.parameters?.command) {
              this.manager.updateCurrentTask(agentId, String(req.parameters.command).slice(0, 80))
            }
          }
          break
        }

        case 'tool.call': {
          // Some copilot versions emit this for tool execution
          const name = event.data?.tool?.name ?? 'unknown'
          const callId = uuid()
          this.manager.addLog(agentId, 'tool', `→ ${name}`)
          this.manager.addToolCall(agentId, {
            id: callId,
            name,
            input: event.data?.tool?.parameters ?? {},
            timestamp: new Date().toISOString(),
            status: 'pending',
          })
          break
        }

        case 'tool.result': {
          const output = event.data?.result ?? ''
          const isError = event.data?.isError ?? false
          const preview = output.slice(0, 300)
          this.manager.addLog(agentId, isError ? 'error' : 'debug', `← ${preview}${output.length > 300 ? '…' : ''}`)
          break
        }

        case 'result': {
          // Flush any remaining buffer
          if (deltaBuffer.trim()) { this.flushText(agentId, deltaBuffer); deltaBuffer = '' }

          if (event.exitCode !== 0) {
            this.manager.addLog(agentId, 'error', `[copilot] Exited with code ${event.exitCode}`)
            this.manager.updateStatus(agentId, 'error', `Exit code ${event.exitCode}`)
          } else {
            this.manager.addLog(agentId, 'info', `✓ Complete`)
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
      if (deltaBuffer.trim()) { this.flushText(agentId, deltaBuffer); deltaBuffer = '' }
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
      this.manager.addLog(agentId, 'error', `Failed to start copilot CLI: ${err.message}`)
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

  private flushText(agentId: string, text: string): void {
    for (const line of text.split('\n')) {
      if (line.trim()) this.manager.addLog(agentId, 'info', line)
    }
  }
}
