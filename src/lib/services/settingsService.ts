import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/database'
import type { AppSettings, AutoPrintMode } from '@/lib/db/types'

const SETTINGS_ID = 'app' as const
const BCRYPT_ROUNDS = 12

const AUTO_PRINT_MODES: AutoPrintMode[] = [
  'off',
  'invoice',
  'official_receipt',
  'acknowledgement_receipt',
]

export type SettingsUpdateInput = {
  masterPassword?: string
  autoPrint: AutoPrintMode
  continuousBarcodeScanning: boolean
  vatPercentage: number
  receiptMainText: string
  receiptAddress: string
  receiptContactNumber: string
  receiptTin: string
  receiptBottomText: string
  officialReceiptMainText: string
  officialReceiptAddress: string
  officialReceiptContactNumber: string
  officialReceiptTin: string
  officialReceiptBottomText: string
  syncApiUrl?: string
  syncTenantId?: string
  syncEmail?: string
  syncPassword?: string
}

function createDefaultSettings(): AppSettings {
  const now = new Date()
  return {
    id: SETTINGS_ID,
    masterPasswordHash: '',
    autoPrint: 'off',
    continuousBarcodeScanning: false,
    vatPercentage: 12,
    receiptMainText: 'Tofu POS',
    receiptAddress: '',
    receiptContactNumber: '',
    receiptTin: '',
    receiptBottomText: 'Thank You',
    officialReceiptMainText: 'Tofu POS',
    officialReceiptAddress: '',
    officialReceiptContactNumber: '',
    officialReceiptTin: '',
    officialReceiptBottomText: 'Thank You',
    invoiceNextNumber: 0,
    syncApiUrl: '',
    syncTenantId: '',
    syncEmail: '',
    syncPassword: '',
    updatedAt: now,
  }
}

function parseAutoPrint(value: unknown, legacyAutoInvoice?: unknown): AutoPrintMode {
  if (typeof value === 'string' && AUTO_PRINT_MODES.includes(value as AutoPrintMode)) {
    return value as AutoPrintMode
  }

  if (typeof legacyAutoInvoice === 'boolean') {
    return legacyAutoInvoice ? 'invoice' : 'off'
  }

  return 'off'
}

function isSettingsComplete(
  settings: AppSettings & { autoInvoice?: boolean; directInvoice?: boolean },
): boolean {
  return (
    typeof settings.masterPasswordHash === 'string' &&
    typeof settings.autoPrint === 'string' &&
    typeof settings.continuousBarcodeScanning === 'boolean' &&
    typeof settings.vatPercentage === 'number' &&
    typeof settings.receiptMainText === 'string' &&
    typeof settings.receiptAddress === 'string' &&
    typeof settings.receiptContactNumber === 'string' &&
    typeof settings.receiptTin === 'string' &&
    typeof settings.receiptBottomText === 'string' &&
    typeof settings.officialReceiptMainText === 'string' &&
    typeof settings.officialReceiptAddress === 'string' &&
    typeof settings.officialReceiptContactNumber === 'string' &&
    typeof settings.officialReceiptTin === 'string' &&
    typeof settings.officialReceiptBottomText === 'string' &&
    typeof settings.invoiceNextNumber === 'number' &&
    typeof settings.syncApiUrl === 'string' &&
    typeof settings.syncTenantId === 'string' &&
    typeof settings.syncEmail === 'string' &&
    typeof settings.syncPassword === 'string'
  )
}

