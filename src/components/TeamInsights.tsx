import { useEffect, useMemo, useState } from 'react'
import { listenAvailabilityForMembers } from '../lib/data'
import {
  buildAbsenceSpans,
  lowestCapacityDay,
  nextCalendarDays,
  roleCoverageGaps,
  todayIso,
  type AbsenceSpan,
} from '../lib/insights'
import { capacityStatus } from '../lib/capacity'
import { formatShortDayLabel, getAdjacentSprint, getSprintForDate, isWeekendDate } from '../lib/sprints'
import { REASON_EMOJI, REASON_LABELS, ROLE_LABELS, type AvailabilityEntry, type Member, type Sprint } from '../types'

interface TeamInsightsProps {
  members: Member[]
  /** The sprint currently being browsed — used for the capacity/role-coverage insights. */
  browsedSprint: Sprint
  browsedEntries: Record<string, AvailabilityEntry>
}

function formatSpanRange(dates: string[]): string {
  if (dates.length === 1) return formatShortDayLabel(dates[0])
  return `${formatShortDayLabel(dates[0])} – ${formatShortDayLabel(dates[dates.length - 1])}`
}

const STATUS_DOT: Record<'ok' | 'warning' | 'critical', string> = {
  ok: 'var(--color-available)',
  warning: 'var(--color-status-warning)',
  critical: 'var(--color-status-critical)',
}

export function TeamInsights({ members, browsedSprint, browsedEntries }: TeamInsightsProps) {
  const today = useMemo(() => getSprintForDate(), [])
  const nextReal = useMemo(() => getAdjacentSprint(today, 1), [today])
  const [todayEntries, setTodayEntries] = useState<Record<string, AvailabilityEntry>>({})
  const [nextEntries, setNextEntries] = useState<Record<string, AvailabilityEntry>>({})
  const uids = useMemo(() => members.map((m) => m.uid), [members])
  const uidsKey = uids.join(',')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(today.number, uids, setTodayEntries), [today.number, uidsKey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(nextReal.number, uids, setNextEntries), [nextReal.number, uidsKey])

  const mergedEntries = useMemo(() => {
    const merged: Record<string, AvailabilityEntry> = {}
    for (const uid of uids) {
      merged[uid] = {
        unavailable: { ...todayEntries[uid]?.unavailable, ...nextEntries[uid]?.unavailable },
      }
    }
    return merged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntries, nextEntries, uidsKey])

  const window7 = useMemo(() => nextCalendarDays(7), [])
  const spans = useMemo(() => buildAbsenceSpans(members, mergedEntries, window7), [members, mergedEntries, window7])
  const todayStr = todayIso()
  const absentToday: AbsenceSpan[] = spans.filter((s) => s.dates.includes(todayStr))
  const upcoming = spans.filter((s) => !s.dates.includes(todayStr) || s.dates.length > 1)

  const worstDay = useMemo(() => lowestCapacityDay(members, browsedEntries, browsedSprint), [members, browsedEntries, browsedSprint])
  const gaps = useMemo(() => roleCoverageGaps(members, browsedEntries, browsedSprint), [members, browsedEntries, browsedSprint])

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Vandaag afwezig</h3>
        {isWeekendDate(todayStr) ? (
          <p className="text-[12px] text-muted">Het is weekend.</p>
        ) : absentToday.length === 0 ? (
          <p className="text-[12px] text-muted">Niemand — iedereen is er vandaag.</p>
        ) : (
          <ul className="space-y-1.5">
            {absentToday.map((s) => (
              <li key={s.member.uid} className="flex items-center gap-2 text-[13px]">
                <span>{REASON_EMOJI[s.reason]}</span>
                <span className="font-medium">{s.member.name}</span>
                <span className="text-[11px] text-muted">{REASON_LABELS[s.reason]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Komende 7 dagen</h3>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-muted">Geen geplande afwezigheid.</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.slice(0, 6).map((s) => (
              <li key={`${s.member.uid}-${s.dates[0]}`} className="flex items-center gap-2 text-[13px]">
                <span>{REASON_EMOJI[s.reason]}</span>
                <span className="font-medium">{s.member.name}</span>
                <span className="text-[11px] text-muted">{formatSpanRange(s.dates)}</span>
              </li>
            ))}
            {upcoming.length > 6 && <li className="text-[11px] text-muted">+{upcoming.length - 6} meer</li>}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Laagste bezetting deze sprint</h3>
        {!worstDay ? (
          <p className="text-[12px] text-muted">Geen werkdagen in deze sprint.</p>
        ) : (
          <div className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_DOT[capacityStatus(worstDay.pct)] }}
              aria-hidden
            />
            <span className="font-medium">{formatShortDayLabel(worstDay.date)}</span>
            <span className="tabular-nums text-muted">
              {worstDay.hours}u / {worstDay.maxHours}u ({worstDay.pct}%)
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Roldekking</h3>
        {gaps.length === 0 ? (
          <p className="text-[12px] text-muted">Geen gaten — elke rol heeft elke werkdag iemand beschikbaar.</p>
        ) : (
          <ul className="space-y-1.5">
            {gaps.slice(0, 3).map((g) => (
              <li key={`${g.date}-${g.role}`} className="text-[13px]">
                <span className="font-medium">{formatShortDayLabel(g.date)}</span>{' '}
                <span className="text-muted">— geen {ROLE_LABELS[g.role]} beschikbaar</span>
              </li>
            ))}
            {gaps.length > 3 && <li className="text-[11px] text-muted">+{gaps.length - 3} meer</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
