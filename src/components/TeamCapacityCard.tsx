import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CapacityStatusBadge } from './CapacityStatusBadge'
import { RoleBreakdownBar } from './RoleBreakdownBar'
import { capacityStatus, hoursByRole, maxPossibleHours, teamSprintHours } from '../lib/capacity'
import { listenAvailabilityForMembers, listenMembers } from '../lib/data'
import type { AvailabilityEntry, Member, Sprint, Team } from '../types'

interface TeamCapacityCardProps {
  team: Team
  sprint: Sprint
}

export function TeamCapacityCard({ team, sprint }: TeamCapacityCardProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [entries, setEntries] = useState<Record<string, AvailabilityEntry>>({})
  const uids = useMemo(() => members.map((m) => m.uid), [members])
  const uidsKey = uids.join(',')

  useEffect(() => listenMembers(team.id, setMembers), [team.id])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(sprint.number, uids, setEntries), [sprint.number, uidsKey])

  const totalHours = teamSprintHours(members, entries, sprint)
  const maxHours = maxPossibleHours(members, sprint)
  const pct = maxHours > 0 ? Math.round((totalHours / maxHours) * 100) : 0
  const roleHours = hoursByRole(members, entries, sprint)

  return (
    <Link
      to={`/team/${team.id}`}
      className="block rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">{team.name}</h3>
        <span className="text-[12px] font-medium text-muted">{members.length} leden</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-[24px] font-semibold tabular-nums tracking-tight">{totalHours}u</span>
        <span className="text-[12px] font-medium text-muted">{pct}% van max</span>
      </div>
      <div className="mt-4">
        <RoleBreakdownBar roleHours={roleHours} />
      </div>
      <div className="mt-3 empty:hidden">
        <CapacityStatusBadge status={capacityStatus(pct)} />
      </div>
    </Link>
  )
}
