import { useState, useEffect, useRef } from 'react';
import { stockAPI, userAPI } from '../api/api';
import './ConditionalOrderPage.css';

const CONDITION_TYPES = [
  { value: 'GTD', label: 'GTD', desc: 'Good Till Date — Lệnh có hiệu lực đến ngày hết hạn' },
  { value: 'STOP', label: 'Stop', desc: 'Kích hoạt khi giá chạm mức Stop' },
  { value: 'STOP_LIMIT', label: 'Stop Limit', desc: 'Kích hoạt Stop rồi đặt lệnh Limit' },
  { value: 'TRAILING_STOP', label: 'Trailing Stop', desc: 'Stop di chuyển theo giá thị trường' },
  { value: 'TRAILING_STOP_LIMIT', label: 'Trailing Stop Limit', desc: 'Trailing Stop kết hợp Limit' },
  { value: 'OCO', label: 'OCO', desc: 'One Cancels Other — Hủy lệnh còn lại khi 1 lệnh khớp' },
  { value: 'SL_TP', label: 'Stop Loss / Take Profit', desc: 'Cắt lỗ và chốt lời tự động' },
];

export default function ConditionalOrderPage() {
  const [activeTab, setActiveTab] = useState('BUY');
  const [conditionType, setConditionType] = useState('GTD');
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState(null);

  const conditionRef = useRef(null);

  useEffect(() => {
    fetchBalance();
    // Set default dates
    const now = new Date();
    setEffectiveDate(now.toISOString().slice(0, 10));
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);
    setExpiryDate(expiry.toISOString().slice(0, 16));
  }, []);

  // Close condition dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (conditionRef.current && !conditionRef.current.contains(e.target)) {
        setConditionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.data.success) setBalance(res.data.data.balance);
    } catch { }
  };

  // Search stocks with debounce
  useEffect(() => {
    if (ticker.length >= 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await stockAPI.search(ticker);
          if (res.data.success) {
            setSearchResults(res.data.data);
            setShowDropdown(true);
          }
        } catch { }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [ticker]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setTicker(stock.ticker);
    setPrice(String(stock.currentPrice));
    setShowDropdown(false);
    setSearchResults([]);
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

  const selectedCondition = CONDITION_TYPES.find(c => c.value === conditionType);

  const handleSubmit = () => {
    // Placeholder — sẽ kết nối API sau
    setMessage({
      type: 'info',
      text: `Tính năng đặt lệnh điều kiện ${selectedCondition.label} đang được phát triển. Vui lòng quay lại sau!`
    });
  };

  const totalAmount = selectedStock && quantity ? Number(price || selectedStock.currentPrice) * Number(quantity) : 0;

  return (
    <div className="cond-order-page fade-in">
      <div className="cond-header">
        <h2>⚡ Đặt Lệnh Điều Kiện</h2>
        <div className="balance-display">
          <span className="balance-label">Số dư khả dụng</span>
          <span className="balance-value">{formatPrice(balance)} VND</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`trade-message ${message.type}`}>
          <span>{message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{message.text}</span>
          <button className="msg-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="cond-content">
        <div className="cond-form-card">
          {/* Tabs MUA / BÁN */}
          <div className="trade-tabs">
            <button
              className={`trade-tab ${activeTab === 'BUY' ? 'active buy' : ''}`}
              onClick={() => setActiveTab('BUY')}
            >MUA</button>
            <button
              className={`trade-tab ${activeTab === 'SELL' ? 'active sell' : ''}`}
              onClick={() => setActiveTab('SELL')}
            >BÁN</button>
          </div>

          <div className="form-body">
            {/* Loại điều kiện */}
            <div className="form-group">
              <label>Loại điều kiện</label>
              <div className="cond-select-wrapper" ref={conditionRef}>
                <button
                  className="cond-select-trigger"
                  onClick={() => setConditionDropdownOpen(!conditionDropdownOpen)}
                >
                  <div className="cond-select-value">
                    <span className="cond-select-label">{selectedCondition.label}</span>
                    <span className="cond-select-desc">{selectedCondition.desc}</span>
                  </div>
                  <svg className={`cond-chevron ${conditionDropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
                {conditionDropdownOpen && (
                  <div className="cond-select-dropdown fade-in">
                    {CONDITION_TYPES.map(c => (
                      <button
                        key={c.value}
                        className={`cond-select-option ${conditionType === c.value ? 'selected' : ''}`}
                        onClick={() => { setConditionType(c.value); setConditionDropdownOpen(false); }}
                      >
                        <span className="cond-opt-label">{c.label}</span>
                        <span className="cond-opt-desc">{c.desc}</span>
                        {conditionType === c.value && <span className="cond-opt-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mã cổ phiếu */}
            <div className="form-group">
              <label>Mã cổ phiếu</label>
              <div className="stock-search-wrapper">
                <input
                  type="text"
                  placeholder="Nhập mã CP (VD: VNM, FPT...)"
                  value={ticker}
                  onChange={(e) => { setTicker(e.target.value.toUpperCase()); setSelectedStock(null); }}
                  className="form-input"
                  autoComplete="off"
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="stock-dropdown">
                    {searchResults.slice(0, 8).map(s => (
                      <div key={s.ticker} className="stock-dropdown-item" onClick={() => handleSelectStock(s)}>
                        <div className="sd-icon" style={{ background: getTickerColor(s.ticker) }}>
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

            {/* Selected stock info */}
            {selectedStock && (
              <div className="selected-stock-info">
                <div className="ssi-header">
                  <div className="ssi-icon" style={{ background: getTickerColor(selectedStock.ticker) }}>
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

            {/* Khối lượng */}
            <div className="form-group">
              <label>Khối lượng</label>
              <input
                type="number"
                min="1"
                placeholder="Nhập số lượng CP"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Giá đặt */}
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
                  <button className="price-fill-btn" onClick={() => setPrice(String(selectedStock.currentPrice))}>
                    Dùng giá hiện tại
                  </button>
                </div>
              )}
            </div>

            {/* Ngày hiệu lực */}
            <div className="form-group">
              <label>Ngày hiệu lực</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Ngày hết hạn */}
            <div className="form-group">
              <label>Ngày hết hạn</label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Kiểu xác thực */}
            <div className="form-group">
              <label>Kiểu xác thực</label>
              <div className="auth-type-display">
                <span className="auth-type-icon">📱</span>
                <span className="auth-type-label">Mã SMS OTP</span>
              </div>
              <div className="otp-input-group">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Nhập mã OTP 6 số"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="form-input otp-input"
                />
                <button className="otp-send-btn">Gửi mã</button>
              </div>
            </div>

            {/* Summary */}
            {selectedStock && quantity > 0 && (
              <div className="trade-summary">
                <div className="summary-row">
                  <span>Loại điều kiện</span>
                  <span className="order-type-badge">⚡ {selectedCondition.label}</span>
                </div>
                <div className="summary-row">
                  <span>Giá đặt</span>
                  <span>{formatPrice(price || selectedStock.currentPrice)} VND</span>
                </div>
                <div className="summary-row">
                  <span>Số lượng</span>
                  <span>{Number(quantity).toLocaleString()} CP</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Tổng tiền (ước tính)</span>
                  <span className={activeTab === 'BUY' ? 'text-danger' : 'text-success'}>
                    {activeTab === 'BUY' ? '-' : '+'}{formatPrice(totalAmount)} VND
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              className={`trade-btn ${activeTab === 'BUY' ? 'buy' : 'sell'}`}
              onClick={handleSubmit}
              disabled={!selectedStock || !quantity || !otpCode || otpCode.length < 6}
            >
              ĐẶT LỆNH ĐIỀU KIỆN {selectedStock?.ticker || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
