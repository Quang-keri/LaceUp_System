import React, {useState} from 'react';
import authService from '../../../service/authService';
import {useNavigate} from 'react-router-dom';
import './style.css'; // Import file CSS ở đây

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.login({email, password});
            if (response.code === 200) {
                alert('Đăng nhập thành công!');
                localStorage.setItem('accessToken', response.result.accessToken);
                localStorage.setItem('refreshToken', response.result.refreshToken);
                navigate('/dashboard');
            }
        } catch (error: any) {
            alert('Đăng nhập thất bại: ' + (error.response?.data?.message || 'Lỗi kết nối'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">ĐĂNG NHẬP</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input"
                            placeholder="example@gmail.com"
                        />
                    </div>
                    <div className="input-group">
                        <label>Mật khẩu:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="login-input"
                            placeholder="********"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="divider">HOẶC</div>

                <button
                    onClick={() => alert('Chức năng Google đang cập nhật')}
                    className="login-button google"
                >
                    Đăng nhập với Google
                </button>
            </div>
        </div>
    );
};

export default LoginPage;