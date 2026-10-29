import { ROLE_LABELS, type MemberRole } from '../types'
import type { RoleHours } from '../lib/capacity'

const ROLE_COLOR_VAR: Record<MemberRole, string> = {
  developer: 'var(--color-role-developer)',
  tester: 'var(--color-role-tester)',
  designer: 'var(--color-role-designer)',
  po: 'var(--color-role-po)',
  sm: 'var(--color-role-sm)',
  ba: 'var(--color-role-ba)',
  pdm: 'var(--color-role-pdm)',
  mo: 'var(--color-role-mo)',
  architect: 'var(--color-role-architect)',
  qa: 'var(--color-role-qa)',
}

interface RoleBreakdownBarProps {
  roleHours: RoleHours[]
}

export function RoleBreakdownBar({ roleHours }: RoleBreakdownBarProps) {
  const total = roleHours.reduce((sum, r) => sum + r.hours, 0)
  if (total === 0 || roleHours.length === 0) return null

  return (
    <div>
      <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
        {roleHours.map(({ role, hours }) => (
          <div
            key={role}
            style={{ width: `${(hours / total) * 100}%`, backgroundColor: ROLE_COLOR_VAR[role] }}
            aria-hidden
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {roleHours.map(({ role, hours }) => (
          <div key={role} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: ROLE_COLOR_VAR[role] }}
              aria-hidden
            />
            <span>
              {ROLE_LABELS[role]} <span className="tabular-nums text-ink">{hours}u</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
