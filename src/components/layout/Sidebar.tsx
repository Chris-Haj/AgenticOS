import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAgentStore } from '@/store/agentStore'
import { cn } from '@/utils/cn'

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  path: '/',        icon: LayoutDashboard },
  { id: 'agents',    label: 'Agents',     path: '/agents',  icon: Bot },
  { id: 'memory',    label: 'Memory',     path: '/memory',  icon: BookOpen },
  { id: 'settings',  label: 'Settings',   path: '/settings',icon: Settings },
] as const

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const { agents } = useAgentStore()

  const runningCount = Object.values(agents).filter((a) => a.status === 'running').length
  const errorCount   = Object.values(agents).filter((a) => a.status === 'error').length

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-bg-surface border-r border-green-dim/40',
        'transition-all duration-200 ease-in-out shrink-0',
        sidebarOpen ? 'w-52' : 'w-14',
      )}
    >
      {/* Logo / brand */}
      <div
        className={cn(
          'flex items-center border-b border-green-dim/30 h-14 shrink-0',
          sidebarOpen ? 'px-4 gap-3' : 'justify-center',
        )}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1e4d2b, #22c55e)',
            boxShadow: '0 0 12px rgba(34,197,94,0.3)',
          }}
        >
          <Zap size={14} className="text-bg-base" />
        </div>
        {sidebarOpen && (
          <div>
            <p className="text-sm font-bold text-text-primary tracking-tight">AgentOS</p>
            <p className="text-xs text-text-dim font-mono">v0.1.0-dev</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map(({ id, label, path, icon: Icon }) => (
          <NavLink
            key={id}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active', !sidebarOpen && 'justify-center px-0')
            }
          >
            <div className="relative shrink-0">
              <Icon size={16} />
              {/* Agent count bubble on Agents nav item */}
              {id === 'agents' && runningCount > 0 && !sidebarOpen && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-vivid"
                  style={{ boxShadow: '0 0 6px rgba(34,197,94,0.7)' }}
                />
              )}
              {id === 'agents' && errorCount > 0 && !sidebarOpen && runningCount === 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400" />
              )}
            </div>
            {sidebarOpen && (
              <span className="flex-1">{label}</span>
            )}
            {sidebarOpen && id === 'agents' && runningCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-green-dim/40 text-green-vivid">
                {runningCount}
              </span>
            )}
            {sidebarOpen && id === 'agents' && errorCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-red-900/40 text-red-400">
                {errorCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <div className="p-2 border-t border-green-dim/30 shrink-0">
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center justify-center p-2 rounded text-text-dim',
            'hover:text-text-primary hover:bg-bg-muted transition-colors',
          )}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </aside>
  )
}
