import type { HTMLAttributes } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

const paddings: Record<Padding, string> = { none: '', sm: 'p-3 sm:p-4', md: 'p-4 sm:p-5', lg: 'p-5 sm:p-6' }

export function Card({
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; padding?: Padding }) {
  const hover = hoverable ? 'hover:border-gray-300 hover:bg-surface-alt hover:shadow-md motion-safe:hover:-translate-y-0.5' : ''
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ${hover} ${paddings[padding]} ${className}`}
      {...props}
    />
  )
}
