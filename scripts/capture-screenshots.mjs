import { chromium } from 'playwright'
import { execSync, spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import net from 'node:net'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173'
const OUT_DIR = join(ROOT_DIR, 'docs/screenshots')
const PREVIEW_PORT = new URL(BASE_URL).port || '4173'

async function isServerUp(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch {
    return false
  }
}

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port: Number(port), host })
    const finish = (inUse) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(inUse)
    }

    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(1000, () => finish(true))
  })
}

function freePort(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      const pids = new Set(
        output
          .split('\n')
          .map((line) => line.trim().split(/\s+/).at(-1))
          .filter((pid) => pid && /^\d+$/.test(pid)),
      )
      for (const pid of pids) {
        console.log(`Stopping process ${pid} on port ${port}...`)
        execSync(`taskkill /PID ${pid} /F`)
      }
    } catch {
      // Port already free.
    }
    return
  }

  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)

    for (const pid of pids) {
      console.log(`Stopping process ${pid} on port ${port}...`)
      try {
        process.kill(Number(pid), 'SIGKILL')
      } catch {
        execSync(`kill -9 ${pid}`)
      }
    }
  } catch {
    // Port already free.
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isServerUp(url)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(
    `Preview server not reachable at ${url}.\n` +
      'Start it in another terminal:\n' +
      `  npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
  )
}

function isPortBound(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      return output.includes('LISTENING')
    } catch {
      return false
    }
  }

  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim()
    return Boolean(pids)
  } catch {
    return false
  }
}

async function startPreviewServer() {
  if (await isServerUp(BASE_URL)) {
    console.log(`Using preview server at ${BASE_URL}`)
    return null
  }

  if (isPortBound(PREVIEW_PORT) || (await isPortInUse(PREVIEW_PORT))) {
    console.log(`Clearing port ${PREVIEW_PORT} before starting preview...`)
    freePort(PREVIEW_PORT)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (await isServerUp(BASE_URL)) {
    console.log(`Using preview server at ${BASE_URL}`)
    return null
  }

  console.log(`Starting preview server on port ${PREVIEW_PORT}...`)

  const child = spawn(
    'npx',
    ['vite', 'preview', '--port', PREVIEW_PORT, '--strictPort'],
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  )

  let spawnFailed = false
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      spawnFailed = true
    }
  })

  try {
    await waitForServer(BASE_URL)
    return child
  } catch (error) {
    child.kill()
    if (spawnFailed) {
      throw new Error(`Could not start preview server on port ${PREVIEW_PORT}.`, {
        cause: error,
      })
    }
    throw error
  }
}

async function screenshot(page, name) {
  const path = join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  console.log(`Saved ${path}`)
}

async function goto(page, path) {
  await page.goto(`${BASE_URL}/#${path}`, { waitUntil: 'load', timeout: 60_000 })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const autoPreview = process.env.SCREENSHOT_AUTO_PREVIEW !== '0'
  const previewProcess = autoPreview ? await startPreviewServer() : null

  if (!previewProcess) {
    await waitForServer(BASE_URL)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  try {
    await goto(page, '/login')
    await page.getByText('Choose setup').waitFor({ timeout: 30_000 })
    await page.getByText('Initial setup').waitFor()
    await page.waitForTimeout(800)
    await screenshot(page, '01-login-setup')

    await page.getByRole('button', { name: /Setup from scratch/i }).click()
    await page.getByLabel('Display name').waitFor({ timeout: 10_000 })
    await page.getByLabel('Display name').fill('Demo Admin')
    await page.getByLabel('Username').fill('admin')
    const passwordFields = page.locator('input[type="password"]')
    await passwordFields.nth(0).fill('password123')
    await passwordFields.nth(1).fill('password123')
    await page.getByRole('button', { name: 'Create admin account' }).click()
    await page.waitForURL('**/#/dashboard', { timeout: 30_000 })
    await page.waitForTimeout(1000)
    await screenshot(page, '02-dashboard')

    await goto(page, '/pos')
    await page.waitForTimeout(1000)
    await screenshot(page, '03-pos')

    await goto(page, '/products')
    await page.waitForTimeout(800)
    await screenshot(page, '04-products')

    await goto(page, '/settings')
    await page.waitForTimeout(800)
    await screenshot(page, '05-settings')
  } finally {
    await browser.close()
    if (previewProcess) {
      previewProcess.kill()
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
