import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex min-h-11 items-center justify-center rounded-lg font-medium tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'
const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white shadow-sm hover:bg-primary-700 hover:shadow-md',
  ghost: 'border border-gray-400 bg-white text-gray-800 hover:bg-surface-alt',
}
const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

type Common = { variant?: Variant; size?: Size }
type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type LinkProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

// Renders an <a> when given an href, so links can look like buttons without losing link semantics.
export function Button(props: ButtonProps | LinkProps) {
  const { variant = 'primary', size = 'md', className = '', ...rest } = props
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  if (typeof rest.href === 'string') {
    return <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={cls} />
  }
  return <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={cls} />
}
