import { useState, useEffect, useRef } from 'react';
import { botAPI } from '../api/api';
import { usePageTour } from '../hooks/usePageTour';
import './BotActivityPage.css';

export default function BotActivityPage() {
  const { restartTour } = usePageTour('botActivity');
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [prevCount, setPrevCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const [statusRes, activityRes] = await Promise.all([
        botAPI.getStatus(),
        botAPI.getActivity(),
      ]);
      setStatus(statusRes.data);
      const newActivity = activityRes.data || [];
      setPrevCount(prev => {
        if (prev > 0 && newActivity.length > prev) {
          // New orders arrived
        }
        return newActivity.length;
      });
      setActivity(newActivity);
    } catch (err) {
      console.error('Bot API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  const formatPrice = (p) => Number(p).toLocaleString('vi-VN');
  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bot-page fade-in">
        <div className="bot-loading">
          <div className="bot-loading-spinner"></div>
          <span>Đang tải dữ liệu bot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-page fade-in">
      {/* Header */}
      <div className="bot-header">
        <div className="bot-header-left">
          <h2>🤖 Trading Bot</h2>
          <span className="bot-subtitle">Hệ thống tạo thanh khoản tự động</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="bot-auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Tự động cập nhật (3s)
          </label>
          <button className="page-tour-btn" onClick={restartTour} title="Hướng dẫn trang này">?</button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="bot-stats-grid">
        <div className="bot-stat-card">
          <div className={`bot-status-dot ${status?.enabled ? 'active' : 'inactive'}`}></div>
          <div className="bot-stat-info">
            <span className="bot-stat-label">Trạng thái</span>
            <span className={`bot-stat-value ${status?.enabled ? 'text-success' : 'text-danger'}`}>
              {status?.enabled ? '🟢 Đang chạy' : '🔴 Đã dừng'}
            </span>
          </div>
        </div>

        <div className="bot-stat-card">
          <div className="bot-stat-icon">📊</div>
          <div className="bot-stat-info">
            <span className="bot-stat-label">Tổng lệnh đã đặt</span>
            <span className="bot-stat-value">{status?.totalOrdersPlaced?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="bot-stat-card">
          <div className="bot-stat-icon">⏱️</div>
          <div className="bot-stat-info">
            <span className="bot-stat-label">Tần suất</span>
            <span className="bot-stat-value">{(status?.intervalMs / 1000)?.toFixed(0) || 5}s / lệnh</span>
          </div>
        </div>

        <div className="bot-stat-card">
          <div className="bot-stat-icon">👤</div>
          <div className="bot-stat-info">
            <span className="bot-stat-label">Bot Account</span>
            <span className="bot-stat-value bot-username">{status?.username || 'bot_liquidity'}</span>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bot-activity-card">
        <div className="bot-activity-header">
          <h3>📋 Lệnh gần đây</h3>
          <span className="bot-activity-count">{activity.length} lệnh</span>
        </div>

        {activity.length === 0 ? (
          <div className="bot-empty">
            <div className="bot-empty-icon">🤖</div>
            <p>Bot chưa đặt lệnh nào. Hãy đợi vài giây...</p>
          </div>
        ) : (
          <div className="bot-table-wrapper">
            <table className="bot-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã CP</th>
                  <th>Loại</th>
                  <th>Số lượng</th>
                  <th>Giá</th>
                  <th>Tổng giá trị</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((order, i) => (
                  <tr key={i} className={`bot-row ${i === 0 ? 'bot-row-new' : ''}`}>
                    <td className="bot-time">{formatTime(order.timestamp)}</td>
                    <td>
                      <span className="bot-ticker">{order.ticker}</span>
                    </td>
                    <td>
                      <span className={`bot-side-badge ${order.side === 'BUY' ? 'buy' : 'sell'}`}>
                        {order.side === 'BUY' ? '🟢 MUA' : '🔴 BÁN'}
                      </span>
                    </td>
                    <td className="bot-qty">{order.quantity?.toLocaleString()}</td>
                    <td className="bot-price">{formatPrice(order.price)}</td>
                    <td className="bot-total">{formatPrice(order.price * order.quantity)}</td>
                    <td>
                      <span className="bot-status-badge success">{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