function normalizeSettings(
  settings: AppSettings & { autoInvoice?: boolean; directInvoice?: boolean },
): AppSettings {
  const legacyAutoInvoice =
    typeof settings.autoInvoice === 'boolean'
      ? settings.autoInvoice
      : typeof settings.directInvoice === 'boolean'
        ? settings.directInvoice
        : undefined

  return {
    ...settings,
    autoPrint: parseAutoPrint(settings.autoPrint, legacyAutoInvoice),
    continuousBarcodeScanning:
      typeof settings.continuousBarcodeScanning === 'boolean'
        ? settings.continuousBarcodeScanning
        : false,
    vatPercentage:
      typeof settings.vatPercentage === 'number' ? settings.vatPercentage : 12,
    receiptMainText:
      typeof settings.receiptMainText === 'string' ? settings.receiptMainText : 'Tofu POS',
    receiptAddress:
      typeof settings.receiptAddress === 'string' ? settings.receiptAddress : '',
    receiptContactNumber:
      typeof settings.receiptContactNumber === 'string' ? settings.receiptContactNumber : '',
    receiptTin: typeof settings.receiptTin === 'string' ? settings.receiptTin : '',
    receiptBottomText:
      typeof settings.receiptBottomText === 'string' ? settings.receiptBottomText : 'Thank You',
    officialReceiptMainText:
      typeof settings.officialReceiptMainText === 'string'
        ? settings.officialReceiptMainText
        : 'Tofu POS',
    officialReceiptAddress:
      typeof settings.officialReceiptAddress === 'string'
        ? settings.officialReceiptAddress
        : '',
    officialReceiptContactNumber:
      typeof settings.officialReceiptContactNumber === 'string'
        ? settings.officialReceiptContactNumber
        : '',
    officialReceiptTin:
      typeof settings.officialReceiptTin === 'string' ? settings.officialReceiptTin : '',
    officialReceiptBottomText:
      typeof settings.officialReceiptBottomText === 'string'
        ? settings.officialReceiptBottomText
        : 'Thank You',
    invoiceNextNumber:
      typeof settings.invoiceNextNumber === 'number' ? settings.invoiceNextNumber : 0,
    syncApiUrl: typeof settings.syncApiUrl === 'string' ? settings.syncApiUrl : '',
    syncTenantId: typeof settings.syncTenantId === 'string' ? settings.syncTenantId : '',
    syncEmail: typeof settings.syncEmail === 'string' ? settings.syncEmail : '',
    syncPassword: typeof settings.syncPassword === 'string' ? settings.syncPassword : '',
  }
}

async function hashMasterPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function persistSettings(settings: AppSettings): Promise<AppSettings> {
  await db.settings.put(settings)
  return settings
}

export async function initializeSettings(masterPassword: string): Promise<AppSettings> {
  const settings = createDefaultSettings()
  settings.masterPasswordHash = await hashMasterPassword(masterPassword)
  return persistSettings(settings)
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)

  if (!existing) {
    return persistSettings(createDefaultSettings())
  }

  if (isSettingsComplete(existing)) {
    return existing
  }

  return persistSettings({
    ...normalizeSettings(existing),
    updatedAt: new Date(),
  })
}

export async function updateSettings(input: SettingsUpdateInput): Promise<AppSettings> {
  const existing = await getSettings()
  const masterPassword = input.masterPassword?.trim()

  if (!Number.isFinite(input.vatPercentage) || input.vatPercentage < 0 || input.vatPercentage > 100) {
    throw new Error('VAT percentage must be between 0 and 100')
  }

  if (!AUTO_PRINT_MODES.includes(input.autoPrint)) {
    throw new Error('Invalid auto print mode')
  }

  const updated: AppSettings = {
    ...existing,
    autoPrint: input.autoPrint,
    continuousBarcodeScanning: input.continuousBarcodeScanning,
    vatPercentage: input.vatPercentage,
    receiptMainText: input.receiptMainText.trim(),
    receiptAddress: input.receiptAddress.trim(),
    receiptContactNumber: input.receiptContactNumber.trim(),
    receiptTin: input.receiptTin.trim(),
    receiptBottomText: input.receiptBottomText.trim() || 'Thank You',
    officialReceiptMainText: input.officialReceiptMainText.trim() || 'Tofu POS',
    officialReceiptAddress: input.officialReceiptAddress.trim(),
    officialReceiptContactNumber: input.officialReceiptContactNumber.trim(),
    officialReceiptTin: input.officialReceiptTin.trim(),
    officialReceiptBottomText: input.officialReceiptBottomText.trim() || 'Thank You',
    syncApiUrl: (input.syncApiUrl ?? '').trim(),
    syncTenantId: (input.syncTenantId ?? '').trim(),
    syncEmail: (input.syncEmail ?? '').trim(),
    syncPassword: input.syncPassword ?? '',
    updatedAt: new Date(),
  }

  if (masterPassword !== undefined) {
    updated.masterPasswordHash = masterPassword
      ? await hashMasterPassword(masterPassword)
      : ''
  }

  await db.settings.put(updated)
  return updated
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  const settings = await getSettings()

  if (!settings.masterPasswordHash) {
    throw new Error('Master password is not configured in Settings')
  }

  return bcrypt.compare(password, settings.masterPasswordHash)
}

export async function hasMasterPassword(): Promise<boolean> {
  const settings = await getSettings()
  return Boolean(settings.masterPasswordHash)
}
