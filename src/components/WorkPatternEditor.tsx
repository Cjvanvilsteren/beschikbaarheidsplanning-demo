import { DEFAULT_DAY_HOURS, WEEKDAY_LABELS, WEEKDAY_ORDER, type WorkPattern } from '../types'


interface WorkPatternEditorProps {
  value: WorkPattern
  onChange: (next: WorkPattern) => void
}

const CYCLE_OPTIONS = [1, 2, 3, 4]

/** 1–4 alternating pattern weeks, each with an hours-per-weekday grid (0 = not working
 *  that day). Cycle length 1 is the common case: the same every week. */
export function WorkPatternEditor({ value, onChange }: WorkPatternEditorProps) {
  const cycleLength = Object.keys(value.weeks).length
  const weekIndexes = Array.from({ length: cycleLength }, (_, i) => i)

  function setCycleLength(n: number) {
    const weeks: WorkPattern['weeks'] = {}
    for (let i = 0; i < n; i++) {
      weeks[String(i)] =
        value.weeks[String(i)] ?? WEEKDAY_ORDER.map((weekday) => ({ weekday, hours: DEFAULT_DAY_HOURS }))
    }
    onChange({ ...value, weeks })
  }

  function hoursFor(weekIndex: number, weekday: number): number {
    return value.weeks[String(weekIndex)]?.find((d) => d.weekday === weekday)?.hours ?? 0
  }

  function setHours(weekIndex: number, weekday: number, hours: number) {
    const key = String(weekIndex)
    const week = value.weeks[key] ?? []
    const nextWeek =
      hours <= 0
        ? week.filter((d) => d.weekday !== weekday)
        : week.some((d) => d.weekday === weekday)
          ? week.map((d) => (d.weekday === weekday ? { ...d, hours } : d))
          : [...week, { weekday, hours }]
    onChange({ ...value, weeks: { ...value.weeks, [key]: nextWeek } })
  }

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-muted">Werkpatroon</label>
      <div className="flex gap-1.5">
        {CYCLE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCycleLength(n)}
            className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition-colors ${
              cycleLength === n ? 'bg-accent text-white' : 'bg-ink/[0.06] text-muted'
            }`}
          >
            {n === 1 ? 'Elke week gelijk' : `${n} weken`}
          </button>
        ))}
      </div>

      {cycleLength > 1 && (
        <div className="mt-3">
          <label className="mb-1.5 block text-[13px] font-medium text-muted">Week 1 start op</label>
          <input
            type="date"
            value={value.anchorDate}
            onChange={(e) => onChange({ ...value, anchorDate: e.target.value })}
            className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-[14px] outline-none ring-accent/30 focus:ring-2"
          />
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="w-16 text-left font-medium text-muted"></th>
              {WEEKDAY_ORDER.map((wd) => (
                <th key={wd} className="pb-1.5 text-center font-medium text-muted">
                  {WEEKDAY_LABELS[wd]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekIndexes.map((weekIndex) => (
              <tr key={weekIndex}>
                <td className="pr-2 text-[12px] font-medium text-muted">
                  {cycleLength > 1 ? `Week ${weekIndex + 1}` : 'Uren/dag'}
                </td>
                {WEEKDAY_ORDER.map((wd) => (
                  <td key={wd} className="px-1 pb-1.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      step={0.5}
                      value={hoursFor(weekIndex, wd)}
                      onChange={(e) => setHours(weekIndex, wd, Number(e.target.value))}
                      className="w-12 rounded-lg border border-border bg-canvas px-1.5 py-1.5 text-center text-[13px] outline-none ring-accent/30 focus:ring-2"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        0 uur = geen werkdag. Fulltime? Laat alles op 8 staan. Wisselend ritme (bv. andere
        dagen de ene week dan de andere)? Kies 2–4 weken en vul per week in.
      </p>
    </div>
  )
}
