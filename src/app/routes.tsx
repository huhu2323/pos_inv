import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DataArchiverPage } from '@/features/archive/pages/DataArchiverPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { InventoryPage } from '@/features/inventory/pages/InventoryPage'
import { ReceiptsPage } from '@/features/receipts/pages/ReceiptsPage'
import { PosPage } from '@/features/pos/pages/PosPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { SalesPage } from '@/features/sales/pages/SalesPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { useNativeBackButton } from '@/shared/hooks/useNativeBackButton'

export function AppRoutes() {
  useNativeBackButton()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pos" element={<PosPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/invoices" element={<Navigate to="/receipts" replace />} />
          <Route element={<AdminRoute />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/data-archiver" element={<DataArchiverPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
