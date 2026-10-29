import { absenceReason, dayTeamHours, hoursForDay, isAvailable, isWorkingDay } from './capacity'
import { isWeekendDate } from './sprints'
import type { AbsenceReason, AvailabilityEntry, Member, MemberRole, Sprint } from '../types'

export interface AbsenceSpan {
  member: Member
  reason: AbsenceReason
  /** Consecutive working-day dates (weekends/non-working days bridge the span, not shown in it). */
  dates: string[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function addDaysIso(iso: string, days: number): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** The next `count` calendar days starting today (inclusive), raw ISO dates — not sprint-bound. */
export function nextCalendarDays(count: number, from: string = todayIso()): string[] {
  return Array.from({ length: count }, (_, i) => addDaysIso(from, i))
}

/** Per member, merge consecutive (working-day) absences with the same reason into one span. */
export function buildAbsenceSpans(
  members: Member[],
  entries: Record<string, AvailabilityEntry>,
  calendarDates: string[],
): AbsenceSpan[] {
  const spans: AbsenceSpan[] = []
  for (const member of members) {
    const entry = entries[member.uid]
    let current: AbsenceSpan | null = null
    for (const date of calendarDates) {
      if (isWeekendDate(date) || !isWorkingDay(member, date)) continue // bridges the span, doesn't break it
      const reason = absenceReason(entry, date)
      if (reason && current && current.reason === reason) {
        current.dates.push(date)
      } else if (reason) {
        current = { member, reason, dates: [date] }
        spans.push(current)
      } else {
        current = null
      }
    }
  }
  return spans.sort((a, b) => a.dates[0].localeCompare(b.dates[0]))
}

export interface DayCapacity {
  date: string
  hours: number
  maxHours: number
  pct: number
}

/** The working day with the lowest capacity %, within the given sprint's working days. */
export function lowestCapacityDay(members: Member[], entries: Record<string, AvailabilityEntry>, sprint: Sprint): DayCapacity | null {
  let worst: DayCapacity | null = null
  for (const date of sprint.workingDays) {
    const maxHours = members.reduce((sum, m) => sum + hoursForDay(m, date), 0)
    const hours = dayTeamHours(members, entries, date)
    const pct = maxHours > 0 ? Math.round((hours / maxHours) * 100) : 100
    if (!worst || pct < worst.pct) worst = { date, hours, maxHours, pct }
  }
  return worst
}

export interface RoleCoverageGap {
  date: string
  role: MemberRole
}

/** Working days where a role present on the team has zero available people. */
export function roleCoverageGaps(
  members: Member[],
  entries: Record<string, AvailabilityEntry>,
  sprint: Sprint,
): RoleCoverageGap[] {
  const roles = [...new Set(members.map((m) => m.role))]
  const gaps: RoleCoverageGap[] = []
  for (const date of sprint.workingDays) {
    for (const role of roles) {
      const roleMembers = members.filter((m) => m.role === role)
      const anyWorking = roleMembers.some((m) => isWorkingDay(m, date))
      if (!anyWorking) continue
      const availableCount = roleMembers.filter((m) => isWorkingDay(m, date) && isAvailable(entries[m.uid], date)).length
      if (availableCount === 0) gaps.push({ date, role })
    }
  }
  return gaps
}
