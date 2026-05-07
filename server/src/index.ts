import 'dotenv/config'
import http from 'http'
import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { WsBroadcaster } from './ws/broadcaster.js'
import { AgentManager } from './agents/AgentManager.js'
import { AgentRunner } from './agents/AgentRunner.js'
import { createRouter } from './api/routes.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const WORKSPACES_DIR = process.env.AGENT_WORKING_DIR ?? path.join(process.cwd(), 'agent-workspaces')

// Ensure workspaces dir exists
fs.mkdirSync(WORKSPACES_DIR, { recursive: true })

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// Health check (pre-router, no auth needed)
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// HTTP + WS on same port
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/' })

const broadcaster = new WsBroadcaster(wss)
const manager = new AgentManager(broadcaster)
const runner = new AgentRunner(manager, WORKSPACES_DIR)

app.use('/api/v1', createRouter(manager, runner))

// 404 fallback for unmatched API routes
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'Not found' }))

server.listen(PORT, () => {
  const obsidianUrl = process.env.OBSIDIAN_URL ?? 'http://127.0.0.1:27123'
  const obsidianConfigured = Boolean(process.env.OBSIDIAN_API_KEY)

  console.log(`\n  AgentOS Server  v0.1.0`)
  console.log(`  ─────────────────────────────────`)
  console.log(`  REST  →  http://localhost:${PORT}/api/v1`)
  console.log(`  WS    →  ws://localhost:${PORT}/api/v1/agents/:id/stream`)
  console.log(`  Work  →  ${WORKSPACES_DIR}`)
  console.log(`  Obsidian: ${obsidianConfigured ? `✓ ${obsidianUrl}` : '✗ not configured (set OBSIDIAN_API_KEY)'}`)
  console.log()
})
