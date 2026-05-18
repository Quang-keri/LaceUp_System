import React, {useState} from "react";
import authService from "../../../service/authService";
import {useNavigate} from "react-router-dom";
import {message} from "antd";
import {useAuth} from "../../../context/AuthContext";
import {GoogleOutlined} from "@ant-design/icons";
import {useGoogleLogin} from "@react-oauth/google";

const BACKEND_ERRORS: Record<string, string> = {
    PASSWORD_TOO_SHORT: "Mật khẩu quá ngắn (cần ít nhất 6-8 ký tự).",
    WRONG_PASSWORD: "Mật khẩu không chính xác.",
    USER_NOT_FOUND: "Tài khoản không tồn tại.",
    EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
    "Email or Password is invalid!": "Email hoặc mật khẩu không chính xác.",
    "Validation failed": "Thông tin nhập vào không hợp lệ.",
};

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [hasEmailError, setHasEmailError] = useState(false);
    const [hasPasswordError, setHasPasswordError] = useState(false);

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {refreshProfile} = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setHasEmailError(false);
        setHasPasswordError(false);

        let isValid = true;

        if (!email.trim()) {
            message.error("Vui lòng nhập email của bạn.");
            setHasEmailError(true);
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            message.error("Định dạng email không hợp lệ.");
            setHasEmailError(true);
            isValid = false;
        }

        if (!password) {
            if (isValid) message.error("Vui lòng nhập mật khẩu.");
            setHasPasswordError(true);
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        try {
            const response = await authService.login({email, password});
            if (response.code === 200) {
                message.success("Đăng nhập thành công!");
                await refreshProfile();
                navigate("/home");
            }
        } catch (error: any) {
            const errorData = error.response?.data;

            if (errorData?.result) {
                const {email: emailErrCode, password: passwordErrCode} =
                    errorData.result;

                if (emailErrCode) {
                    setHasEmailError(true);
                    message.error(BACKEND_ERRORS[emailErrCode] || emailErrCode);
                }

                if (passwordErrCode) {
                    setHasPasswordError(true);
                    message.error(BACKEND_ERRORS[passwordErrCode] || passwordErrCode);
                }
            } else {
                const backendMessage = errorData?.message;
                const translatedMessage =
                    BACKEND_ERRORS[backendMessage] ||
                    "Email hoặc mật khẩu không chính xác.";

                setHasEmailError(true);
                setHasPasswordError(true);

                message.error(translatedMessage);
            }
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
                message.error("Đăng nhập bằng Google thất bại. Vui lòng thử lại!");
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

                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (hasEmailError) setHasEmailError(false);
                        }}
                        placeholder="Email"
                        className={`w-full px-4 py-2 text-gray-900 placeholder-gray-400 bg-white border rounded-lg outline-none transition focus:ring-2 ${
                            hasPasswordError
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-[#9156F1] border-gray-300"
                        }`}
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (hasPasswordError) setHasPasswordError(false);
                        }}
                        placeholder="Mật khẩu"
                        className={`w-full px-4 py-2 text-gray-900 placeholder-gray-400 bg-white border rounded-lg outline-none transition focus:ring-2 ${
                            hasPasswordError
                                ? "border-red-500 focus:ring-red-500"
                                : "focus:ring-[#9156F1] border-gray-300"
                        }`}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#9156F1] hover:bg-[#7E46D6] text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 mt-2"
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="my-4 text-center text-gray-400 text-sm">HOẶC</div>

                <button
                    onClick={() => handleGoogleLogin()}
                    disabled={loading}
                    className="w-full border border-[#9156F1] text-[#9156F1] flex justify-center items-center gap-2 hover:bg-[#F3ECFF] py-2 rounded-lg transition disabled:opacity-50"
                >
                    <GoogleOutlined/> Tiếp tục với Google
                </button>

                <div className="mt-6 text-center text-sm">
                    Chưa có tài khoản?{" "}
                    <button
                        onClick={() => navigate("/register")}
                        className="text-[#9156F1] font-medium hover:underline"
                    >
                        Đăng ký
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
