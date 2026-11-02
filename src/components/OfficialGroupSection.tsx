import { useId, useState } from 'react'
import { nodeByCode } from '../lib/geo'
import { useT } from '../lib/i18n'
import type { OfficialGroup } from '../lib/group'
import type { Geo, SalnRecord } from '../lib/types'
import OfficialCard from './OfficialCard'
import { Badge } from './ui/Badge'

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 text-gray-700 transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 4 6 6-6 6" />
    </svg>
  )
}

// One collapsible row: full-width bordered button (chevron, bold title, count pill) that
// reveals the cards. The parent re-keys it when its default state changes (filters).
export default function OfficialGroupSection({
  group,
  geo,
  salnByPerson,
  defaultOpen,
  description,
}: {
  group: OfficialGroup
  geo: Geo
  salnByPerson: Map<string, SalnRecord[]>
  defaultOpen: boolean
  /** One-line level description, shown under the row title when this row is the whole level. */
  description?: string
}) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const descId = useId()
  const lguName = group.code ? (nodeByCode(geo, group.code)?.name ?? '') : ''
  const title =
    group.kind === 'provincial'
      ? t('groupProvincial')
      : group.kind === 'sp'
        ? t('groupSp')
        : group.kind === 'house'
          ? t('groupHouse')
          : group.kind === 'lgu'
            ? lguName
            : t('groupBarangays', { lgu: lguName })
  const n = group.officials.length
  return (
    <li data-testid="group" data-group={group.key}>
      <div className={`rounded-xl border border-gray-200 bg-white shadow-sm`}>
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-describedby={description ? descId : undefined}
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-gray-50 sm:gap-4 sm:px-5"
          >
            <Chevron open={open} />
            <span className="min-w-0 flex-1 text-base font-bold leading-6 text-gray-900 sm:text-lg sm:leading-7">{title}</span>
            <Badge variant="primary" size="md" className="shrink-0">
              {n === 1 ? t('groupCount.one') : t('groupCount.other', { n })}
            </Badge>
          </button>
        </h3>
        {description && (
          <p id={descId} className="-mt-1 px-4 pb-3 pl-12 text-sm text-gray-700 sm:pl-14">
            {description}
          </p>
        )}
        {open && (
          <div id={panelId} className="border-t border-gray-200 p-3 sm:p-4">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {group.officials.map((o) => (
                <OfficialCard key={o.id} official={o} saln={salnByPerson.get(o.personId)} geo={geo} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  )
}
