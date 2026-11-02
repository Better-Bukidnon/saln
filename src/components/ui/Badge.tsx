import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'ph-blue' | 'ph-red' | 'ph-yellow' | 'gray' | 'verified' | 'unverified'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<BadgeVariant, string> = {
  'ph-blue': 'bg-primary-100 text-primary-800',
  'ph-red': 'bg-danger-100 text-danger-800',
  'ph-yellow': 'bg-accent-400 text-gray-900',
  gray: 'bg-gray-100 text-gray-800',
  verified: 'bg-green-100 text-green-900',
  unverified: 'border border-amber-500 bg-amber-100 text-amber-900',
}
const sizes: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function Badge({
  variant = 'gray',
  size = 'md',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; size?: Size }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
