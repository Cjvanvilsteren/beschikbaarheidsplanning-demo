import { useEffect, useMemo, useState } from 'react'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { RoleBreakdownBar } from '../components/RoleBreakdownBar'
import { SprintSwitcher } from '../components/SprintSwitcher'
import { hoursByRole, teamSprintHours } from '../lib/capacity'
import { listenAllMembers, listenAvailabilityForMembers, listenTeams } from '../lib/data'
import { getAdjacentSprint, getSprintForDate } from '../lib/sprints'
import type { AvailabilityEntry, Member, Team } from '../types'

/** Read-only roster of everyone in the cluster, independent of team. */
export function AllMembersOverview() {
  const [sprint, setSprint] = useState(() => getSprintForDate())
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [entries, setEntries] = useState<Record<string, AvailabilityEntry>>({})

  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members])
  const uids = useMemo(() => sortedMembers.map((m) => m.uid), [sortedMembers])
  const uidsKey = uids.join(',')
  const teamNameById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t.name])), [teams])

  useEffect(() => listenAllMembers(setMembers), [])
  useEffect(() => listenTeams(setTeams), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(sprint.number, uids, setEntries), [sprint.number, uidsKey])

  const totalHours = teamSprintHours(sortedMembers, entries, sprint)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Totaaloverzicht</h1>
          <p className="mt-0.5 text-[14px] text-muted">
            Alle {sortedMembers.length} mensen in het cluster, team-onafhankelijk. Alleen-lezen.
          </p>
        </div>
        <SprintSwitcher
          sprint={sprint}
          onPrev={() => setSprint((s) => getAdjacentSprint(s, -1))}
          onNext={() => setSprint((s) => getAdjacentSprint(s, 1))}
        />
      </div>

      {sortedMembers.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[22px] font-semibold tabular-nums tracking-tight">{totalHours}u</span>
            <span className="text-[12px] font-medium text-muted">totaal deze sprint</span>
          </div>
          <RoleBreakdownBar roleHours={hoursByRole(sortedMembers, entries, sprint)} />
        </div>
      )}

      {sortedMembers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[14px] text-muted shadow-soft">
          Nog geen leden gevonden.
        </div>
      ) : (
        <AvailabilityGrid
          sprint={sprint}
          members={sortedMembers}
          entries={entries}
          currentUid=""
          readOnly
          totalsLabel="Totaal"
          secondaryLineFor={(m) => m.teamIds.map((id) => teamNameById[id]).filter(Boolean).join(', ') || null}
        />
      )}
    </div>
  )
}
