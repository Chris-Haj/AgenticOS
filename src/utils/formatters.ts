import { formatDistanceToNow, format } from 'date-fns'

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export function formatRelative(isoString: string): string {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true })
  } catch {
    return isoString
  }
}

export function formatTimestamp(isoString: string): string {
  try {
    return format(new Date(isoString), 'HH:mm:ss.SSS')
  } catch {
    return isoString
  }
}

export function formatDate(isoString: string): string {
  try {
    return format(new Date(isoString), 'MMM d, yyyy HH:mm')
  } catch {
    return isoString
  }
}
