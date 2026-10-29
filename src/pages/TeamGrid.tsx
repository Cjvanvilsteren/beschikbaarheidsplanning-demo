import { useEffect, useMemo, useState } from 'react'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { EditMemberModal } from '../components/EditMemberModal'
import { CapacityStatusBadge } from '../components/CapacityStatusBadge'
import { MyAvailabilityBar } from '../components/MyAvailabilityBar'
import { RoleBreakdownBar } from '../components/RoleBreakdownBar'
import { SprintSwitcher } from '../components/SprintSwitcher'
import { TeamInsights } from '../components/TeamInsights'
import { capacityStatus, hoursByRole, maxPossibleHours, teamSprintHours } from '../lib/capacity'
import { listenAvailabilityForMembers, listenMembers, listenTeam, listenTeams, setAvailability } from '../lib/data'
import { getAdjacentSprint, getSprintForDate } from '../lib/sprints'
import { useAvailabilityDrag } from '../hooks/useAvailabilityDrag'
import { REASON_EMOJI, REASON_LABELS, REASON_ORDER, type AvailabilityEntry, type Member, type Team } from '../types'

interface TeamGridProps {
  teamId: string
  /** The logged-in viewer's own profile (not necessarily a member of this team — an admin can view any team). */
  viewer: Member
}

export function TeamGrid({ teamId, viewer }: TeamGridProps) {
  const [sprint, setSprint] = useState(() => getSprintForDate())
  const [team, setTeam] = useState<Team | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [entries, setEntries] = useState<Record<string, AvailabilityEntry>>({})
  const [prevEntries, setPrevEntries] = useState<Record<string, AvailabilityEntry>>({})
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  const prevSprint = useMemo(() => getAdjacentSprint(sprint, -1), [sprint])
  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members])
  const uids = useMemo(() => sortedMembers.map((m) => m.uid), [sortedMembers])
  const uidsKey = uids.join(',')

  useEffect(() => listenTeam(teamId, setTeam), [teamId])
  useEffect(() => listenTeams(setAllTeams), [])
  useEffect(() => listenMembers(teamId, setMembers), [teamId])
  // uidsKey (not uids) is the dep on purpose: re-subscribe only when the actual set of
  // uids changes, not on every members snapshot that recreates the array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(sprint.number, uids, setEntries), [sprint.number, uidsKey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => listenAvailabilityForMembers(prevSprint.number, uids, setPrevEntries), [prevSprint.number, uidsKey])

  const { effectiveEntries, handleMouseDown, handleMouseEnter } = useAvailabilityDrag({
    entries,
    sprint,
    currentUid: viewer.uid,
    members: sortedMembers,
    canEditAll: viewer.isAdmin,
    onCommit: (uid, unavailable) => setAvailability(sprint.number, uid, unavailable),
  })

  const myMember = sortedMembers.find((m) => m.uid === viewer.uid)

  const totalHours = teamSprintHours(sortedMembers, effectiveEntries, sprint)
  const maxHours = maxPossibleHours(sortedMembers, sprint)
  const pct = maxHours > 0 ? Math.round((totalHours / maxHours) * 100) : 0
  const status = capacityStatus(pct)
  const prevTotalHours = teamSprintHours(sortedMembers, prevEntries, prevSprint)
  const delta = totalHours - prevTotalHours

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">{team?.name ?? '…'}</h1>
          <p className="mt-0.5 text-[14px] text-muted">Beschikbaarheid voor de sprint</p>
        </div>
        <SprintSwitcher
          sprint={sprint}
          onPrev={() => setSprint((s) => getAdjacentSprint(s, -1))}
          onNext={() => setSprint((s) => getAdjacentSprint(s, 1))}
        />
      </div>

      {myMember && (
        <>
          <h2 className="mb-4 text-[20px] font-semibold tracking-tight">Jouw beschikbaarheid</h2>
          <MyAvailabilityBar
            sprint={sprint}
            member={myMember}
            entry={effectiveEntries[viewer.uid]}
            onMouseDown={(dayIndex, date) => handleMouseDown(viewer.uid, dayIndex, date)}
            onMouseEnter={(dayIndex) => handleMouseEnter(viewer.uid, dayIndex)}
          />
        </>
      )}

      {sortedMembers.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-[20px] font-semibold tracking-tight">Inzichten voor het team</h2>
          <TeamInsights members={sortedMembers} browsedSprint={sprint} browsedEntries={effectiveEntries} />
        </>
      )}

      <h2 className="mb-4 mt-10 text-[20px] font-semibold tracking-tight">Totaal overzicht van het team</h2>
      {sortedMembers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[14px] text-muted shadow-soft">
          Nog geen teamleden gevonden.
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">{totalHours}u</span>
                <span className="text-[12px] font-medium text-muted">{pct}% van max deze sprint</span>
                <CapacityStatusBadge status={status} />
              </div>
              <span className="text-[12px] text-muted">
                {delta === 0 ? '=' : delta > 0 ? '▲' : '▼'}{' '}
                <span className="tabular-nums text-ink">
                  {delta > 0 ? '+' : ''}
                  {delta}u
                </span>{' '}
                t.o.v. sprint {prevSprint.number}
              </span>
            </div>
            <RoleBreakdownBar roleHours={hoursByRole(sortedMembers, effectiveEntries, sprint)} />
          </div>

          <p className="mb-3 select-none text-[11px] text-muted">
            Klik om te togglen, klik nogmaals om de reden te wijzigen (
            {REASON_ORDER.map((r) => `${REASON_EMOJI[r]} ${REASON_LABELS[r]}`).join(' · ')}), of sleep over
            meerdere dagen.
            {viewer.isAdmin && ' Als admin kun je ieders rij bewerken en profielen aanpassen (✎).'}
          </p>
          <AvailabilityGrid
            sprint={sprint}
            members={sortedMembers}
            entries={effectiveEntries}
            currentUid={viewer.uid}
            canEditAll={viewer.isAdmin}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onEditMember={setEditingMember}
          />
        </>
      )}

      {editingMember && (
        <EditMemberModal member={editingMember} teams={allTeams} onClose={() => setEditingMember(null)} />
      )}
    </div>
  )
}
