import { BookOpen, Plug, FileText, Network } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function MemoryPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-text-primary tracking-tight">Memory</h1>
        <p className="text-xs text-text-secondary mt-0.5">Persistent knowledge via Obsidian</p>
      </div>

      {/* Connection status */}
      <div className="card-panel p-6 flex flex-col items-center gap-5 text-center">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0c1410, #162019)',
            border: '1px solid #1e4d2b',
          }}
        >
          <BookOpen size={28} className="text-green-dim" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-1">Obsidian Not Connected</h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
            Connect your Obsidian vault to give agents persistent memory. Agents will read context
            before tasks and write findings back to your knowledge graph.
          </p>
        </div>

        <Button variant="outline" icon={<Plug size={13} />} disabled>
          Connect Vault (Coming Soon)
        </Button>
      </div>

      {/* Planned features */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">
          Planned Capabilities
        </h2>
        <div className="flex flex-col gap-2">
          {[
            {
              icon: <FileText size={14} />,
              title: 'Note-based Memory',
              desc: 'Agents read and write markdown notes as persistent context across sessions.',
            },
            {
              icon: <Network size={14} />,
              title: 'Knowledge Graph',
              desc: 'Linked concepts build a growing graph of institutional knowledge your agents share.',
            },
            {
              icon: <BookOpen size={14} />,
              title: 'Vault Indexing',
              desc: 'Full-text search over your entire vault so agents can retrieve relevant context.',
            },
          ].map((f) => (
            <div key={f.title} className="card-panel px-4 py-3 flex items-start gap-3 opacity-50">
              <span className="text-green-dim mt-0.5 shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-medium text-text-primary">{f.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
