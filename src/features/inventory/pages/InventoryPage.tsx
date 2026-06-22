import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { InventoryFormDialog } from '@/features/inventory/components/InventoryFormDialog'
import type { InventoryLog, Product } from '@/lib/db/types'
import { createInventoryLog, listInventoryLogs } from '@/lib/services/inventoryService'
import { listProducts } from '@/lib/services/productService'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { DataTableCard } from '@/shared/components/ui/DataTableCard'
import { StatusChip } from '@/shared/components/ui/StatusChip'
import { stitchTableHeadSx } from '@/shared/theme/stitchStyles'
import { formatDate } from '@/shared/utils/formatDate'

function movementLabel(type: InventoryLog['type']): string {
  return type === 'inbound' ? 'Inbound' : 'Outbound'
}

export function InventoryPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [logItems, productItems] = await Promise.all([
          listInventoryLogs(),
          listProducts(),
        ])

        if (active) {
          setLogs(logItems)
          setProducts(productItems)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load inventory logs')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  async function reloadData() {
    setLoading(true)
    setError(null)

    try {
      const [logItems, productItems] = await Promise.all([
        listInventoryLogs(),
        listProducts(),
      ])
      setLogs(logItems)
      setProducts(productItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory logs')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(input: Parameters<typeof createInventoryLog>[0]) {
    if (!user) {
      throw new Error('You must be signed in to create inventory logs')
    }

    await createInventoryLog(input, user)
    await reloadData()
  }

  return (
    <Box>
      <PageHeader
        title="Inventory management"
        subtitle="Stock movement log for inbound deliveries and outbound removals."
        action={
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            disabled={products.length === 0}
          >
            New log
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {products.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add products before recording inventory movements.
        </Alert>
      )}

      <DataTableCard title="Full inventory table">
        <TableContainer>
          <Table>
            <TableHead sx={stitchTableHeadSx}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Target</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Before</TableCell>
              <TableCell align="right">After</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Created by</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography color="text.secondary">Loading inventory logs...</Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography color="text.secondary">
                    No inventory logs yet. Create your first stock movement.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{
                    bgcolor: (theme) =>
                      log.type === 'inbound'
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.error.main, 0.1),
                  }}
                >
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>
                    <StatusChip
                      status={log.type === 'inbound' ? 'success' : 'error'}
                      label={movementLabel(log.type)}
                    />
                  </TableCell>
                  <TableCell>{log.productName}</TableCell>
                  <TableCell>{log.variantName ?? 'Product (base)'}</TableCell>
                  <TableCell align="right">{log.qty}</TableCell>
                  <TableCell align="right">{log.beforeQty}</TableCell>
                  <TableCell align="right">{log.afterQty}</TableCell>
                  <TableCell>{log.reference || '—'}</TableCell>
                  <TableCell>{log.createdByName}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </DataTableCard>

      <InventoryFormDialog
        open={formOpen}
        products={products}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
      />
    </Box>
  )
}
