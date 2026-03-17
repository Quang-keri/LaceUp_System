import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, message } from "antd";
import authService from "../../../service/authService.ts";

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [form] = Form.useForm();

    type ResetPasswordFormValues = {
        password: string;
        confirmPassword: string;
    };

    const onFinish = async (values: ResetPasswordFormValues) => {
        setApiError("");
        setSuccessMsg("");
        setIsLoading(true);

        try {
            if (token) {
                await authService.resetPassword({
                    token: token,
                    newPassword: values.password,
                });

                setSuccessMsg("Đặt lại mật khẩu thành công!");
                message.success("Đặt lại mật khẩu thành công!");

                setTimeout(() => navigate("/"), 2000);
            }
        } catch (err: unknown) {
            let errorMsg = "Không thể đặt lại mật khẩu. Vui lòng thử lại.";

            if (typeof err === "object" && err !== null && "response" in err) {
                type ErrorResponseData = { message?: string } | string;
                const errorWithResponse = err as {
                    response?: { data?: ErrorResponseData };
                };
                const data = errorWithResponse.response?.data;

                if (typeof data === "string") {
                    errorMsg = data;
                } else if (data && typeof data === "object" && "message" in data) {
                    const messageFromData = (data as { message?: string }).message;
                    if (messageFromData) {
                        errorMsg = messageFromData;
                    }
                }
            }

            setApiError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex justify-center items-start pt-15 min-h-screen bg-[#F3F4F6] [font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif] pb-5">
                <Card className="w-full max-w-105 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-center p-2.5" bordered={false}>
                    <Alert
                        message="Liên kết không hợp lệ"
                        description="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                        type="error"
                        showIcon
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-start pt-15 min-h-screen bg-[#F3F4F6] [font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif] pb-5">
            <Card className="w-full max-w-105 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-center p-2.5" bordered={false}>
                {/* Header - Giảm margin bottom từ 30 xuống 20 */}
                <div style={{ marginBottom: 20 }}>
                    <Title
                        level={3}
                        style={{ margin: 0, color: "#1F2937", fontWeight: "bold" }}
                    >
                        Đặt lại mật khẩu
                    </Title>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                        Nhập mật khẩu mới cho tài khoản của bạn.
                    </Text>
                </div>

                {apiError && (
                    <Alert
                        message={apiError}
                        type="error"
                        showIcon
                        style={{ marginBottom: 15 }}
                    />
                )}
                {successMsg && (
                    <Alert
                        message={successMsg}
                        type="success"
                        showIcon
                        style={{ marginBottom: 15 }}
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    requiredMark={false} // Tắt dấu sao đỏ mặc định nếu muốn form sạch hơn (tuỳ chọn)
                >
                    <Form.Item
                        name="password"
                        style={{ marginBottom: 12 }} // <--- CHỈNH Ở ĐÂY
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu." },
                            { min: 8, message: "Mật khẩu tối thiểu 8 ký tự." },
                        ]}
                    >
                        <div className="relative group">
                            <Input.Password
                                placeholder=" "
                                className="w-full rounded-lg! border! border-gray-300! bg-gray-100! text-[15px] focus-within:border-[#4da6ff]! focus-within:bg-white! focus-within:shadow-[0_0_0_1px_#4da6ff] transition-all duration-150"
                            />
                            <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 group-focus-within:top-0 group-focus-within:-translate-y-1/2 group-focus-within:text-[0.65rem] group-focus-within:text-blue-700 group-focus-within:font-semibold group-focus-within:border-t group-focus-within:border-blue-600 group-has-[input:not(:placeholder-shown)]:top-0 group-has-[input:not(:placeholder-shown)]:-translate-y-1/2 group-has-[input:not(:placeholder-shown)]:text-[0.65rem] group-has-[input:not(:placeholder-shown)]:text-blue-700 group-has-[input:not(:placeholder-shown)]:font-semibold">
                                Mật khẩu mới
                            </label>
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={["password"]}
                        style={{ marginBottom: 20 }} // <--- CHỈNH Ở ĐÂY
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Mật khẩu không khớp!"),
                                    );
                                },
                            }),
                        ]}
                    >
                        <div className="relative group">
                            <Input.Password
                                placeholder=" "
                                className="w-full rounded-lg! border! border-gray-300! bg-gray-100! text-[15px] focus-within:border-[#4da6ff]! focus-within:bg-white! focus-within:shadow-[0_0_0_1px_#4da6ff] transition-all duration-150"
                            />
                            <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1 text-sm text-gray-600 z-10 transition-all duration-150 group-focus-within:top-0 group-focus-within:-translate-y-1/2 group-focus-within:text-[0.65rem] group-focus-within:text-blue-700 group-focus-within:font-semibold group-focus-within:border-t group-focus-within:border-blue-600 group-has-[input:not(:placeholder-shown)]:top-0 group-has-[input:not(:placeholder-shown)]:-translate-y-1/2 group-has-[input:not(:placeholder-shown)]:text-[0.65rem] group-has-[input:not(:placeholder-shown)]:text-blue-700 group-has-[input:not(:placeholder-shown)]:font-semibold">
                                Nhập lại mật khẩu mới
                            </label>
                        </div>
                    </Form.Item>

                    {/* Nút Submit */}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={isLoading}
                            className="bg-[#4da6ff]! border-[#4da6ff]! rounded-[30px] h-10.5 font-semibold text-[16px] shadow-[0_2px_4px_rgba(77,166,255,0.25)]"
                        >
                            Xác nhận
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPassword;
