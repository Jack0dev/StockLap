import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import './AdminDashboardPage.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Ghi đè cài đặt mặc định để phù hợp nền Dark Mode Glassmorphism
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAdminDashboard();
      if (res.data.success) {
        setStats(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê');
    } finally {
      // Simulate rendering delay for smooth animation
      setTimeout(() => setLoading(false), 400);
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="glow-spinner"></div>
      <p>Đang tải dữ liệu trung tâm...</p>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-error animate-fade-in">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Lỗi: {error}
    </div>
  );

  // Define chart custom aesthetics
  const chartData = {
    labels: stats?.topStocks?.map(ts => ts.ticker) || [],
    datasets: [
      {
        label: ' Khối lượng khớp lệnh',
        data: stats?.topStocks?.map(ts => ts.volume) || [],
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        hoverBackgroundColor: 'rgba(56, 189, 248, 1)',
        borderColor: 'rgba(56, 189, 248, 1)',
        borderWidth: 1,
        borderRadius: 6, // Góc bo tròn cho cột
        barPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { 
        display: false // Ẩn legend vì đã có tiêu đề rõ ràng
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        }
      }
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header animate-slide-down">
        <div>
          <h1 className="dashboard-title">Tổng Quan Hệ Thống</h1>
          <p className="dashboard-subtitle">Thống kê theo thời gian thực (Real-time monitoring)</p>
        </div>
        <button className="btn-refresh-dash group" onClick={fetchStats}>
          <svg className="refresh-icon group-hover:rotate-180" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card" style={{ '--i': 0 }}>
          <div className="stat-icon-box user-box">
             <UserIcon />
          </div>
          <div className="stat-content">
            <h3>Tổng Người Dùng</h3>
            <p className="stat-number">
              {stats?.totalUsers?.toLocaleString('vi-VN') || 0}
            </p>
          </div>
        </div>

        <div className="stat-card" style={{ '--i': 1 }}>
          <div className="stat-icon-box tx-box">
             <TxIcon />
          </div>
          <div className="stat-content">
            <h3>Tổng Giao Dịch</h3>
            <p className="stat-number">
              {stats?.totalTransactions?.toLocaleString('vi-VN') || 0}
            </p>
          </div>
        </div>

        <div className="stat-card" style={{ '--i': 2 }}>
          <div className="stat-icon-box vol-box">
             <VolIcon />
          </div>
          <div className="stat-content">
            <h3>Tổng Khối Lượng CP</h3>
            <p className="stat-number">
              {stats?.totalVolume?.toLocaleString('vi-VN') || 0}
            </p>
          </div>
        </div>

        <div className="stat-card" style={{ '--i': 3 }}>
          <div className="stat-icon-box rev-box">
             <RevIcon />
          </div>
          <div className="stat-content">
            <h3>Tổng Doanh Thu Cước</h3>
            <p className="stat-number rev-text">
              {stats?.totalRevenue?.toLocaleString('vi-VN')} <span className="currency">VND</span>
            </p>
          </div>
        </div>
      </div>

      <div className="top-stocks-section animate-slide-up-delayed">
        <div className="section-header">
           <div className="header-icon"><ChartIcon /></div>
           <h2>Top 5 Cổ Phiếu Giao Dịch Nổi Bật</h2>
        </div>
        
        {stats?.topStocks && stats.topStocks.length > 0 ? (
          <div className="dashboard-content-split">
            <div className="chart-glass-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
            
            <div className="table-glass-container">
              <table className="top-stocks-glass-table">
                <thead>
                  <tr>
                    <th>Xếp Hạng</th>
                    <th>Mã Cổ Phiếu</th>
                    <th>Khối Lượng Khớp Khủng</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topStocks.map((ts, idx) => (
                    <tr key={idx} style={{ '--row-i': idx }} className="table-row-animate">
                      <td className="rank-col">
                         <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                      </td>
                      <td className="ticker-col">{ts.ticker}</td>
                      <td className="vol-col">{ts.volume?.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state-glass">
            <p>Thị trường hiện tại chưa có dữ liệu giao dịch sôi động.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline SVG Icons mapped to concepts
const UserIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const TxIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const VolIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
const RevIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
);
