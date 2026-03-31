import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Checkbox,
  Row,
  Col,
  Divider,
  message,
  Collapse,
  Button,
  Tag,
  Space,
  Badge,
} from "antd";
import type { RoleResponse } from "../../../types/role.ts";
import { permissionService } from "../../../service/permissionService.ts";
import type { PermissionResponse } from "../../../types/permission.ts";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import "./Role.css";

export interface RoleFormValues {
  roleName: string;
  description?: string;
  permissionIds: number[];
}

interface RoleModalProps {
  open: boolean;
  editingRole: RoleResponse | null;
  onCancel: () => void;
  onSuccess: (values: RoleFormValues) => void; // Khai báo rõ kiểu dữ liệu trả về
}

const RoleModal: React.FC<RoleModalProps> = ({
  open,
  editingRole,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<RoleFormValues>();
  const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>(
    [],
  );

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

  useEffect(() => {
    if (open) {
      fetchPermissions();
      if (editingRole) {
        const permissionIds =
          editingRole.permissions?.map((p) => p.permissionId) || [];
        form.setFieldsValue({
          roleName: editingRole.roleName,
          description: editingRole.description,
          permissionIds: permissionIds,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRole]);

  const fetchPermissions = async () => {
    try {
      const res = await permissionService.getAllPermissions();
      setAllPermissions(res.result);
    } catch (error) {
      message.error("Không thể tải danh sách quyền");
    }
  };

  const handleSelectAllGroup = (groupIds: number[]) => {
    const currentValues = form.getFieldValue("permissionIds") || [];
    const newValues = Array.from(new Set([...currentValues, ...groupIds]));
    form.setFieldsValue({ permissionIds: newValues });
  };

  const handleUnselectAllGroup = (groupIds: number[]) => {
    const currentValues = form.getFieldValue("permissionIds") || [];
    const newValues = currentValues.filter(
      (id: number) => !groupIds.includes(id),
    );
    form.setFieldsValue({ permissionIds: newValues });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Ép kiểu mảng rỗng nếu user không chọn quyền nào
      const submitValues: RoleFormValues = {
        ...values,
        permissionIds: values.permissionIds || [],
      };
      onSuccess(submitValues);
    });
  };

  return (
    <Modal
      title={
        editingRole
          ? `Chỉnh sửa Vai trò: ${editingRole.roleName}`
          : "Thêm Vai trò mới"
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={850}
      centered
      okText="Lưu thay đổi"
      cancelText="Hủy bỏ"
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "20px 24px" }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="roleName"
              label={<b>Tên vai trò (Mã định danh)</b>}
              rules={[{ required: true, message: "Vui lòng nhập tên vai trò" }]}
            >
              <Input
                placeholder="Ví dụ: ADMIN, STAFF..."
                disabled={!!editingRole}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label={<b>Mô tả vai trò</b>}>
              <Input placeholder="Mô tả ngắn gọn chức năng..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 0 }}>
          <Space>
            <Tag color="blue">Phân quyền chi tiết</Tag>
            <small style={{ color: "#8c8c8c", fontWeight: "normal" }}>
              Chọn các quyền hạn cho phép vai trò này thực hiện
            </small>
          </Space>
        </Divider>

        <Form.Item name="permissionIds" valuePropName="value">
          <Checkbox.Group style={{ width: "100%" }}>
            <Collapse
              defaultActiveKey={["NGƯỜI DÙNG"]}
              expandIconPosition="left"
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {Object.entries(groupedPermissions).map(([group, list]) => {
                const groupIds = list.map((p) => p.permissionId);
                return (
                  <Collapse.Panel
                    key={group}
                    header={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
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
                            style={{
                              color: "#1890ff",
                              boxShadow: "none",
                              fontWeight: 600,
                            }}
                          />
                        </Space>
                        <Space size={0} onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="link"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleSelectAllGroup(groupIds)}
                            style={{ color: "#52c41a", fontWeight: 500 }}
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
                            style={{ fontWeight: 500 }}
                          >
                            Bỏ hết
                          </Button>
                        </Space>
                      </div>
                    }
                  >
                    <div style={{ padding: "8px 4px" }}>
                      <Row gutter={[12, 12]}>
                        {list.map((perm) => (
                          <Col span={12} key={perm.permissionId}>
                            <div className="permission-item-card">
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
                                      fontSize: "11px",
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
                    </div>
                  </Collapse.Panel>
                );
              })}
            </Collapse>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleModal;
