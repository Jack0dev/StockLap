import { useState, useEffect } from 'react';
import { adminOrderAPI } from '../api/api';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filter
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // State quản lý Modal xác nhận
  const [orderToCancel, setOrderToCancel] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, size: 20, sort: 'createdAt', direction: 'desc' };
      if (statusFilter) params.status = statusFilter;

      const res = await adminOrderAPI.getAllOrders(params);
      if (res.data.success) {
        setOrders(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      } else {
        setError(res.data.message || 'Lỗi khi tải danh sách lệnh');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const requestCancel = (orderId) => {
    setOrderToCancel(orderId);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      const res = await adminOrderAPI.forceCancelOrder(orderToCancel);
      if (res.data.success) {
        alert(res.data.message);
        fetchOrders(); // reload
      } else {
        alert(res.data.message || 'Lỗi khi hủy lệnh');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến server');
    } finally {
      setOrderToCancel(null);
    }
  };

  const cancelConfirm = () => {
    setOrderToCancel(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Chờ khớp</span>;
      case 'PARTIAL': return <span className="badge badge-info">Khớp một phần</span>;
      case 'FILLED': return <span className="badge badge-success">Khớp hết</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Đã hủy</span>;
      case 'REJECTED': return <span className="badge badge-dark">Từ chối</span>;
      default: return <span className="badge">{status}</span>;
    }
  };
  
  const getSideBadge = (side) => {
    return side === 'BUY' 
      ? <span className="side-badge buy">MUA</span> 
      : <span className="side-badge sell">BÁN</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`;
  };

  return (
    <div className="admin-orders-container fade-in">
      <div className="page-header">
        <h1>Quản Lý Lệnh Toàn Hệ Thống</h1>
        <p>Theo dõi và can thiệp (Force Cancel) các lệnh giao dịch của người dùng</p>
      </div>

      <div className="filters-card">
        <label>Lọc theo trạng thái:</label>
        <select 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="admin-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ khớp (PENDING)</option>
          <option value="PARTIAL">Khớp một phần (PARTIAL)</option>
          <option value="FILLED">Khớp hết (FILLED)</option>
          <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          <option value="REJECTED">Bị từ chối (REJECTED)</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchOrders}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 10a4 4 0 110-8 4 4 0 010 8zm1-5h-2v2h2V7z M7 4h2v2H7V4z"/></svg> 
          Làm mới
        </button>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="table-responsive table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã CP</th>
              <th>Loại</th>
              <th>Giá đặt</th>
              <th>Khối lượng</th>
              <th>Khớp</th>
              <th>Trạng thái</th>
              <th>Thời gian đặt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">Đang tải dữ liệu...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">Không có dữ liệu lệnh.</td>
              </tr>
            ) : (
              orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td className="font-weight-bold">{o.ticker}</td>
                  <td>{getSideBadge(o.side)} <small className="text-muted">{o.orderType}</small></td>
                  <td>{formatCurrency(o.price)} ₫</td>
                  <td>{formatCurrency(o.quantity)}</td>
                  <td>{formatCurrency(o.filledQuantity)}</td>
                  <td>{getStatusBadge(o.status)}</td>
                  <td><span className="text-muted small">{formatDate(o.createdAt)}</span></td>
                  <td>
                    {(o.status === 'PENDING' || o.status === 'PARTIAL') && (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => requestCancel(o.id)}
                        title="Ép hủy lệnh này"
                      >
                        Force Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(page - 1)}
            className="page-btn"
          >
            &laquo; Trước
          </button>
          <span className="page-info">Trang {page + 1} / {totalPages}</span>
          <button 
            disabled={page === totalPages - 1} 
            onClick={() => setPage(page + 1)}
            className="page-btn"
          >
            Sau &raquo;
          </button>
        </div>
      )}

      {/* Modal xác nhận */}
      {orderToCancel && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h3>Xác nhận ép hủy lệnh</h3>
            </div>
            <div className="custom-modal-body">
              <p>Bạn có chắc muốn ép hủy lệnh <strong>#{orderToCancel}</strong>?</p>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '10px' }}>
                Số tiền mặt hoặc cổ phiếu đã bị khóa trong lệnh này sẽ ngay lập tức được hệ thống mở khóa và hoàn trả lại vào số dư khả dụng của người dùng.
              </p>
            </div>
            <div className="custom-modal-footer">
              <button className="btn btn-secondary" onClick={cancelConfirm}>Thoát</button>
              <button className="btn btn-danger" style={{ background: '#d32f2f', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} onClick={confirmCancel}>Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
