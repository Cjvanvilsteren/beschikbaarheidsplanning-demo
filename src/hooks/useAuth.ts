import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  return {
    user,
    loading,
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signUp: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
    signOutUser: () => signOut(auth),
  }
}
