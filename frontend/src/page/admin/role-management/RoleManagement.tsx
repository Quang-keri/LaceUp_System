import React, { useEffect, useState } from "react";
import {
  Button,
  Space,
  Tag,
  Card,
  Modal,
  message,
  Tooltip,
  Row,
  Col,
  Typography,
  Badge,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  SafetyOutlined,
  UserOutlined,
  TeamOutlined,
  SolutionOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { roleService } from "../../../service/roleService.ts";
import type { RoleResponse } from "../../../types/role.ts";
import RoleModal, { type RoleFormValues } from "./RoleModal.tsx";

const { Title, Text } = Typography;

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response: any = await roleService.getAllRoles();
      const actualData = response.result || response.data?.result || response;
      setRoles(Array.isArray(actualData) ? actualData : []);
    } catch (error) {
      message.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Hàm lấy Icon và màu sắc dựa theo tên Role
  const getRoleConfig = (name: string) => {
    const role = name.toUpperCase();
    if (role.includes("ADMIN"))
      return { icon: <SafetyOutlined />, color: "#f5222d", bg: "#fff1f0" };
    if (role.includes("STAFF"))
      return { icon: <SolutionOutlined />, color: "#52c41a", bg: "#f6ffed" };
    if (role.includes("OWNER"))
      return { icon: <TeamOutlined />, color: "#faad14", bg: "#fffbe6" };
    return { icon: <UserOutlined />, color: "#1890ff", bg: "#e6f7ff" };
  };

  const showModal = (role?: RoleResponse) => {
    setEditingRole(role || null);
    setIsModalOpen(true);
  };

  const handleStatusChange = (record: RoleResponse) => {
    const actionText = record.active ? "vô hiệu hóa" : "kích hoạt lại";
    Modal.confirm({
      title: `Xác nhận ${actionText} vai trò ${record.roleName}?`,
      content: `Điều này có thể ảnh hưởng đến quyền truy cập của người dùng thuộc nhóm này.`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () =>
        roleService.updateStatus(record.roleId, !record.active).then(() => {
          message.success(`Đã ${actionText} thành công`);
          fetchRoles();
        }),
    });
  };

  // --- THÊM HÀM NÀY ĐỂ XỬ LÝ LƯU TỪ MODAL ---
  const handleModalSuccess = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        // 1. Cập nhật thông tin cơ bản
        await roleService.updateRole(editingRole.roleId, {
          roleName: values.roleName,
          description: values.description,
        });

        // 2. Ghi đè toàn bộ quyền
        await roleService.updateRolePermissions(
          editingRole.roleId,
          values.permissionIds,
        );

        message.success("Cập nhật vai trò và phân quyền thành công!");
      } else {
        // 1. Tạo role mới
        const createRes = await roleService.createRole({
          roleName: values.roleName,
          description: values.description,
        });

        // Backend trả về result chứa roleId
        const newRoleId = createRes.result?.roleId || (createRes as any).roleId;

        // 2. Nếu có chọn quyền thì lưu quyền
        if (values.permissionIds.length > 0 && newRoleId) {
          await roleService.updateRolePermissions(
            newRoleId,
            values.permissionIds,
          );
        }

        message.success("Thêm mới vai trò thành công!");
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vui lòng kiểm tra lại!");
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Quản lý Vai trò
          </Title>
          <Text type="secondary">
            Thiết lập các nhóm quyền hạn chính cho hệ thống
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRoles}
            size="large"
            shape="circle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            size="large"
            style={{ borderRadius: 8, height: 45, fontWeight: 600 }}
          >
            Thêm vai trò mới
          </Button>
        </Space>
      </div>

      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card loading={true} />
            </Col>
          ))}
        </Row>
      ) : roles.length > 0 ? (
        <Row gutter={[24, 24]}>
          {roles.map((role) => {
            const config = getRoleConfig(role.roleName);
            return (
              <Col xs={24} sm={12} lg={6} key={role.roleId}>
                <Card
                  hoverable
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  actions={[
                    <Tooltip title="Chỉnh sửa">
                      <EditOutlined
                        key="edit"
                        onClick={() => showModal(role)}
                        style={{ color: "#1890ff" }}
                      />
                    </Tooltip>,
                    <Tooltip title={role.active ? "Vô hiệu hóa" : "Kích hoạt"}>
                      <PoweroffOutlined
                        key="toggle"
                        onClick={() => handleStatusChange(role)}
                        style={{ color: role.active ? "#ff4d4f" : "#52c41a" }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: config.bg,
                        color: config.color,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: 24,
                        marginRight: 16,
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {role.roleName}
                      </Title>
                      <Badge
                        status={role.active ? "success" : "error"}
                        text={role.active ? "Đang hoạt động" : "Bị khóa"}
                      />
                    </div>
                  </div>

                  <div style={{ height: 50, marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {role.description || "Chưa có mô tả cho vai trò này..."}
                    </Text>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Mã số: #{role.roleId}
                    </Text>
                    <Tag
                      color={config.color}
                      style={{ borderRadius: 4, margin: 0 }}
                    >
                      SYSTEM ROLE
                    </Tag>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description="Chưa có vai trò nào được tạo" />
      )}

      {/* ĐÃ CẬP NHẬT TRUYỀN HÀM XỬ LÝ VÀO ĐÂY */}
      <RoleModal
        open={isModalOpen}
        editingRole={editingRole}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default RoleManagement;
