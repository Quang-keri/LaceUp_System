import React, { useState } from "react";
import authService from "../../../service/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../../context/AuthContext.tsx";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import "./style.css";

const LoginOwnerPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      if (response.code === 200) {
        const token = response.result?.accessToken;

        if (token) {
          localStorage.setItem("accessToken", token);
        }

        await refreshProfile();

        message.success("Đăng nhập thành công");
        navigate("/owner");
      }
    } catch (error: any) {
      message.error(
        "Đăng nhập thất bại: " +
          (error.response?.data?.message || "Lỗi kết nối"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-login-page">
      {/* LEFT */}

      <div className="login-left">
        <div className="overlay">
          <div className="brand">
            <div className="logo">S</div>

            <div>
              <h3>SPORT BOOKING</h3>
              <span>QUẢN LÝ SÂN THỂ THAO</span>
            </div>
          </div>

          <div className="hero-content">
            <h1>
              Quản lý dễ dàng <br />
              Vận hành <span>hiệu quả</span>
            </h1>

            <p>
              Nền tảng đặt sân thể thao dành cho chủ sân. Theo dõi lịch đặt,
              doanh thu và khách hàng mọi lúc, mọi nơi.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <p>Quản lý lịch đặt nhanh chóng</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <p>Theo dõi doanh thu chi tiết</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <p>Bảo mật thông tin tuyệt đối</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}

      <div className="login-right">
        <div className="top-decoration"></div>

        <div className="login-box">
          <div className="login-header">
            <div className="header-icon">
              <UserOutlined />
            </div>

            <div>
              <h2>
                Chào mừng bạn quay <span>trở lại!</span>
              </h2>

              <p>Đăng nhập để tiếp tục quản lý sân của bạn</p>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>

              <div className="input-wrapper">
                <MailOutlined className="input-icon" />

                <input
                  type="email"
                  placeholder="owner@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>

              <div className="input-wrapper">
                <LockOutlined className="input-icon" />

                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                Ghi nhớ đăng nhập
              </label>

              <a href="#">Quên mật khẩu?</a>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="divider">
            <span>Hoặc đăng nhập với</span>
          </div>

          <div className="social-login">
            <button className="social-btn">Google</button>

            <button className="social-btn">Facebook</button>
          </div>

          <div className="security-box">
            <SafetyCertificateOutlined className="security-icon" />

            <div>
              <h4>Hệ thống được bảo mật 24/7</h4>
              <p>Thông tin của bạn luôn được bảo vệ an toàn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginOwnerPage;
