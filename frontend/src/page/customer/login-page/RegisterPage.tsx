import React, { useState } from "react";
import { message } from "antd";
import authService from "../../../service/authService";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [values, setValues] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAgreed) {
      return message.warning("Vui lòng xác nhận thông tin trước khi đăng ký!");
    }

    if (values.password !== values.confirmPassword) {
      return message.error("Mật khẩu nhập lại không khớp!");
    }

    setLoading(true);
    try {
      const response = await authService.sendRegisterOtp({
        ...values,
        roleName: "RENTER",
      });

      if (response?.code === 200) {
        message.success("Đăng ký thành công! Kiểm tra email.");
        navigate("/login");
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F5F3FF] px-3 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
        <h2 className="text-xl font-bold text-center text-black mb-4">
          Tạo tài khoản
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input
            name="userName"
            placeholder="Họ và tên"
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="phone"
              placeholder="SĐT"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
              onChange={handleChange}
            />

            <select
              name="gender"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
              onChange={handleChange}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <input
            name="dateOfBirth"
            type="date"
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
            onChange={handleChange}
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9156F1] outline-none"
            onChange={handleChange}
          />

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="confirmInfo"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-4 h-4 text-[#9156F1] focus:ring-[#9156F1] border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="confirmInfo"
              className="text-gray-600 cursor-pointer"
            >
              Đồng ý với chính xách của chúng tôi.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !isAgreed}
            className={`w-full py-2 rounded-lg font-semibold transition text-white ${
              loading || !isAgreed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#9156F1] hover:bg-[#7E46D6]"
            }`}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-3 text-center text-xs">
          Đã có tài khoản?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#9156F1] hover:underline"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
