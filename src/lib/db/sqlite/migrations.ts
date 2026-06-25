import type { SQLiteDBConnection } from '@capacitor-community/sqlite'

const SETTINGS_MIGRATIONS: Array<{ column: string; definition: string }> = [
  { column: 'autoPrint', definition: "TEXT NOT NULL DEFAULT 'off'" },
  { column: 'officialReceiptMainText', definition: "TEXT NOT NULL DEFAULT 'Tofu POS'" },
  { column: 'officialReceiptAddress', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptContactNumber', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptTin', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'officialReceiptBottomText', definition: "TEXT NOT NULL DEFAULT 'Thank You'" },
  { column: 'syncApiUrl', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'syncTenantId', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'syncEmail', definition: "TEXT NOT NULL DEFAULT ''" },
  { column: 'syncPassword', definition: "TEXT NOT NULL DEFAULT ''" },
]

const PRODUCT_MIGRATIONS: Array<{ column: string; definition: string }> = [
  { column: 'unitOfMeasure', definition: "TEXT NOT NULL DEFAULT 'pc'" },
  { column: 'initialQty', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { column: 'lowStockAlertMode', definition: "TEXT NOT NULL DEFAULT 'off'" },
  { column: 'lowStockAlertValue', definition: 'INTEGER' },
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

  const productColumns = await getTableColumns(connection, 'products')

  for (const migration of PRODUCT_MIGRATIONS) {
    if (!productColumns.has(migration.column)) {
      await connection.run(
        `ALTER TABLE products ADD COLUMN ${migration.column} ${migration.definition}`,
        [],
        false,
      )
    }
  }

  const refreshedProductColumns = await getTableColumns(connection, 'products')

  if (refreshedProductColumns.has('initialQty')) {
    await connection.run(
      `UPDATE products SET initialQty = qty WHERE initialQty = 0 OR initialQty IS NULL`,
      [],
      false,
    )
  }
}
