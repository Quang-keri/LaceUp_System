import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import authService from "../../../service/authService.ts";

const ConfirmRegister: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading",
    );

    // Flag để chống gọi API 2 lần do StrictMode hoặc Re-render
    const initialized = useRef(false);
    const isCalled = useRef(false);

    useEffect(() => {
        const autoVerify = async () => {
            if (initialized.current) return;

            const email = searchParams.get("email");
            const otp = searchParams.get("otp");

            if (isCalled.current || !email || !otp) return;

            isCalled.current = true;

            initialized.current = true;

            try {
                await authService.confirmRegister(email, otp);
                setStatus("success");
            } catch (error: unknown) {
                console.error(error);
                setStatus("error");
            }
        };

        autoVerify();
    }, [searchParams]);

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#F3F4F6",
            }}
        >
            {status === "loading" && (
                <div style={{ textAlign: "center" }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16, fontSize: "15px" }}>
                        Đang xác thực tài khoản, vui lòng chờ...
                    </p>
                </div>
            )}

            {status === "success" && (
                <Result
                    status="success"
                    title="Xác nhận tài khoản thành công"
                    subTitle="Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ."
                    extra={[
                        <Button type="primary" key="login" onClick={() => navigate("/")}>
                            Đăng nhập ngay
                        </Button>,
                    ]}
                />
            )}

            {status === "error" && (
                <Result
                    status="error"
                    title="Xác nhận tài khoản thất bại"
                    subTitle="Link xác nhận không hợp lệ hoặc đã hết hạn."
                    extra={[
                        <Button type="primary" key="home" onClick={() => navigate("/")}>
                            Quay lại trang chủ
                        </Button>,
                    ]}
                />
            )}
        </div>
    );
};

export default ConfirmRegister;
