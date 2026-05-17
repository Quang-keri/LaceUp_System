import React, { useState } from "react";
import authService from "../../../service/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../../context/AuthContext";
import { GoogleOutlined } from "@ant-design/icons";
import { useGoogleLogin } from "@react-oauth/google";

const LoginPage: React.FC = () => {
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
        message.success("Đăng nhập thành công!");
        await refreshProfile();
        navigate("/");
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

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        const response = await authService.loginWithGoogle(codeResponse.code);
        if (response.code === 200) {
          message.success("Đăng nhập bằng Google thành công!");
          await refreshProfile();
          navigate("/");
        }
      } catch (error: any) {
        message.error(
          "Đăng nhập Google thất bại: " +
            (error.response?.data?.message || "Lỗi kết nối"),
        );
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error(errorResponse);
      message.error("Quá trình xác thực với Google thất bại.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center text-[#000] mb-6">
          Đăng nhập
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Mật khẩu"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9156F1] hover:bg-[#7E46D6] text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-400">HOẶC</div>

        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full border border-[#9156F1] text-[#9156F1] flex justify-center items-center gap-2 hover:bg-[#F3ECFF] py-2 rounded-lg transition disabled:opacity-50"
        >
          <GoogleOutlined /> Tiếp tục với Google
        </button>

        <div className="mt-4 text-center text-sm">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-[#9156F1] hover:underline"
          >
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
