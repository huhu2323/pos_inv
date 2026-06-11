import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { EmployeeFormDialog } from '@/features/employees/components/EmployeeFormDialog'
import type { Employee } from '@/lib/db/types'
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
} from '@/lib/services/employeeService'
import { formatDate } from '@/shared/utils/formatDate'

function roleChipColor(role: Employee['role']): 'primary' | 'default' {
  return role === 'admin' ? 'primary' : 'default'
}

export function EmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const items = await listEmployees()
        if (active) {
          setEmployees(items)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load employees')
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

  async function reloadEmployees() {
    setLoading(true)
    setError(null)

    try {
      const items = await listEmployees()
      setEmployees(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  function openEditDialog(employee: Employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  async function handleSave(input: EmployeeCreateInput | EmployeeUpdateInput) {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, input as EmployeeUpdateInput)
    } else {
      await createEmployee(input as EmployeeCreateInput)
    }

    await reloadEmployees()
  }

  async function handleDelete() {
    if (!deleteTarget || !user) {
      return
    }

    setDeleting(true)

    try {
      await deleteEmployee(deleteTarget.id, user.id)
      setDeleteTarget(null)
      await reloadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee')
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
            Employees
          </Typography>
          <Typography color="text.secondary">
            Manage admin and cashier accounts for this POS terminal.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add employee
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
              <TableCell>Display name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Loading employees...</Typography>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No employees found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const isCurrentUser = employee.id === user?.id

                return (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      {employee.displayName}
                      {isCurrentUser && (
                        <Chip label="You" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{employee.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.role}
                        color={roleChipColor(employee.role)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(employee.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Edit ${employee.displayName}`}
                        onClick={() => openEditDialog(employee)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        aria-label={`Delete ${employee.displayName}`}
                        onClick={() => setDeleteTarget(employee)}
                        disabled={isCurrentUser}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <EmployeeFormDialog
        open={formOpen}
        employee={editingEmployee}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete employee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.displayName}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
