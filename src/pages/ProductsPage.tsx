import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { ImageZoomDialog } from '../components/ImageZoomDialog'
import { ProductDetailDialog } from '../components/ProductDetailDialog'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { StoredImage } from '../components/StoredImage'
import type { Product } from '../db/types'
import {
  createProduct,
  deleteProduct,
  listProducts,
  setProductActive,
  updateProduct,
  type ProductInput,
} from '../services/productService'
import { formatCurrency } from '../utils/currency'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const items = await listProducts()
        if (active) {
          setProducts(items)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load products')
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

  async function reloadProducts() {
    setLoading(true)
    setError(null)

    try {
      const items = await listProducts()
      setProducts(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  function openViewDialog(product: Product) {
    setViewingProduct(product)
  }

  function handleZoomImage(src: string, alt: string) {
    setZoomImage({ src, alt })
  }

  async function handleSave(input: ProductInput) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, input)
    } else {
      await createProduct(input)
    }

    await reloadProducts()
  }

  async function handleToggleActive(product: Product, active: 0 | 1) {
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, active } : item)),
    )

    try {
      await setProductActive(product.id, active)
    } catch (err) {
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, active: product.active } : item,
        ),
      )
      setError(err instanceof Error ? err.message : 'Failed to update product status')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)

    try {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      await reloadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Products
          </Typography>
          <Typography color="text.secondary">
            Manage menu items, pricing, and variants for the POS terminal.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add product
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Default price</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Variants</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">Loading products...</Typography>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">
                    No products yet. Add your first product to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <StoredImage
                      image={product.image}
                      alt={product.name}
                      variant="rounded"
                      sx={{ width: 40, height: 40 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {product.barcode || '—'}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{formatCurrency(product.defaultPrice)}</TableCell>
                  <TableCell align="right">{product.qty}</TableCell>
                  <TableCell>
                    {product.variants.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        None
                      </Typography>
                    ) : (
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {product.variants.map((variant) => (
                          <Chip
                            key={variant.id}
                            size="small"
                            avatar={
                              <StoredImage
                                image={variant.image}
                                alt={variant.name}
                                sx={{ width: 24, height: 24 }}
                              />
                            }
                            label={`${variant.name} (${formatCurrency(variant.price)}) · qty ${variant.qty}`}
                          />
                        ))}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={product.active === 1}
                      onChange={(_, checked) =>
                        void handleToggleActive(product, checked ? 1 : 0)
                      }
                      aria-label={`Toggle active status for ${product.name}`}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`View ${product.name}`}
                      onClick={() => openViewDialog(product)}
                    >
                      <VisibilityOutlinedIcon />
                    </IconButton>
                    <IconButton
                      aria-label={`Edit ${product.name}`}
                      onClick={() => openEditDialog(product)}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => setDeleteTarget(product)}
                    >
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ProductFormDialog
        open={formOpen}
        product={editingProduct}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ProductDetailDialog
        open={Boolean(viewingProduct)}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onZoomImage={handleZoomImage}
      />

      <ImageZoomDialog
        open={Boolean(zoomImage)}
        src={zoomImage?.src ?? ''}
        alt={zoomImage?.alt ?? 'Product image'}
        onClose={() => setZoomImage(null)}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
