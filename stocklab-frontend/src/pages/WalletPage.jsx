import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletAPI, vnpayAPI } from '../api/api';
import { usePageTour } from '../hooks/usePageTour';
import './WalletPage.css';

export default function WalletPage() {
  const { user, fetchUserProfile } = useAuth();
  const { restartTour } = usePageTour('wallet');
  const [activeTab, setActiveTab] = useState('deposit');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [pendingPayment, setPendingPayment] = useState(null); // {paymentUrl, txnRef, amount}

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('VCB');
  const [withdrawBankAccount, setWithdrawBankAccount] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  // ----- LOGIC RÚT TIỀN (CÓ OTP) -----
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await walletAPI.requestWithdrawOtp();
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Đã gửi mã OTP về email của bạn!' });
        setCountdown(60);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể gửi mã OTP lúc này.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 10000) {
      setMessage({ type: 'error', text: 'Số tiền rút tối thiểu là 10,000 VNĐ' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        amount: Number(withdrawAmount),
        bankName: withdrawBankName,
        bankAccount: withdrawBankAccount,
        otpCode: otpCode
      };
      const res = await walletAPI.withdraw(payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: `Tạo lệnh rút ${formatCurrency(withdrawAmount)}₫ thành công! Đang chờ duyệt.` });
        setWithdrawAmount('');
        setWithdrawBankAccount('');
        setOtpCode('');
        setCountdown(0);
        if (fetchUserProfile) await fetchUserProfile();
        fetchHistory();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Lỗi khi rút tiền' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể kết nối đến hệ thống.' });
    } finally {
      setLoading(false);
    }
  };


  // ----- LOGIC NẠP TIỀN QUA VNPAY -----
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      setMessage({ type: 'error', text: 'Số tiền nạp tối thiểu là 10.000 VNĐ' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await vnpayAPI.createPayment({ amount: Number(depositAmount) });
      if (res.data.success) {
        setPendingPayment({
          paymentUrl: res.data.data.paymentUrl,
          txnRef: res.data.data.txnRef,
          amount: Number(depositAmount),
        });
        setMessage({ type: '', text: '' });
        fetchHistory();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Lỗi khi tạo thanh toán' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  const [copiedField, setCopiedField] = useState('');
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const VNPAY_BANK_INFO = {
    bankName: 'VNPay - Cổng thanh toán',
    accountName: user?.fullName || user?.username || 'StockLab User',
    accountNo: 'Thanh toán qua cổng VNPay',
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await walletAPI.getHistory(0, 50);
      if (res.data.success && res.data.data?.content) {
        setHistoryItems(res.data.data.content);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
      if (fetchUserProfile) fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  return (
    <div className="wallet-container fade-in">
      <div className="wallet-header">
        <div>
          <h1>Quản Lý Giao Dịch Tiền</h1>
          <p>Nạp thêm nguồn vốn hoặc rút lợi nhuận về tài khoản cá nhân</p>
        </div>
        <button className="page-tour-btn" onClick={restartTour} title="Hướng dẫn trang này">?</button>
      </div>

      <div className="wallet-grid">
        {/* Cột trái: Số dư */}
        <div className="wallet-sidebar">
          <div className="balance-card">
            <h3 className="balance-title">Số dư khả dụng</h3>
            <div className="balance-amount">{formatCurrency(user?.availableBalance)} <span className="currency">VNĐ</span></div>
            <div className="balance-sub">
              Tổng tài sản: {formatCurrency(user?.balance)} VNĐ
            </div>
            {/* Lệnh PENDING sẽ trừ tiền availableBalance (giữ lại balance ảo trên giao diện để rõ ràng) */}
            <div className="balance-sub text-warning" style={{marginTop: '4px'}}>
              Bị giữ (chờ khớp): {formatCurrency((user?.balance || 0) - (user?.availableBalance || 0))} VNĐ
            </div>
          </div>
        </div>

        {/* Cột phải: Form */}
        <div className="wallet-main">
          <div className="wallet-tabs">
            <button 
              className={`wallet-tab ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => { setActiveTab('deposit'); setMessage({type:'', text:''}); }}
            >
              Nạp tiền
            </button>
            <button 
              className={`wallet-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => { setActiveTab('withdraw'); setMessage({type:'', text:''}); }}
            >
              Rút tiền
            </button>
            <button 
              className={`wallet-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setMessage({type:'', text:''}); }}
            >
              Lịch sử
            </button>
          </div>

          <div className="wallet-content">
            {message.text && (
              <div className={`wallet-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'deposit' && (
              <div className="deposit-section">
                {pendingPayment ? (
                  /* === GIAO DIỆN NẠP TIỀN QUA MÃ QR (SSI-STYLE) === */
                  <div className="deposit-qr-layout">
                    <h3 className="deposit-qr-title">NẠP TIỀN QUA MÃ QR</h3>
                    
                    <div className="deposit-qr-grid">
                      {/* BÊN TRÁI: Thông tin chuyển khoản */}
                      <div className="deposit-info-panel">
                        {/* Tài khoản */}
                        <div className="info-row">
                          <span className="info-label">Tài khoản nạp tiền</span>
                          <div className="info-value-group">
                            <span className="info-value">{user?.username || 'StockLab'} - TK tiền mặt - {user?.fullName || user?.username}</span>
                          </div>
                        </div>

                        {/* Số tiền */}
                        <div className="info-row">
                          <span className="info-label">Số tiền</span>
                          <div className="info-value-group">
                            <span className="info-value highlight">{formatCurrency(pendingPayment.amount)} VNĐ</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(String(pendingPayment.amount), 'amount')}>
                              {copiedField === 'amount' ? '✓' : '📋'}
                            </button>
                          </div>
                        </div>

                        {/* Ngân hàng */}
                        <div className="info-row">
                          <span className="info-label">Cổng thanh toán</span>
                          <div className="info-value-group">
                            <span className="info-value">VNPay - Cổng thanh toán trực tuyến</span>
                          </div>
                        </div>

                        {/* Tên chủ tài khoản */}
                        <div className="info-row">
                          <span className="info-label">Tên chủ tài khoản</span>
                          <div className="info-value-group">
                            <span className="info-value">{user?.fullName || user?.username || 'StockLab User'}</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(user?.fullName || user?.username || '', 'name')}>
                              {copiedField === 'name' ? '✓' : '📋'}
                            </button>
                          </div>
                        </div>

                        {/* Mã giao dịch */}
                        <div className="info-row">
                          <span className="info-label">Mã giao dịch</span>
                          <div className="info-value-group">
                            <span className="info-value">{pendingPayment.txnRef}</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(pendingPayment.txnRef, 'txnRef')}>
                              {copiedField === 'txnRef' ? '✓' : '📋'}
                            </button>
                          </div>
                        </div>

                        {/* Nội dung */}
                        <div className="info-row">
                          <span className="info-label">Nội dung</span>
                          <div className="info-value-group">
                            <span className="info-value">Nap tien {pendingPayment.txnRef} tai StockLab</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(`Nap tien ${pendingPayment.txnRef} tai StockLab`, 'content')}>
                              {copiedField === 'content' ? '✓' : '📋'}
                            </button>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="deposit-qr-actions">
                          <button 
                            className="btn-create-qr"
                            onClick={() => { setPendingPayment(null); setDepositAmount(''); }}
                          >
                            Tạo lệnh mới
                          </button>
                          <a 
                            href={pendingPayment.paymentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-direct-pay"
                          >
                            Thanh toán trực tiếp →
                          </a>
                        </div>
                      </div>

                      {/* BÊN PHẢI: QR Code */}
                      <div className="deposit-qr-panel">
                        <div className="qr-code-wrapper">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pendingPayment.paymentUrl)}`}
                            alt="Mã QR Thanh Toán VNPay"
                            className="qr-code-img"
                          />
                        </div>
                        <div className="qr-info-box">
                          <div className="qr-info-row">
                            <span className="qr-info-label">Tên chủ TK</span>
                            <span className="qr-info-value">{user?.fullName || user?.username}</span>
                          </div>
                          <div className="qr-info-row">
                            <span className="qr-info-label">Mã GD</span>
                            <span className="qr-info-value">{pendingPayment.txnRef}</span>
                          </div>
                          <div className="qr-info-row">
                            <span className="qr-info-label">Nội dung CK</span>
                            <span className="qr-info-value">Nap tien {pendingPayment.txnRef} tai StockLab</span>
                          </div>
                        </div>
                        <a 
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pendingPayment.paymentUrl)}`}
                          download={`vnpay-qr-${pendingPayment.txnRef}.png`}
                          className="btn-download-qr"
                        >
                          ↓ Tải về
                        </a>
                      </div>
                    </div>

                    {/* Lưu ý */}
                    <div className="deposit-note">
                      <span>•</span> Quét mã QR bằng ứng dụng ngân hàng hoặc camera điện thoại để thanh toán qua VNPay. Tiền sẽ được cộng tự động sau khi thanh toán thành công.
                    </div>
                  </div>
                ) : (
                  /* === FORM NHẬP SỐ TIỀN === */
                  <form className="wallet-form form-box" onSubmit={handleDeposit} style={{ background: '#1a1d24', padding: '25px', borderRadius: '12px' }}>
                    <h4 className="mb-4 text-white" style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>Nạp Tiền Qua Mã QR</h4>
                    
                    <div className="form-group mb-4">
                      <label className="text-muted">Số tiền (VNĐ)</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Nhập số tiền cần nạp"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          min="10000"
                          step="10000"
                          required
                          style={{ fontSize: '1.1rem', padding: '12px 60px 12px 12px' }}
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontWeight: '600' }}>VND</span>
                      </div>
                      <small className="form-text text-muted mt-2">Tối thiểu: 10,000 VNĐ</small>
                    </div>

                    {/* Quick amount buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {[100000, 500000, 1000000, 5000000, 10000000].map(amt => (
                        <button 
                          key={amt} 
                          type="button" 
                          onClick={() => setDepositAmount(String(amt))}
                          style={{
                            background: Number(depositAmount) === amt ? '#e53e3e' : '#2d3748',
                            color: Number(depositAmount) === amt ? '#fff' : '#a0aec0',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {formatCurrency(amt)}₫
                        </button>
                      ))}
                    </div>

                    <div className="form-actions mt-4">
                      <button type="submit" className="btn-create-qr" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}>
                        {loading ? 'Đang tạo mã QR...' : 'Tạo mã QR'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'withdraw' && (
              <form className="wallet-form" onSubmit={handleWithdraw}>
                <div className="form-group">
                  <label>Số tiền rút (VNĐ)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="VD: 5000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10000"
                    max="50000000"
                    step="10000"
                    required
                  />
                  <small className="form-text text-muted">Tối thiểu: 10,000 VNĐ - Tối đa: 50,000,000 VNĐ/lần</small>
                </div>
                
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Ngân hàng nhận</label>
                    <select 
                      className="form-control"
                      value={withdrawBankName}
                      onChange={(e) => setWithdrawBankName(e.target.value)}
                    >
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="MB">MB Bank</option>
                      <option value="BIDV">BIDV</option>
                    </select>
                  </div>
                  <div className="form-group flex-2">
                    <label>Số tài khoản nhận</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nhập số tài khoản"
                      value={withdrawBankAccount}
                      onChange={(e) => setWithdrawBankAccount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label>Mã xác nhận OTP (Gửi về tự động)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nhập 6 số OTP..."
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || isSendingOtp}
                      style={{ whiteSpace: 'nowrap', minWidth: '120px' }}
                    >
                      {isSendingOtp ? 'Đang gửi...' : countdown > 0 ? `Chờ ${countdown}s` : 'Nhận mã OTP'}
                    </button>
                  </div>
                </div>

                <div className="form-actions mt-4">
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Xác nhận Rút Lợi Nhuận'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'history' && (
               <div className="history-section">
                 {loadingHistory ? (
                   <p className="text-center text-muted py-4">Đang tải lịch sử...</p>
                 ) : historyItems.length === 0 ? (
                   <div className="empty-state">
                     <div className="empty-icon">🕒</div>
                     <h4>Chưa có giao dịch nào</h4>
                     <p className="text-muted">Lịch sử nạp/rút sẽ hiển thị tại đây.</p>
                   </div>
                 ) : (
                   <div className="table-responsive">
                     <table className="table wallet-table">
                       <thead>
                         <tr>
                           <th>Mã GD</th>
                           <th>Loại</th>
                           <th className="text-right">Số Tiền</th>
                           <th>Ngân hàng</th>
                           <th>Thời gian</th>
                           <th>Trạng thái</th>
                         </tr>
                       </thead>
                       <tbody>
                         {historyItems.map((item) => (
                           <tr key={item.id}>
                             <td>
                               #{item.transactionCode || item.id}
                             </td>
                             <td>
                               <span className={`transaction-type ${item.type.toLowerCase()}`}>
                                 {item.type === 'DEPOSIT' ? 'Nạp tiền' : 'Rút tiền'}
                               </span>
                             </td>
                             <td className={`text-right font-weight-bold ${item.type === 'DEPOSIT' ? 'text-success' : 'text-danger'}`}>
                               {item.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(item.amount)}₫
                             </td>
                             <td>
                               <div>{item.bankName}</div>
                               <small className="text-muted">{item.bankAccount}</small>
                             </td>
                             <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                             <td>
                               <span className={`status-badge ${item.status.toLowerCase()}`}>
                                 {item.status}
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
