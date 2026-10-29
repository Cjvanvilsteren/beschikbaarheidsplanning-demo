import { DayCell } from './DayCell'
import {
  absenceReason,
  dayTeamHours,
  isAvailable,
  isWorkingDay,
  memberSprintHours,
} from '../lib/capacity'
import { formatDateLabel, isWeekendDate } from '../lib/sprints'
import { ROLE_LABELS, type AvailabilityEntry, type Member, type Sprint } from '../types'

interface AvailabilityGridProps {
  sprint: Sprint
  members: Member[]
  entries: Record<string, AvailabilityEntry>
  currentUid: string
  /** Admins can edit anyone's row and get an edit-profile button per row. */
  canEditAll?: boolean
  /** Fully non-interactive — for the team-independent "iedereen" overview. */
  readOnly?: boolean
  /** Shown under the role, e.g. team names — for views that span multiple teams. */
  secondaryLineFor?: (member: Member) => string | null
  /** Label for the totals row; defaults to "Team totaal". */
  totalsLabel?: string
  onMouseDown?: (uid: string, dayIndex: number, date: string) => void
  onMouseEnter?: (uid: string, dayIndex: number) => void
  onEditMember?: (member: Member) => void
}

/** The team roster table: names + role, one column per day (weekends shown but grayed
 *  out), editable only for your own row (or any row, for an admin) on working days. */
export function AvailabilityGrid({
  sprint,
  members,
  entries,
  currentUid,
  canEditAll = false,
  readOnly = false,
  secondaryLineFor,
  totalsLabel = 'Team totaal',
  onMouseDown,
  onMouseEnter,
  onEditMember,
}: AvailabilityGridProps) {
  const totalHours = members.reduce((sum, m) => sum + memberSprintHours(m, entries[m.uid], sprint), 0)

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full select-none border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 min-w-[180px] bg-surface px-5 py-3 text-left font-medium text-muted">
                Naam
              </th>
              {sprint.displayDays.map((date) => {
                const weekend = isWeekendDate(date)
                return (
                  <th
                    key={date}
                    className={`min-w-[64px] px-2 py-3 text-center font-medium ${weekend ? 'text-muted/50' : 'text-muted'}`}
                  >
                    {formatDateLabel(date)}
                  </th>
                )
              })}
              <th className="sticky right-0 z-10 min-w-[88px] border-l border-border bg-surface px-4 py-3 text-right font-medium text-muted">
                Uren
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const entry = entries[member.uid]
              const isMe = member.uid === currentUid
              return (
                <tr key={member.uid} className="border-b border-border last:border-b-0">
                  <td className="sticky left-0 z-10 bg-surface px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="font-medium">
                        {member.name}
                        {isMe && <span className="ml-2 text-[11px] font-normal text-accent">jij</span>}
                      </div>
                      {canEditAll && onEditMember && (
                        <button
                          onClick={() => onEditMember(member)}
                          title="Profiel bewerken"
                          aria-label={`Profiel van ${member.name} bewerken`}
                          className="cursor-pointer text-[11px] text-muted hover:text-accent"
                        >
                          ✎
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">
                      {ROLE_LABELS[member.role]}
                      {secondaryLineFor?.(member) && <> · {secondaryLineFor(member)}</>}
                    </div>
                  </td>
                  {sprint.displayDays.map((date) => {
                    const weekend = isWeekendDate(date)
                    if (weekend) {
                      return (
                        <td key={date} className="px-2 py-2 text-center">
                          <DayCell
                            date={date}
                            weekend
                            working={false}
                            available={false}
                            reason={undefined}
                            clickable={false}
                            onMouseDown={() => {}}
                            onMouseEnter={() => {}}
                          />
                        </td>
                      )
                    }
                    const dayIndex = sprint.workingDays.indexOf(date)
                    const working = isWorkingDay(member, date)
                    const available = isAvailable(entry, date)
                    const reason = absenceReason(entry, date)
                    const clickable = !readOnly && (isMe || canEditAll) && working
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        <DayCell
                          date={date}
                          weekend={false}
                          working={working}
                          available={available}
                          reason={reason}
                          clickable={clickable}
                          onMouseDown={() => onMouseDown?.(member.uid, dayIndex, date)}
                          onMouseEnter={() => onMouseEnter?.(member.uid, dayIndex)}
                        />
                      </td>
                    )
                  })}
                  <td className="sticky right-0 z-10 border-l border-border bg-surface px-4 py-3 text-right font-medium tabular-nums">
                    {memberSprintHours(member, entry, sprint)}u
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface">
              <td className="sticky left-0 z-10 bg-surface px-5 py-3 font-semibold">{totalsLabel}</td>
              {sprint.displayDays.map((date) =>
                isWeekendDate(date) ? (
                  <td key={date} className="px-2 py-3 text-center text-[12px] text-muted/40">
                    ·
                  </td>
                ) : (
                  <td key={date} className="px-2 py-3 text-center text-[12px] font-medium tabular-nums text-muted">
                    {dayTeamHours(members, entries, date)}u
                  </td>
                ),
              )}
              <td className="sticky right-0 z-10 border-l border-border bg-surface px-4 py-3 text-right text-[14px] font-semibold tabular-nums text-accent">
                {totalHours}u
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
