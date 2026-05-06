import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">Configuration and preferences</p>
      </div>
      <div className="card-panel p-6 flex flex-col items-center gap-4 text-center">
        <Settings size={28} className="text-green-dim" />
        <p className="text-sm text-text-secondary">Settings panel coming soon</p>
      </div>
    </div>
  )
}
