import type { HTMLAttributes } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

const paddings: Record<Padding, string> = { none: '', sm: 'p-4', md: 'p-4 sm:p-6', lg: 'p-6 sm:p-8' }

export function Card({
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; padding?: Padding }) {
  const hover = hoverable ? 'hover:shadow-xl motion-safe:hover:scale-[1.02]' : ''
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-200 ${hover} ${paddings[padding]} ${className}`}
      {...props}
    />
  )
}
