import { createContext } from 'react'
import type { AuthUser } from '@/lib/db/types'

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  needsSetup: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setupAdmin: (input: {
    username: string
    password: string
    displayName: string
  }) => Promise<void>
  setupAdminFromAdmin: (input: {
    username: string
    password: string
    displayName: string
    apiUrl: string
    tenantId: string
    posId: string
  }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
