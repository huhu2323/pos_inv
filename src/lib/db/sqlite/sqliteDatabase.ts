import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite'
import type {
  AppSettings,
  DataArchive,
  InventoryLog,
  Invoice,
  Product,
  Sale,
  Session,
  User,
} from '@/lib/db/types'
import { SQLITE_SCHEMA_STATEMENTS } from './schema'
import {
  dataArchiveToValues,
  imageToValues,
  inventoryLogToValues,
  invoiceToValues,
  productToValues,
  rowToDataArchive,
  rowToImage,
  rowToInventoryLog,
  rowToInvoice,
  rowToProduct,
  rowToSale,
  rowToSession,
  rowToSettings,
  rowToUser,
  saleToValues,
  sessionToValues,
  settingsToValues,
  userToValues,
} from './rows'

const DB_NAME = 'tofu-pos-term'

interface StoredImageRecord {
  id: string
  blob: Blob
  mimeType: string
  createdAt: Date
}

type TableName =
  | 'users'
  | 'sessions'
  | 'products'
  | 'images'
  | 'inventoryLogs'
  | 'sales'
  | 'settings'
  | 'invoices'
  | 'dataArchives'

function getRows(result: { values?: Array<Record<string, unknown>> }): Record<string, unknown>[] {
  return result.values ?? []
}

class WhereEqualsQuery<T> {
  private table: SqliteTable<T>
  private field: string
  private value: unknown

  constructor(table: SqliteTable<T>, field: string, value: unknown) {
    this.table = table
    this.field = field
    this.value = value
  }

  async first(): Promise<T | undefined> {
    const rows = await this.table.queryWhere(`${this.field} = ?`, [this.value])
    return rows[0]
  }

  async delete(): Promise<void> {
    await this.table.runWhere(`DELETE FROM ${this.table.name} WHERE ${this.field} = ?`, [this.value])
  }

  async count(): Promise<number> {
    return this.table.countWhere(`${this.field} = ?`, [this.value])
  }

  async toArray(): Promise<T[]> {
    return this.table.queryWhere(`${this.field} = ?`, [this.value])
  }
}

class WhereBelowQuery<T> {
  private table: SqliteTable<T>
  private field: string
  private value: unknown

  constructor(table: SqliteTable<T>, field: string, value: unknown) {
    this.table = table
    this.field = field
    this.value = value
  }

  async delete(): Promise<void> {
    await this.table.runWhere(`DELETE FROM ${this.table.name} WHERE ${this.field} < ?`, [this.value])
  }
}

class WhereBetweenQuery<T> {
  private table: SqliteTable<T>
  private field: string
  private lower: unknown
  private upper: unknown

  constructor(table: SqliteTable<T>, field: string, lower: unknown, upper: unknown) {
    this.table = table
    this.field = field
    this.lower = lower
    this.upper = upper
  }

  async toArray(): Promise<T[]> {
    return this.table.queryWhere(
      `${this.field} >= ? AND ${this.field} <= ?`,
      [this.lower, this.upper],
    )
  }
}

class WhereQuery<T> {
  private table: SqliteTable<T>
  private field: string

  constructor(table: SqliteTable<T>, field: string) {
    this.table = table
    this.field = field
  }

  equals(value: unknown): WhereEqualsQuery<T> {
    return new WhereEqualsQuery(this.table, this.field, value)
  }

  below(value: unknown): WhereBelowQuery<T> {
    return new WhereBelowQuery(this.table, this.field, value)
  }

  between(
    lower: unknown,
    upper: unknown,
    includeLower = true,
    includeUpper = true,
  ): WhereBetweenQuery<T> {
    // Dexie passes inclusive flags; SQLite queries always use inclusive bounds.
    void includeLower
    void includeUpper
    return new WhereBetweenQuery(this.table, this.field, lower, upper)
  }
}

class OrderByQuery<T> {
  private reversed = false
  private table: SqliteTable<T>
  private field: string

  constructor(table: SqliteTable<T>, field: string) {
    this.table = table
    this.field = field
  }

  reverse(): this {
    this.reversed = true
    return this
  }

  async toArray(): Promise<T[]> {
    const direction = this.reversed ? 'DESC' : 'ASC'
    return this.table.queryAll(`ORDER BY ${this.field} ${direction}`)
  }
}

abstract class SqliteTable<T> {
  protected connection: SQLiteDBConnection
  readonly name: TableName

  constructor(connection: SQLiteDBConnection, name: TableName) {
    this.connection = connection
    this.name = name
  }

  protected abstract mapRow(row: Record<string, unknown>): T

  async queryAll(orderClause = ''): Promise<T[]> {
    const statement = `SELECT * FROM ${this.name} ${orderClause}`.trim()
    const result = await this.connection.query(statement)
    return getRows(result).map((row) => this.mapRow(row))
  }

  async queryWhere(whereClause: string, values: unknown[]): Promise<T[]> {
    const statement = `SELECT * FROM ${this.name} WHERE ${whereClause}`
    const result = await this.connection.query(statement, values)
    return getRows(result).map((row) => this.mapRow(row))
  }

