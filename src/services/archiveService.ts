import { db } from '../db/database'
import type { AuthUser, DataArchive } from '../db/types'

export async function listDataArchives(): Promise<DataArchive[]> {
  return db.dataArchives.orderBy('createdAt').reverse().toArray()
}

export async function archiveSalesAndInvoices(archivedBy: AuthUser): Promise<DataArchive> {
  const [sales, invoices] = await Promise.all([db.sales.toArray(), db.invoices.toArray()])

  if (sales.length === 0 && invoices.length === 0) {
    throw new Error('No sales or invoices to archive')
  }

  const salesTotal = sales
    .filter((sale) => sale.type === 'sale' && sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.subtotal, 0)

  const archive: DataArchive = {
    id: crypto.randomUUID(),
    saleCount: sales.length,
    invoiceCount: invoices.length,
    salesTotal,
    status: 'archived',
    archivedById: archivedBy.id,
    archivedByName: archivedBy.displayName,
    payload: { sales, invoices },
    createdAt: new Date(),
  }

  await db.transaction('rw', db.sales, db.invoices, db.dataArchives, async () => {
    await db.dataArchives.add(archive)
    await db.sales.clear()
    await db.invoices.clear()
  })

  return archive
}

export async function restoreDataArchive(
  id: string,
  restoredBy: AuthUser,
): Promise<DataArchive> {
  const archive = await db.dataArchives.get(id)

  if (!archive) {
    throw new Error('Archive not found')
  }

  if (archive.status === 'restored') {
    throw new Error('This archive has already been restored')
  }

  const { sales, invoices } = archive.payload

  const [existingSales, existingInvoices] = await Promise.all([
    sales.length > 0 ? db.sales.bulkGet(sales.map((sale) => sale.id)) : Promise.resolve([]),
    invoices.length > 0
      ? db.invoices.bulkGet(invoices.map((invoice) => invoice.id))
      : Promise.resolve([]),
  ])

  if (existingSales.some(Boolean) || existingInvoices.some(Boolean)) {
    throw new Error('Cannot restore: some archived sales or invoices already exist')
  }

  const restored: DataArchive = {
    ...archive,
    status: 'restored',
    restoredAt: new Date(),
    restoredById: restoredBy.id,
    restoredByName: restoredBy.displayName,
  }

  await db.transaction('rw', db.sales, db.invoices, db.dataArchives, async () => {
    if (sales.length > 0) {
      await db.sales.bulkAdd(sales)
    }

    if (invoices.length > 0) {
      await db.invoices.bulkAdd(invoices)
    }

    await db.dataArchives.put(restored)
  })

  return restored
}
