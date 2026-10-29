import { useEffect, useMemo, useRef, useState } from 'react'
import { isWorkingDay } from '../lib/capacity'
import { REASON_ORDER, type AbsenceReason, type AvailabilityEntry, type Member, type Sprint } from '../types'

interface DragState {
  uid: string
  startIndex: number
  currentIndex: number
  /** The reason applied to the whole dragged range, or undefined to mark available. */
  nextValue: AbsenceReason | undefined
}

function cycleReason(current: AbsenceReason | undefined): AbsenceReason | undefined {
  if (!current) return REASON_ORDER[0]
  return REASON_ORDER[REASON_ORDER.indexOf(current) + 1]
}

interface UseAvailabilityDragArgs {
  entries: Record<string, AvailabilityEntry>
  sprint: Sprint
  currentUid: string
  /** Full roster — used to check each dragged person's own working-day pattern. */
  members: Member[]
  /** Admin viewers can edit anyone's row, not just their own. */
  canEditAll: boolean
  /** Called once, on mouse-up, with the full resulting unavailable map for that person. */
  onCommit: (uid: string, unavailable: Record<string, AbsenceReason>) => void
}

/**
 * Click to cycle a day through available -> verlof -> ziek -> opleiding -> available.
 * Click-and-drag applies whatever the start cell landed on to the whole dragged range.
 * Days outside the dragged person's own working-week pattern are not interactive.
 */
export function useAvailabilityDrag({ entries, sprint, currentUid, members, canEditAll, onCommit }: UseAvailabilityDragArgs) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const membersByUid = useMemo(() => Object.fromEntries(members.map((m) => [m.uid, m])), [members])

  function previewFor(uid: string, dragState: DragState | null): Record<string, AbsenceReason> {
    const base = entries[uid]?.unavailable ?? {}
    if (!dragState || dragState.uid !== uid) return base
    const targetMember = membersByUid[uid]
    const lo = Math.min(dragState.startIndex, dragState.currentIndex)
    const hi = Math.max(dragState.startIndex, dragState.currentIndex)
    const next = { ...base }
    for (let i = lo; i <= hi; i++) {
      const date = sprint.workingDays[i]
      if (targetMember && !isWorkingDay(targetMember, date)) continue
      if (dragState.nextValue) next[date] = dragState.nextValue
      else delete next[date]
    }
    return next
  }

  const effectiveEntries = useMemo(() => {
    if (!drag) return entries
    return { ...entries, [drag.uid]: { unavailable: previewFor(drag.uid, drag) } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, drag, sprint, membersByUid])

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  useEffect(() => {
    if (!drag) return
    function handleMouseUp() {
      const d = dragRef.current
      if (!d) return
      onCommit(d.uid, previewFor(d.uid, d))
      setDrag(null)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null])

  function handleMouseDown(uid: string, dayIndex: number, date: string) {
    if (uid !== currentUid && !canEditAll) return
    const targetMember = membersByUid[uid]
    if (targetMember && !isWorkingDay(targetMember, date)) return
    const currentReason = entries[uid]?.unavailable?.[date]
    setDrag({ uid, startIndex: dayIndex, currentIndex: dayIndex, nextValue: cycleReason(currentReason) })
  }

  function handleMouseEnter(uid: string, dayIndex: number) {
    if (!drag || drag.uid !== uid) return
    setDrag((prev) => (prev ? { ...prev, currentIndex: dayIndex } : prev))
  }

  return { effectiveEntries, handleMouseDown, handleMouseEnter }
}
