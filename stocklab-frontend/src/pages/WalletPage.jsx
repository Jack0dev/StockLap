import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../api/api';
import { usePageTour } from '../hooks/usePageTour';
import './WalletPage.css';

export default function WalletPage() {
  const { user, fetchUserProfile } = useAuth();
  const { restartTour } = usePageTour('wallet');
  const [activeTab, setActiveTab] = useState('deposit');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [bankName, setBankName] = useState('MB'); // Mặc định MB Bank
  const [bankAccount, setBankAccount] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState(null); // Lưu thông tin thanh toán PENDING

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


  // ----- LOGIC NẠP TIỀN -----
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số tiền hợp lệ (>0)' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        amount: Number(depositAmount),
        bankName: bankName,
        bankAccount: bankAccount
      };
      const res = await walletAPI.deposit(payload);
      if (res.data.success) {
        // Lưu thông tin để render QR Payment Card
        setPendingDeposit({
          amount: Number(depositAmount),
          transactionCode: res.data.data.transactionCode,
          bankName: bankName
        });
        setMessage({ type: '', text: '' }); // Xóa message, dùng giao diện QR luôn
        setDepositAmount('');
        if (fetchUserProfile) await fetchUserProfile();
        fetchHistory(); // Làm mới lịch sử để thấy lệnh PENDING
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Lỗi khi nạp tiền' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setLoading(false);
    }
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Hiện thông báo nhỏ (tùy chọn)
  };

  // Helper cho giao diện chuyển khoản
  const SYSTEM_BANK = {
    accountNo: '8858253943',
    accountName: 'STOCK LAB CK', 
    bankName: 'MB Bank',
    bankId: 'MB' // Mã cho VietQR
  };

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
                {pendingDeposit ? (
                  // GIAO DIỆN THANH TOÁN QR PAYMENT CHUYÊN NGHIỆP
                  <div className="payment-card-wrapper slide-in" style={{ maxWidth: '420px', margin: '0 auto', background: '#f5f7fa', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                    
                    {/* Header màu (VD màu xanh MB) */}
                    <div className="payment-header" style={{ background: '#1c3d9a', padding: '20px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '5px 15px' }}>
                        <span style={{ color: '#1c3d9a', fontWeight: 'bold', fontSize: '1.2rem' }}>MB</span>
                        <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '4px' }}>BANK</span>
                      </div>
                    </div>

                    <div className="payment-body" style={{ padding: '20px 20px 30px 20px', textAlign: 'center' }}>
                      {/* QR Code */}
                      <div className="qr-wrapper" style={{ margin: '0 auto', padding: '10px', background: '#fff', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <img 
                          src={`https://img.vietqr.io/image/${SYSTEM_BANK.bankId}-${SYSTEM_BANK.accountNo}-compact2.png?amount=${pendingDeposit.amount}&addInfo=${pendingDeposit.transactionCode}&accountName=${SYSTEM_BANK.accountName.replace(/ /g, '%20')}`} 
                          alt="Mã QR Thanh Toán"
                          style={{ width: '220px', height: '220px', display: 'block' }}
                        />
                      </div>
                      <p style={{ color: '#4a5568', margin: '15px 0 25px 0', fontSize: '0.95rem' }}>Quét mã QR để thanh toán nhanh</p>

                      {/* Các khối thông tin có nút Copy */}
                      <div className="payment-info-box" style={{ background: '#eef2fb', border: '1px solid #dbe4f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3182ce', textTransform: 'uppercase', marginBottom: '4px' }}>Số tài khoản</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2b6cb0' }}>{SYSTEM_BANK.accountNo}</div>
                        </div>
                        <button onClick={() => copyToClipboard(SYSTEM_BANK.accountNo)} style={{ background: '#fff', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3182ce', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </div>

                      <div className="payment-info-box" style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568', textTransform: 'uppercase', marginBottom: '4px' }}>Chủ tài khoản</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1a202c' }}>{SYSTEM_BANK.accountName}</div>
                        </div>
                        <div style={{ background: '#f7fafc', border: '1px solid #edf2f7', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                      </div>

                      <div className="payment-info-box" style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '12px', padding: '12px 16px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38a169', textTransform: 'uppercase', marginBottom: '4px' }}>Nội dung chuyển</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#276749' }}>{pendingDeposit.transactionCode}</div>
                        </div>
                        <button onClick={() => copyToClipboard(pendingDeposit.transactionCode)} style={{ background: '#fff', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#38a169', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </div>

                    </div>
                    
                    {/* Footer Button */}
                    <button 
                      onClick={() => { setPendingDeposit(null); setActiveTab('history'); }}
                      style={{ width: '100%', padding: '18px', background: '#3182ce', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.5px' }}>
                      Hoàn tất / Kiểm tra số dư lịch sử
                    </button>
                  </div>

                ) : (
                  <>
                    <form className="wallet-form form-box" onSubmit={handleDeposit} style={{ background: '#1a1d24', padding: '25px', borderRadius: '12px' }}>
                      <h4 className="mb-4 text-white">Khởi Tạo Lệnh Nạp Tiền</h4>
                      <div className="form-group mb-4">
                        <label className="text-muted">Nhập số tiền cần nạp (VNĐ)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="VD: 5000000"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          min="10000"
                          step="10000"
                          required
                          style={{ fontSize: '1.2rem', padding: '12px' }}
                        />
                        <small className="form-text text-muted mt-2">Tối thiểu: 10,000 VNĐ</small>
                      </div>

                      <div className="form-actions mt-4">
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '12px', fontSize: '1.1rem' }}>
                          {loading ? 'Đang khởi tạo lệnh...' : 'Tiếp tục / Lấy mã QR'}
                        </button>
                      </div>
                    </form>
                  </>
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