  async countWhere(whereClause: string, values: unknown[]): Promise<number> {
    const statement = `SELECT COUNT(*) AS count FROM ${this.name} WHERE ${whereClause}`
    const result = await this.connection.query(statement, values)
    const row = getRows(result)[0]
    return Number(row?.count ?? 0)
  }

  async runWhere(statement: string, values: unknown[]): Promise<void> {
    await this.connection.run(statement, values, false)
  }

  where(field: string): WhereQuery<T> {
    return new WhereQuery(this, field)
  }

  orderBy(field: string): OrderByQuery<T> {
    return new OrderByQuery(this, field)
  }

  async toArray(): Promise<T[]> {
    return this.queryAll()
  }

  async count(): Promise<number> {
    const result = await this.connection.query(`SELECT COUNT(*) AS count FROM ${this.name}`)
    const row = getRows(result)[0]
    return Number(row?.count ?? 0)
  }

  async clear(): Promise<void> {
    await this.connection.run(`DELETE FROM ${this.name}`, [], false)
  }
}

class UsersTable extends SqliteTable<User> {
  protected mapRow(row: Record<string, unknown>): User {
    return rowToUser(row)
  }

  async get(id: number): Promise<User | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async add(user: User): Promise<number> {
    await this.connection.run(
      `INSERT INTO ${this.name} (username, passwordHash, displayName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      userToValues(user),
      false,
    )

    const created = await this.where('username').equals(user.username).first()
    return created?.id ?? 0
  }

  async put(user: User): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, username, passwordHash, displayName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, ...userToValues(user)],
      false,
    )
  }

  async update(id: number, changes: Partial<User>): Promise<void> {
    const existing = await this.get(id)
    if (!existing) {
      return
    }

    await this.put({ ...existing, ...changes, id })
  }

  async delete(id: number): Promise<void> {
    await this.runWhere(`DELETE FROM ${this.name} WHERE id = ?`, [id])
  }
}

class SessionsTable extends SqliteTable<Session> {
  protected mapRow(row: Record<string, unknown>): Session {
    return rowToSession(row)
  }

  async add(session: Session): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)`,
      sessionToValues(session),
      false,
    )
  }

  async put(session: Session): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [session.id, ...sessionToValues(session)],
      false,
    )
  }

  async delete(id: number): Promise<void> {
    await this.runWhere(`DELETE FROM ${this.name} WHERE id = ?`, [id])
  }
}

class ProductsTable extends SqliteTable<Product> {
  protected mapRow(row: Record<string, unknown>): Product {
    return rowToProduct(row)
  }

  async get(id: string): Promise<Product | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async bulkGet(ids: string[]): Promise<(Product | undefined)[]> {
    if (ids.length === 0) {
      return []
    }

    const placeholders = ids.map(() => '?').join(', ')
    const rows = await this.queryWhere(`id IN (${placeholders})`, ids)
    const byId = new Map(rows.map((product) => [product.id, product]))
    return ids.map((id) => byId.get(id))
  }

  async add(product: Product): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (id, barcode, shortName, name, defaultPrice, image, description, qty, active, variants, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      productToValues(product),
      false,
    )
  }

  async put(product: Product): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, barcode, shortName, name, defaultPrice, image, description, qty, active, variants, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      productToValues(product),
      false,
    )
  }

  async delete(id: string): Promise<void> {
    await this.runWhere(`DELETE FROM ${this.name} WHERE id = ?`, [id])
  }
}

class ImagesTable extends SqliteTable<StoredImageRecord> {
  protected mapRow(row: Record<string, unknown>): StoredImageRecord {
    return rowToImage(row)
  }

