import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getUser, hadSession, onAuthChange, signOut as doSignOut } from '../lib/auth'
import { hasBackend } from '../lib/backend'

// Signed-in customer, shared by the header, checkout, account page and the saved bag.
const AuthContext = createContext({ user: null, ready: true, ensure: async () => null, signOut: async () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // ready = we know whether someone is signed in. First-time visitors never load the auth library.
  const [ready, setReady] = useState(!hasBackend || !hadSession())
  const listening = useRef(false)
  const listen = useCallback(() => {
    if (listening.current) return
    listening.current = true
    onAuthChange(setUser)
  }, [])

  const start = useCallback(async () => {
    const u = await getUser()
    setUser(u)
    setReady(true)
    return u
  }, [])

  useEffect(() => {
    if (!hasBackend || !hadSession()) return
    start().then(listen)
  }, [start, listen])

  // Load auth on demand (checkout / account) and start listening for sign-in.
  const ensure = useCallback(async () => {
    if (!hasBackend) return null
    const u = await start()
    listen()
    return u
  }, [start, listen])

  const value = useMemo(() => ({ user, ready, ensure, setUser, signOut: async () => { await doSignOut(); setUser(null) } }), [user, ready, ensure])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
