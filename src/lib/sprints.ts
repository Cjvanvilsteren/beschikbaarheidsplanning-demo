import { isDutchHoliday } from './holidays'
import type { Sprint } from '../types'

/** Anchor point: sprint 190 starts on this date. All other sprints are derived from it. */
const ANCHOR_SPRINT_NUMBER = 190
const ANCHOR_START = Date.UTC(2026, 8, 17) // 2026-09-17 (month is 0-indexed)
const SPRINT_LENGTH_DAYS = 21 // 3 weeks

const DAY_MS = 24 * 60 * 60 * 1000

function toISODate(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10)
}

function isWeekday(utcMs: number): boolean {
  const day = new Date(utcMs).getUTCDay()
  return day !== 0 && day !== 6
}

function buildSprint(number: number, startMs: number): Sprint {
  const endMs = startMs + (SPRINT_LENGTH_DAYS - 1) * DAY_MS
  const workingDays: string[] = []
  const displayDays: string[] = []
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    const iso = toISODate(ms)
    if (isDutchHoliday(iso)) continue // holidays stay fully hidden, not just grayed
    displayDays.push(iso)
    if (isWeekday(ms)) workingDays.push(iso)
  }
  return {
    number,
    startDate: toISODate(startMs),
    endDate: toISODate(endMs),
    workingDays,
    displayDays,
  }
}

/** The sprint that contains the given date (defaults to today). */
export function getSprintForDate(date: Date = new Date()): Sprint {
  const dateMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const sprintsSinceAnchor = Math.floor((dateMs - ANCHOR_START) / (SPRINT_LENGTH_DAYS * DAY_MS))
  const number = ANCHOR_SPRINT_NUMBER + sprintsSinceAnchor
  const startMs = ANCHOR_START + sprintsSinceAnchor * SPRINT_LENGTH_DAYS * DAY_MS
  return buildSprint(number, startMs)
}

/** Get a sprint by its number, computed relative to the anchor. */
export function getSprintByNumber(number: number): Sprint {
  const startMs = ANCHOR_START + (number - ANCHOR_SPRINT_NUMBER) * SPRINT_LENGTH_DAYS * DAY_MS
  return buildSprint(number, startMs)
}

export function getAdjacentSprint(sprint: Sprint, offset: number): Sprint {
  return getSprintByNumber(sprint.number + offset)
}

export function isWeekendDate(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

export function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Narrow label (weekday + day, no month) for compact strips where the full label wraps too wide. */
export function formatShortDayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  const weekday = date.toLocaleDateString('nl-NL', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2)
  const day = date.toLocaleDateString('nl-NL', { day: 'numeric', timeZone: 'UTC' })
  return `${weekday} ${day}`
}

/** Every date matching `weekday` (1=ma…5=vr) every `intervalWeeks` weeks, within
 *  [startDateIso, endDateIso] inclusive — for alternating patterns like "elke 2 weken op
 *  donderdag" that a single fixed weekly non-working day can't express. */
export function datesMatchingWeeklyPattern(
  weekday: number,
  intervalWeeks: number,
  startDateIso: string,
  endDateIso: string,
): string[] {
  const dates: string[] = []
  const startMs = Date.parse(`${startDateIso}T00:00:00Z`)
  const startDay = new Date(startMs).getUTCDay()
  const firstMs = startMs + (((weekday - startDay + 7) % 7) * DAY_MS)
  const endMs = Date.parse(`${endDateIso}T00:00:00Z`)
  const stepMs = intervalWeeks * 7 * DAY_MS
  for (let ms = firstMs; ms <= endMs; ms += stepMs) dates.push(toISODate(ms))
  return dates
}

export function formatSprintRange(sprint: Sprint): string {
  const start = new Date(`${sprint.startDate}T00:00:00Z`)
  const end = new Date(`${sprint.endDate}T00:00:00Z`)
  const startLabel = start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const endLabel = end.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${startLabel} – ${endLabel}`
}
