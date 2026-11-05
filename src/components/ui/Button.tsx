import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex min-h-11 items-center justify-center rounded-full type-button-pill transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'
const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white shadow-sm hover:scale-[1.02] hover:bg-primary-700 hover:shadow-md motion-reduce:hover:scale-100',
  ghost: 'border border-gray-500 bg-white text-gray-800 hover:border-gray-900 hover:bg-surface-alt',
}
const sizes: Record<Size, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-2.5',
  lg: 'px-8 py-3',
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
