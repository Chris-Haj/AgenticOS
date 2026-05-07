import type { Agent, SpawnAgentPayload } from '../types/index.js'
import type { AgentManager } from './AgentManager.js'
import { ClaudeCliRunner } from './ClaudeCliRunner.js'
import { CopilotCliRunner } from './CopilotCliRunner.js'

export class AgentRunner {
  private claude: ClaudeCliRunner
  private copilot: CopilotCliRunner
  private manager: AgentManager

  constructor(manager: AgentManager, workspacesDir: string) {
    this.manager = manager
    this.claude = new ClaudeCliRunner(manager, workspacesDir)
    this.copilot = new CopilotCliRunner(manager, workspacesDir)
  }

  async spawn(payload: SpawnAgentPayload): Promise<Agent> {
    const agent = this.manager.create(payload)

    const runner = payload.runner === 'copilot' ? this.copilot : this.claude

    runner.spawn(agent.id, payload).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err)
      this.manager.addLog(agent.id, 'error', `Fatal: ${msg}`)
      this.manager.updateStatus(agent.id, 'error', msg)
    })

    return agent
  }

  stop(agentId: string): void {
    this.claude.stop(agentId)
    this.copilot.stop(agentId)
    this.manager.updateStatus(agentId, 'stopped')
  }
}
