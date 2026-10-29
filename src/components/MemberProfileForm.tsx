import { useState } from 'react'
import { WorkPatternEditor } from './WorkPatternEditor'
import { ROLE_LABELS, ROLE_ORDER, type MemberRole, type Team, type WorkPattern } from '../types'

export interface MemberProfileValues {
  name: string
  teamIds: string[]
  role: MemberRole
  workPattern: WorkPattern
}

interface MemberProfileFormProps {
  teams: Team[]
  initial: MemberProfileValues
  onSave: (values: MemberProfileValues) => Promise<void>
  submitLabel: string
  savingLabel: string
  /** Onboarding keeps this hidden (defaults to fulltime) — an admin can still set it later. */
  showWorkPattern?: boolean
}

export function MemberProfileForm({
  teams,
  initial,
  onSave,
  submitLabel,
  savingLabel,
  showWorkPattern = true,
}: MemberProfileFormProps) {
  const [name, setName] = useState(initial.name)
  const [teamIds, setTeamIds] = useState(initial.teamIds)
  const [role, setRole] = useState(initial.role)
  const [workPattern, setWorkPattern] = useState(initial.workPattern)
  const [saving, setSaving] = useState(false)

  const canSubmit = name.trim().length > 0 && teamIds.length > 0 && !saving

  function toggleTeam(id: string) {
    setTeamIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), teamIds, role, workPattern })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-muted">Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
            placeholder="Naam"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-muted">Team{teamIds.length > 1 ? 's' : ''}</label>
          {teams.length === 0 ? (
            <p className="text-[13px] text-muted">Geen teams gevonden.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {teams.map((t) => {
                const selected = teamIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeam(t.id)}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      selected ? 'bg-accent text-white' : 'bg-ink/[0.06] text-muted'
                    }`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-muted">
            In meerdere teams (bv. als PO, SM, BA, PDM, MO of architect)? Selecteer ze allemaal — één gedeelde
            kalender telt op elk van die teams mee.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-muted">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {showWorkPattern && <WorkPatternEditor value={workPattern} onChange={setWorkPattern} />}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  )
}
