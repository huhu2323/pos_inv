import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  DataArchive,
  InventoryLog,
  Invoice,
  Product,
  Sale,
  Session,
  User,
} from './types'

interface StoredImageRecord {
  id: string
  blob: Blob
  mimeType: string
  createdAt: Date
}

export class TofuPosDatabase extends Dexie {
  users!: EntityTable<User, 'id'>
  sessions!: EntityTable<Session, 'id'>
  products!: EntityTable<Product, 'id'>
  images!: EntityTable<StoredImageRecord, 'id'>
  inventoryLogs!: EntityTable<InventoryLog, 'id'>
  sales!: EntityTable<Sale, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  invoices!: EntityTable<Invoice, 'id'>
  dataArchives!: EntityTable<DataArchive, 'id'>

  constructor() {
    super('tofu-pos-term')

    this.version(1).stores({
      users: '++id, &username, role',
      sessions: '++id, &token, userId, expiresAt',
    })

    this.version(2).stores({
      users: '++id, &username, role',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, name, createdAt',
    })

    this.version(3)
      .stores({
        users: '++id, &username, role',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, name, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('products')
          .toCollection()
          .modify((product: Record<string, unknown>) => {
            if (typeof product.price === 'number' && product.defaultPrice === undefined) {
              product.defaultPrice = product.price
              delete product.price
            }

            if (typeof product.defaultPrice !== 'number') {
              product.defaultPrice = 0
            }

            product.image = typeof product.image === 'string' ? product.image : ''

            if (Array.isArray(product.variants)) {
              product.variants = product.variants.map((variant: Record<string, unknown>) => ({
                ...variant,
                image: typeof variant.image === 'string' ? variant.image : '',
              }))
            }
          })
      })

    this.version(4)
      .stores({
        users: '++id, &username, role',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('products')
          .toCollection()
          .modify((product: Record<string, unknown>) => {
            product.barcode = typeof product.barcode === 'string' ? product.barcode : ''
          })
      })

    this.version(5).stores({
      users: '++id, &username, role',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, &barcode, name, createdAt',
      images: 'id, createdAt',
    })

    this.version(6).stores({
      users: '++id, &username, role, createdAt',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, &barcode, name, createdAt',
      images: 'id, createdAt',
    })

    this.version(7)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('products')
          .toCollection()
          .modify((product: Record<string, unknown>) => {
            product.qty = typeof product.qty === 'number' ? product.qty : 0

            if (Array.isArray(product.variants)) {
              product.variants = product.variants.map((variant: Record<string, unknown>) => ({
                ...variant,
                qty: typeof variant.qty === 'number' ? variant.qty : 0,
              }))
            }
          })
      })

    this.version(8)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('products')
          .toCollection()
          .modify((product: Record<string, unknown>) => {
            product.active = product.active === 0 ? 0 : 1
          })
      })

    this.version(9).stores({
      users: '++id, &username, role, createdAt',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, &barcode, name, createdAt, active',
      images: 'id, createdAt',
      inventoryLogs: 'id, productId, type, createdAt',
      sales: 'id, status, createdAt, createdById',
    })

    this.version(10)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('sales')
          .toCollection()
          .modify((sale: Record<string, unknown>) => {
            sale.type = sale.type === 'void' ? 'void' : 'sale'
          })
      })

    this.version(11).stores({
      users: '++id, &username, role, createdAt',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, &barcode, name, createdAt, active',
      images: 'id, createdAt',
      inventoryLogs: 'id, productId, type, createdAt',
      sales: 'id, type, status, createdAt, createdById, originalSaleId',
      settings: 'id',
    })

    this.version(12)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            settings.vatPercentage =
              typeof settings.vatPercentage === 'number' ? settings.vatPercentage : 12
          })
      })

    this.version(13)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            settings.receiptMainText =
              typeof settings.receiptMainText === 'string' ? settings.receiptMainText : 'Tofu POS'
            settings.receiptAddress =
              typeof settings.receiptAddress === 'string' ? settings.receiptAddress : ''
            settings.receiptTin =
              typeof settings.receiptTin === 'string' ? settings.receiptTin : ''
            settings.receiptBottomText =
              typeof settings.receiptBottomText === 'string' ? settings.receiptBottomText : 'Thank You'
          })
      })

    this.version(14)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            settings.receiptContactNumber =
              typeof settings.receiptContactNumber === 'string' ? settings.receiptContactNumber : ''
          })
      })

    this.version(15)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
        invoices: 'id, &invoiceNumber, &saleId, createdAt, createdById',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            settings.invoiceNextNumber =
              typeof settings.invoiceNextNumber === 'number' ? settings.invoiceNextNumber : 0
          })
      })

    this.version(16).stores({
      users: '++id, &username, role, createdAt',
      sessions: '++id, &token, userId, expiresAt',
      products: 'id, &shortName, &barcode, name, createdAt, active',
      images: 'id, createdAt',
      inventoryLogs: 'id, productId, type, createdAt',
      sales: 'id, type, status, createdAt, createdById, originalSaleId',
      settings: 'id',
      invoices: 'id, &invoiceNumber, saleId, createdAt, createdById',
    })

    this.version(17)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
        invoices: 'id, &invoiceNumber, saleId, createdAt, createdById',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            if (typeof settings.autoInvoice !== 'boolean' && typeof settings.directInvoice === 'boolean') {
              settings.autoInvoice = settings.directInvoice
            }

            delete settings.directInvoice
          })
      })

    this.version(18)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
        invoices: 'id, &invoiceNumber, saleId, createdAt, createdById',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            if (typeof settings.continuousBarcodeScanning !== 'boolean') {
              settings.continuousBarcodeScanning = false
            }
          })
      })

    this.version(20)
      .stores({
        users: '++id, &username, role, createdAt',
        sessions: '++id, &token, userId, expiresAt',
        products: 'id, &shortName, &barcode, name, createdAt, active',
        images: 'id, createdAt',
        inventoryLogs: 'id, productId, type, createdAt',
        sales: 'id, type, status, createdAt, createdById, originalSaleId',
        settings: 'id',
        invoices: 'id, &invoiceNumber, saleId, createdAt, createdById',
        dataArchives: 'id, status, createdAt, archivedById',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('settings')
          .toCollection()
          .modify((settings: Record<string, unknown>) => {
            if (typeof settings.autoPrint !== 'string') {
              if (typeof settings.autoInvoice === 'boolean') {
                settings.autoPrint = settings.autoInvoice ? 'invoice' : 'off'
              } else if (typeof settings.directInvoice === 'boolean') {
                settings.autoPrint = settings.directInvoice ? 'invoice' : 'off'
              } else {
                settings.autoPrint = 'off'
              }
            }

            delete settings.autoInvoice
            delete settings.directInvoice

            if (typeof settings.officialReceiptMainText !== 'string') {
              settings.officialReceiptMainText = 'Tofu POS'
            }

            if (typeof settings.officialReceiptAddress !== 'string') {
              settings.officialReceiptAddress = ''
            }

            if (typeof settings.officialReceiptContactNumber !== 'string') {
              settings.officialReceiptContactNumber = ''
            }

            if (typeof settings.officialReceiptTin !== 'string') {
              settings.officialReceiptTin = ''
            }

            if (typeof settings.officialReceiptBottomText !== 'string') {
              settings.officialReceiptBottomText = 'Thank You'
            }
          })
      })
  }
}

export const dexieDb = new TofuPosDatabase()
