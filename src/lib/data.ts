import {
  collection,
  doc,
  documentId,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { isWorkingDay } from './capacity'
import { datesMatchingWeeklyPattern, getAdjacentSprint, getSprintForDate } from './sprints'
import type { AbsenceReason, AvailabilityEntry, Member, Team } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function listenTeams(onChange: (teams: Team[]) => void) {
  const q = query(collection(db, 'teams'), orderBy('order'))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, 'id'>) })))
  })
}

export function listenTeam(teamId: string, onChange: (team: Team | null) => void) {
  return onSnapshot(doc(db, 'teams', teamId), (snap) => {
    onChange(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Team, 'id'>) } : null)
  })
}

export function listenMembers(teamId: string, onChange: (members: Member[]) => void) {
  const q = query(collection(db, 'members'), where('teamIds', 'array-contains', teamId))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data() as Member))
  })
}

/** Everyone in the cluster, independent of team. */
export function listenAllMembers(onChange: (members: Member[]) => void) {
  return onSnapshot(collection(db, 'members'), (snap) => {
    onChange(snap.docs.map((d) => d.data() as Member))
  })
}

export async function getMember(uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'members', uid))
  return snap.exists() ? (snap.data() as Member) : null
}

export function listenMember(uid: string, onChange: (member: Member | null) => void) {
  return onSnapshot(doc(db, 'members', uid), (snap) => {
    onChange(snap.exists() ? (snap.data() as Member) : null)
  })
}

export async function createMemberProfile(member: Member) {
  await setDoc(doc(db, 'members', member.uid), member)
}

/** Admin edit of someone else's profile — leaves `uid`, `email` and `isAdmin` untouched. */
export async function updateMemberProfile(
  uid: string,
  values: Pick<Member, 'name' | 'teamIds' | 'role' | 'workPattern'>,
) {
  await setDoc(doc(db, 'members', uid), values, { merge: true })
}

function entriesCollection(sprintNumber: number) {
  return collection(db, 'availability', String(sprintNumber), 'entries')
}

const FIRESTORE_IN_LIMIT = 30

/** One shared calendar per person — fetched by uid, independent of team. Chunks past
 *  Firestore's 30-value `in` limit and merges the results. */
export function listenAvailabilityForMembers(
  sprintNumber: number,
  uids: string[],
  onChange: (entries: Record<string, AvailabilityEntry>) => void,
) {
  if (uids.length === 0) {
    onChange({})
    return () => {}
  }
  const chunks: string[][] = []
  for (let i = 0; i < uids.length; i += FIRESTORE_IN_LIMIT) chunks.push(uids.slice(i, i + FIRESTORE_IN_LIMIT))

  const byChunk: Record<string, AvailabilityEntry>[] = chunks.map(() => ({}))
  const unsubs = chunks.map((chunk, i) => {
    const q = query(entriesCollection(sprintNumber), where(documentId(), 'in', chunk))
    return onSnapshot(q, (snap) => {
      const byUid: Record<string, AvailabilityEntry> = {}
      for (const d of snap.docs) byUid[d.id] = d.data() as AvailabilityEntry
      byChunk[i] = byUid
      onChange(Object.assign({}, ...byChunk))
    })
  })
  return () => unsubs.forEach((u) => u())
}

export async function setAvailability(sprintNumber: number, uid: string, unavailable: Record<string, AbsenceReason>) {
  const entry: AvailabilityEntry = { unavailable }
  await setDoc(doc(entriesCollection(sprintNumber), uid), entry)
}

async function getAvailability(sprintNumber: number, uid: string): Promise<AvailabilityEntry | null> {
  const snap = await getDoc(doc(entriesCollection(sprintNumber), uid))
  return snap.exists() ? (snap.data() as AvailabilityEntry) : null
}

/** Writes `dates` as unavailable (with `reason`) across whichever sprints they fall in —
 *  fetches each touched sprint's existing entry first so it merges instead of overwrites. */
async function writeUnavailableDates(member: Member, dates: string[], reason: AbsenceReason) {
  if (dates.length === 0) return
  const sorted = [...dates].sort()
  const lastDate = sorted[sorted.length - 1]
  let sprint = getSprintForDate(new Date(`${sorted[0]}T00:00:00Z`))
  while (sprint.startDate <= lastDate) {
    const datesToMark = dates.filter((d) => sprint.workingDays.includes(d))
    if (datesToMark.length > 0) {
      const existing = await getAvailability(sprint.number, member.uid)
      const unavailable = { ...existing?.unavailable }
      for (const d of datesToMark) unavailable[d] = reason
      await setAvailability(sprint.number, member.uid, unavailable)
    }
    sprint = getAdjacentSprint(sprint, 1)
  }
}

function calendarDatesBetween(startDateIso: string, endDateIso: string): string[] {
  const dates: string[] = []
  const endMs = Date.parse(`${endDateIso}T00:00:00Z`)
  for (let ms = Date.parse(`${startDateIso}T00:00:00Z`); ms <= endMs; ms += DAY_MS) {
    dates.push(new Date(ms).toISOString().slice(0, 10))
  }
  return dates
}

const MAX_FILL_RANGE_DAYS = 180

/** Mark every working day between startDateIso and endDateIso (inclusive) with `reason`,
 *  writing to each sprint the range touches (a period can span a sprint boundary). */
export async function fillAbsenceRange(
  member: Member,
  startDateIso: string,
  endDateIso: string,
  reason: AbsenceReason,
) {
  if (startDateIso > endDateIso) throw new Error('startDate moet voor endDate liggen')
  const spanDays = (Date.parse(endDateIso) - Date.parse(startDateIso)) / DAY_MS
  if (spanDays > MAX_FILL_RANGE_DAYS) throw new Error('Periode is te lang')
  const dates = calendarDatesBetween(startDateIso, endDateIso).filter((d) => isWorkingDay(member, d))
  await writeUnavailableDates(member, dates, reason)
}

const MAX_RECURRING_RANGE_DAYS = 400

/** For alternating patterns a single fixed non-working weekday can't express (e.g.
 *  "donderdag deze week, vrijdag volgende week" doesn't fit — but "elke 2 weken op
 *  donderdag" does). Marks one weekday, every `intervalWeeks` weeks, as `reason`. */
export async function fillRecurringAbsence(
  member: Member,
  weekday: number,
  intervalWeeks: number,
  startDateIso: string,
  endDateIso: string,
  reason: AbsenceReason,
) {
  if (startDateIso > endDateIso) throw new Error('startDate moet voor endDate liggen')
  const spanDays = (Date.parse(endDateIso) - Date.parse(startDateIso)) / DAY_MS
  if (spanDays > MAX_RECURRING_RANGE_DAYS) throw new Error('Periode is te lang')
  const dates = datesMatchingWeeklyPattern(weekday, intervalWeeks, startDateIso, endDateIso).filter((d) =>
    isWorkingDay(member, d),
  )
  await writeUnavailableDates(member, dates, reason)
}
