import React, { useState } from "react";
import { message } from "antd";
import authService from "../../../service/authService.ts";
import type { CreateUserRequest } from "../../../types/auth.ts";

export interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        gender: "MALE",
        dateOfBirth: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (values.password !== values.confirmPassword) {
            return message.error("Mật khẩu nhập lại không khớp!");
        }

        setLoading(true);
        try {
            const payload: CreateUserRequest = {
                ...values,
                roleName: "RENTER",
            };
            const response = await authService.sendRegisterOtp(payload);
            if (response?.code === 200) {
                message.success("Đăng ký thành công! Hãy kiểm tra Email.");
                onSwitchToLogin();
            } else {
                message.error(response?.message || "Đăng ký thất bại");
            }
        } catch (error) {
            message.error("Lỗi kết nối máy chủ!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Tạo tài khoản</h2>
                    <p className="text-gray-500 mt-2">Bắt đầu trải nghiệm cùng LaceUp</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Họ tên */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <input
                            name="userName"
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* SĐT */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
                            <input
                                name="phone"
                                type="tel"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                onChange={handleChange}
                            />
                        </div>
                        {/* Giới tính */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                            <select
                                name="gender"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                onChange={handleChange}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                            </select>
                        </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                        <input
                            name="dateOfBirth"
                            type="date"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Nhập lại mật khẩu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors mt-4 disabled:bg-blue-300"
                    >
                        {loading ? "Đang xử lý..." : "Đăng ký ngay"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Đã có tài khoản?{" "}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;