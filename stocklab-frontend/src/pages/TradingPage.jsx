import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stockAPI, tradeAPI, orderAPI, userAPI } from '../api/api';
import './TradingPage.css';

export default function TradingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchBalance();
    fetchPortfolio();
    fetchRecentOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'SELL') {
      fetchPortfolio();
    }
  }, [activeTab]);

  const fetchBalance = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.data.success) {
        setBalance(res.data.data.balance);
      }
    } catch (err) {
      console.error('Lỗi tải số dư:', err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await tradeAPI.getPortfolio();
      if (res.data.success) {
        setPortfolio(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders(0, 5);
      if (res.data.success) {
        setRecentOrders(res.data.data.content || []);
      }
    } catch (err) {
      console.error('Lỗi tải lệnh:', err);
    }
  };

  // Search stocks with debounce
  useEffect(() => {
    if (activeTab === 'BUY' && ticker.length >= 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await stockAPI.search(ticker);
          if (res.data.success) {
            setSearchResults(res.data.data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error('Lỗi tìm kiếm:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [ticker, activeTab]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setTicker(stock.ticker);
    setPrice(String(stock.currentPrice));
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSelectPortfolioStock = (item) => {
    setSelectedStock({
      ticker: item.ticker,
      companyName: item.companyName,
      currentPrice: item.currentPrice,
      exchange: item.exchange,
    });
    setTicker(item.ticker);
    setPrice(String(item.currentPrice));
  };

  const resetForm = () => {
    setSelectedStock(null);
    setTicker('');
    setQuantity('');
    setPrice('');
    setOrderType('MARKET');
  };

  // Tính giá sử dụng cho hiển thị
  const effectivePrice = orderType === 'LIMIT' && price
    ? Number(price)
    : (selectedStock?.currentPrice || 0);

  const totalAmount = selectedStock && quantity
    ? effectivePrice * Number(quantity)
    : 0;

  const holdingQty = portfolio.find(p => p.ticker === selectedStock?.ticker)?.quantity || 0;

  const canTrade = () => {
    if (!selectedStock || !quantity || Number(quantity) <= 0) return false;
    if (orderType === 'LIMIT' && (!price || Number(price) <= 0)) return false;
    if (activeTab === 'BUY') return balance >= totalAmount;
    if (activeTab === 'SELL') return holdingQty >= Number(quantity);
    return false;
  };

  const handlePlaceOrder = async () => {
    if (!canTrade()) return;
    setLoading(true);
    setMessage(null);

    try {
      const data = {
        ticker: selectedStock.ticker,
        side: activeTab,
        orderType: orderType,
        quantity: Number(quantity),
      };

      // Chỉ gửi price khi LIMIT
      if (orderType === 'LIMIT') {
        data.price = Number(price);
      }

      const res = await orderAPI.placeOrder(data);

      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        resetForm();
        fetchBalance();
        fetchPortfolio();
        fetchRecentOrders();
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi đặt lệnh';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p) => {
    if (!p) return '0';
    return Number(p).toLocaleString('vi-VN');
  };

  const getTickerColor = (t) => {
    const colors = ['#2962ff', '#00c853', '#ff6d00', '#aa00ff', '#d50000', '#00bfa5', '#6200ea', '#c51162'];
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusLabel = (status) => {
    const map = { PENDING: 'Chờ khớp', PARTIAL: 'Khớp 1 phần', FILLED: 'Đã khớp', CANCELLED: 'Đã hủy', REJECTED: 'Bị từ chối' };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = { PENDING: 'pending', PARTIAL: 'partial', FILLED: 'filled', CANCELLED: 'cancelled', REJECTED: 'rejected' };
    return map[status] || '';
  };

  return (
    <div className="trading-page fade-in">
      <div className="trading-header">
        <h2>📊 Đặt lệnh</h2>
        <div className="balance-display">
          <span className="balance-label">Số dư khả dụng</span>
          <span className="balance-value">{formatPrice(balance)} VND</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`trade-message ${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          <span>{message.text}</span>
          <button className="msg-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="trading-content">
        {/* Trading Form */}
        <div className="trading-form-card">
          {/* Tabs */}
          <div className="trade-tabs">
            <button
              className={`trade-tab ${activeTab === 'BUY' ? 'active buy' : ''}`}
              onClick={() => { setActiveTab('BUY'); resetForm(); }}
            >
              MUA
            </button>
            <button
              className={`trade-tab ${activeTab === 'SELL' ? 'active sell' : ''}`}
              onClick={() => { setActiveTab('SELL'); resetForm(); }}
            >
              BÁN
            </button>
          </div>

          <div className="form-body">
            {/* Order Type Selector */}
            <div className="form-group">
              <label>Loại lệnh</label>
              <div className="order-type-selector">
                <button
                  className={`ot-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                  onClick={() => setOrderType('MARKET')}
                >
                  <span className="ot-icon">⚡</span>
                  <span>Thường</span>
                </button>
                <button
                  className={`ot-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                  onClick={() => setOrderType('LIMIT')}
                >
                  <span className="ot-icon">📌</span>
                  <span>Giới hạn</span>
                </button>
              </div>
            </div>

            {/* Stock Picker - BUY */}
            {activeTab === 'BUY' && (
              <div className="form-group">
                <label>Mã cổ phiếu</label>
                <div className="stock-search-wrapper">
                  <input
                    type="text"
                    placeholder="Nhập mã CP (VD: VNM, FPT...)"
                    value={ticker}
                    onChange={(e) => {
                      setTicker(e.target.value.toUpperCase());
                      setSelectedStock(null);
                    }}
                    className="form-input"
                    autoComplete="off"
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <div className="stock-dropdown">
                      {searchResults.slice(0, 8).map(s => (
                        <div
                          key={s.ticker}
                          className="stock-dropdown-item"
                          onClick={() => handleSelectStock(s)}
                        >
                          <div
                            className="sd-icon"
                            style={{ background: getTickerColor(s.ticker) }}
                          >
                            {s.ticker.substring(0, 2)}
                          </div>
                          <div className="sd-info">
                            <span className="sd-ticker">{s.ticker}</span>
                            <span className="sd-name">{s.companyName}</span>
                          </div>
                          <span className="sd-price">{formatPrice(s.currentPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Picker - SELL */}
            {activeTab === 'SELL' && (
              <div className="form-group">
                <label>Chọn cổ phiếu đang giữ</label>
                {portfolio.length === 0 ? (
                  <div className="empty-portfolio-msg">Bạn chưa có cổ phiếu nào trong danh mục</div>
                ) : (
                  <div className="portfolio-select-list">
                    {portfolio.map(item => (
                      <div
                        key={item.ticker}
                        className={`portfolio-select-item ${selectedStock?.ticker === item.ticker ? 'selected' : ''}`}
                        onClick={() => handleSelectPortfolioStock(item)}
                      >
                        <div
                          className="sd-icon"
                          style={{ background: getTickerColor(item.ticker) }}
                        >
                          {item.ticker.substring(0, 2)}
                        </div>
                        <div className="ps-info">
                          <span className="sd-ticker">{item.ticker}</span>
                          <span className="ps-qty">Đang giữ: {item.quantity} CP</span>
                        </div>
                        <div className="ps-price-info">
                          <span className="sd-price">{formatPrice(item.currentPrice)}</span>
                          <span className={`ps-pnl ${item.profitLoss >= 0 ? 'up' : 'down'}`}>
                            {item.profitLoss >= 0 ? '+' : ''}{formatPrice(item.profitLoss)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Stock Info */}
            {selectedStock && (
              <div className="selected-stock-info">
                <div className="ssi-header">
                  <div
                    className="ssi-icon"
                    style={{ background: getTickerColor(selectedStock.ticker) }}
                  >
                    {selectedStock.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <div className="ssi-ticker">{selectedStock.ticker}</div>
                    <div className="ssi-name">{selectedStock.companyName}</div>
                  </div>
                </div>
                <div className="ssi-price">{formatPrice(selectedStock.currentPrice)} VND</div>
              </div>
            )}

            {/* Price Input (LIMIT only) */}
            {orderType === 'LIMIT' && (
              <div className="form-group">
                <label>Giá đặt (VND)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Nhập giá đặt lệnh"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input"
                />
                {selectedStock && (
                  <div className="price-hint">
                    Giá hiện tại: <strong>{formatPrice(selectedStock.currentPrice)} VND</strong>
                    <button
                      className="price-fill-btn"
                      onClick={() => setPrice(String(selectedStock.currentPrice))}
                    >
                      Dùng giá hiện tại
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label>Số lượng</label>
              <input
                type="number"
                min="1"
                placeholder="Nhập số lượng CP"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input"
              />
              {activeTab === 'SELL' && selectedStock && (
                <div className="qty-hint">
                  Đang giữ: <strong>{holdingQty} CP</strong>
                  <button
                    className="qty-max-btn"
                    onClick={() => setQuantity(holdingQty.toString())}
                  >
                    Bán hết
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedStock && quantity > 0 && (
              <div className="trade-summary">
                <div className="summary-row">
                  <span>Loại lệnh</span>
                  <span className="order-type-badge">
                    {orderType === 'MARKET' ? '⚡ Thị trường' : '📌 Giới hạn'}
                  </span>
                </div>
                <div className="summary-row">
                  <span>{orderType === 'LIMIT' ? 'Giá đặt' : 'Giá hiện tại'}</span>
                  <span>{formatPrice(effectivePrice)} VND</span>
                </div>
                <div className="summary-row">
                  <span>Số lượng</span>
                  <span>{Number(quantity).toLocaleString('vi-VN')} CP</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Tổng tiền {orderType === 'LIMIT' ? '(ước tính)' : ''}</span>
                  <span className={activeTab === 'BUY' ? 'text-danger' : 'text-success'}>
                    {activeTab === 'BUY' ? '-' : '+'}{formatPrice(totalAmount)} VND
                  </span>
                </div>
                {activeTab === 'BUY' && (
                  <div className="summary-row">
                    <span>Số dư sau GD</span>
                    <span className={balance - totalAmount < 0 ? 'text-danger' : ''}>
                      {formatPrice(balance - totalAmount)} VND
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Trade Button */}
            <button
              className={`trade-btn ${activeTab === 'BUY' ? 'buy' : 'sell'}`}
              disabled={!canTrade() || loading}
              onClick={handlePlaceOrder}
            >
              {loading ? (
                <span className="btn-loading">Đang xử lý...</span>
              ) : activeTab === 'BUY' ? (
                `ĐẶT LỆNH MUA ${selectedStock?.ticker || ''}`
              ) : (
                `ĐẶT LỆNH BÁN ${selectedStock?.ticker || ''}`
              )}
            </button>

            {activeTab === 'BUY' && selectedStock && quantity > 0 && balance < totalAmount && (
              <div className="insufficient-msg">⚠️ Số dư không đủ để thực hiện giao dịch</div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="trading-sidebar">
          {/* Recent Orders */}
          <div className="sidebar-card">
            <h3>📋 Lệnh gần đây</h3>
            {recentOrders.length === 0 ? (
              <div className="sidebar-empty">Chưa có lệnh nào</div>
            ) : (
              <div className="recent-orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="ro-item">
                    <div className="ro-left">
                      <div className={`ro-side ${order.side === 'BUY' ? 'buy' : 'sell'}`}>
                        {order.side === 'BUY' ? 'M' : 'B'}
                      </div>
                      <div>
                        <div className="ro-ticker">{order.ticker}</div>
                        <div className="ro-detail">
                          {order.filledQuantity}/{order.quantity} CP · {formatPrice(order.price)}
                        </div>
                      </div>
                    </div>
                    <div className={`ro-status ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="sidebar-card" style={{ marginTop: '16px' }}>
            <h3>💼 Danh mục hiện tại</h3>
            {portfolio.length === 0 ? (
              <div className="sidebar-empty">Chưa có cổ phiếu nào</div>
            ) : (
              <div className="sidebar-portfolio-list">
                {portfolio.map(item => (
                  <div key={item.ticker} className="sp-item">
                    <div className="sp-left">
                      <div
                        className="sp-icon"
                        style={{ background: getTickerColor(item.ticker) }}
                      >
                        {item.ticker.substring(0, 2)}
                      </div>
                      <div>
                        <div className="sp-ticker">{item.ticker}</div>
                        <div className="sp-qty">{item.quantity} CP</div>
                      </div>
                    </div>
                    <div className="sp-right">
                      <div className="sp-value">{formatPrice(item.totalValue)}</div>
                      <div className={`sp-pnl ${item.profitLoss >= 0 ? 'up' : 'down'}`}>
                        {item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercent?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
