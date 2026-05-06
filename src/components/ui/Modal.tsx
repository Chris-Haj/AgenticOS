import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(8,13,10,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'w-full rounded-lg card-panel animate-slide-up',
          'border border-green-dim/60',
          sizes[size],
        )}
        style={{ boxShadow: '0 0 0 1px rgba(34,197,94,0.12), 0 24px 48px rgba(0,0,0,0.8), 0 0 80px rgba(34,197,94,0.05)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-dim/40">
          <h2
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: '#dff0e8', letterSpacing: '0.1em' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-muted"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-green-dim/40 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
