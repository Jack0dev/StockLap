import React, { useState, useEffect } from 'react';
import { adminAuditLogAPI } from '../api/api';
import './AdminLogsPage.css';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAuditLogAPI.getLogs({ page, size: 20 });
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Lỗi khi tải dữ liệu nhật ký hoạt động. Vui lòng kiểm tra kết nối.');
    } finally {
      // Simulate slight delay for animation smoothness if API is too fast
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    // Format: DD/MM/YYYY, HH:mm:ss
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
      <div className="date-group">
        <span className="time">{time}</span>
        <span className="date">{date}</span>
      </div>
    );
  };

  const getBadgeRender = (type) => {
    switch (type) {
      case 'CREATE': 
        return <span className="action-badge badge-create"><PlusIcon /> Tạo Mới</span>;
      case 'UPDATE': 
        return <span className="action-badge badge-update"><EditIcon /> Cập Nhật</span>;
      case 'DELETE': 
        return <span className="action-badge badge-delete"><TrashIcon /> Bị Xóa</span>;
      case 'STATUS_CHANGE': 
        return <span className="action-badge badge-status"><LockIcon /> Đổi Trạng Thái</span>;
      case 'ROLE_CHANGE': 
        return <span className="action-badge badge-role"><ShieldIcon /> Đổi Quyền</span>;
      default: 
        return <span className="action-badge badge-default">{type}</span>;
    }
  };

  const formatIpAddress = (ip) => {
    if (!ip) return '127.0.0.1';
    if (ip === '0:0:0:0:0:0:0:1') return '127.0.0.1 (Local)';
    return ip;
  };

  return (
    <div className="admin-logs-page animate-fade-in">
      <div className="admin-logs-header">
        <div className="header-title-group">
          <div className="header-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
          </div>
          <div>
            <h1>Nhật Ký Tác Vụ (Audit Logs)</h1>
            <p className="header-subtitle">Theo dõi, kiểm soát và lưu trữ toàn bộ hoạt động nhạy cảm của hệ thống</p>
          </div>
        </div>
        <button className="btn-refresh" onClick={fetchLogs} disabled={loading}>
          <svg className="refresh-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>Làm Mới</span>
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th width="12%">Thời Gian</th>
                <th width="12%">Thực Hiện Bởi</th>
                <th width="15%">Thao Tác</th>
                <th width="12%">Khối Nguồn</th>
                <th width="10%">Mã ID</th>
                <th width="24%">Chi Tiết Lịch Sử</th>
                <th width="15%">Origin IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    <div className="empty-state">Không có nhật ký hệ thống nào.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={log.id} style={{ '--i': index }} className="log-row">
                    <td>{formatDate(log.timestamp)}</td>
                    <td>
                      <div className="admin-username">{log.adminUsername}</div>
                    </td>
                    <td>{getBadgeRender(log.actionType)}</td>
                    <td className="td-entity">{log.entityName}</td>
                    <td><span className="td-id">#{log.entityId}</span></td>
                    <td className="td-desc">{log.description}</td>
                    <td className="ip-address">{formatIpAddress(log.ipAddress)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {totalPages > 0 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Trang trước
              </button>
              <div className="page-indicator">
                {page + 1} / {totalPages}
              </div>
              <button 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page >= totalPages - 1}
              >
                Trang sau
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- SVG Icons Components ---
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);

export default AdminLogsPage;
