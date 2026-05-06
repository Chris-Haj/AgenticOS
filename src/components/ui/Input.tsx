import { cn } from '@/utils/cn'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

function FieldWrapper({
  label,
  error,
  hint,
  children,
}: {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-text-dim">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input
        className={cn(
          'input-base',
          error && 'border-red-500/60 focus:border-red-500',
          className,
        )}
        {...props}
      />
    </FieldWrapper>
  )
}

export function Textarea({ label, error, hint, className, ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea
        className={cn(
          'input-base resize-none min-h-[80px]',
          error && 'border-red-500/60 focus:border-red-500',
          className,
        )}
        {...props}
      />
    </FieldWrapper>
  )
}
