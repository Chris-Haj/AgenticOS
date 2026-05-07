import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Search,
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  fetchObsidianStatus,
  fetchObsidianNotes,
  fetchObsidianNote,
  searchObsidianNotes,
} from '@/api/agents'
import { Button } from '@/components/ui/Button'

// ---------- helpers ----------

function isFolder(entry: string) {
  return entry.endsWith('/')
}

function entryName(entry: string) {
  return entry.replace(/\/$/, '').split('/').pop() ?? entry
}

function joinPath(base: string, name: string) {
  if (!base) return name
  return `${base.replace(/\/$/, '')}/${name}`
}

// ---------- sub-components ----------

interface FileTreeProps {
  folder: string
  selectedNote: string | null
  onSelectNote: (path: string) => void
  depth?: number
}

function FileTree({ folder, selectedNote, onSelectNote, depth = 0 }: FileTreeProps) {
  const [open, setOpen] = useState(depth === 0)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['obsidian-notes', folder],
    queryFn: () => fetchObsidianNotes(folder),
    staleTime: 30_000,
    enabled: open || depth === 0,
  })

  const folders = entries.filter(isFolder)
  const files = entries.filter((e) => !isFolder(e))

  if (depth === 0) {
    return (
      <div className="flex flex-col gap-0.5">
        {isLoading && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-secondary">
            <Loader2 size={12} className="animate-spin" />
            Loading…
          </div>
        )}
        {folders.map((f) => (
          <FileTree
            key={f}
            folder={joinPath(folder, f)}
            selectedNote={selectedNote}
            onSelectNote={onSelectNote}
            depth={depth + 1}
          />
        ))}
        {files.map((f) => {
          const path = joinPath(folder, f)
          const active = selectedNote === path
          return (
            <button
              key={f}
              onClick={() => onSelectNote(path)}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs text-left w-full transition-colors ${
                active
                  ? 'bg-green-dim/40 text-text-primary'
                  : 'text-text-secondary hover:bg-green-dim/20 hover:text-text-primary'
              }`}
            >
              <FileText size={11} className="shrink-0 text-green-dim" />
              <span className="truncate">{entryName(f)}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const folderLabel = entryName(folder)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full px-2 py-1 rounded text-xs text-text-secondary hover:bg-green-dim/20 hover:text-text-primary transition-colors"
      >
        <ChevronRight
          size={11}
          className={`shrink-0 transition-transform text-green-dim ${open ? 'rotate-90' : ''}`}
        />
        {open ? (
          <FolderOpen size={11} className="shrink-0 text-green-dim" />
        ) : (
          <Folder size={11} className="shrink-0 text-green-dim" />
        )}
        <span className="truncate">{folderLabel}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-green-dim/20 pl-1 mt-0.5 flex flex-col gap-0.5">
          {isLoading && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-text-secondary">
              <Loader2 size={10} className="animate-spin" />
              Loading…
            </div>
          )}
          {folders.map((f) => (
            <FileTree
              key={f}
              folder={joinPath(folder, f)}
              selectedNote={selectedNote}
              onSelectNote={onSelectNote}
              depth={depth + 1}
            />
          ))}
          {files.map((f) => {
            const path = joinPath(folder, f)
            const active = selectedNote === path
            return (
              <button
                key={f}
                onClick={() => onSelectNote(path)}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs text-left w-full transition-colors ${
                  active
                    ? 'bg-green-dim/40 text-text-primary'
                    : 'text-text-secondary hover:bg-green-dim/20 hover:text-text-primary'
                }`}
              >
                <FileText size={11} className="shrink-0 text-green-dim" />
                <span className="truncate">{entryName(f)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NoteViewer({ path, onClose }: { path: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['obsidian-note', path],
    queryFn: () => fetchObsidianNote(path),
    staleTime: 60_000,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-green-dim/20 shrink-0">
        <FileText size={13} className="text-green-dim shrink-0" />
        <span className="text-xs text-text-primary font-mono truncate flex-1">{path}</span>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors p-0.5"
        >
          <X size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-24 text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle size={13} />
            Failed to load note.
          </div>
        )}
        {data && (
          <pre className="text-xs text-text-primary font-mono leading-relaxed whitespace-pre-wrap break-words">
            {data.content}
          </pre>
        )}
      </div>
    </div>
  )
}

interface SearchResultsProps {
  query: string
  onSelectNote: (path: string) => void
}

function SearchResults({ query, onSelectNote }: SearchResultsProps) {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['obsidian-search', query],
    queryFn: () => searchObsidianNotes(query),
    staleTime: 15_000,
    enabled: query.length >= 2,
  })

  if (query.length < 2) return null

  return (
    <div className="flex flex-col gap-1">
      {isLoading && (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-text-secondary">
          <Loader2 size={12} className="animate-spin" />
          Searching…
        </div>
      )}
      {!isLoading && results.length === 0 && (
        <p className="px-2 py-2 text-xs text-text-secondary">No results for "{query}"</p>
      )}
      {results.map((r) => (
        <button
          key={r.filename}
          onClick={() => onSelectNote(r.filename)}
          className="flex flex-col gap-0.5 px-2 py-1.5 rounded hover:bg-green-dim/20 text-left transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <FileText size={11} className="text-green-dim shrink-0" />
            <span className="text-xs text-text-primary truncate">{entryName(r.filename)}</span>
          </div>
          <p className="text-xs text-text-secondary truncate pl-4">
            {r.matches.slice(0, 1).join(' … ')}
          </p>
        </button>
      ))}
    </div>
  )
}

// ---------- main page ----------

export function MemoryPage() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['obsidian-status'],
    queryFn: fetchObsidianStatus,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  const connected = status?.connected && status?.enabled
  const isSearch = debouncedQuery.length >= 2

  if (statusLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in max-w-5xl">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Memory</h1>
          <p className="text-xs text-text-secondary mt-0.5">Persistent knowledge via Obsidian</p>
        </div>
        <div className="card-panel p-6 flex items-center justify-center h-40">
          <Loader2 size={20} className="animate-spin text-green-vivid" />
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Memory</h1>
          <p className="text-xs text-text-secondary mt-0.5">Persistent knowledge via Obsidian</p>
        </div>

        <div className="card-panel p-6 flex flex-col items-center gap-5 text-center">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0c1410, #162019)', border: '1px solid #1e4d2b' }}
          >
            <BookOpen size={28} className="text-green-dim" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              {status?.enabled ? 'Obsidian Unreachable' : 'Obsidian Not Configured'}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              {status?.enabled
                ? `Could not reach ${status.url}. Make sure the Obsidian Local REST API plugin is running.`
                : 'Set OBSIDIAN_API_KEY in server/.env to connect your vault. Agents will read and write notes as persistent memory.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={12} />}
            onClick={() => refetchStatus()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Memory</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Obsidian vault —{' '}
            <span className="text-green-vivid font-mono text-[10px]">{status.url}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-green-vivid font-mono bg-green-dim/20 px-2 py-1 rounded-full border border-green-dim/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-vivid animate-pulse inline-block" />
          connected
        </div>
      </div>

      {/* Search bar */}
      <div className="relative shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vault…"
          className="w-full bg-bg-surface border border-green-dim/30 rounded-lg pl-8 pr-4 py-2 text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-green-vivid/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setDebouncedQuery('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Main pane */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Sidebar: file tree or search results */}
        <div
          className="w-56 shrink-0 card-panel overflow-y-auto p-2"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-secondary px-2 pb-2 font-semibold">
            {isSearch ? 'Search Results' : 'Vault'}
          </p>
          {isSearch ? (
            <SearchResults query={debouncedQuery} onSelectNote={setSelectedNote} />
          ) : (
            <FileTree folder="" selectedNote={selectedNote} onSelectNote={setSelectedNote} />
          )}
        </div>

        {/* Note viewer */}
        <div
          className="flex-1 card-panel overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          {selectedNote ? (
            <NoteViewer path={selectedNote} onClose={() => setSelectedNote(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
              <FileText size={28} className="opacity-30" />
              <p className="text-xs">Select a note to read it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
