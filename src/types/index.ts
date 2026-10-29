export interface Team {
  id: string
  name: string
  order: number
}

export type MemberRole =
  | 'developer'
  | 'tester'
  | 'qa'
  | 'designer'
  | 'po'
  | 'sm'
  | 'ba'
  | 'pdm'
  | 'mo'
  | 'architect'

/** Fixed display/legend order — also the categorical color order (see index.css). */
export const ROLE_ORDER: MemberRole[] = [
  'developer',
  'tester',
  'designer',
  'po',
  'sm',
  'ba',
  'pdm',
  'mo',
  'architect',
  'qa',
]

export const ROLE_LABELS: Record<MemberRole, string> = {
  developer: 'Developer',
  tester: 'Tester',
  designer: 'Designer',
  po: 'PO',
  sm: 'SM',
  ba: 'BA',
  pdm: 'PDM',
  mo: 'MO',
  architect: 'Architect',
  qa: 'QA',
}

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5] as const

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Ma',
  2: 'Di',
  3: 'Wo',
  4: 'Do',
  5: 'Vr',
}

/** One weekday (1=ma…5=vr) worked within a pattern week, and how many hours that day. */
export interface WorkPatternDay {
  weekday: number
  hours: number
}

/** A recurring schedule of 1–4 alternating weeks (cycle length 1 = the same every week).
 *  `anchorDate` is any date that falls in "week 1" of the cycle — used to work out which
 *  pattern week applies to an arbitrary calendar date (irrelevant when there's only 1 week).
 *  `weeks` is keyed by week index as a string ("0", "1", …) rather than a plain array,
 *  because Firestore rejects an array nested directly inside another array. */
export interface WorkPattern {
  anchorDate: string
  weeks: Record<string, WorkPatternDay[]>
}

export const DEFAULT_DAY_HOURS = 8

/** Fulltime, every week the same: Mon–Fri, 8h/day. */
export const DEFAULT_WORK_PATTERN: WorkPattern = {
  anchorDate: '2026-01-05',
  weeks: { '0': WEEKDAY_ORDER.map((weekday) => ({ weekday, hours: DEFAULT_DAY_HOURS })) },
}

export interface Member {
  uid: string
  name: string
  email: string
  /** Someone can be in more than one team (e.g. PO/SM/BA/PDM/MO/Architect); one shared
   *  calendar covers all of them, hours are not split between teams. */
  teamIds: string[]
  /** Recurring working days + hours/day, possibly alternating over a 1–4 week cycle
   *  (e.g. "ma/di/wo 4u" one week, "di/wo/do 4u" the next). Falls back to
   *  DEFAULT_WORK_PATTERN if missing (older accounts predate this field). */
  workPattern: WorkPattern
  /** Self-selected at onboarding; can be corrected later by the member or an admin. */
  role: MemberRole
  /** Full access everywhere. Always false on self-service create/update — only settable
   *  via the Firestore console or an admin script (never through the app's own UI). */
  isAdmin: boolean
}

export function canViewCluster(member: Pick<Member, 'role' | 'isAdmin'> | null | undefined): boolean {
  return member?.role === 'po' || member?.role === 'sm' || member?.isAdmin === true
}

/** Whether `viewer` may edit `targetUid`'s profile or availability. */
export function canEditMember(viewer: Pick<Member, 'uid' | 'isAdmin'> | null | undefined, targetUid: string): boolean {
  return viewer?.uid === targetUid || viewer?.isAdmin === true
}

export type AbsenceReason = 'verlof' | 'ziek' | 'opleiding'

/** Cycle order for the grid: click steps through these, then back to available. */
export const REASON_ORDER: AbsenceReason[] = ['verlof', 'ziek', 'opleiding']

export const REASON_LABELS: Record<AbsenceReason, string> = {
  verlof: 'Verlof',
  ziek: 'Ziek',
  opleiding: 'Opleiding',
}

/** One-letter direct label shown in the grid cell (identity by text, not color alone). */
export const REASON_LETTERS: Record<AbsenceReason, string> = {
  verlof: 'V',
  ziek: 'Z',
  opleiding: 'O',
}

/** Emoji shown in the grid cell instead of the letter — still paired with REASON_LABELS
 *  in the title/aria-label so the reason is never emoji-only. */
export const REASON_EMOJI: Record<AbsenceReason, string> = {
  verlof: '🏖️',
  ziek: '🤒',
  opleiding: '🎓',
}

/** Firestore doc at availability/{sprintNumber}/entries/{uid} — one shared calendar per
 *  person, independent of which team(s) they're in. */
export interface AvailabilityEntry {
  /** ISO date (YYYY-MM-DD) -> reason, for each day within the sprint this person is NOT available */
  unavailable: Record<string, AbsenceReason>
}

export interface Sprint {
  number: number
  /** ISO date, inclusive */
  startDate: string
  /** ISO date, inclusive */
  endDate: string
  /** Working days (Mon-Fri, excl. holidays) within the sprint, ISO dates — used for capacity math. */
  workingDays: string[]
  /** All days shown in the grid (incl. weekends, excl. holidays), ISO dates. */
  displayDays: string[]
}
