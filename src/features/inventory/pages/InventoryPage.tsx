import AddIcon from '@mui/icons-material/Add'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
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
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { InventoryFormDialog } from '@/features/inventory/components/InventoryFormDialog'
import type { InventoryLog, Product } from '@/lib/db/types'
import { createInventoryLog, listInventoryLogs } from '@/lib/services/inventoryService'
import { listProducts } from '@/lib/services/productService'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { DataTableCard } from '@/shared/components/ui/DataTableCard'
import { StatusChip } from '@/shared/components/ui/StatusChip'
import { stitchTableHeadSx, labelCapsSx } from '@/shared/theme/stitchStyles'
import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'
import {
  collectLowStockAlerts,
  countCriticalStockAlerts,
  formatLowStockAlertLabel,
} from '@/shared/utils/lowStockAlert'
import { formatDate } from '@/shared/utils/formatDate'
import { formatQtyWithUnit } from '@/shared/utils/productUnitOfMeasure'

function movementLabel(type: InventoryLog['type']): string {
  return type === 'inbound' ? 'Inbound' : 'Outbound'
}

export function InventoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const productUnits = new Map(products.map((product) => [product.id, product.unitOfMeasure]))
  const lowStockAlerts = collectLowStockAlerts(products)
  const criticalAlerts = lowStockAlerts.filter(
    (alert) => alert.level === 'critical' || alert.level === 'out_of_stock',
  )
  const criticalCount = countCriticalStockAlerts(lowStockAlerts)

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

      {criticalAlerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Low stock alerts</Typography>
            <Typography
              component="span"
              sx={{
                ...labelCapsSx,
                bgcolor: 'error.light',
                color: 'error.dark',
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                fontSize: '0.65rem',
              }}
            >
              {criticalCount} item{criticalCount === 1 ? '' : 's'} critical
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {criticalAlerts.slice(0, 3).map((alert) => (
              <Grid key={`${alert.productId}:${alert.variantId ?? 'base'}`} size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    border: 1,
                    borderColor: 'error.main',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <ErrorOutlineOutlinedIcon
                    color="error"
                    sx={{ position: 'absolute', top: 12, right: 12, fontSize: 20 }}
                  />
                  <CardContent>
                    <Typography sx={{ ...labelCapsSx, color: 'text.secondary', mb: 0.5 }}>
                      {alert.level === 'out_of_stock' ? 'Out of stock' : 'Critical'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      {formatLowStockAlertLabel(alert)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ ...labelCapsSx, color: 'text.secondary', fontSize: '0.65rem' }}>
                          Current level
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: monoFontFamily,
                            fontWeight: 700,
                            color: 'error.main',
                            fontSize: '1.25rem',
                          }}
                        >
                          {formatQtyWithUnit(alert.qty, alert.unitOfMeasure)}{' '}
                          <Typography component="span" variant="body2" color="text.secondary">
                            / {formatQtyWithUnit(alert.initialQty, alert.unitOfMeasure)}
                          </Typography>
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => navigate('/products')}
                        sx={{ ...labelCapsSx, fontSize: '0.65rem' }}
                      >
                        Restock
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
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
                  <TableCell align="right">
                    {formatQtyWithUnit(log.qty, productUnits.get(log.productId) ?? 'pc')}
                  </TableCell>
                  <TableCell align="right">
                    {formatQtyWithUnit(log.beforeQty, productUnits.get(log.productId) ?? 'pc')}
                  </TableCell>
                  <TableCell align="right">
                    {formatQtyWithUnit(log.afterQty, productUnits.get(log.productId) ?? 'pc')}
                  </TableCell>
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
