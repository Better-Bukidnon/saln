import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'primary' | 'accent' | 'danger' | 'gray' | 'verified' | 'unverified'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-800',
  danger: 'bg-danger-100 text-danger-800',
  accent: 'bg-accent-500 text-gray-900',
  gray: 'bg-gray-100 text-gray-800',
  verified: 'bg-green-100 text-green-900',
  unverified: 'border border-dashed border-amber-700 bg-amber-100 text-amber-900',
}
const sizes: Record<Size, string> = {
  sm: 'px-2 py-0.5 type-badge',
  md: 'px-2.5 py-1 type-badge-lg',
  lg: 'px-3 py-1.5 type-badge-lg',
}

export function Badge({
  variant = 'gray',
  size = 'md',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; size?: Size }) {
  return (
    <span
      className={`inline-flex items-center rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
