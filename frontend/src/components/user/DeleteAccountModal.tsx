import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  List,
  Modal,
  Space,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";

import accountDeletionService from "../../service/accountDeletionService";
import type {
  DeleteAccountRequest,
  DeleteAccountResponse,
} from "../../types/accountDeletion";

const { Text, Paragraph } = Typography;

const PRIMARY_COLOR = "#9156F1";
const DELETE_COLOR = "#ef4444";

interface DeleteAccountFormValues {
  password?: string;
  reason: string;
  confirmation: string;
}

interface DeleteAccountModalProps {
  open: boolean;
  authProvider?: string;
  role?: string;
  onClose: () => void;
  onDeleted: () => void;
}

const getApiErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    responseData?.result?.message ||
    error?.message ||
    "Không thể xóa tài khoản. Vui lòng thử lại."
  );
};

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  authProvider = "LOCAL",
  role = "",
  onClose,
  onDeleted,
}) => {
  const [form] = Form.useForm<DeleteAccountFormValues>();

  const [loading, setLoading] = useState(false);

  const normalizedProvider = String(authProvider).trim().toUpperCase();

  const normalizedRole = String(role).trim().toUpperCase();

  /*
   * LOCAL/BOTH: bắt buộc nhập mật khẩu.
   * GOOGLE: backend hiện xác thực bằng phiên đăng nhập nên không cần mật khẩu.
   */
  const requiresPassword =
    normalizedProvider === "LOCAL" ||
    normalizedProvider === "BOTH" ||
    normalizedProvider === "EMAIL" ||
    normalizedProvider === "PASSWORD";

  const isOwner = normalizedRole === "OWNER";
  const isAdmin = normalizedRole === "ADMIN";

  const warningMessage = useMemo(() => {
    if (isAdmin) {
      return "Tài khoản quản trị nội bộ không thể tự xóa trên hệ thống.";
    }

    if (isOwner) {
      return (
        "Tài khoản chủ sân chỉ được xóa khi không còn sân hoạt động, " +
        "booking, trận đấu hoặc khoản đối soát đang chờ xử lý."
      );
    }

    return (
      "Thông tin cá nhân và quyền đăng nhập của bạn sẽ bị xóa. " +
      "Hành động này không thể hoàn tác."
    );
  }, [isAdmin, isOwner]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setLoading(false);
    }
  }, [open, form]);

  const handleClose = () => {
    if (loading) return;

    form.resetFields();
    onClose();
  };

  const showWaitingResult = (result: DeleteAccountResponse) => {
    Modal.warning({
      centered: true,
      width: 560,
      title: "Chưa thể xóa tài khoản ngay",
      icon: (
        <InfoCircleOutlined
          style={{
            color: "#fa8c16",
          }}
        />
      ),
      okText: "Đã hiểu",
      okButtonProps: {
        style: {
          backgroundColor: PRIMARY_COLOR,
          borderColor: PRIMARY_COLOR,
        },
      },
      content: (
        <div style={{ marginTop: 16 }}>
          <Paragraph
            style={{
              color: "#4B5563",
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            {result.message ||
              "Yêu cầu xóa tài khoản đã được ghi nhận nhưng tài khoản vẫn còn nghĩa vụ cần xử lý."}
          </Paragraph>

          {result.blockers?.length > 0 && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
              }}
            >
              <Text
                strong
                style={{
                  color: "#ad4e00",
                }}
              >
                Bạn cần xử lý các nội dung sau:
              </Text>

              <List
                size="small"
                style={{
                  marginTop: 8,
                }}
                dataSource={result.blockers}
                renderItem={(blocker) => (
                  <List.Item
                    style={{
                      border: "none",
                      padding: "7px 0",
                      alignItems: "flex-start",
                    }}
                  >
                    <Space align="start">
                      <ExclamationCircleOutlined
                        style={{
                          color: "#fa8c16",
                          marginTop: 4,
                        }}
                      />

                      <Text
                        style={{
                          color: "#7c2d12",
                        }}
                      >
                        {blocker}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      ),
    });
  };

  const showCompletedResult = (result: DeleteAccountResponse) => {
    Modal.success({
      centered: true,
      width: 500,
      title: "Xóa tài khoản thành công",
      icon: (
        <CheckCircleOutlined
          style={{
            color: "#10B981",
          }}
        />
      ),
      okText: "Về trang đăng nhập",
      closable: false,
      maskClosable: false,
      keyboard: false,
      okButtonProps: {
        style: {
          backgroundColor: PRIMARY_COLOR,
          borderColor: PRIMARY_COLOR,
        },
      },
      content: (
        <div style={{ marginTop: 14 }}>
          <Paragraph
            style={{
              color: "#4B5563",
              lineHeight: 1.6,
            }}
          >
            {result.message ||
              "Tài khoản và dữ liệu cá nhân của bạn đã được xóa."}
          </Paragraph>

          <Alert
            type="info"
            showIcon
            message="Phiên đăng nhập hiện tại sẽ kết thúc và bạn sẽ được chuyển về trang đăng nhập."
            style={{
              marginTop: 14,
              borderRadius: 10,
              backgroundColor: "#F4EEFF",
              borderColor: "#D8C4FF",
            }}
          />
        </div>
      ),
      onOk: onDeleted,
    });
  };

  const submitDeleteAccount = async (payload: DeleteAccountRequest) => {
    setLoading(true);

    try {
      console.log("Delete account payload:", {
        password: payload.password ? "Đã nhập mật khẩu" : null,
        reason: payload.reason,
        confirmation: payload.confirmation,
      });

      const result = await accountDeletionService.requestAccountDeletion(
        payload,
      );

      if (result.status === "WAITING_FOR_OBLIGATIONS") {
        form.resetFields();
        onClose();

        showWaitingResult(result);
        return;
      }

      if (result.status === "COMPLETED") {
        form.resetFields();
        onClose();

        showCompletedResult(result);
        return;
      }

      if (result.status === "PROCESSING") {
        message.info(
          result.message || "Yêu cầu xóa tài khoản đang được hệ thống xử lý.",
        );
        return;
      }

      message.warning(
        result.message || "Yêu cầu xóa tài khoản đã được ghi nhận.",
      );
    } catch (error: any) {
      message.error(getApiErrorMessage(error));

      /*
       * Throw lại lỗi để popup xác nhận không hiểu nhầm
       * rằng thao tác đã hoàn thành thành công.
       */
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteButtonClick = async () => {
    if (isAdmin) {
      message.error("Tài khoản quản trị nội bộ không thể tự xóa.");
      return;
    }

    try {
      /*
       * validateFields trả về đầy đủ tất cả giá trị đang có
       * trong form: password, reason và confirmation.
       */
      const values = await form.validateFields();

      const password = String(values.password ?? "").trim();

      const reason = String(values.reason ?? "").trim();

      const confirmation = String(values.confirmation ?? "")
        .trim()
        .toUpperCase();

      const payload: DeleteAccountRequest = {
        password: password || null,
        reason: reason || null,
        confirmation,
      };

      Modal.confirm({
        centered: true,
        width: 520,
        title: "Bạn có chắc muốn xóa tài khoản?",
        icon: (
          <ExclamationCircleOutlined
            style={{
              color: DELETE_COLOR,
            }}
          />
        ),
        content: (
          <div style={{ marginTop: 14 }}>
            <Paragraph
              style={{
                color: "#4B5563",
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            >
              Sau khi tài khoản được xóa, bạn sẽ không thể đăng nhập hoặc khôi
              phục lại dữ liệu cá nhân.
            </Paragraph>

            <Alert
              type="error"
              showIcon
              message="Hành động này không thể hoàn tác"
              description={
                isOwner
                  ? "Sân, booking, trận đấu và dữ liệu liên quan sẽ được hệ thống kiểm tra trước khi tài khoản được xóa."
                  : "Thông tin cá nhân và quyền truy cập tài khoản sẽ bị xóa vĩnh viễn."
              }
              style={{
                borderRadius: 10,
              }}
            />
          </div>
        ),
        okText: "Có, xóa tài khoản",
        cancelText: "Không, quay lại",
        okButtonProps: {
          danger: true,
          type: "primary",
        },
        cancelButtonProps: {
          disabled: loading,
        },

        /*
         * Trả về Promise để Ant Design tự hiển thị
         * trạng thái loading trên nút xác nhận.
         */
        onOk: () => submitDeleteAccount(payload),
      });
    } catch (error: any) {
      /*
       * Đây là lỗi validate form.
       * Ant Design đã tự hiển thị lỗi dưới field nên không cần message.
       */
      if (error?.errorFields) {
        return;
      }

      console.error("Lỗi xác nhận xóa tài khoản:", error);
    }
  };

  return (
    <Modal
      open={open}
      centered
      width={580}
      title={
        <Space>
          <DeleteOutlined
            style={{
              color: DELETE_COLOR,
              fontSize: 23,
            }}
          />

          <span>Xóa tài khoản</span>
        </Space>
      }
      onCancel={handleClose}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>,

        !isAdmin && (
          <Button
            key="delete"
            danger
            type="primary"
            icon={<DeleteOutlined />}
            loading={loading}
            onClick={handleDeleteButtonClick}
          >
            Xóa tài khoản
          </Button>
        ),
      ]}
    >
      <Alert
        type={isAdmin ? "error" : "warning"}
        showIcon
        message={warningMessage}
        style={{
          marginBottom: 22,
          borderRadius: 10,
        }}
      />

      {!isAdmin && (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            password: "",
            reason: "",
            confirmation: "",
          }}
        >
          <Form.Item
            name="reason"
            label="Lý do xóa tài khoản"
            rules={[
              {
                max: 200,
                message: "Lý do không được vượt quá 200 ký tự",
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={200}
              showCount
              disabled={loading}
              placeholder="Ví dụ: Tôi không còn nhu cầu sử dụng ứng dụng"
            />
          </Form.Item>

          {requiresPassword ? (
            <Form.Item
              name="password"
              label="Mật khẩu hiện tại"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Vui lòng nhập mật khẩu hiện tại",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                disabled={loading}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
            </Form.Item>
          ) : (
            <Alert
              type="info"
              showIcon
              message="Tài khoản đăng nhập bằng Google"
              description="Tài khoản sẽ được xác thực bằng phiên đăng nhập hiện tại nên không cần nhập mật khẩu."
              style={{
                marginBottom: 22,
                borderRadius: 10,
                backgroundColor: "#F4EEFF",
                borderColor: "#D8C4FF",
              }}
            />
          )}

          <Form.Item
            name="confirmation"
            label={<span>Nhập "XOA" để xác nhận</span>}
            validateTrigger={["onChange", "onBlur"]}
            getValueFromEvent={(event) =>
              String(event.target.value ?? "").toUpperCase()
            }
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập XOA để xác nhận",
              },
              {
                validator: (_, value) => {
                  const confirmation = String(value ?? "")
                    .trim()
                    .toUpperCase();

                  if (confirmation === "XOA") {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("Bạn phải nhập chính xác XOA"),
                  );
                },
              },
            ]}
          >
            <Input
              prefix={<DeleteOutlined />}
              disabled={loading}
              placeholder="Nhập XOA"
              autoComplete="off"
              maxLength={3}
              onPressEnter={() => {
                if (!loading) {
                  handleDeleteButtonClick();
                }
              }}
            />
          </Form.Item>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "#fff1f0",
              border: "1px solid #ffccc7",
            }}
          >
            <Space align="start">
              <ExclamationCircleOutlined
                style={{
                  color: DELETE_COLOR,
                  marginTop: 4,
                }}
              />

              <Text
                style={{
                  color: "#991b1b",
                  lineHeight: 1.6,
                }}
              >
                Sau khi bấm nút xóa, bạn vẫn phải xác nhận thêm một lần nữa
                trước khi yêu cầu được gửi đến hệ thống.
              </Text>
            </Space>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default DeleteAccountModal;
