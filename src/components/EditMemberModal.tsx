import { MemberProfileForm, type MemberProfileValues } from './MemberProfileForm'
import { updateMemberProfile } from '../lib/data'
import { DEFAULT_WORK_PATTERN, type Member, type Team } from '../types'

interface EditMemberModalProps {
  member: Member
  teams: Team[]
  onClose: () => void
}

/** Used both for an admin editing anyone's profile, and for a member editing their own. */
export function EditMemberModal({ member, teams, onClose }: EditMemberModalProps) {
  async function handleSave(values: MemberProfileValues) {
    await updateMemberProfile(member.uid, values)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/30 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center px-6 py-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-tight">Profiel bewerken</h2>
            <button onClick={onClose} aria-label="Sluiten" className="text-[13px] text-muted hover:text-ink">
              Annuleren
            </button>
          </div>
          <MemberProfileForm
            teams={teams}
            initial={{
              name: member.name,
              teamIds: member.teamIds,
              role: member.role,
              workPattern: member.workPattern ?? DEFAULT_WORK_PATTERN,
            }}
            onSave={handleSave}
            submitLabel="Opslaan"
            savingLabel="Opslaan…"
          />
        </div>
      </div>
    </div>
  )
}
