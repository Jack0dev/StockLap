import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminStocksPage from '../pages/AdminStocksPage'
import AdminOrdersPage from '../pages/AdminOrdersPage'
import AdminLogsPage from '../pages/AdminLogsPage'

const adminRoutes = [
  { path: '/admin/dashboard', element: <AdminDashboardPage /> },
  { path: '/admin/users', element: <AdminUsersPage /> },
  { path: '/admin/stocks', element: <AdminStocksPage /> },
  { path: '/admin/orders', element: <AdminOrdersPage /> },
  { path: '/admin/logs', element: <AdminLogsPage /> },
]

export default adminRoutes
