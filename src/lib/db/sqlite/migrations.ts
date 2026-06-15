import type { SQLiteDBConnection } from '@capacitor-community/sqlite'

const SETTINGS_MIGRATIONS: Array<{ column: string; definition: string }> = [
  { column: 'autoPrint', definition: "TEXT NOT NULL DEFAULT 'off'" },
  { column: 'officialReceiptMainText', definition: "TEXT NOT NULL DEFAULT 'Tofu POS'" },
  { column: 'officialReceiptAddress', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptContactNumber', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptTin', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptBottomText', definition: "TEXT NOT NULL DEFAULT 'Thank You'" },
]

async function getTableColumns(
  connection: SQLiteDBConnection,
  table: string,
): Promise<Set<string>> {
  const result = await connection.query(`PRAGMA table_info(${table})`)
  const rows = result.values ?? []
  return new Set(rows.map((row) => String(row.name)))
}

export async function migrateSqliteSchema(connection: SQLiteDBConnection): Promise<void> {
  const settingsColumns = await getTableColumns(connection, 'settings')

  for (const migration of SETTINGS_MIGRATIONS) {
    if (!settingsColumns.has(migration.column)) {
      await connection.run(
        `ALTER TABLE settings ADD COLUMN ${migration.column} ${migration.definition}`,
        [],
        false,
      )
    }
  }

  if (settingsColumns.has('autoInvoice') && settingsColumns.has('autoPrint')) {
    await connection.run(
      `UPDATE settings SET autoPrint = CASE WHEN autoInvoice = 1 THEN 'invoice' ELSE 'off' END WHERE autoPrint = 'off'`,
      [],
      false,
    )
  } else if (settingsColumns.has('autoInvoice') && !settingsColumns.has('autoPrint')) {
    await connection.run(
      `ALTER TABLE settings ADD COLUMN autoPrint TEXT NOT NULL DEFAULT 'off'`,
      [],
      false,
    )
    await connection.run(
      `UPDATE settings SET autoPrint = CASE WHEN autoInvoice = 1 THEN 'invoice' ELSE 'off' END`,
      [],
      false,
    )
  }
}
