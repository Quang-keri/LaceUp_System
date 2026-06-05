import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";

import authService from "../../../service/authService";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [hasEmailError, setHasEmailError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: any): string => {
    const data = error?.response?.data;

    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.result?.email) {
      return data.result.email;
    }

    return "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setHasEmailError(false);
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setHasEmailError(true);
      setErrorMessage("Vui lòng nhập email của bạn.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setHasEmailError(true);
      setErrorMessage("Định dạng email không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(normalizedEmail);

      setSuccessMessage(
        "Đã gửi đường dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư email của bạn.",
      );
    } catch (error: any) {
      setHasEmailError(true);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#9156F1]"
        >
          <ArrowLeftOutlined />
          Quay lại đăng nhập
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3ECFF] text-[#9156F1]">
            <MailOutlined className="text-2xl" />
          </div>

          <h2 className="text-2xl font-bold text-black">Quên mật khẩu</h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Nhập email đã đăng ký. Hệ thống sẽ gửi đường dẫn giúp bạn đặt lại
            mật khẩu.
          </p>
        </div>

        {successMessage ? (
          <div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircleOutlined className="mb-3 text-3xl text-green-500" />

              <p className="text-sm font-medium leading-6 text-green-700">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-5 w-full rounded-lg bg-[#9156F1] py-2.5 font-semibold text-white transition hover:bg-[#7E46D6]"
            >
              Về trang đăng nhập
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className="mt-3 w-full rounded-lg border border-[#9156F1] py-2.5 font-semibold text-[#9156F1] transition hover:bg-[#F3ECFF]"
            >
              Gửi lại bằng email khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="forgot-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              disabled={loading}
              placeholder="Nhập email của bạn"
              onChange={(event) => {
                setEmail(event.target.value);

                if (hasEmailError) {
                  setHasEmailError(false);
                }

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                hasEmailError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-[#9156F1] focus:ring-[#9156F1]"
              }`}
            />

            {errorMessage && (
              <div className="mt-2 text-sm font-medium text-red-500">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-lg bg-[#9156F1] py-2.5 font-semibold text-white transition hover:bg-[#7E46D6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Đang gửi yêu cầu..." : "Gửi link đặt lại mật khẩu"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              Đã nhớ mật khẩu?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-[#9156F1] hover:underline"
              >
                Đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
