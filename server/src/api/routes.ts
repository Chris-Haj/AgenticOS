import { Router, type Request, type Response } from 'express'
import type { AgentManager } from '../agents/AgentManager.js'
import type { AgentRunner } from '../agents/AgentRunner.js'
import type { ApiResponse, SpawnAgentPayload } from '../types/index.js'
import { obsidianClient } from '../obsidian/ObsidianClient.js'

function ok<T>(res: Response, data: T): void {
  const body: ApiResponse<T> = { data, success: true, timestamp: new Date().toISOString() }
  res.json(body)
}

function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, error: message, timestamp: new Date().toISOString() })
}

function id(req: Request): string {
  return req.params['id'] as string
}

export function createRouter(manager: AgentManager, runner: AgentRunner): Router {
  const router = Router()

  // GET /api/v1/agents
  router.get('/agents', (_req: Request, res: Response) => {
    ok(res, manager.list())
  })

  // GET /api/v1/agents/:id
  router.get('/agents/:id', (req: Request, res: Response) => {
    const agent = manager.get(id(req))
    if (!agent) return fail(res, 404, 'Agent not found')
    ok(res, agent)
  })

  // POST /api/v1/agents — spawn
  router.post('/agents', async (req: Request, res: Response) => {
    const { name, goal, type, runner: agentRunner, model, context } = req.body as SpawnAgentPayload

    if (!name?.trim()) return fail(res, 400, 'name is required')
    if (!goal?.trim()) return fail(res, 400, 'goal is required')
    if (!type) return fail(res, 400, 'type is required')

    try {
      const agent = await runner.spawn({ name: name.trim(), goal: goal.trim(), type, runner: agentRunner, model, context })
      res.status(201).json({ data: agent, success: true, timestamp: new Date().toISOString() })
    } catch (err) {
      fail(res, 500, err instanceof Error ? err.message : 'Spawn failed')
    }
  })

  // PATCH /api/v1/agents/:id — pause / resume
  router.patch('/agents/:id', (req: Request, res: Response) => {
    const agentId = id(req)
    const agent = manager.get(agentId)
    if (!agent) return fail(res, 404, 'Agent not found')

    const { action } = req.body as { action: 'pause' | 'resume' }
    if (action === 'pause' && agent.status === 'running') {
      manager.updateStatus(agentId, 'idle')
    } else if (action === 'resume' && agent.status === 'idle') {
      manager.updateStatus(agentId, 'running')
    } else {
      return fail(res, 400, `Cannot ${action} agent in status: ${agent.status}`)
    }

    ok(res, manager.get(agentId)!)
  })

  // DELETE /api/v1/agents/:id — stop
  router.delete('/agents/:id', (req: Request, res: Response) => {
    const agentId = id(req)
    const agent = manager.get(agentId)
    if (!agent) return fail(res, 404, 'Agent not found')

    runner.stop(agentId)
    ok(res, { id: agentId, stoppedAt: new Date().toISOString() })
  })

  // GET /api/v1/agents/:id/logs
  router.get('/agents/:id/logs', (req: Request, res: Response) => {
    const agentId = id(req)
    if (!manager.get(agentId)) return fail(res, 404, 'Agent not found')

    const limit = Math.min(parseInt((req.query['limit'] as string) ?? '200', 10), 1000)
    const logs = manager.getLogs(agentId).slice(-limit)
    ok(res, logs)
  })

  // GET /api/v1/agents/:id/toolcalls
  router.get('/agents/:id/toolcalls', (req: Request, res: Response) => {
    const agentId = id(req)
    if (!manager.get(agentId)) return fail(res, 404, 'Agent not found')
    ok(res, manager.getToolCalls(agentId))
  })

  // GET /api/v1/system/status
  router.get('/system/status', (_req: Request, res: Response) => {
    const { activeAgentCount, totalAgentCount, uptime } = manager.systemStatus()
    ok(res, {
      activeAgentCount,
      totalAgentCount,
      memorySyncStatus: 'disconnected',
      backendVersion: '0.1.0',
      uptime,
    })
  })

  // GET /api/v1/obsidian/status
  router.get('/obsidian/status', async (_req: Request, res: Response) => {
    if (!obsidianClient.enabled) {
      return ok(res, { enabled: false, connected: false, url: null })
    }
    const connected = await obsidianClient.ping()
    ok(res, { enabled: true, connected, url: obsidianClient.baseUrl })
  })

  // GET /api/v1/obsidian/search?q=...
  router.get('/obsidian/search', async (req: Request, res: Response) => {
    if (!obsidianClient.enabled) return fail(res, 503, 'Obsidian not configured')
    const query = req.query['q'] as string
    if (!query?.trim()) return fail(res, 400, 'q is required')
    const results = await obsidianClient.search(query)
    ok(res, results)
  })

  // GET /api/v1/obsidian/notes?folder=...
  router.get('/obsidian/notes', async (req: Request, res: Response) => {
    if (!obsidianClient.enabled) return fail(res, 503, 'Obsidian not configured')
    const folder = (req.query['folder'] as string) ?? ''
    const files = await obsidianClient.listNotes(folder)
    ok(res, files)
  })

  // GET /api/v1/obsidian/note?path=...
  router.get('/obsidian/note', async (req: Request, res: Response) => {
    if (!obsidianClient.enabled) return fail(res, 503, 'Obsidian not configured')
    const notePath = req.query['path'] as string
    if (!notePath?.trim()) return fail(res, 400, 'path is required')
    const content = await obsidianClient.readNote(notePath)
    if (content === null) return fail(res, 404, 'Note not found')
    ok(res, { path: notePath, content })
  })

  return router
}
