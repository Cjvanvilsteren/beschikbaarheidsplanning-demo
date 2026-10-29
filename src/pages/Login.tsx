import { FirebaseError } from 'firebase/app'
import { useState } from 'react'

interface LoginProps {
  onSignIn: (email: string, password: string) => Promise<unknown>
  onSignUp: (email: string, password: string) => Promise<unknown>
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Dit e-mailadres heeft al een account. Probeer in te loggen.',
  'auth/invalid-email': 'Dit is geen geldig e-mailadres.',
  'auth/weak-password': 'Wachtwoord moet minimaal 6 tekens zijn.',
  'auth/invalid-credential': 'E-mailadres of wachtwoord klopt niet.',
  'auth/wrong-password': 'E-mailadres of wachtwoord klopt niet.',
  'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
  'auth/too-many-requests': 'Te veel pogingen. Probeer het later opnieuw.',
}

export function Login({ onSignIn, onSignUp }: LoginProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signin') await onSignIn(email, password)
      else await onSignUp(email, password)
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined
      setError((code && ERROR_MESSAGES[code]) ?? 'Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-10 shadow-card">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-white">
          📅
        </div>
        <h1 className="text-center text-[22px] font-semibold tracking-tight">Beschikbaarheidsplanning CUS</h1>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-muted">
          {mode === 'signin' ? 'Log in om je beschikbaarheid door te geven.' : 'Maak een account aan om te starten.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-muted">E-mailadres</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
              placeholder="jij@bedrijf.nl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-muted">Wachtwoord</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-[15px] outline-none ring-accent/30 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[13px] text-unavailable">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Bezig…' : mode === 'signin' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError(null)
          }}
          className="mt-5 w-full text-center text-[13px] font-medium text-accent"
        >
          {mode === 'signin' ? 'Nog geen account? Account aanmaken' : 'Al een account? Inloggen'}
        </button>
      </div>
    </div>
  )
}
