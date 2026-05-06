import { cn } from '@/utils/cn'

type BadgeColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'

interface BadgeProps {
  label: string
  color?: BadgeColor
  dot?: boolean
  className?: string
}

const colors: Record<BadgeColor, string> = {
  green:  'bg-green-900/30 text-green-vivid border-green-700/30',
  yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  red:    'bg-red-900/30 text-red-400 border-red-700/30',
  gray:   'bg-gray-900/30 text-gray-400 border-gray-700/30',
  blue:   'bg-blue-900/30 text-blue-400 border-blue-700/30',
  orange: 'bg-orange-900/30 text-orange-400 border-orange-700/30',
}

const dotColors: Record<BadgeColor, string> = {
  green:  'bg-green-vivid',
  yellow: 'bg-yellow-300',
  red:    'bg-red-400',
  gray:   'bg-gray-400',
  blue:   'bg-blue-400',
  orange: 'bg-orange-400',
}

export function Badge({ label, color = 'gray', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border',
        colors[color],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[color])} />}
      {label}
    </span>
  )
}
