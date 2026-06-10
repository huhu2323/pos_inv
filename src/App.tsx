import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useNativeBackButton } from './hooks/useNativeBackButton'
import { AuthProvider } from './auth/AuthContext'
import { AdminRoute } from './components/AdminRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { PosPage } from './pages/PosPage'
import { ProductsPage } from './pages/ProductsPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { SalesPage } from './pages/SalesPage'
import { DataArchiverPage } from './pages/DataArchiverPage'
import { SettingsPage } from './pages/SettingsPage'
import { ThemeModeProvider } from './theme/ThemeModeProvider'

function AppRoutes() {
  useNativeBackButton()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pos" element={<PosPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
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

function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeModeProvider>
  )
}

export default App
