import { useEffect, useMemo, useState } from 'react'
import { ClusterInsights } from '../components/ClusterInsights'
import { SprintSwitcher } from '../components/SprintSwitcher'
import { TeamCapacityCard } from '../components/TeamCapacityCard'
import { listenAllMembers, listenAvailabilityForMembers, listenTeams } from '../lib/data'
import { getAdjacentSprint, getSprintForDate } from '../lib/sprints'
import type { AvailabilityEntry, Member, Team } from '../types'

export function ClusterOverview() {
  const [sprint, setSprint] = useState(() => getSprintForDate())
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [entries, setEntries] = useState<Record<string, AvailabilityEntry>>({})

  const uids = useMemo(() => members.map((m) => m.uid), [members])
  const uidsKey = uids.join(',')

  useEffect(() => listenTeams(setTeams), [])
  useEffect(() => listenAllMembers(setMembers), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(sprint.number, uids, setEntries), [sprint.number, uidsKey])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Cluster dashboard</h1>
          <p className="mt-0.5 text-[14px] text-muted">Beschikbare uren per team</p>
        </div>
        <SprintSwitcher
          sprint={sprint}
          onPrev={() => setSprint((s) => getAdjacentSprint(s, -1))}
          onNext={() => setSprint((s) => getAdjacentSprint(s, 1))}
        />
      </div>

      {teams.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[14px] text-muted shadow-soft">
          Nog geen teams gevonden.
        </div>
      ) : (
        <>
          <ClusterInsights teams={teams} members={members} entries={entries} sprint={sprint} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCapacityCard key={team.id} team={team} sprint={sprint} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
