import type { Sprint } from '../types'
import { formatSprintRange } from '../lib/sprints'

interface SprintSwitcherProps {
  sprint: Sprint
  onPrev: () => void
  onNext: () => void
}

export function SprintSwitcher({ sprint, onPrev, onNext }: SprintSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-1.5 shadow-soft">
      <button
        onClick={onPrev}
        aria-label="Vorige sprint"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
      >
        ‹
      </button>
      <div className="px-2 text-center">
        <div className="text-[13px] font-semibold leading-tight">Sprint {sprint.number}</div>
        <div className="text-[11px] leading-tight text-muted">{formatSprintRange(sprint)}</div>
      </div>
      <button
        onClick={onNext}
        aria-label="Volgende sprint"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
      >
        ›
      </button>
    </div>
  )
}
