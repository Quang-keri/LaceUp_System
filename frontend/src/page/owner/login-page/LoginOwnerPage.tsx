import React, {useState} from 'react';
import authService from '../../../service/authService';
import {useNavigate} from 'react-router-dom';
import './style.css';
import {toast} from "react-toastify";
import {useAuth} from "../../../context/AuthContext.tsx";

const LoginOwnerPage: React.FC = () => {
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
                const token = response.result?.accessToken;
                if (token) {
                    localStorage.setItem("accessToken", token);
                }

                await refreshProfile();

                toast("Đăng nhập thành công.");
                navigate('/owner');
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
            </div>
        </div>
    );
};

export default LoginOwnerPage;