import type { User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { MemberProfileForm, type MemberProfileValues } from '../components/MemberProfileForm'
import { createMemberProfile, listenTeams } from '../lib/data'
import { DEFAULT_WORK_PATTERN, type Team } from '../types'

interface OnboardingProps {
  user: User
}

export function Onboarding({ user }: OnboardingProps) {
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => listenTeams(setTeams), [])

  async function handleSave(values: MemberProfileValues) {
    await createMemberProfile({
      uid: user.uid,
      email: user.email ?? '',
      isAdmin: false,
      ...values,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-10 shadow-card">
        <h1 className="text-[20px] font-semibold tracking-tight">Welkom 👋</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          Nog even je profiel afronden voor je verder kan.
        </p>

        <div className="mt-7">
          <MemberProfileForm
            teams={teams}
            initial={{ name: user.displayName ?? '', teamIds: [], role: 'developer', workPattern: DEFAULT_WORK_PATTERN }}
            onSave={handleSave}
            submitLabel="Aan de slag"
            savingLabel="Opslaan…"
            showWorkPattern={false}
          />
        </div>
      </div>
    </div>
  )
}
