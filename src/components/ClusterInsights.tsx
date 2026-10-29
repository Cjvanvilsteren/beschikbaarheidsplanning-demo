import { useEffect, useMemo, useState } from 'react'
import { RoleBreakdownBar } from './RoleBreakdownBar'
import { capacityStatus, hoursByRole, isAvailable, isWorkingDay, maxPossibleHours, teamSprintHours } from '../lib/capacity'
import { listenAvailabilityForMembers } from '../lib/data'
import { todayIso } from '../lib/insights'
import { getSprintForDate, isWeekendDate } from '../lib/sprints'
import type { AvailabilityEntry, Member, Sprint, Team } from '../types'

interface ClusterInsightsProps {
  teams: Team[]
  members: Member[]
  entries: Record<string, AvailabilityEntry>
  sprint: Sprint
}

const STATUS_DOT: Record<'ok' | 'warning' | 'critical', string> = {
  ok: 'var(--color-available)',
  warning: 'var(--color-status-warning)',
  critical: 'var(--color-status-critical)',
}

/** Cluster-wide counterpart to TeamInsights: how teams compare, who's out today, and the
 *  role mix across everyone — rather than day-by-day detail for one team. */
export function ClusterInsights({ teams, members, entries, sprint }: ClusterInsightsProps) {
  const todaySprint = useMemo(() => getSprintForDate(), [])
  const [todayEntries, setTodayEntries] = useState<Record<string, AvailabilityEntry>>({})
  const uids = useMemo(() => members.map((m) => m.uid), [members])
  const uidsKey = uids.join(',')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(todaySprint.number, uids, setTodayEntries), [todaySprint.number, uidsKey])

  const ranking = useMemo(
    () =>
      teams
        .map((team) => {
          const teamMembers = members.filter((m) => m.teamIds.includes(team.id))
          const hours = teamSprintHours(teamMembers, entries, sprint)
          const maxHours = maxPossibleHours(teamMembers, sprint)
          const pct = maxHours > 0 ? Math.round((hours / maxHours) * 100) : 100
          return { team, pct }
        })
        .sort((a, b) => a.pct - b.pct),
    [teams, members, entries, sprint],
  )

  const todayStr = todayIso()
  const absentToday = useMemo(() => {
    if (isWeekendDate(todayStr)) return []
    return members.filter((m) => isWorkingDay(m, todayStr) && !isAvailable(todayEntries[m.uid], todayStr))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, todayEntries, todayStr])

  const roleHours = useMemo(() => hoursByRole(members, entries, sprint), [members, entries, sprint])

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Teams op bezetting</h3>
        {ranking.length === 0 ? (
          <p className="text-[12px] text-muted">Nog geen teams.</p>
        ) : (
          <ul className="space-y-1.5">
            {ranking.map(({ team, pct }) => (
              <li key={team.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_DOT[capacityStatus(pct)] }}
                    aria-hidden
                  />
                  {team.name}
                </span>
                <span className="tabular-nums text-muted">{pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Vandaag afwezig</h3>
        {isWeekendDate(todayStr) ? (
          <p className="text-[12px] text-muted">Het is weekend.</p>
        ) : absentToday.length === 0 ? (
          <p className="text-[12px] text-muted">Niemand — iedereen is er vandaag.</p>
        ) : (
          <>
            <p className="mb-1.5 text-[22px] font-semibold tabular-nums tracking-tight">{absentToday.length}</p>
            <p className="text-[12px] text-muted">
              {absentToday
                .slice(0, 5)
                .map((m) => m.name)
                .join(', ')}
              {absentToday.length > 5 && ` +${absentToday.length - 5} meer`}
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h3 className="mb-3 text-[13px] font-semibold tracking-tight">Rolverdeling cluster</h3>
        <RoleBreakdownBar roleHours={roleHours} />
      </div>
    </div>
  )
}
