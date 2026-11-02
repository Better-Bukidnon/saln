import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LANGS, LANG_NAMES, useLang, useT } from '../lib/i18n'
import type { Lang } from '../lib/i18n'

const CODES: Record<Lang, string> = { en: 'EN', fil: 'FIL', ceb: 'CEB' }

const icon = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

// One globe button that opens a list of languages (same pattern as the BetterBukidnon main site).
export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const t = useT()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listId = useId()

  useEffect(() => {
    if (!open) return
    optionRefs.current[LANGS.indexOf(lang)]?.focus()
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open, lang])

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) toggleRef.current?.focus()
  }

  const focusOption = (i: number) => optionRefs.current[(i + LANGS.length) % LANGS.length]?.focus()

  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = optionRefs.current.findIndex((o) => o === document.activeElement)
    if (e.key === 'ArrowDown') focusOption(i + 1)
    else if (e.key === 'ArrowUp') focusOption(i - 1)
    else if (e.key === 'Home') focusOption(0)
    else if (e.key === 'End') focusOption(LANGS.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div
      className="relative"
      ref={menuRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          close(true)
        }
      }}
      onBlur={(e) => {
        if (open && !menuRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={toggleRef}
        id="lang-toggle"
        type="button"
        aria-label={t('language')}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary-400 bg-primary-50 px-3.5 type-label font-bold text-primary-500 transition-colors hover:bg-primary-100"
      >
        <svg {...icon}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        <span>{CODES[lang]}</span>
        <svg {...icon} width={12} height={12} className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        id={listId}
        hidden={!open}
        role="group"
        aria-label={t('language')}
        onKeyDown={onListKey}
        className="absolute right-0 top-[calc(100%+0.5rem)] z-[1001] min-w-[13.5rem] max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.06)]"
      >
        {LANGS.map((l, i) => (
          <button
            key={l}
            ref={(el) => {
              optionRefs.current[i] = el
            }}
            type="button"
            lang={l}
            aria-pressed={l === lang}
            onClick={() => {
              setLang(l)
              close(true)
            }}
            className={`flex min-h-12 w-full items-center gap-4 whitespace-nowrap rounded-lg px-4 text-left type-control hover:bg-primary-50 ${l === lang ? 'font-bold text-primary-500' : 'font-medium text-ink'}`}
          >
            <svg {...icon} className={l === lang ? '' : 'invisible'}>
              <path d="m5 12 5 5 9-10" />
            </svg>
            {LANG_NAMES[l]}
          </button>
        ))}
      </div>
    </div>
  )
}
