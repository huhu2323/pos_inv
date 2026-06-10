import { Capacitor } from '@capacitor/core'
import { TofuPosDatabase, dexieDb } from './dexieDatabase'
import { migrateFromDexieIfNeeded } from './sqlite/migrateFromDexie'
import { SqliteDatabase, createSqliteDatabase } from './sqlite/sqliteDatabase'

export type TofuPosDb = TofuPosDatabase | SqliteDatabase

let initializedDb: TofuPosDb | null = null

function usesNativeSqlite(): boolean {
  // Android/iOS Capacitor builds use native SQLite instead of WebView IndexedDB.
  return Capacitor.isNativePlatform()
}

export async function initDatabase(): Promise<void> {
  if (initializedDb) {
    return
  }

  if (usesNativeSqlite()) {
    const sqliteDb = await createSqliteDatabase()
    await migrateFromDexieIfNeeded(sqliteDb)
    initializedDb = sqliteDb
    return
  }

  initializedDb = dexieDb
}

function getDatabase(): TofuPosDb {
  if (!initializedDb) {
    throw new Error('Database not initialized. Call initDatabase() before using the app.')
  }

  return initializedDb
}

export const db = new Proxy({} as TofuPosDatabase, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDatabase(), property, receiver)
    return typeof value === 'function' ? value.bind(getDatabase()) : value
  },
})
