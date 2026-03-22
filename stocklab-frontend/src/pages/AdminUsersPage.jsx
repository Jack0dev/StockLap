import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getAllUsers();
            if (response.data.success) {
                setUsers(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này?')) return;
        
        try {
            const response = await adminAPI.toggleUserLock(userId);
            if (response.data.success) {
                alert(response.data.message);
                fetchUsers(); // Tải lại danh sách
            } else {
                alert(response.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái');
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '50px auto' }}></div>;

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Quản lý Người dùng</h2>
            </div>
            
            {error && <div style={{ color: '#ff4d4f', marginBottom: '15px' }}>{error}</div>}
            
            <div style={{ overflowX: 'auto', backgroundColor: '#141414', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1f1f1f', borderBottom: '1px solid #333' }}>
                            <th style={{ padding: '16px' }}>ID</th>
                            <th style={{ padding: '16px' }}>Tên đăng nhập</th>
                            <th style={{ padding: '16px' }}>Họ Tên</th>
                            <th style={{ padding: '16px' }}>Email</th>
                            <th style={{ padding: '16px' }}>Số dư (VND)</th>
                            <th style={{ padding: '16px' }}>Quyền</th>
                            <th style={{ padding: '16px' }}>Trạng thái</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            // Jackson serialize boolean isActive => js field (active can be undefined if lombok is weird)
                            const isUserActive = user.active !== undefined ? user.active : user.isActive;
                            return (
                                <tr key={user.id} style={{ borderBottom: '1px solid #333', transition: 'background-color 0.3s' }}>
                                    <td style={{ padding: '16px' }}>{user.id}</td>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '16px' }}>{user.fullName || '-'}</td>
                                    <td style={{ padding: '16px', color: '#888' }}>{user.email}</td>
                                    <td style={{ padding: '16px', color: '#389e0d' }}>
                                        {user.balance?.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: user.role === 'ADMIN' ? '#ff4d4f22' : '#1890ff22',
                                            color: user.role === 'ADMIN' ? '#ff4d4f' : '#1890ff' 
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {isUserActive ? (
                                            <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4d4f' }}></div>
                                                Đã bị khoá
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        {user.role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleToggleLock(user.id)}
                                                style={{ 
                                                    padding: '8px 16px', 
                                                    backgroundColor: isUserActive ? '#ff4d4f' : '#52c41a', 
                                                    color: '#fff', 
                                                    border: 'none', 
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.opacity = 0.8}
                                                onMouseOut={(e) => e.target.style.opacity = 1}
                                            >
                                                {isUserActive ? 'Khoá tài khoản' : 'Mở khoá'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                        Không có user nào trong hệ thống.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
