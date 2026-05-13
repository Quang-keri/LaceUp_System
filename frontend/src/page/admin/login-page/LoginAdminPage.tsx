import React, { useState } from "react";
import authService from "../../../service/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../../context/AuthContext.tsx";

import {
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const LoginAdminPage: React.FC = () => {
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

        message.success("Đăng nhập thành công.");
        navigate("/admin");
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
    // DÙNG POSITION FIXED VÀ 100VW/VH ĐỂ KHÓA CHẶT VÀO MÀN HÌNH, TRỊ DỨT ĐIỂM LỖI SCROLL
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#050816",
        zIndex: 9999, // Ép trang này nổi lên trên cùng, bỏ qua mọi CSS bên ngoài
      }}
    >
      {/* BACKGROUND */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(1.05)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(5, 8, 22, 0.85)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      </div>

      {/* GLOW EFFECTS */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "-100px",
          width: "400px",
          height: "400px",
          backgroundColor: "rgba(249,115,22,0.15)",
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          right: "-100px",
          width: "350px",
          height: "350px",
          backgroundColor: "rgba(147,51,234,0.15)",
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      {/* CONTENT WRAPPER */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          height: "100%",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* LEFT */}
        <div
          className="hidden lg:flex flex-1 flex-col justify-center text-white"
          style={{ paddingLeft: "60px", paddingRight: "40px", gap: "32px" }}
        >
          {/* LOGO */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            <div
              className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/30"
              style={{ width: "48px", height: "48px" }}
            >
              <ThunderboltOutlined />
            </div>
            <div>
              <h1
                className="font-black tracking-wide m-0"
                style={{ fontSize: "24px" }}
              >
                LACE UP
              </h1>
              <p
                className="text-gray-300 uppercase m-0"
                style={{
                  fontSize: "11px",
                  letterSpacing: "3px",
                  marginTop: "4px",
                }}
              >
                Admin Dashboard
              </p>
            </div>
          </div>

          {/* HEADING */}
          <div style={{ maxWidth: "600px" }}>
            <p
              className="text-orange-400 font-semibold uppercase"
              style={{
                fontSize: "13px",
                letterSpacing: "4px",
                marginBottom: "16px",
              }}
            >
              System Control Center
            </p>
            <h2
              className="leading-[1.15] font-black"
              style={{ fontSize: "48px", marginBottom: "20px" }}
            >
              Quản lý hệ thống
              <br />
              <span className="text-orange-500">mạnh mẽ & hiện đại</span>
            </h2>
            <p
              className="text-gray-300 m-0"
              style={{ fontSize: "16px", lineHeight: "1.7" }}
            >
              Theo dõi hoạt động sân tập, quản lý người dùng, doanh thu và vận
              hành toàn bộ hệ thống trong một không gian trực quan và chuyên
              nghiệp.
            </p>
          </div>

          {/* FEATURES */}
          <div className="flex" style={{ gap: "20px" }}>
            {/* FEATURE 1 */}
            <div
              style={{
                width: "240px",
                padding: "24px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
              }}
            >
              <h3
                className="font-black text-orange-400 m-0"
                style={{ fontSize: "32px" }}
              >
                24/7
              </h3>
              <p
                className="text-gray-300 m-0"
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Hệ thống hoạt động ổn định và bảo mật liên tục
              </p>
            </div>

            {/* FEATURE 2 */}
            <div
              style={{
                width: "240px",
                padding: "24px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
              }}
            >
              <h3
                className="font-black text-purple-400 m-0"
                style={{ fontSize: "32px" }}
              >
                Realtime
              </h3>
              <p
                className="text-gray-300 m-0"
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Cập nhật lịch đặt và dữ liệu theo thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT (LOGIN FORM) */}
        <div
          className="w-full lg:w-[500px] flex items-center justify-center"
          style={{ paddingRight: "40px", paddingLeft: "20px" }}
        >
          {/* MAIN CARD */}
          <div
            className="w-full"
            style={{
              maxWidth: "440px",
              padding: "40px 32px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "32px",
              boxShadow: "0 15px 50px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ marginBottom: "32px" }}>
              <div
                className="inline-flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  fontSize: "24px",
                  marginBottom: "20px",
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <h2
                className="text-white font-black leading-tight m-0"
                style={{ fontSize: "36px" }}
              >
                Admin Login
              </h2>
              <p
                className="text-gray-300 m-0"
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Đăng nhập để truy cập trung tâm quản trị hệ thống.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              {/* EMAIL */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  className="block font-semibold text-gray-200"
                  style={{ marginBottom: "8px", fontSize: "14px" }}
                >
                  Email quản trị
                </label>
                <div className="relative flex items-center">
                  <MailOutlined
                    className="absolute text-white/40"
                    style={{ left: "16px", fontSize: "18px" }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@laceup.com"
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "16px",
                      paddingLeft: "46px",
                      paddingRight: "16px",
                      fontSize: "15px",
                      color: "white",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      transition:
                        "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(249,115,22,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  className="block font-semibold text-gray-200"
                  style={{ marginBottom: "8px", fontSize: "14px" }}
                >
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <LockOutlined
                    className="absolute text-white/40"
                    style={{ left: "16px", fontSize: "18px" }}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "16px",
                      paddingLeft: "46px",
                      paddingRight: "16px",
                      fontSize: "15px",
                      color: "white",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      transition:
                        "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(249,115,22,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* OPTIONS */}
              <div
                className="flex items-center justify-between py-1"
                style={{ fontSize: "14px", marginBottom: "24px" }}
              >
                <label
                  className="flex items-center text-gray-300 cursor-pointer"
                  style={{ gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    className="accent-orange-500"
                    style={{ width: "16px", height: "16px" }}
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-orange-400 hover:text-orange-300 transition-all bg-transparent border-none p-0 cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 8px 25px rgba(249,115,22,0.35)",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
              </button>
            </form>

            {/* FOOTER */}
            <div
              className="flex items-center"
              style={{
                marginTop: "32px",
                paddingTop: "20px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                gap: "16px",
              }}
            >
              <div
                className="bg-orange-500/15 flex items-center justify-center text-orange-400"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  fontSize: "20px",
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <div>
                <h4
                  className="text-white font-semibold m-0"
                  style={{ fontSize: "14px" }}
                >
                  Secure Admin Access
                </h4>
                <p
                  className="text-gray-400 m-0"
                  style={{ fontSize: "12px", marginTop: "2px" }}
                >
                  Hệ thống bảo mật nhiều lớp và mã hóa dữ liệu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdminPage;