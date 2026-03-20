import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import StockListPage from './pages/StockListPage'
import StockDetailPage from './pages/StockDetailPage'
import TradingPage from './pages/TradingPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import PortfolioPage from './pages/PortfolioPage'

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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stocks" element={<StockListPage />} />
        <Route path="/stocks/:ticker" element={<StockDetailPage />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  )
}

export default App
