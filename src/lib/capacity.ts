import {
  DEFAULT_WORK_PATTERN,
  ROLE_ORDER,
  type AbsenceReason,
  type AvailabilityEntry,
  type Member,
  type MemberRole,
  type Sprint,
  type WorkPattern,
} from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function isAvailable(entry: AvailabilityEntry | undefined, date: string): boolean {
  return !entry?.unavailable?.[date]
}

export function absenceReason(entry: AvailabilityEntry | undefined, date: string): AbsenceReason | undefined {
  return entry?.unavailable?.[date]
}

function mondayOfWeek(dateIso: string): number {
  const ms = Date.parse(`${dateIso}T00:00:00Z`)
  const day = new Date(ms).getUTCDay() // 0=Sun…6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  return ms + diffToMonday * DAY_MS
}

function patternWeekIndex(pattern: WorkPattern, dateIso: string): number {
  const n = Object.keys(pattern.weeks).length
  if (n <= 1) return 0
  const weeksDiff = Math.round((mondayOfWeek(dateIso) - mondayOfWeek(pattern.anchorDate)) / (7 * DAY_MS))
  return ((weeksDiff % n) + n) % n
}

/** Hours this member works on this calendar date, per their (possibly alternating)
 *  work pattern — 0 if it's not a working day for them at all. */
export function hoursForDay(member: Member, date: string): number {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  if (weekday === 0 || weekday === 6) return 0
  const pattern = member.workPattern ?? DEFAULT_WORK_PATTERN
  const week = pattern.weeks[String(patternWeekIndex(pattern, date))] ?? []
  return week.find((d) => d.weekday === weekday)?.hours ?? 0
}

/** Whether this date falls on a day this member's work pattern has them working at all. */
export function isWorkingDay(member: Member, date: string): boolean {
  return hoursForDay(member, date) > 0
}

export function memberSprintHours(member: Member, entry: AvailabilityEntry | undefined, sprint: Sprint): number {
  return sprint.workingDays.reduce(
    (sum, d) => (isAvailable(entry, d) ? sum + hoursForDay(member, d) : sum),
    0,
  )
}

export function dayTeamHours(
  members: Member[],
  entries: Record<string, AvailabilityEntry>,
  date: string,
): number {
  return members.reduce(
    (sum, m) => (isAvailable(entries[m.uid], date) ? sum + hoursForDay(m, date) : sum),
    0,
  )
}

export function teamSprintHours(members: Member[], entries: Record<string, AvailabilityEntry>, sprint: Sprint): number {
  return members.reduce((sum, m) => sum + memberSprintHours(m, entries[m.uid], sprint), 0)
}

export function maxPossibleHours(members: Member[], sprint: Sprint): number {
  return members.reduce(
    (sum, m) => sum + sprint.workingDays.reduce((daySum, d) => daySum + hoursForDay(m, d), 0),
    0,
  )
}

export interface RoleHours {
  role: MemberRole
  hours: number
}

/** Sprint hours per role, in fixed ROLE_ORDER, skipping roles with no members. */
export function hoursByRole(
  members: Member[],
  entries: Record<string, AvailabilityEntry>,
  sprint: Sprint,
): RoleHours[] {
  const totals = new Map<MemberRole, number>()
  for (const m of members) {
    totals.set(m.role, (totals.get(m.role) ?? 0) + memberSprintHours(m, entries[m.uid], sprint))
  }
  return ROLE_ORDER.filter((role) => totals.has(role)).map((role) => ({ role, hours: totals.get(role)! }))
}

export type CapacityStatus = 'ok' | 'warning' | 'critical'

/** Below 40% of max capacity is critical, below 65% is a warning. */
export function capacityStatus(pct: number): CapacityStatus {
  if (pct < 40) return 'critical'
  if (pct < 65) return 'warning'
  return 'ok'
}
