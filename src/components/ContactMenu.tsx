import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import portalConfig from '../../portal.config'
import { useT } from '../lib/i18n'

const email = portalConfig.volunteerEmail
const enc = encodeURIComponent(email)

// A web page cannot list the mail apps installed on a device, and a bare mailto: does nothing when none is
// registered. So "contact" opens a small menu: the default mail app (mailto:), the common web mail
// services, and a copy-address fallback that always works.
const WEBMAIL = [
  { name: 'Gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc}` },
  { name: 'Outlook', href: `https://outlook.live.com/mail/0/deeplink/compose?to=${enc}` },
  { name: 'Yahoo Mail', href: `https://compose.mail.yahoo.com/?to=${enc}` },
] as const

const item =
  'flex min-h-11 w-full items-center rounded-full px-4 text-left type-control font-medium text-ink transition-colors hover:bg-primary-50 focus-visible:bg-primary-50'

export default function ContactMenu({
  className,
  ariaLabel,
  openUp = false,
  align = 'left',
  children,
}: {
  className: string
  ariaLabel?: string
  openUp?: boolean
  align?: 'left' | 'right'
  children: ReactNode
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    wrapRef.current?.querySelector<HTMLElement>('[data-contact-item]')?.focus()
    return () => document.removeEventListener('click', onClick)
  }, [open])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Clipboard blocked (insecure context, permissions): select the visible address instead.
      const el = wrapRef.current?.querySelector('[data-contact-address]')
      if (el) window.getSelection()?.selectAllChildren(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      toggleRef.current?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...(wrapRef.current?.querySelectorAll<HTMLElement>('[data-contact-item]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    e.preventDefault()
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full lg:w-auto"
      onKeyDown={onKey}
      onBlur={(e) => {
        if (open && !wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        {children}
      </button>
      <div
        id={menuId}
        hidden={!open}
        role="group"
        aria-label={t('contactMenuLabel')}
        className={`absolute z-[1001] min-w-[14rem] max-w-[calc(100vw-1.5rem)] rounded-lg border border-gray-200 bg-white p-2 text-left shadow-lg ${align === 'right' ? 'right-0' : 'left-0'} ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
      >
        <a data-contact-item className={item} href={`mailto:${email}`} onClick={() => setOpen(false)}>
          {t('contactDefault')}
        </a>
        {WEBMAIL.map((m) => (
          <a key={m.name} data-contact-item className={item} href={m.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            {m.name}
          </a>
        ))}
        <button type="button" data-contact-item className={item} onClick={copy}>
          {copied ? t('contactCopied') : t('contactCopy')}
        </button>
        <p className="px-4 pb-1 pt-2 type-body-sm text-gray-700">
          <span data-contact-address className="select-all font-bold">{email}</span>
        </p>
        <span role="status" className="sr-only">{copied ? t('contactCopied') : ''}</span>
      </div>
    </div>
  )
}
