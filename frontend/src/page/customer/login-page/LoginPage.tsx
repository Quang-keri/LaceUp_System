import React, {useState} from 'react';
import authService from '../../../service/authService';
import {useNavigate} from 'react-router-dom';
import {message} from 'antd';
import {useAuth} from '../../../context/AuthContext';
import './style.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {refreshProfile} = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.login({email, password});
            if (response.code === 200) {
                message.success('Đăng nhập thành công!');
                await refreshProfile();
                navigate('/');
            }
        } catch (error: any) {
            message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || 'Lỗi kết nối'));
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
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email của bạn"
                            className="login-input"
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mật khẩu"
                            className="login-input"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="divider">HOẶC</div>

                <button
                    type="button"
                    onClick={() => message.info('Tính năng đang phát triển')}
                    className="google-btn"
                >
                    Tiếp tục với Google
                </button>

                <div className="footer-link">
                    <span>Chưa có tài khoản? </span>
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => navigate('/register')}
                    >
                        Tạo tài khoản mới
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;