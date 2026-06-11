import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { ThemeModeProvider } from '@/shared/theme/ThemeModeProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeModeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeModeProvider>
  )
}
