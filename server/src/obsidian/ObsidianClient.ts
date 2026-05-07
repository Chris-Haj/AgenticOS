/**
 * Thin wrapper around the Obsidian Local REST API plugin.
 * Plugin docs: https://github.com/coddingtonbear/obsidian-local-rest-api
 *
 * Set OBSIDIAN_URL (default http://127.0.0.1:27123) and OBSIDIAN_API_KEY
 * in .env. If neither is set the client is considered disabled.
 */

export interface ObsidianNote {
  path: string
  content: string
  tags?: string[]
  frontmatter?: Record<string, unknown>
}

export interface ObsidianSearchResult {
  filename: string
  score: number
  matches: string[]
}

export class ObsidianClient {
  baseUrl: string
  apiKey: string

  get enabled() {
    return Boolean(this.apiKey)
  }

  constructor() {
    this.baseUrl = (process.env.OBSIDIAN_URL ?? 'http://127.0.0.1:27123').replace(/\/$/, '')
    this.apiKey = process.env.OBSIDIAN_API_KEY ?? ''
  }

  reconfigure(url: string, apiKey: string) {
    this.baseUrl = url.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async ping(): Promise<boolean> {
    if (!this.enabled) return false
    try {
      const res = await fetch(`${this.baseUrl}/`, { headers: this.headers(), signal: AbortSignal.timeout(3000) })
      return res.ok
    } catch {
      return false
    }
  }

  async readNote(vaultPath: string): Promise<string | null> {
    if (!this.enabled) return null
    try {
      const res = await fetch(`${this.baseUrl}/vault/${encodeURIComponent(vaultPath)}`, {
        headers: this.headers(),
      })
      if (!res.ok) return null
      const data = await res.json() as { content?: string }
      return data.content ?? null
    } catch {
      return null
    }
  }

  async writeNote(vaultPath: string, content: string): Promise<boolean> {
    if (!this.enabled) return false
    try {
      const res = await fetch(`${this.baseUrl}/vault/${encodeURIComponent(vaultPath)}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ content }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async appendNote(vaultPath: string, content: string): Promise<boolean> {
    if (!this.enabled) return false
    try {
      const res = await fetch(`${this.baseUrl}/vault/${encodeURIComponent(vaultPath)}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ content }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async deleteNote(vaultPath: string): Promise<boolean> {
    if (!this.enabled) return false
    try {
      const res = await fetch(`${this.baseUrl}/vault/${encodeURIComponent(vaultPath)}`, {
        method: 'DELETE',
        headers: this.headers(),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async search(query: string, contextLength = 100): Promise<ObsidianSearchResult[]> {
    if (!this.enabled) return []
    try {
      const res = await fetch(`${this.baseUrl}/search/simple/?query=${encodeURIComponent(query)}&contextLength=${contextLength}`, {
        headers: this.headers(),
      })
      if (!res.ok) return []
      return await res.json() as ObsidianSearchResult[]
    } catch {
      return []
    }
  }

  async listNotes(folder = ''): Promise<string[]> {
    if (!this.enabled) return []
    try {
      const url = folder
        ? `${this.baseUrl}/vault/${encodeURIComponent(folder)}/`
        : `${this.baseUrl}/vault/`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const data = await res.json() as { files?: string[] }
      return data.files ?? []
    } catch {
      return []
    }
  }

  /** System prompt fragment injected into every agent explaining how to use Obsidian. */
  systemPromptFragment(): string {
    if (!this.enabled) return ''
    return `
## Obsidian Memory (Local REST API)
You have access to the user's Obsidian vault via HTTP. Use it to persist information, plans, and results across sessions.

Base URL : ${this.baseUrl}
Auth header: Authorization: Bearer ${this.apiKey}

Key endpoints (all paths are relative to vault root):
- GET    /vault/<path>              Read a note (returns JSON with "content" field)
- PUT    /vault/<path>              Write/overwrite a note (body: {"content":"..."})
- POST   /vault/<path>              Append to a note
- DELETE /vault/<path>              Delete a note
- GET    /vault/<folder>/           List files in folder
- GET    /search/simple/?query=...  Full-text search (returns [{filename,score,matches}])

Conventions:
- Store agent context in AgentOS/<agent-name>/ folder
- Use AgentOS/<agent-name>/memory.md for persistent key facts
- Use AgentOS/<agent-name>/tasks.md for task tracking
- Use AgentOS/shared/ for notes shared across agents
- Paths must include the .md extension

Example: curl -s -H "Authorization: Bearer ${this.apiKey}" -X GET "${this.baseUrl}/vault/AgentOS/shared/memory.md"
`.trim()
  }
}

export const obsidianClient = new ObsidianClient()
