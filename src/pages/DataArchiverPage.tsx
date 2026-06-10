import ArchiveIcon from '@mui/icons-material/Archive'
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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import type { DataArchive } from '../db/types'
import { archiveSalesAndInvoices, listDataArchives, restoreDataArchive } from '../services/archiveService'
import { verifyMasterPassword } from '../services/settingsService'
import { formatCurrency } from '../utils/currency'

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function archiveStatusLabel(archive: DataArchive): string {
  return archive.status === 'restored' ? 'Restored' : 'Archived'
}

function archiveStatusColor(archive: DataArchive): 'default' | 'success' {
  return archive.status === 'restored' ? 'success' : 'default'
}

export function DataArchiverPage() {
  const { user } = useAuth()
  const [archives, setArchives] = useState<DataArchive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [archiveDialogError, setArchiveDialogError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)

  const [restoreTarget, setRestoreTarget] = useState<DataArchive | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreDialogError, setRestoreDialogError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const items = await listDataArchives()
        if (active) {
          setArchives(items)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load archives')
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

  async function reloadArchives() {
    setLoading(true)
    setError(null)

    try {
      const items = await listDataArchives()
      setArchives(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archives')
    } finally {
      setLoading(false)
    }
  }

  function openArchiveDialog() {
    setArchiveDialogOpen(true)
    setMasterPassword('')
    setArchiveDialogError(null)
  }

  function closeArchiveDialog() {
    setArchiveDialogOpen(false)
    setMasterPassword('')
    setArchiveDialogError(null)
  }

  function openRestoreDialog(archive: DataArchive) {
    setRestoreTarget(archive)
    setRestoreDialogError(null)
  }

  function closeRestoreDialog() {
    setRestoreTarget(null)
    setRestoreDialogError(null)
  }

  async function handleArchive() {
    if (!user) {
      return
    }

    setArchiving(true)
    setArchiveDialogError(null)
    setSuccess(null)

    try {
      if (!masterPassword.trim()) {
        throw new Error('Master password is required')
      }

      const valid = await verifyMasterPassword(masterPassword)
      if (!valid) {
        throw new Error('Incorrect master password')
      }

      const archive = await archiveSalesAndInvoices(user)
      closeArchiveDialog()
      setSuccess(
        `Archived ${archive.saleCount} sale${archive.saleCount === 1 ? '' : 's'} and ${archive.invoiceCount} invoice${archive.invoiceCount === 1 ? '' : 's'}.`,
      )
      await reloadArchives()
    } catch (err) {
      setArchiveDialogError(err instanceof Error ? err.message : 'Failed to archive data')
    } finally {
      setArchiving(false)
    }
  }

  async function handleRestore() {
    if (!restoreTarget || !user) {
      return
    }

    setRestoring(true)
    setRestoreDialogError(null)
    setSuccess(null)

    try {
      const restored = await restoreDataArchive(restoreTarget.id, user)
      closeRestoreDialog()
      setSuccess(
        `Restored ${restored.saleCount} sale${restored.saleCount === 1 ? '' : 's'} and ${restored.invoiceCount} invoice${restored.invoiceCount === 1 ? '' : 's'}.`,
      )
      await reloadArchives()
    } catch (err) {
      setRestoreDialogError(err instanceof Error ? err.message : 'Failed to restore archive')
    } finally {
      setRestoring(false)
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
            Data Archiver
          </Typography>
          <Typography color="text.secondary">
            Archive sales and invoices to reduce database size. Archived data is stored safely and
            can be restored later.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<ArchiveIcon />} onClick={openArchiveDialog}>
          Archive
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Archived at</TableCell>
              <TableCell>Archived by</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell align="right">Invoices</TableCell>
              <TableCell align="right">Sales total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Restored at</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">Loading archives...</Typography>
                </TableCell>
              </TableRow>
            ) : archives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">
                    No archives yet. Use Archive to move all current sales and invoices into a
                    safe snapshot and clear the live tables.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              archives.map((archive) => (
                <TableRow key={archive.id} hover>
                  <TableCell>{formatDate(archive.createdAt)}</TableCell>
                  <TableCell>{archive.archivedByName}</TableCell>
                  <TableCell align="right">{archive.saleCount}</TableCell>
                  <TableCell align="right">{archive.invoiceCount}</TableCell>
                  <TableCell align="right">{formatCurrency(archive.salesTotal)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={archiveStatusLabel(archive)}
                      color={archiveStatusColor(archive)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {archive.restoredAt ? (
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{formatDate(archive.restoredAt)}</Typography>
                        {archive.restoredByName && (
                          <Typography variant="caption" color="text.secondary">
                            by {archive.restoredByName}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={archive.status === 'restored'}
                      onClick={() => openRestoreDialog(archive)}
                    >
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={archiveDialogOpen} onClose={closeArchiveDialog}>
        <DialogTitle>Archive sales and invoices</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will copy all current sales and invoices into a safe archive record, then remove
            them from the live Sales and Invoices tables. Products, inventory, and settings are not
            affected.
          </DialogContentText>
          <TextField
            label="Master password"
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            fullWidth
            autoFocus
            disabled={archiving}
          />
          {archiveDialogError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {archiveDialogError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeArchiveDialog} disabled={archiving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleArchive()}
            disabled={archiving}
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(restoreTarget)} onClose={closeRestoreDialog}>
        <DialogTitle>Restore archive</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: restoreDialogError ? 2 : 0 }}>
            Restore{' '}
            <strong>
              {restoreTarget?.saleCount ?? 0} sale
              {(restoreTarget?.saleCount ?? 0) === 1 ? '' : 's'}
            </strong>{' '}
            and{' '}
            <strong>
              {restoreTarget?.invoiceCount ?? 0} invoice
              {(restoreTarget?.invoiceCount ?? 0) === 1 ? '' : 's'}
            </strong>{' '}
            from {restoreTarget ? formatDate(restoreTarget.createdAt) : 'this archive'} back into
            the live database?
          </DialogContentText>
          {restoreDialogError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {restoreDialogError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRestoreDialog} disabled={restoring}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleRestore()} disabled={restoring}>
            {restoring ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
