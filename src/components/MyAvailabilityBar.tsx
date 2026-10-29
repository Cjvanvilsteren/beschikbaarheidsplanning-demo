import { useState } from 'react'
import { DayCell } from './DayCell'
import { QuickFillModal } from './QuickFillModal'
import { absenceReason, isAvailable, isWorkingDay, memberSprintHours } from '../lib/capacity'
import { setAvailability } from '../lib/data'
import { formatShortDayLabel, isWeekendDate } from '../lib/sprints'
import { REASON_EMOJI, REASON_LABELS, REASON_ORDER, type AvailabilityEntry, type Member, type Sprint } from '../types'

interface MyAvailabilityBarProps {
  sprint: Sprint
  member: Member
  entry: AvailabilityEntry | undefined
  onMouseDown: (dayIndex: number, date: string) => void
  onMouseEnter: (dayIndex: number) => void
}

/** A standalone, always-visible card for your own availability — so you don't have to
 *  find yourself in a long team roster just to fill in your days. */
export function MyAvailabilityBar({ sprint, member, entry, onMouseDown, onMouseEnter }: MyAvailabilityBarProps) {
  const hours = memberSprintHours(member, entry, sprint)
  const [quickFillOpen, setQuickFillOpen] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      await setAvailability(sprint.number, member.uid, {})
      setConfirmingReset(false)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-accent/50 bg-surface p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {confirmingReset ? (
          <span className="flex items-center gap-1.5 text-[12px]">
            <span className="text-muted">Sprint {sprint.number} wissen?</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="rounded-full bg-unavailable/10 px-2.5 py-1 font-medium text-unavailable transition-colors hover:bg-unavailable/20 disabled:opacity-50"
            >
              {resetting ? 'Bezig…' : 'Ja, wissen'}
            </button>
            <button
              onClick={() => setConfirmingReset(false)}
              className="rounded-full px-2.5 py-1 font-medium text-muted hover:text-ink"
            >
              Annuleren
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            title="Alle dagen van deze sprint weer op beschikbaar zetten"
            className="rounded-full bg-ink/[0.06] px-3 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-ink/[0.1] hover:text-ink"
          >
            🧹 Je sprint beschikbaarheid resetten
          </button>
        )}
        <span className="text-[13px] font-semibold tabular-nums text-ink">{hours}u deze sprint</span>
      </div>

      <p className="mb-3 text-[11px] font-medium text-muted">
        {REASON_ORDER.map((r) => `${REASON_EMOJI[r]} ${REASON_LABELS[r]}`).join('   ')}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {sprint.displayDays.map((date) => {
          const weekend = isWeekendDate(date)
          const working = !weekend && isWorkingDay(member, date)
          const available = isAvailable(entry, date)
          const reason = absenceReason(entry, date)
          const dayIndex = sprint.workingDays.indexOf(date)
          return (
            <div key={date} className="flex w-9 flex-col items-center gap-1.5">
              <span
                className={`whitespace-nowrap text-[10.5px] font-semibold ${weekend ? 'text-muted/50' : 'text-ink'}`}
              >
                {formatShortDayLabel(date)}
              </span>
              <DayCell
                date={date}
                weekend={weekend}
                working={working}
                available={available}
                reason={reason}
                clickable={!weekend && working}
                onMouseDown={() => onMouseDown(dayIndex, date)}
                onMouseEnter={() => onMouseEnter(dayIndex)}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-xl bg-accent/[0.06] p-4">
        <p className="mb-2.5 text-[13px] leading-relaxed text-ink">
          Wil je gelijk een bepaalde periode je ziekmelden, vakantie plannen of opleiding
          registreren? Dan kan dat via de onderstaande knop:
        </p>
        <button
          onClick={() => setQuickFillOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
        >
          <span aria-hidden>📅</span> Periode invullen
        </button>
      </div>

      {quickFillOpen && <QuickFillModal member={member} onClose={() => setQuickFillOpen(false)} />}
    </div>
  )
}
