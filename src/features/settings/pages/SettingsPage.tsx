import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '@/lib/services/settingsService'

export function SettingsPage() {
  const [autoInvoice, setAutoInvoice] = useState(false)
  const [continuousBarcodeScanning, setContinuousBarcodeScanning] = useState(false)
  const [vatPercentage, setVatPercentage] = useState('12')
  const [receiptMainText, setReceiptMainText] = useState('Tofu POS')
  const [receiptAddress, setReceiptAddress] = useState('')
  const [receiptContactNumber, setReceiptContactNumber] = useState('')
  const [receiptTin, setReceiptTin] = useState('')
  const [receiptBottomText, setReceiptBottomText] = useState('Thank You')
  const [masterPassword, setMasterPassword] = useState('')
  const [hasExistingMasterPassword, setHasExistingMasterPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
          setAutoInvoice(settings.autoInvoice)
          setContinuousBarcodeScanning(settings.continuousBarcodeScanning)
          setVatPercentage(String(settings.vatPercentage))
          setReceiptMainText(settings.receiptMainText)
          setReceiptAddress(settings.receiptAddress)
          setReceiptContactNumber(settings.receiptContactNumber)
          setReceiptTin(settings.receiptTin)
          setReceiptBottomText(settings.receiptBottomText)
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
        autoInvoice,
        continuousBarcodeScanning,
        vatPercentage: parsedVat,
        receiptMainText,
        receiptAddress,
        receiptContactNumber,
        receiptTin,
        receiptBottomText,
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

      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Stack spacing={3}>
          <Box>
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
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Receipt header and footer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Shown at the top and bottom of printed sales invoices.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Receipt main text"
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
                label="Receipt contact number"
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
                helperText='Closing message at the bottom of the receipt. Defaults to "Thank You".'
              />
            </Stack>
          </Box>

          <Box>
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
          </Box>

          <Box>
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
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Auto-invoice
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              When enabled, an invoice is saved and printed automatically after each POS sale is
              completed.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoInvoice}
                  onChange={(_, checked) => setAutoInvoice(checked)}
                  disabled={loading || saving}
                />
              }
              label="Enable auto-invoice"
            />
          </Box>

          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={loading || saving}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
