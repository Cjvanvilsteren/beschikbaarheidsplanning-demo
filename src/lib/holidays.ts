const DAY_MS = 24 * 60 * 60 * 1000

/** Meeus/Jones/Butcher algorithm. Returns UTC ms midnight of Easter Sunday. */
function easterSundayMs(year: number): number {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const monthIndex = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0 = March
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return Date.UTC(year, monthIndex, day)
}

function koningsdagMs(year: number): number {
  const apr27 = Date.UTC(year, 3, 27)
  return new Date(apr27).getUTCDay() === 0 ? apr27 - DAY_MS : apr27 // Sunday -> Saturday 26th
}

function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

const cache = new Map<number, Set<string>>()

/** Algemeen erkende Nederlandse feestdagen. 1e Paas-/Pinksterdag vallen altijd op zondag
 *  en zijn dus al uitgesloten als weekend; alleen de 2e dag hoeft hier expliciet. */
function computeDutchHolidays(year: number): Set<string> {
  const easter = easterSundayMs(year)
  const dates = [
    Date.UTC(year, 0, 1), // Nieuwjaarsdag
    easter + DAY_MS, // 2e Paasdag
    koningsdagMs(year), // Koningsdag
    Date.UTC(year, 4, 5), // Bevrijdingsdag
    easter + 39 * DAY_MS, // Hemelvaartsdag
    easter + 50 * DAY_MS, // 2e Pinksterdag
    Date.UTC(year, 11, 25), // 1e Kerstdag
    Date.UTC(year, 11, 26), // 2e Kerstdag
  ]
  return new Set(dates.map(toISODate))
}

function getDutchHolidays(year: number): Set<string> {
  let set = cache.get(year)
  if (!set) {
    set = computeDutchHolidays(year)
    cache.set(year, set)
  }
  return set
}

export function isDutchHoliday(iso: string): boolean {
  const year = Number(iso.slice(0, 4))
  return getDutchHolidays(year).has(iso)
}
