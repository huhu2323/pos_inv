import SyncIcon from '@mui/icons-material/Sync'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { AutoPrintMode } from '@/lib/db/types'
import { getSettings, updateSettings } from '@/lib/services/settingsService'
import { formatSyncSummary, syncWithServer } from '@/lib/services/syncService'

export function SettingsPage() {
  const [autoPrint, setAutoPrint] = useState<AutoPrintMode>('off')
  const [continuousBarcodeScanning, setContinuousBarcodeScanning] = useState(false)
  const [vatPercentage, setVatPercentage] = useState('12')
  const [receiptMainText, setReceiptMainText] = useState('Tofu POS')
  const [receiptAddress, setReceiptAddress] = useState('')
  const [receiptContactNumber, setReceiptContactNumber] = useState('')
  const [receiptTin, setReceiptTin] = useState('')
  const [receiptBottomText, setReceiptBottomText] = useState('Thank You')
  const [officialReceiptMainText, setOfficialReceiptMainText] = useState('Tofu POS')
  const [officialReceiptAddress, setOfficialReceiptAddress] = useState('')
  const [officialReceiptContactNumber, setOfficialReceiptContactNumber] = useState('')
  const [officialReceiptTin, setOfficialReceiptTin] = useState('')
  const [officialReceiptBottomText, setOfficialReceiptBottomText] = useState('Thank You')
  const [syncApiUrl, setSyncApiUrl] = useState('')
  const [syncTenantId, setSyncTenantId] = useState('')
  const [syncPosId, setSyncPosId] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [hasExistingMasterPassword, setHasExistingMasterPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const settings = await getSettings()
        if (active) {
          setAutoPrint(settings.autoPrint)
          setContinuousBarcodeScanning(settings.continuousBarcodeScanning)
          setVatPercentage(String(settings.vatPercentage))
          setReceiptMainText(settings.receiptMainText)
          setReceiptAddress(settings.receiptAddress)
          setReceiptContactNumber(settings.receiptContactNumber)
          setReceiptTin(settings.receiptTin)
          setReceiptBottomText(settings.receiptBottomText)
          setOfficialReceiptMainText(settings.officialReceiptMainText)
          setOfficialReceiptAddress(settings.officialReceiptAddress)
          setOfficialReceiptContactNumber(settings.officialReceiptContactNumber)
          setOfficialReceiptTin(settings.officialReceiptTin)
          setOfficialReceiptBottomText(settings.officialReceiptBottomText)
          setSyncApiUrl(settings.syncApiUrl)
          setSyncTenantId(settings.syncTenantId)
          setSyncPosId(settings.syncPosId)
          setHasExistingMasterPassword(Boolean(settings.masterPasswordHash))
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load settings')
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

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const parsedVat = Number.parseFloat(vatPercentage)
      if (!Number.isFinite(parsedVat)) {
        throw new Error('VAT percentage must be a valid number')
      }

      await updateSettings({
        autoPrint,
        continuousBarcodeScanning,
        vatPercentage: parsedVat,
        receiptMainText,
        receiptAddress,
        receiptContactNumber,
        receiptTin,
        receiptBottomText,
        officialReceiptMainText,
        officialReceiptAddress,
        officialReceiptContactNumber,
        officialReceiptTin,
        officialReceiptBottomText,
        syncApiUrl,
        syncTenantId,
        syncPosId,
        masterPassword: masterPassword.trim() || undefined,
      })

      if (masterPassword.trim()) {
        setHasExistingMasterPassword(true)
        setMasterPassword('')
      }

      setSuccess('Settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setSuccess(null)

    try {
      await updateSettings({
        autoPrint,
        continuousBarcodeScanning,
        vatPercentage: Number.parseFloat(vatPercentage),
        receiptMainText,
        receiptAddress,
        receiptContactNumber,
        receiptTin,
        receiptBottomText,
        officialReceiptMainText,
        officialReceiptAddress,
        officialReceiptContactNumber,
        officialReceiptTin,
        officialReceiptBottomText,
        syncApiUrl,
        syncTenantId,
        syncPosId,
      })

      const result = await syncWithServer()
      setSuccess(formatSyncSummary(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Typography color="text.secondary">
          Configure terminal behavior. Master password is required for cashiers when voiding sales.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Master password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Used by cashiers to authorize voids and other protected actions. Admins do not need
            this password.
          </Typography>
          <TextField
            label="Master password"
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            fullWidth
            disabled={loading || saving}
            placeholder={
              hasExistingMasterPassword ? 'Leave blank to keep current password' : 'Set a password'
            }
            helperText={
              hasExistingMasterPassword
                ? 'Enter a new value to change it, or leave blank to keep the current password.'
                : 'Required before cashiers can void sales.'
            }
          />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Invoice header and footer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Shown at the top and bottom of printed invoices.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Main text"
              value={receiptMainText}
              onChange={(event) => setReceiptMainText(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Main business name or title centered at the top."
            />
            <TextField
              label="Address"
              value={receiptAddress}
              onChange={(event) => setReceiptAddress(event.target.value)}
              fullWidth
              disabled={loading || saving}
              multiline
              minRows={2}
              helperText="Displayed below the main text."
            />
            <TextField
              label="Contact number"
              value={receiptContactNumber}
              onChange={(event) => setReceiptContactNumber(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Displayed below the address."
            />
            <TextField
              label="TIN"
              value={receiptTin}
              onChange={(event) => setReceiptTin(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Tax identification number shown below the address."
            />
            <TextField
              label="Bottom text"
              value={receiptBottomText}
              onChange={(event) => setReceiptBottomText(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText='Closing message at the bottom of the invoice. Defaults to "Thank You".'
            />
          </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Official Receipt header and footer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Shown at the top and bottom of printed official receipts.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Main text"
              value={officialReceiptMainText}
              onChange={(event) => setOfficialReceiptMainText(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Main business name or title centered at the top."
            />
            <TextField
              label="Address"
              value={officialReceiptAddress}
              onChange={(event) => setOfficialReceiptAddress(event.target.value)}
              fullWidth
              disabled={loading || saving}
              multiline
              minRows={2}
              helperText="Displayed below the main text."
            />
            <TextField
              label="Contact number"
              value={officialReceiptContactNumber}
              onChange={(event) => setOfficialReceiptContactNumber(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Displayed below the address."
            />
            <TextField
              label="TIN"
              value={officialReceiptTin}
              onChange={(event) => setOfficialReceiptTin(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText="Tax identification number shown below the address."
            />
            <TextField
              label="Bottom text"
              value={officialReceiptBottomText}
              onChange={(event) => setOfficialReceiptBottomText(event.target.value)}
              fullWidth
              disabled={loading || saving}
              helperText='Closing message at the bottom of the official receipt. Defaults to "Thank You".'
            />
          </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            VAT percentage
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Applied to sale totals on printed invoices. VAT is calculated as a percentage of the
            total amount.
          </Typography>
          <TextField
            label="VAT percentage"
            type="number"
            value={vatPercentage}
            onChange={(event) => setVatPercentage(event.target.value)}
            fullWidth
            disabled={loading || saving}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
            helperText="Example: 12% of ₱1,000.00 is ₱120.00 VAT and ₱880.00 net amount."
          />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Continuous barcode scanning
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            When enabled, the barcode scanner stays open after each scan so you can keep adding
            items to the current order without reopening it.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={continuousBarcodeScanning}
                onChange={(_, checked) => setContinuousBarcodeScanning(checked)}
                disabled={loading || saving}
              />
            }
            label="Enable continuous barcode scanning"
          />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Auto Print
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Automatically print a document after each POS sale is completed.
          </Typography>
          <FormControl disabled={loading || saving}>
            <FormLabel id="auto-print-label">Document to print</FormLabel>
            <RadioGroup
              aria-labelledby="auto-print-label"
              value={autoPrint}
              onChange={(event) => setAutoPrint(event.target.value as AutoPrintMode)}
            >
              <FormControlLabel value="off" control={<Radio />} label="Off" />
              <FormControlLabel
                value="official_receipt"
                control={<Radio />}
                label="Official Receipt"
              />
              <FormControlLabel value="invoice" control={<Radio />} label="Invoice" />
              <FormControlLabel
                value="acknowledgement_receipt"
                control={<Radio />}
                label="Acknowledgement Receipt"
              />
            </RadioGroup>
          </FormControl>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Sync
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Push new products, sales, and invoices to Tofu Admin. Use the admin URL from your store
            dashboard (for example http://localhost:5174). Existing records are matched by their
            local UUID so nothing is duplicated.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="API URL"
              value={syncApiUrl}
              onChange={(event) => setSyncApiUrl(event.target.value)}
              fullWidth
              disabled={loading || saving || syncing}
              placeholder="http://localhost:5174"
              helperText="Tofu Admin URL"
            />
            <TextField
              label="Tenant ID"
              value={syncTenantId}
              onChange={(event) => setSyncTenantId(event.target.value)}
              fullWidth
              disabled={loading || saving || syncing}
            />
            <TextField
              label="POS ID"
              value={syncPosId}
              onChange={(event) => setSyncPosId(event.target.value)}
              fullWidth
              disabled={loading || saving || syncing}
              helperText="Generated when you register this terminal in Tofu Admin"
            />
            <Button
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={18} /> : <SyncIcon />}
              onClick={() => void handleSync()}
              disabled={loading || saving || syncing}
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </Button>
          </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={loading || saving}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
