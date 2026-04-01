import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Space,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Empty,
  Tabs,
  Tooltip,
  Badge,
  Table,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import permissionService from "../../../service/permissionService";
import type {
  PermissionResponse,
  PermissionRequest,
} from "../../../types/permission";

const { Title, Text } = Typography;

const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getAllPermissions();
      setPermissions(response.result);
    } catch (error) {
      message.error("Không thể tải danh sách quyền hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values: PermissionRequest = await form.validateFields();
      if (editingId) {
        await permissionService.updatePermission(editingId, values);
        message.success("Cập nhật thành công");
      } else {
        await permissionService.createPermission(values);
        message.success("Tạo mới thành công");
      }
      setIsModalOpen(false);
      fetchPermissions();
    } catch (error) {}
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // 1. Hàm định dạng màu sắc dựa trên hành động (Prefix)
  const getTagColor = (name: string) => {
    if (name.startsWith("VIEW")) return "blue";
    if (name.startsWith("CREATE")) return "green";
    if (name.startsWith("UPDATE")) return "orange";
    if (name.startsWith("DELETE")) return "red";
    if (name.startsWith("MANAGE") || name.startsWith("ASSIGN")) return "purple";
    return "cyan";
  };

  // 2. Logic Grouping (Dùng Regex để chuẩn hóa các từ tương tự)
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionResponse[]> = {};
    const getGroupName = (name: string): string => {
      const n = name.toUpperCase();
      if (
        n.includes("PERMISSION") ||
        n.includes("DASHBOARD")
      ) {
        return "HỆ THỐNG";
      }

      if (n.includes("USER") || n.includes("AUTHORITIES")) {
        return "NGƯỜI DÙNG";
      }

      if (n.includes("ROLE")) {
        return "VAI TRÒ";
      }

      if (
        n.includes("COURT") ||
        n.includes("RENTAL_AREA") ||
        n.includes("SLOT")
      ) {
        return "SÂN BÃI";
      }

      if (n.includes("MATCH")) {
        return "TRẬN ĐẤU";
      }

      if (
        n.includes("BOOK") ||
        n.includes("PAY") ||
        n.includes("FINANCE") ||
        n.includes("COMMISSION")
      ) {
        return "GIAO DỊCH";
      }

      if (n.includes("POST")) {
        return "BÀI ĐĂNG";
      }

      if (n.includes("NEWS") || n.includes("CHAT")) {
        return "CỘNG ĐỒNG";
      }

      if (
        n.includes("CATEGORY") ||
        n.includes("AMENITY")
      ) {
        return "DANH MỤC, TIỆN ÍCH";
      }

      return "KHÁC";
    };

    const filtered = permissions.filter(
      (p) =>
        p.permissionName.toLowerCase().includes(searchText.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchText.toLowerCase()),
    );

    filtered.forEach((p) => {
      const group = getGroupName(p.permissionName);
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });

    const priority = [
      "HỆ THỐNG",
      "NGƯỜI DÙNG",
      "VAI TRÒ",
      "SÂN BÃI",
      "GIAO DỊCH",
      "TRẬN ĐẤU",
      "BÀI ĐĂNG",
      "CỘNG ĐỒNG",
      "DANH MỤC, TIỆN ÍCH",
      "KHÁC",
    ];
    return Object.fromEntries(
      priority.filter((k) => groups[k]).map((k) => [k, groups[k]]),
    );
  }, [permissions, searchText]);

  const showModal = (record?: PermissionResponse) => {
    setEditingId(record ? record.permissionId : null);
    form.setFieldsValue(record || { permissionName: "", description: "" });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await permissionService.deletePermission(id);
      message.success("Đã xóa quyền");
      fetchPermissions();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  // Định nghĩa Columns cho Table bên trong Tab
  const columns = [
    {
      title: "Mã Quyền",
      dataIndex: "permissionName",
      key: "permissionName",
      render: (name: string) => (
        <Tag
          color={getTagColor(name)}
          style={{ fontWeight: 600, borderRadius: 4, padding: "2px 8px" }}
        >
          {name}
        </Tag>
      ),
    },
    {
      title: "Mô tả chi tiết",
      dataIndex: "description",
      key: "description",
      render: (text: string) => <Text type="secondary">{text || "—"}</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "right" as const,
      render: (_: any, record: PermissionResponse) => (
        <Space size="middle">
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa quyền này?"
            onConfirm={() => handleDelete(record.permissionId)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header Section */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#1890ff",
                padding: "8px",
                borderRadius: "12px",
                display: "flex",
              }}
            >
              <SafetyCertificateOutlined style={{ color: "#fff" }} />
            </div>
            Quản trị Quyền hạn
          </Title>
          <Text type="secondary">
            Phân loại và cấu hình chi tiết các quyền hạn truy cập hệ thống
          </Text>
        </div>
        <Space>
          <Input
            placeholder="Tìm mã quyền hoặc mô tả..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 300,
              borderRadius: 8,
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPermissions}
            size="large"
            shape="circle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            size="large"
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            Tạo mới
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        {loading ? (
          <Table loading={true} columns={columns} dataSource={[]} />
        ) : Object.keys(groupedPermissions).length > 0 ? (
          <Tabs
            defaultActiveKey="HỆ THỐNG"
            tabPosition="left" // Để Menu ở bên trái nhìn rất chuyên nghiệp (như Settings của MacOS/Facebook)
            items={Object.entries(groupedPermissions).map(([group, list]) => ({
              key: group,
              label: (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: 150,
                    padding: "4px 0",
                  }}
                >
                  <span>{group}</span>
                  <Badge
                    count={list.length}
                    color={group === "HỆ THỐNG" ? "#faad14" : "#1890ff"}
                    size="small"
                  />
                </div>
              ),
              children: (
                <div style={{ padding: "0 16px" }}>
                  <div
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ControlOutlined style={{ color: "#1890ff" }} />
                    <Title level={4} style={{ margin: 0 }}>
                      Danh sách quyền {group.toLowerCase()}
                    </Title>
                  </div>
                  <Table
                    dataSource={list}
                    columns={columns}
                    rowKey="permissionId"
                    pagination={false}
                    size="middle"
                    className="custom-table"
                  />
                </div>
              ),
            }))}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không tìm thấy dữ liệu phù hợp"
          />
        )}
      </Card>

      {/* Modal Form */}
      <Modal
        title={
          <Title level={4}>
            {editingId ? "Cập nhật Quyền hạn" : "Tạo Quyền hạn mới"}
          </Title>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        width={500}
        okText="Lưu thông tin"
        cancelText="Để sau"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="permissionName"
            label="Mã định danh (System Code)"
            rules={[
              { required: true, message: "Mã quyền không được để trống" },
            ]}
          >
            <Input
              placeholder="Ví dụ: VIEW_REPORT"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>
          <Form.Item name="description" label="Diễn giải chức năng">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả ngắn gọn phạm vi của quyền này..."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
