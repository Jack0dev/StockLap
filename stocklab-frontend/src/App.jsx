import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

import ProfilePage from './pages/ProfilePage'
import StockListPage from './pages/StockListPage'
import StockDetailPage from './pages/StockDetailPage'
import TradingPage from './pages/TradingPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import PortfolioPage from './pages/PortfolioPage'
import WatchlistPage from './pages/WatchlistPage'
import AdminUsersPage from './pages/AdminUsersPage'

// Trang mẫu cho Admin
function AdminDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Chỉ admin mới thấy trang này.</p>
    </div>
  )
}

// Layout chính (có Navbar) cho các trang sau khi đăng nhập
function AppLayout() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </>
  )
}

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/stocks" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/stocks" /> : <RegisterPage />} />

      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stocks" element={<StockListPage />} />
        <Route path="/stocks/:ticker" element={<StockDetailPage />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/stocks" : "/login"} />} />
    </Routes>
  )
}

export default App
