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
import { useAuth } from '../auth/useAuth'
import { ThemeModeToggle } from '../components/ThemeModeToggle'

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
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e8f4fd 100%)'
            : 'linear-gradient(135deg, #071422 0%, #0d2137 50%, #132a45 100%)',
        py: 4,
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeModeToggle />
      </Box>
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ mb: 3, alignItems: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PointOfSaleIcon fontSize="large" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Tofu POS Terminal
            </Typography>
            <Typography color="text.secondary">
              {needsSetup
                ? 'Create the first admin account to secure this terminal'
                : 'Sign in to access the dashboard'}
            </Typography>
          </Box>
        </Stack>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
              <LockOutlinedIcon color="primary" />
              <Typography variant="h6">
                {needsSetup ? 'Initial setup' : 'Login'}
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
  )
}
