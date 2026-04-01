import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Checkbox,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Collapse,
  Button,
  Tag,
  Space,
  Badge,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { userService } from "../../../service/userService";
import { permissionService } from "../../../service/permissionService";
import type { UserResponse } from "../../../types/user";
import type { PermissionResponse } from "../../../types/permission";
import "./User.css";

interface Props {
  open: boolean;
  user: UserResponse | null;
  onClose: () => void;
  onRefresh: () => void;
}

const UserPermissionModal: React.FC<Props> = ({
  open,
  user,
  onClose,
  onRefresh,
}) => {
  const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>(
    [],
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Logic nhóm quyền
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionResponse[]> = {};
    const getGroupName = (name: string): string => {
      const n = name.toUpperCase();
      if (n.includes("USER") || n.includes("AUTHORITIES")) return "NGƯỜI DÙNG";
      if (n.includes("ROLE")) return "VAI TRÒ";
      if (
        n.includes("COURT") ||
        n.includes("RENTAL_AREA") ||
        n.includes("SLOT")
      )
        return "SÂN BÃI";
      if (n.includes("MATCH")) return "TRẬN ĐẤU";
      if (
        n.includes("BOOK") ||
        n.includes("PAY") ||
        n.includes("FINANCE") ||
        n.includes("COMMISSION")
      )
        return "GIAO DỊCH";
      if (n.includes("POST")) return "BÀI ĐĂNG";
      if (n.includes("NEWS") || n.includes("CHAT")) return "CỘNG ĐỒNG";
      if (
        n.includes("PERMISSION") ||
        n.includes("DASHBOARD") ||
        n.includes("CATEGORY") ||
        n.includes("AMENITY")
      )
        return "HỆ THỐNG";
      return "KHÁC";
    };

    allPermissions.forEach((p) => {
      const group = getGroupName(p.permissionName);
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return groups;
  }, [allPermissions]);

  const fetchAllSystemPermissions = async () => {
    try {
      const response = await permissionService.getAllPermissions();
      setAllPermissions(response.result || response);
    } catch (error) {
      message.error("Không thể tải danh sách quyền hệ thống");
    }
  };

  useEffect(() => {
    if (open) fetchAllSystemPermissions();
  }, [open]);

  useEffect(() => {
    if (open && user && allPermissions.length > 0) {
      const userPermissionNames = user.permissions || [];
      const currentIds = allPermissions
        .filter((p) => userPermissionNames.includes(p.permissionName))
        .map((p) => p.permissionId);
      setSelectedIds(currentIds);
    }
  }, [open, user, allPermissions]);

  const handleSelectAllGroup = (groupIds: number[]) => {
    setSelectedIds((prev) => Array.from(new Set([...prev, ...groupIds])));
  };

  const handleUnselectAllGroup = (groupIds: number[]) => {
    setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await userService.addExtraPermissions(user.userId, selectedIds);
      message.success(`Cập nhật quyền cho ${user.userName} thành công`);
      onRefresh();
      onClose();
    } catch (error) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: "#1890ff" }} />
          <span>
            Quản lý quyền riêng: <b>{user?.userName}</b>
          </span>
        </Space>
      }
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={loading}
      width={850}
      centered
      okText="Lưu thay đổi"
      cancelText="Hủy bỏ"
      destroyOnClose
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "16px 24px" }}
    >
      <Alert
        message={
          <small>
            Những quyền này sẽ được <b>cộng thêm</b> vào quyền mặc định của vai
            trò <Tag color="blue">{user?.role}</Tag>
          </small>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Spin spinning={loading || allPermissions.length === 0}>
        <Checkbox.Group
          className="perm-group-container"
          value={selectedIds}
          onChange={(v) => setSelectedIds(v as number[])}
        >
          <Collapse
            defaultActiveKey={["NGƯỜI DÙNG"]}
            expandIconPosition="left"
            className="perm-collapse-wrapper"
          >
            {Object.entries(groupedPermissions).map(([group, list]) => {
              const groupIds = list.map((p) => p.permissionId);
              return (
                <Collapse.Panel
                  key={group}
                  className="perm-collapse-panel"
                  header={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Space>
                        <span style={{ fontWeight: 700, fontSize: "15px" }}>
                          {group}
                        </span>
                        <Badge
                          count={list.length}
                          showZero
                          color="#e6f7ff"
                          style={{ color: "#1890ff", fontWeight: 600 }}
                        />
                      </Space>
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="link"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => handleSelectAllGroup(groupIds)}
                          style={{ color: "#52c41a" }}
                        >
                          Chọn hết
                        </Button>
                        <Divider type="vertical" />
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => handleUnselectAllGroup(groupIds)}
                        >
                          Bỏ hết
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  <Row gutter={[12, 12]}>
                    {list.map((perm) => (
                      <Col span={12} key={perm.permissionId}>
                        <div className="perm-item-card">
                          <Checkbox value={perm.permissionId}>
                            <div style={{ marginLeft: 8 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "#262626",
                                  fontSize: "13px",
                                }}
                              >
                                {perm.permissionName}
                              </div>
                              <div
                                style={{
                                  color: "#8c8c8c",
                                  fontSize: "11.5px",
                                  marginTop: 2,
                                  lineHeight: "1.4",
                                }}
                              >
                                {perm.description}
                              </div>
                            </div>
                          </Checkbox>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Collapse.Panel>
              );
            })}
          </Collapse>
        </Checkbox.Group>
      </Spin>
    </Modal>
  );
};

export default UserPermissionModal;
