import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser, UserRole } from '@/lib/db/types'
import {
  cleanupExpiredSessions,
  createUser,
  getCurrentUser,
  hasUsers,
  login,
  logout,
} from '@/features/auth/api/authService'
import { initializeSettings } from '@/lib/services/settingsService'
import { AuthContext } from '@/features/auth/context/authContextState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      await cleanupExpiredSessions()
      const usersExist = await hasUsers()

      if (!active) {
        return
      }

      setNeedsSetup(!usersExist)

      if (usersExist) {
        const currentUser = await getCurrentUser()
        if (active) {
          setUser(currentUser)
        }
      }

      if (active) {
        setLoading(false)
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  const handleLogin = useCallback(async (username: string, password: string) => {
    const authenticatedUser = await login(username, password)
    setUser(authenticatedUser)
    setNeedsSetup(false)
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const handleSetupAdmin = useCallback(
    async (input: { username: string; password: string; displayName: string }) => {
      const adminUser = await createUser({
        ...input,
        role: 'admin' as UserRole,
      })
      await initializeSettings(input.password)
      const authenticatedUser = await login(input.username, input.password)
      setUser(authenticatedUser ?? adminUser)
      setNeedsSetup(false)
    },
    [],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      needsSetup,
      login: handleLogin,
      logout: handleLogout,
      setupAdmin: handleSetupAdmin,
    }),
    [user, loading, needsSetup, handleLogin, handleLogout, handleSetupAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
