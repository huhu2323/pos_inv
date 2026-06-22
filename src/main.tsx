import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initDatabase } from '@/lib/db/database'
import './index.css'

async function bootstrap() {
  await initDatabase()

  const { default: App } = await import('@/app/App.tsx')
  const root = document.getElementById('root')

  if (!root) {
    throw new Error('Root element not found')
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
