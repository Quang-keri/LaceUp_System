import React from "react";
import { Modal, Button, Descriptions, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { UserResponse } from "../../../types/user.ts";

interface UserDetailModalProps {
  open: boolean;
  user: UserResponse | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  user,
  onClose,
}) => {
  const renderRoleTag = (role: string) => {
    let color = "geekblue";
    if (role === "ADMIN") color = "blue";
    if (role === "RENTER") color = "cyan";
    if (role === "OWNER") color = "purple";
    return <Tag color={color}>{role ? role.toUpperCase() : "N/A"}</Tag>;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined /> Thông tin chi tiết người dùng
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={700}
    >
      {user && (
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="ID" span={2}>
            {user.userId}
          </Descriptions.Item>
          <Descriptions.Item label="Tên đăng nhập">
            {user.userName}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={2}>
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {user.phone || "Chưa cập nhật"}
          </Descriptions.Item>
          <Descriptions.Item label="Giới tính">
            {user.gender || "Chưa cập nhật"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">
            {user.dateOfBirth
              ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
              : "Chưa cập nhật"}
          </Descriptions.Item>
          <Descriptions.Item label="Tuổi">{user.age || "-"}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {renderRoleTag(user.role)}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={user.active ? "success" : "error"}>
              {user.active ? "Hoạt động" : "Bị khóa"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(user.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật cuối">
            {user.updatedAt
              ? new Date(user.updatedAt).toLocaleString("vi-VN")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default UserDetailModal;
