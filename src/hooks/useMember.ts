import { useEffect, useState } from 'react'
import { listenMember } from '../lib/data'
import type { Member } from '../types'

/** Live Firestore profile for the given uid. `undefined` while loading, `null` if no profile exists yet. */
export function useMember(uid: string | undefined) {
  const [member, setMember] = useState<Member | null | undefined>(undefined)

  useEffect(() => {
    if (!uid) {
      setMember(null)
      return
    }
    setMember(undefined)
    return listenMember(uid, setMember)
  }, [uid])

  return member
}
