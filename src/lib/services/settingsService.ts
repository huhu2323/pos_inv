import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/database'
import type { AppSettings } from '@/lib/db/types'

const SETTINGS_ID = 'app' as const
const BCRYPT_ROUNDS = 12

export type SettingsUpdateInput = {
  masterPassword?: string
  autoInvoice: boolean
  continuousBarcodeScanning: boolean
  vatPercentage: number
  receiptMainText: string
  receiptAddress: string
  receiptContactNumber: string
  receiptTin: string
  receiptBottomText: string
}

function createDefaultSettings(): AppSettings {
  const now = new Date()
  return {
    id: SETTINGS_ID,
    masterPasswordHash: '',
    autoInvoice: false,
    continuousBarcodeScanning: false,
    vatPercentage: 12,
    receiptMainText: 'Tofu POS',
    receiptAddress: '',
    receiptContactNumber: '',
    receiptTin: '',
    receiptBottomText: 'Thank You',
    invoiceNextNumber: 0,
    updatedAt: now,
  }
}

function normalizeSettings(settings: AppSettings & { directInvoice?: boolean }): AppSettings {
  return {
    ...settings,
    autoInvoice:
      typeof settings.autoInvoice === 'boolean'
        ? settings.autoInvoice
        : typeof settings.directInvoice === 'boolean'
          ? settings.directInvoice
          : false,
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
    invoiceNextNumber:
      typeof settings.invoiceNextNumber === 'number' ? settings.invoiceNextNumber : 0,
  }
}

async function hashMasterPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)

  if (!existing) {
    return createDefaultSettings()
  }

  return normalizeSettings(existing)
}

export async function updateSettings(input: SettingsUpdateInput): Promise<AppSettings> {
  const existing = await getSettings()
  const masterPassword = input.masterPassword?.trim()

  if (!Number.isFinite(input.vatPercentage) || input.vatPercentage < 0 || input.vatPercentage > 100) {
    throw new Error('VAT percentage must be between 0 and 100')
  }

  const updated: AppSettings = {
    ...existing,
    autoInvoice: input.autoInvoice,
    continuousBarcodeScanning: input.continuousBarcodeScanning,
    vatPercentage: input.vatPercentage,
    receiptMainText: input.receiptMainText.trim(),
    receiptAddress: input.receiptAddress.trim(),
    receiptContactNumber: input.receiptContactNumber.trim(),
    receiptTin: input.receiptTin.trim(),
    receiptBottomText: input.receiptBottomText.trim() || 'Thank You',
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
