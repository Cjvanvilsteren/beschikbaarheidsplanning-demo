import type { CapacityStatus } from '../lib/capacity'

const STATUS_LABEL: Record<'warning' | 'critical', string> = {
  warning: 'Lage bezetting',
  critical: 'Zeer lage bezetting',
}

const STATUS_COLOR_VAR: Record<'warning' | 'critical', string> = {
  warning: 'var(--color-status-warning)',
  critical: 'var(--color-status-critical)',
}

interface CapacityStatusBadgeProps {
  status: CapacityStatus
}

/** Icon + label, never color alone — a colored dot carries identity, text stays in ink. */
export function CapacityStatusBadge({ status }: CapacityStatusBadgeProps) {
  if (status === 'ok') return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-medium text-ink">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR_VAR[status] }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}
