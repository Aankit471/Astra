import { format, parseISO } from 'date-fns'

export function formatDateTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'dd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

export function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function formatTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'HH:mm')
  } catch {
    return '—'
  }
}

export function formatReferralId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}

export function formatInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function formatEmergencyCategory(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase()
}
