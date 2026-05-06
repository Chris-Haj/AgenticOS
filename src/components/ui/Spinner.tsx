import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-3 h-3 border', md: 'w-4 h-4 border-2', lg: 'w-6 h-6 border-2' }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-green-vivid border-t-transparent animate-spin',
        sizes[size],
        className,
      )}
    />
  )
}
