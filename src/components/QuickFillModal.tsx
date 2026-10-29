import { useState } from 'react'
import { fillAbsenceRange, fillRecurringAbsence } from '../lib/data'
import {
  REASON_EMOJI,
  REASON_LABELS,
  REASON_ORDER,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type AbsenceReason,
  type Member,
} from '../types'

interface QuickFillModalProps {
  member: Member
  onClose: () => void
}

type Mode = 'period' | 'recurring'

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Elke week' },
  { value: 2, label: 'Elke 2 weken' },
  { value: 3, label: 'Elke 3 weken' },
  { value: 4, label: 'Elke 4 weken' },
]

export function QuickFillModal({ member, onClose }: QuickFillModalProps) {
  const [mode, setMode] = useState<Mode>('period')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState<AbsenceReason>('verlof')
  const [weekday, setWeekday] = useState(1)
  const [intervalWeeks, setIntervalWeeks] = useState(2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = startDate.length > 0 && endDate.length > 0 && startDate <= endDate && !saving

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      if (mode === 'period') {
        await fillAbsenceRange(member, startDate, endDate, reason)
      } else {
        await fillRecurringAbsence(member, weekday, intervalWeeks, startDate, endDate, reason)
      }
      onClose()
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/30 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center px-6 py-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight">Periode invullen</h2>
          <button onClick={onClose} aria-label="Sluiten" className="text-[13px] text-muted hover:text-ink">
            Annuleren
          </button>
        </div>

        <div className="mb-5 flex gap-1.5 rounded-full bg-ink/[0.05] p-1">
          {(['period', 'recurring'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-1.5 text-[13px] font-medium transition-colors ${
                mode === m ? 'bg-surface text-ink shadow-soft' : 'text-muted'
              }`}
            >
              {m === 'period' ? 'Aaneengesloten' : 'Herhalend'}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {mode === 'recurring' && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted">Welke dag</label>
              <div className="flex gap-1.5">
                {WEEKDAY_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeekday(day)}
                    className={`flex h-10 flex-1 items-center justify-center rounded-xl text-[13px] font-medium transition-colors ${
                      weekday === day ? 'bg-accent text-white' : 'bg-ink/[0.06] text-muted'
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                ))}
              </div>
              <label className="mb-1.5 mt-4 block text-[13px] font-medium text-muted">Hoe vaak</label>
              <select
                value={intervalWeeks}
                onChange={(e) => setIntervalWeeks(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-muted">Van</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-[14px] outline-none ring-accent/30 focus:ring-2"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-muted">Tot en met</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-[14px] outline-none ring-accent/30 focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-muted">Reden</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AbsenceReason)}
              className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
            >
              {REASON_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REASON_EMOJI[r]} {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-muted">
            {mode === 'period'
              ? 'Markeert al je werkdagen in deze periode als niet beschikbaar — weekenden, feestdagen en je eigen vrije dagen worden overgeslagen.'
              : `Markeert ${WEEKDAY_LABELS[weekday]} ${intervalWeeks === 1 ? 'elke week' : `elke ${intervalWeeks} weken`} tussen deze data — handig voor een wisselend ritme (bv. "donderdag deze week, vrijdag volgende week" vul je in als twee losse herhalingen).`}
          </p>

          {error && <p className="text-[13px] text-unavailable">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Opslaan…' : 'Toepassen'}
        </button>
      </div>
      </div>
    </div>
  )
}
