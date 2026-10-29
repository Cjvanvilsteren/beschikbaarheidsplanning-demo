import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { EditMemberModal } from './EditMemberModal'
import { canViewCluster, type Member, type Team } from '../types'

interface NavProps {
  user: User
  member: Member | null | undefined
  teams: Team[]
  onSignOut: () => void
}

function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? ''
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function ViewSwitcher({ member, teams }: { member: Member; teams: Team[] }) {
  const location = useLocation()
  const navigate = useNavigate()

  const myTeams = member.isAdmin ? teams : teams.filter((t) => member.teamIds.includes(t.id))
  const showOverviews = canViewCluster(member)

  const isActive =
    location.pathname === '/' ||
    location.pathname.startsWith('/team') ||
    location.pathname === '/cluster' ||
    location.pathname === '/iedereen'
  const pillClass = `rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
    isActive ? 'border-accent/30 bg-accent/[0.06] text-ink' : 'border-border bg-surface text-muted hover:text-ink'
  }`

  // Nothing to switch between — just a plain link to your one team.
  if (myTeams.length <= 1 && !showOverviews) {
    return (
      <button onClick={() => navigate('/')} className={pillClass}>
        {myTeams[0]?.name ?? 'Mijn team'}
      </button>
    )
  }

  const teamMatch = location.pathname.match(/^\/team\/([^/]+)/)
  const activeValue =
    location.pathname === '/cluster'
      ? 'cluster'
      : location.pathname === '/iedereen'
        ? 'iedereen'
        : (teamMatch?.[1] ?? member.teamIds[0] ?? myTeams[0]?.id ?? '')

  function handleChange(value: string) {
    if (value === 'cluster') navigate('/cluster')
    else if (value === 'iedereen') navigate('/iedereen')
    else navigate(`/team/${value}`)
  }

  return (
    <div className="relative">
      <select
        value={activeValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`appearance-none pr-6 outline-none ${pillClass}`}
      >
        <optgroup label="Team">
          {myTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
        {showOverviews && (
          <optgroup label="Overzicht">
            <option value="cluster">Cluster dashboard</option>
            <option value="iedereen">Totaaloverzicht</option>
          </optgroup>
        )}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-muted">▾</span>
    </div>
  )
}

export function Nav({ user, member, teams, onSignOut }: NavProps) {
  const [editingSelf, setEditingSelf] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-5">
            <span className="text-[15px] font-semibold tracking-tight">Beschikbaarheidsplanning CUS</span>
            {member && (
              <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
                <span className="hidden text-[12px] text-muted sm:inline">Je bekijkt:</span>
                <ViewSwitcher member={member} teams={teams} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] font-medium text-ink sm:inline">
              Dag {firstName(member?.name ?? user.email ?? '')}!
            </span>
            {member && (
              <button
                onClick={() => setEditingSelf(true)}
                title="Persoonlijke instellingen"
                aria-label="Persoonlijke instellingen"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                ⚙️
              </button>
            )}
            <button
              onClick={onSignOut}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {member && editingSelf && (
        <EditMemberModal member={member} teams={teams} onClose={() => setEditingSelf(false)} />
      )}
    </>
  )
}
