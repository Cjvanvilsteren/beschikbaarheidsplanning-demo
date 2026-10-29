import { REASON_EMOJI, REASON_LABELS, type AbsenceReason } from '../types'

interface DayCellProps {
  date: string
  weekend: boolean
  /** Whether this is a working day for this person (their part-time pattern); irrelevant if weekend. */
  working: boolean
  available: boolean
  reason: AbsenceReason | undefined
  clickable: boolean
  onMouseDown: () => void
  onMouseEnter: () => void
}

/** A single day's availability toggle — shared by the full team grid and the standalone "your availability" bar. */
export function DayCell({ date, weekend, working, available, reason, clickable, onMouseDown, onMouseEnter }: DayCellProps) {
  if (weekend) {
    return (
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.03] text-[12px] text-muted/40">
        ·
      </div>
    )
  }
  return (
    <button
      onMouseDown={(e) => {
        if (!clickable) return
        e.preventDefault()
        onMouseDown()
      }}
      onMouseEnter={onMouseEnter}
      disabled={!clickable}
      title={!working ? 'Geen werkdag' : available ? 'Beschikbaar' : REASON_LABELS[reason!]}
      aria-label={`${date}: ${!working ? 'geen werkdag' : available ? 'beschikbaar' : REASON_LABELS[reason!]}`}
      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-all ${
        !working
          ? 'bg-ink/[0.04] text-muted'
          : available
            ? 'bg-available-soft text-available'
            : 'bg-unavailable-soft text-unavailable'
      } ${clickable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default opacity-70'}`}
    >
      {!working ? '·' : available ? '✓' : REASON_EMOJI[reason!]}
    </button>
  )
}
