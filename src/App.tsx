import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Nav } from './components/Nav'
import { useAuth } from './hooks/useAuth'
import { useMember } from './hooks/useMember'
import { listenTeams } from './lib/data'
import { AllMembersOverview } from './pages/AllMembersOverview'
import { ClusterOverview } from './pages/ClusterOverview'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { TeamGrid } from './pages/TeamGrid'
import { canViewCluster, type Member, type Team } from './types'

function TeamGridRoute({ member, fallbackTeamId }: { member: Member; fallbackTeamId: string }) {
  const { teamId } = useParams<{ teamId: string }>()
  return <TeamGrid teamId={teamId ?? fallbackTeamId} viewer={member} />
}

export default function App() {
  const { user, loading, signIn, signUp, signOutUser } = useAuth()
  const member = useMember(user?.uid)
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => listenTeams(setTeams), [])

  if (loading) return null

  if (!user) return <Login onSignIn={signIn} onSignUp={signUp} />

  if (member === undefined) return null

  if (member === null) return <Onboarding user={user} />

  return (
    <div className="min-h-screen">
      <Nav user={user} member={member} teams={teams} onSignOut={signOutUser} />
      <Routes>
        <Route path="/" element={<TeamGridRoute member={member} fallbackTeamId={member.teamIds[0]} />} />
        <Route path="/team/:teamId" element={<TeamGridRoute member={member} fallbackTeamId={member.teamIds[0]} />} />
        <Route path="/cluster" element={canViewCluster(member) ? <ClusterOverview /> : <Navigate to="/" replace />} />
        <Route path="/iedereen" element={canViewCluster(member) ? <AllMembersOverview /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
