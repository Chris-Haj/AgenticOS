import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { WsMessage } from '../types/index.js'

export class WsBroadcaster {
  private wss: WebSocketServer
  // Map from agentId → set of connected clients
  private subscriptions: Map<string, Set<WebSocket>> = new Map()

  constructor(wss: WebSocketServer) {
    this.wss = wss
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req)
    })
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // URL pattern: /api/v1/agents/:id/stream
    const match = req.url?.match(/\/api\/v1\/agents\/([^/]+)\/stream/)
    const agentId = match?.[1]

    if (!agentId) { ws.close(1008, 'Invalid stream URL'); return }

    if (!this.subscriptions.has(agentId)) this.subscriptions.set(agentId, new Set())
    this.subscriptions.get(agentId)!.add(ws)

    // Send heartbeat every 15s
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, { type: 'heartbeat', agentId, payload: null, timestamp: new Date().toISOString() })
      }
    }, 15_000)

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'ping') {
          this.send(ws, { type: 'heartbeat', agentId, payload: 'pong', timestamp: new Date().toISOString() })
        }
      } catch { /* ignore malformed */ }
    })

    ws.on('close', () => {
      clearInterval(heartbeat)
      this.subscriptions.get(agentId)?.delete(ws)
      if (this.subscriptions.get(agentId)?.size === 0) this.subscriptions.delete(agentId)
    })

    ws.on('error', () => {
      clearInterval(heartbeat)
      this.subscriptions.get(agentId)?.delete(ws)
    })
  }

  toAgent<T>(agentId: string, message: WsMessage<T>): void {
    const clients = this.subscriptions.get(agentId)
    if (!clients?.size) return
    const payload = JSON.stringify(message)
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  private send(ws: WebSocket, message: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
  }

  subscriberCount(agentId: string): number {
    return this.subscriptions.get(agentId)?.size ?? 0
  }
}
