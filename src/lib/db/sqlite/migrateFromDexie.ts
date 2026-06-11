import { dexieDb } from '@/lib/db/dexieDatabase'
import type { SqliteDatabase } from './sqliteDatabase'

export async function migrateFromDexieIfNeeded(sqliteDb: SqliteDatabase): Promise<void> {
  const existingUsers = await sqliteDb.users.count()
  if (existingUsers > 0) {
    return
  }

  let dexieUserCount: number
  try {
    dexieUserCount = await dexieDb.users.count()
  } catch {
    return
  }

  if (dexieUserCount === 0) {
    return
  }

  const [
    users,
    sessions,
    products,
    images,
    inventoryLogs,
    sales,
    settings,
    invoices,
    dataArchives,
  ] = await Promise.all([
    dexieDb.users.toArray(),
    dexieDb.sessions.toArray(),
    dexieDb.products.toArray(),
    dexieDb.images.toArray(),
    dexieDb.inventoryLogs.toArray(),
    dexieDb.sales.toArray(),
    dexieDb.settings.toArray(),
    dexieDb.invoices.toArray(),
    dexieDb.dataArchives.toArray(),
  ])

  await sqliteDb.transaction('rw', async () => {
    for (const user of users) {
      await sqliteDb.users.put(user)
    }

    for (const session of sessions) {
      await sqliteDb.sessions.put(session)
    }

    for (const product of products) {
      await sqliteDb.products.put(product)
    }

    for (const image of images) {
      await sqliteDb.images.put({
        id: image.id,
        blob: image.blob,
        mimeType: image.mimeType,
        createdAt: image.createdAt,
      })
    }

    for (const log of inventoryLogs) {
      await sqliteDb.inventoryLogs.add(log)
    }

    for (const sale of sales) {
      await sqliteDb.sales.put(sale)
    }

    for (const setting of settings) {
      await sqliteDb.settings.put(setting)
    }

    for (const invoice of invoices) {
      await sqliteDb.invoices.add(invoice)
    }

    for (const archive of dataArchives) {
      await sqliteDb.dataArchives.put(archive)
    }
  })
}
