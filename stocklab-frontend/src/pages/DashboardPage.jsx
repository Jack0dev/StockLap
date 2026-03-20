import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-welcome">
        <h2>Chào mừng, {user?.fullName || user?.username}!</h2>
        <p className="welcome-subtitle">Sẵn sàng giao dịch hôm nay</p>
      </div>

      <div className="dashboard-grid">
        {/* Bảng giá — Active */}
        <Link to="/stocks" className="card dashboard-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-icon card-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-label">Bảng giá</span>
            <span className="card-value text-success" style={{ fontSize: '0.75rem' }}>✓ Khả dụng</span>
          </div>
        </Link>

        <Link to="/trading" className="card dashboard-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-icon card-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-label">Giao dịch</span>
            <span className="card-value text-success" style={{ fontSize: '0.75rem' }}>✓ Khả dụng</span>
          </div>
        </Link>

        <Link to="/portfolio" className="card dashboard-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-icon card-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-label">Danh mục</span>
            <span className="card-value text-success" style={{ fontSize: '0.75rem' }}>✓ Khả dụng</span>
          </div>
        </Link>

        <div className="card dashboard-card">
          <div className="card-icon card-icon-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-label">Xếp hạng</span>
            <span className="card-value text-muted">Phase 6</span>
          </div>
        </div>
      </div>

      <div className="dashboard-info">
        <div className="card">
          <h3>🚀 Hệ thống đang phát triển</h3>
          <p>Các tính năng giao dịch, và quản lý danh mục sẽ được cập nhật trong các phiên bản tiếp theo.</p>
        </div>
      </div>
    </div>
  );
}
