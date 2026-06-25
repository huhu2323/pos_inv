import CloudSyncIcon from '@mui/icons-material/CloudSync'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ThemeModeToggle } from '@/shared/theme/ThemeModeToggle'
import { labelCapsSx, stitchCardSx } from '@/shared/theme/stitchStyles'

type SetupMode = 'choose' | 'scratch' | 'admin'

export function LoginPage() {
  const { user, loading, needsSetup, login, setupAdmin, setupAdminFromAdmin } = useAuth()
  const navigate = useNavigate()

  const [setupMode, setSetupMode] = useState<SetupMode>('choose')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [posId, setPosId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSetupScratch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      await setupAdmin({ username, password, displayName })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSetupFromAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      await setupAdminFromAdmin({
        username,
        password,
        displayName,
        apiUrl,
        tenantId,
        posId,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Tofu Admin')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const setupTitle =
    setupMode === 'choose'
      ? 'Choose setup'
      : setupMode === 'admin'
        ? 'Connect to Tofu Admin'
        : 'Setup from scratch'

  const setupSubtitle =
    setupMode === 'choose'
      ? 'Configure this terminal on its own, or pull store settings from Tofu Admin.'
      : setupMode === 'admin'
        ? 'Enter the IDs from Tofu Admin, then create the local admin account. Master password and all POS settings come from Tofu Admin → POS Settings.'
        : 'Create the first admin account and configure settings on this terminal.'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: 6,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <PointOfSaleIcon sx={{ fontSize: 48, mb: 3 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, maxWidth: 420 }}>
          Unified POS Management
        </Typography>
        <Typography sx={{ opacity: 0.85, maxWidth: 420, lineHeight: 1.7 }}>
          High-velocity transactional software built for speed, accuracy, and reliability during
          long shifts.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeModeToggle />
        </Box>

        <Container maxWidth="sm" disableGutters>
          <Stack spacing={1} sx={{ mb: 4 }}>
            <Typography sx={labelCapsSx} color="primary.main">
              Tofu POS Terminal
            </Typography>
            <Typography variant="h4">
              {needsSetup ? setupTitle : 'Sign in'}
            </Typography>
            <Typography color="text.secondary">
              {needsSetup ? setupSubtitle : 'Access the dashboard and register.'}
            </Typography>
          </Stack>

          <Card sx={stitchCardSx}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
                <LockOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h6">
                  {needsSetup ? 'Initial setup' : 'Login'}
                </Typography>
              </Stack>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {needsSetup && setupMode === 'choose' ? (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardActionArea onClick={() => setSetupMode('scratch')}>
                      <CardContent>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                          <SettingsSuggestIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Setup from scratch
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Configure invoice, receipt, VAT, and sync settings on this terminal.
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>

                  <Card variant="outlined">
                    <CardActionArea onClick={() => setSetupMode('admin')}>
                      <CardContent>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                          <CloudSyncIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Connect to Tofu Admin
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Pull store settings using your tenant ID and POS ID from Tofu Admin.
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Stack>
              ) : needsSetup ? (
                <Box
                  component="form"
                  onSubmit={(event) =>
                    void (setupMode === 'admin'
                      ? handleSetupFromAdmin(event)
                      : handleSetupScratch(event))
                  }
                  noValidate
                >
                  <Stack spacing={2.5}>
                    {setupMode === 'admin' && (
                      <>
                        <TextField
                          label="Tofu Admin URL"
                          value={apiUrl}
                          onChange={(event) => setApiUrl(event.target.value)}
                          required
                          fullWidth
                          placeholder="http://localhost:5174"
                          helperText="The URL where Tofu Admin is running"
                        />
                        <TextField
                          label="Tenant ID"
                          value={tenantId}
                          onChange={(event) => setTenantId(event.target.value)}
                          required
                          fullWidth
                          helperText="Store UUID from Tofu Admin"
                        />
                        <TextField
                          label="POS ID"
                          value={posId}
                          onChange={(event) => setPosId(event.target.value)}
                          required
                          fullWidth
                          helperText="Terminal UUID from POS Terminals in Tofu Admin"
                        />
                      </>
                    )}

                    <TextField
                      label="Display name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      fullWidth
                      autoComplete="name"
                    />
                    <TextField
                      label="Username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      fullWidth
                      autoComplete="username"
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      fullWidth
                      autoComplete="new-password"
                      helperText="Minimum 8 characters for signing in to this terminal."
                    />
                    <TextField
                      label="Confirm password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      fullWidth
                      autoComplete="new-password"
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSetupMode('choose')
                          setError(null)
                        }}
                        disabled={submitting}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        size="large"
                        disabled={submitting}
                        sx={{ flex: 1 }}
                      >
                        {submitting
                          ? setupMode === 'admin'
                            ? 'Connecting...'
                            : 'Creating account...'
                          : setupMode === 'admin'
                            ? 'Connect and finish setup'
                            : 'Create admin account'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleLogin} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      fullWidth
                      autoComplete="username"
                      autoFocus
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      fullWidth
                      autoComplete="current-password"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="large"
                      disabled={submitting}
                    >
                      {submitting ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}
