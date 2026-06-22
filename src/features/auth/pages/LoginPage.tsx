import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import {
  Alert,
  Box,
  Button,
  Card,
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

export function LoginPage() {
  const { user, loading, needsSetup, login, setupAdmin } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  async function handleSetup(event: FormEvent<HTMLFormElement>) {
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

      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: { xs: 3, md: 6 }, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeModeToggle />
        </Box>

        <Container maxWidth="sm" disableGutters>
          <Stack spacing={1} sx={{ mb: 4 }}>
            <Typography sx={labelCapsSx} color="primary.main">
              Tofu POS Terminal
            </Typography>
            <Typography variant="h4">
              {needsSetup ? 'Initial setup' : 'Sign in'}
            </Typography>
            <Typography color="text.secondary">
              {needsSetup
                ? 'Create the first admin account to secure this terminal.'
                : 'Access the dashboard and register.'}
            </Typography>
          </Stack>

          <Card sx={stitchCardSx}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
                <LockOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="h6">
                  {needsSetup ? 'Admin account' : 'Login'}
                </Typography>
              </Stack>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {needsSetup ? (
                <Box component="form" onSubmit={handleSetup} noValidate>
                  <Stack spacing={2.5}>
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
                      helperText="Minimum 8 characters"
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
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="large"
                      disabled={submitting}
                    >
                      {submitting ? 'Creating account...' : 'Create admin account'}
                    </Button>
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
