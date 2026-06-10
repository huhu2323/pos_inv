import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import type { Employee, UserRole } from '../db/types'
import type { EmployeeCreateInput, EmployeeUpdateInput } from '../services/employeeService'

interface EmployeeFormDialogProps {
  open: boolean
  employee: Employee | null
  onClose: () => void
  onSave: (input: EmployeeCreateInput | EmployeeUpdateInput) => Promise<void>
}

interface EmployeeFormContentProps {
  employee: Employee | null
  onClose: () => void
  onSave: (input: EmployeeCreateInput | EmployeeUpdateInput) => Promise<void>
}

function EmployeeFormContent({ employee, onClose, onSave }: EmployeeFormContentProps) {
  const [displayName, setDisplayName] = useState(employee?.displayName ?? '')
  const [username, setUsername] = useState(employee?.username ?? '')
  const [role, setRole] = useState<UserRole>(employee?.role ?? 'cashier')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)

    if (employee) {
      if (password && password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      setSubmitting(true)

      try {
        const input: EmployeeUpdateInput = {
          displayName,
          username,
          role,
        }

        if (password) {
          input.password = password
        }

        await onSave(input)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save employee')
      } finally {
        setSubmitting(false)
      }

      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      await onSave({
        displayName,
        username,
        role,
        password,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            fullWidth
            autoComplete="username"
          />
          <FormControl fullWidth required>
            <InputLabel id="employee-role-label">Role</InputLabel>
            <Select
              labelId="employee-role-label"
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={employee ? 'New password' : 'Password'}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={!employee}
            fullWidth
            autoComplete="new-password"
            helperText={
              employee
                ? 'Leave blank to keep the current password'
                : 'Minimum 8 characters'
            }
          />
          <TextField
            label={employee ? 'Confirm new password' : 'Confirm password'}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required={!employee && Boolean(password)}
            fullWidth
            autoComplete="new-password"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Saving...' : employee ? 'Save changes' : 'Create employee'}
        </Button>
      </DialogActions>
    </>
  )
}

export function EmployeeFormDialog({
  open,
  employee,
  onClose,
  onSave,
}: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{employee ? 'Edit employee' : 'Add employee'}</DialogTitle>
      {open && (
        <EmployeeFormContent
          key={employee?.id ?? 'create'}
          employee={employee}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}
