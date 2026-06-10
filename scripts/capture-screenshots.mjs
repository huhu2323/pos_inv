import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173'
const OUT_DIR = new URL('../docs/screenshots', import.meta.url).pathname

async function screenshot(page, name) {
  const path = join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  console.log(`Saved ${path}`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await screenshot(page, '01-login-setup')

  await page.getByText('Initial setup').waitFor()
  await page.getByLabel('Display name').fill('Demo Admin')
  await page.getByLabel('Username').fill('admin')
  const passwordFields = page.locator('input[type="password"]')
  await passwordFields.nth(0).fill('password123')
  await passwordFields.nth(1).fill('password123')
  await page.getByRole('button', { name: 'Create admin account' }).click()
  await page.waitForURL('**/#/dashboard')
  await page.waitForTimeout(1000)
  await screenshot(page, '02-dashboard')

  await page.goto(`${BASE_URL}/#/pos`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await screenshot(page, '03-pos')

  await page.goto(`${BASE_URL}/#/products`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await screenshot(page, '04-products')

  await page.goto(`${BASE_URL}/#/settings`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await screenshot(page, '05-settings')

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
