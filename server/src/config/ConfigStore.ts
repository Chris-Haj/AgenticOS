import fs from 'fs'
import path from 'path'

export interface AppSettings {
  obsidianUrl: string
  obsidianApiKey: string
  defaultRunner: 'claude' | 'copilot'
  defaultModel: string
}

const SETTINGS_PATH = path.join(process.cwd(), 'settings.json')

const DEFAULTS: AppSettings = {
  obsidianUrl: process.env.OBSIDIAN_URL ?? 'http://127.0.0.1:27123',
  obsidianApiKey: process.env.OBSIDIAN_API_KEY ?? '',
  defaultRunner: 'claude',
  defaultModel: 'claude-sonnet-4-6',
}

export class ConfigStore {
  private settings: AppSettings

  constructor() {
    this.settings = this.load()
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
        return { ...DEFAULTS, ...JSON.parse(raw) }
      }
    } catch {
      // fall through to defaults
    }
    return { ...DEFAULTS }
  }

  get(): AppSettings {
    return { ...this.settings }
  }

  getSafe(): Omit<AppSettings, 'obsidianApiKey'> & { obsidianApiKeySet: boolean } {
    const { obsidianApiKey, ...rest } = this.settings
    return { ...rest, obsidianApiKeySet: obsidianApiKey.length > 0 }
  }

  update(patch: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...patch }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(this.settings, null, 2), 'utf-8')
    return this.get()
  }
}

export const configStore = new ConfigStore()
