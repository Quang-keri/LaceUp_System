import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, List, Modal, Space, Typography, message } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import accountDeletionService from "../../service/accountDeletionService";
import type { DeleteAccountResponse } from "../../types/accountDeletion";

const { Text, Paragraph } = Typography;

const PRIMARY_COLOR = "#9156F1";
const DELETE_COLOR = "#EF4444";

interface DeleteAccountModalProps {
  open: boolean;
  role?: string;

  onClose: () => void;

  onDeleted: () => void | Promise<void>;
}

const getApiErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  return (
    responseData?.result?.message ||
    responseData?.message ||
    responseData?.error ||
    error?.message ||
    "Không thể xóa tài khoản. Vui lòng thử lại."
  );
};

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  role = "",
  onClose,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const normalizedRole = String(role).trim().toUpperCase();

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
      setLoading(false);
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
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
            color: "#FA8C16",
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
                backgroundColor: "#FFF7E6",
                border: "1px solid #FFD591",
              }}
            >
              <Text
                strong
                style={{
                  color: "#AD4E00",
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
                          color: "#FA8C16",
                          marginTop: 4,
                        }}
                      />

                      <Text
                        style={{
                          color: "#7C2D12",
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

  const handleConfirmDelete = async () => {
    if (loading) return;

    if (isAdmin) {
      message.error("Tài khoản quản trị nội bộ không thể tự xóa.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend mới không nhận password, reason hoặc confirmation.
       * User được xác định từ access token hiện tại.
       */
      const result = await accountDeletionService.requestAccountDeletion();

      setLoading(false);

      if (result.status === "WAITING_FOR_OBLIGATIONS") {
        onClose();
        showWaitingResult(result);
        return;
      }

      if (result.status === "COMPLETED") {
        onClose();

        message.success(
          result.message || "Tài khoản và dữ liệu cá nhân đã được xóa.",
        );

        /*
         * Parent sẽ logout và redirect về trang chủ.
         */
        await onDeleted();
        return;
      }

      if (result.status === "PROCESSING") {
        message.info(
          result.message || "Tài khoản đang được hệ thống xử lý xóa.",
        );
        return;
      }

      message.warning(
        result.message || "Yêu cầu xóa tài khoản đã được ghi nhận.",
      );
    } catch (error: any) {
      setLoading(false);
      message.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      centered
      width={560}
      title={
        <Space align="start">
          <ExclamationCircleOutlined
            style={{
              color: DELETE_COLOR,
              fontSize: 24,
              marginTop: 3,
            }}
          />

          <span>Xác nhận xóa tài khoản</span>
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
            key="confirm-delete"
            danger
            type="primary"
            icon={<DeleteOutlined />}
            loading={loading}
            onClick={handleConfirmDelete}
          >
            {loading ? "Đang xử lý..." : "Xác nhận xóa"}
          </Button>
        ),
      ]}
    >
      <Paragraph
        strong
        style={{
          color: "#111827",
          fontSize: 15,
          lineHeight: 1.6,
          marginBottom: 14,
        }}
      >
        Bạn có chắc chắn muốn xóa tài khoản không?
      </Paragraph>

      <Alert
        type={isAdmin ? "error" : "warning"}
        showIcon
        message={warningMessage}
        style={{
          marginBottom: 16,
          borderRadius: 10,
        }}
      />

      {!isAdmin && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
          }}
        >
          <WarningItem text="Bạn sẽ không thể đăng nhập lại bằng tài khoản này." />

          <WarningItem text="Thông tin cá nhân và quyền truy cập tài khoản sẽ bị xóa." />

          <WarningItem text="Tài khoản đã xóa không thể khôi phục." />

          {isOwner && (
            <WarningItem text="Tài khoản chủ sân có thể phải chờ nếu còn sân hoạt động, lịch đặt, trận đấu hoặc đối soát chưa hoàn tất." />
          )}
        </div>
      )}

      {isOwner && !isAdmin && (
        <Paragraph
          style={{
            color: "#6B7280",
            lineHeight: 1.6,
            marginTop: 14,
            marginBottom: 0,
          }}
        >
          Hệ thống sẽ kiểm tra các nghĩa vụ còn tồn tại trước khi hoàn tất việc
          xóa tài khoản.
        </Paragraph>
      )}
    </Modal>
  );
};

interface WarningItemProps {
  text: string;
}

const WarningItem: React.FC<WarningItemProps> = ({ text }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <ExclamationCircleOutlined
        style={{
          color: DELETE_COLOR,
          fontSize: 17,
          marginTop: 3,
          flexShrink: 0,
        }}
      />

      <Text
        style={{
          color: "#991B1B",
          lineHeight: 1.5,
        }}
      >
        {text}
      </Text>
    </div>
  );
};

export default DeleteAccountModal;
