import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names safely, resolving conflicts.
 * Use this instead of bare `clsx` for all component className props.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
