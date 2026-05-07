import { WS_BASE } from './client'
import type { WsMessage, WsMessageType } from '@/types/api'

type MessageHandler = (msg: WsMessage) => void

export class AgentWebSocket {
  private ws: WebSocket | null = null
  private agentId: string
  private handlers: Map<WsMessageType | '*', Set<MessageHandler>> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private dead = false

  constructor(agentId: string) {
    this.agentId = agentId
  }

  connect(): void {
    if (this.dead) return
    const url = `${WS_BASE}/api/v1/agents/${this.agentId}/stream`

    try {
      this.ws = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        this.emit(msg.type, msg)
        this.emit('*', msg)
      } catch { /* ignore */ }
    }

    this.ws.onclose = () => {
      if (!this.dead) this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  on(type: WsMessageType | '*', handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  disconnect(): void {
    this.dead = true
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private emit(type: WsMessageType | '*', msg: WsMessage): void {
    this.handlers.get(type)?.forEach((h) => h(msg))
  }

  private scheduleReconnect(): void {
    if (this.dead) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      this.connect()
    }, this.reconnectDelay)
  }
}
