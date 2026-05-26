import React, { useState } from "react";
import { message } from "antd";
import authService from "../../../service/authService";
import { Link, useNavigate } from "react-router-dom";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const BACKEND_ERRORS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  "Email existed": "Email này đã được đăng ký. Vui lòng dùng email khác.",
  PHONE_ALREADY_EXISTS: "Số điện thoại này đã được sử dụng.",
  PASSWORD_TOO_SHORT: "Mật khẩu quá ngắn (cần ít nhất 6 ký tự).",
  INVALID_EMAIL: "Định dạng email không hợp lệ.",
  "Validation failed": "Thông tin nhập vào không hợp lệ.",
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [values, setValues] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage("");

    if (!values.userName.trim()) {
      setFieldErrors({ userName: true });
      setErrorMessage("Vui lòng nhập họ và tên.");
      return;
    }

    if (!values.email.trim() || !/\S+@\S+\.\S+/.test(values.email)) {
      setFieldErrors({ email: true });
      setErrorMessage("Email không hợp lệ hoặc bị bỏ trống.");
      return;
    }

    if (!values.dateOfBirth) {
      setFieldErrors({ dateOfBirth: true });
      setErrorMessage("Vui lòng chọn ngày sinh.");
      return;
    }

    if (!values.password) {
      setFieldErrors({ password: true });
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: true });
      setErrorMessage("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (!isAgreed) {
      setErrorMessage("Vui lòng đồng ý với chính sách trước khi đăng ký!");
      return;
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
    } catch (error: any) {
      const errorData = error.response?.data;

      if (errorData?.result) {
        const backendResult = errorData.result;
        const newFieldErrors: Record<string, boolean> = {};
        let firstErrorMessage = "";

        Object.keys(backendResult).forEach((key, index) => {
          const errCode = backendResult[key];
          newFieldErrors[key] = true;
          if (index === 0) {
            firstErrorMessage = BACKEND_ERRORS[errCode] || errCode;
          }
        });

        setFieldErrors(newFieldErrors);
        setErrorMessage(firstErrorMessage);
      } else {
        const backendMessage = errorData?.message;

        if (backendMessage === "Email existed") {
          setFieldErrors({ email: true });
        }

        setErrorMessage(
          BACKEND_ERRORS[backendMessage] ||
            backendMessage ||
            "Lỗi kết nối máy chủ!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF] px-3 overflow-hidden py-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
        <h2 className="text-xl font-bold text-center text-black mb-4">
          Tạo tài khoản
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm" noValidate>
          <input
            name="userName"
            value={values.userName}
            placeholder="Họ và tên"
            className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
              fieldErrors.userName
                ? "border-red-500 focus:ring-red-500"
                : "focus:ring-[#9156F1] border-gray-300"
            }`}
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            value={values.email}
            placeholder="Email"
            className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
              fieldErrors.email
                ? "border-red-500 focus:ring-red-500"
                : "focus:ring-[#9156F1] border-gray-300"
            }`}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="phone"
              value={values.phone}
              placeholder="SĐT"
              className={`px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
                fieldErrors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "focus:ring-[#9156F1] border-gray-300"
              }`}
              onChange={handleChange}
            />

            <select
              name="gender"
              value={values.gender}
              className="px-3 py-2 border rounded-lg outline-none transition focus:ring-2 focus:ring-[#9156F1] border-gray-300 bg-white"
              onChange={handleChange}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <input
            name="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
              fieldErrors.dateOfBirth
                ? "border-red-500 focus:ring-red-500"
                : "focus:ring-[#9156F1] border-gray-300"
            }`}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            value={values.password}
            placeholder="Mật khẩu"
            className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
              fieldErrors.password
                ? "border-red-500 focus:ring-red-500"
                : "focus:ring-[#9156F1] border-gray-300"
            }`}
            onChange={handleChange}
          />

          <input
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            placeholder="Nhập lại mật khẩu"
            className={`w-full px-3 py-2 border rounded-lg outline-none transition focus:ring-2 ${
              fieldErrors.confirmPassword
                ? "border-red-500 focus:ring-red-500"
                : "focus:ring-[#9156F1] border-gray-300"
            }`}
            onChange={handleChange}
          />

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="confirmInfo"
              checked={isAgreed}
              onChange={(e) => {
                setIsAgreed(e.target.checked);
                if (errorMessage) setErrorMessage("");
              }}
              className="w-4 h-4 text-[#9156F1] focus:ring-[#9156F1] border-gray-300 rounded cursor-pointer shrink-0"
            />
            <div className="text-gray-600 text-sm">
              <label htmlFor="confirmInfo" className="cursor-pointer">
                Đồng ý với{" "}
              </label>
              <Link
                to="/info/policies"
                className="text-[#9156F1] font-medium hover:underline cursor-pointer"
              >
                chính sách của chúng tôi
              </Link>
              .
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg mt-2">
              <ExclamationCircleOutlined className="text-red-500 text-base" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isAgreed}
            className={`w-full py-2 rounded-lg font-semibold transition text-white mt-1 ${
              loading || !isAgreed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#9156F1] hover:bg-[#7E46D6]"
            }`}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          Đã có tài khoản?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#9156F1] font-medium hover:underline"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