  async get(id: string): Promise<StoredImageRecord | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async put(record: StoredImageRecord): Promise<void> {
    const values = await imageToValues(record)
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, blobData, mimeType, createdAt) VALUES (?, ?, ?, ?)`,
      values,
      false,
    )
  }

  async delete(id: string): Promise<void> {
    await this.runWhere(`DELETE FROM ${this.name} WHERE id = ?`, [id])
  }
}

class InventoryLogsTable extends SqliteTable<InventoryLog> {
  protected mapRow(row: Record<string, unknown>): InventoryLog {
    return rowToInventoryLog(row)
  }

  async add(log: InventoryLog): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (id, productId, productName, variantId, variantName, type, qty, reference, beforeQty, afterQty, createdById, createdByName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      inventoryLogToValues(log),
      false,
    )
  }
}

class SalesTable extends SqliteTable<Sale> {
  protected mapRow(row: Record<string, unknown>): Sale {
    return rowToSale(row)
  }

  async get(id: string): Promise<Sale | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async add(sale: Sale): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (id, type, originalSaleId, lines, subtotal, amountPaid, changeAmount, itemCount, status, createdById, createdByName, voidedById, voidedByName, voidedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      saleToValues(sale),
      false,
    )
  }

  async put(sale: Sale): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, type, originalSaleId, lines, subtotal, amountPaid, changeAmount, itemCount, status, createdById, createdByName, voidedById, voidedByName, voidedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      saleToValues(sale),
      false,
    )
  }

  async bulkGet(ids: string[]): Promise<(Sale | undefined)[]> {
    if (ids.length === 0) {
      return []
    }

    const placeholders = ids.map(() => '?').join(', ')
    const rows = await this.queryWhere(`id IN (${placeholders})`, ids)
    const byId = new Map(rows.map((sale) => [sale.id, sale]))
    return ids.map((id) => byId.get(id))
  }

  async bulkAdd(sales: Sale[]): Promise<void> {
    for (const sale of sales) {
      await this.add(sale)
    }
  }
}

class SettingsTable extends SqliteTable<AppSettings> {
  protected mapRow(row: Record<string, unknown>): AppSettings {
    return rowToSettings(row)
  }

  async get(id: string): Promise<AppSettings | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async put(settings: AppSettings): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, masterPasswordHash, autoInvoice, continuousBarcodeScanning, vatPercentage, receiptMainText, receiptAddress, receiptContactNumber, receiptTin, receiptBottomText, invoiceNextNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      settingsToValues(settings),
      false,
    )
  }
}

class InvoicesTable extends SqliteTable<Invoice> {
  protected mapRow(row: Record<string, unknown>): Invoice {
    return rowToInvoice(row)
  }

  async get(id: string): Promise<Invoice | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async add(invoice: Invoice): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (id, invoiceNumber, saleId, lines, subtotal, amountPaid, changeAmount, vatPercentage, netAmount, vatAmount, createdById, createdByName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      invoiceToValues(invoice),
      false,
    )
  }

  async bulkGet(ids: string[]): Promise<(Invoice | undefined)[]> {
    if (ids.length === 0) {
      return []
    }

    const placeholders = ids.map(() => '?').join(', ')
    const rows = await this.queryWhere(`id IN (${placeholders})`, ids)
    const byId = new Map(rows.map((invoice) => [invoice.id, invoice]))
    return ids.map((id) => byId.get(id))
  }

  async bulkAdd(invoices: Invoice[]): Promise<void> {
    for (const invoice of invoices) {
      await this.add(invoice)
    }
  }
}

class DataArchivesTable extends SqliteTable<DataArchive> {
  protected mapRow(row: Record<string, unknown>): DataArchive {
    return rowToDataArchive(row)
  }

  async get(id: string): Promise<DataArchive | undefined> {
    const rows = await this.queryWhere('id = ?', [id])
    return rows[0]
  }

  async add(archive: DataArchive): Promise<void> {
    await this.connection.run(
      `INSERT INTO ${this.name} (id, saleCount, invoiceCount, salesTotal, status, archivedById, archivedByName, restoredById, restoredByName, restoredAt, payload, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      dataArchiveToValues(archive),
      false,
    )
  }

  async put(archive: DataArchive): Promise<void> {
    await this.connection.run(
      `INSERT OR REPLACE INTO ${this.name} (id, saleCount, invoiceCount, salesTotal, status, archivedById, archivedByName, restoredById, restoredByName, restoredAt, payload, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      dataArchiveToValues(archive),
      false,
    )
  }
}

export class SqliteDatabase {
  private connection: SQLiteDBConnection
  readonly users: UsersTable
  readonly sessions: SessionsTable
  readonly products: ProductsTable
  readonly images: ImagesTable
  readonly inventoryLogs: InventoryLogsTable
  readonly sales: SalesTable
  readonly settings: SettingsTable
  readonly invoices: InvoicesTable
  readonly dataArchives: DataArchivesTable

  constructor(connection: SQLiteDBConnection) {
    this.connection = connection
    this.users = new UsersTable(connection, 'users')
    this.sessions = new SessionsTable(connection, 'sessions')
    this.products = new ProductsTable(connection, 'products')
    this.images = new ImagesTable(connection, 'images')
    this.inventoryLogs = new InventoryLogsTable(connection, 'inventoryLogs')
    this.sales = new SalesTable(connection, 'sales')
    this.settings = new SettingsTable(connection, 'settings')
    this.invoices = new InvoicesTable(connection, 'invoices')
    this.dataArchives = new DataArchivesTable(connection, 'dataArchives')
  }

  async transaction(
    _mode: string,
    ...args: [...unknown[], () => Promise<void>]
  ): Promise<void> {
    const callback = args[args.length - 1] as () => Promise<void>
    await this.connection.beginTransaction()

    try {
      await callback()
      await this.connection.commitTransaction()
    } catch (error) {
      await this.connection.rollbackTransaction()
      throw error
    }
  }
}

export async function createSqliteDatabase(): Promise<SqliteDatabase> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const connection = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await connection.open()
  await connection.execute(SQLITE_SCHEMA_STATEMENTS, false)
  return new SqliteDatabase(connection)
}
