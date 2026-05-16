import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Drawer,
  Space,
  Form,
  InputNumber,
  Input,
  message,
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Timeline,
  Pagination,
  Select,
} from "antd";
import {
  StarOutlined,
  HistoryOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { userService } from "../../../service/userService";
import type { ReputationLogResponse, UserResponse } from "../../../types/user";

const { Title, Text } = Typography;
const { Option } = Select;

const getScoreColor = (score: number) => {
  if (score >= 90) return "success";
  if (score >= 70) return "processing";
  if (score >= 50) return "warning";
  if (score >= 30) return "volcano";
  return "error";
};

const AdminCustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // States cho Drawer
  const [scoreDrawerVisible, setScoreDrawerVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [reputationLogs, setReputationLogs] = useState<ReputationLogResponse[]>(
    [],
  );
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // States cho Filter
  const [keyword, setKeyword] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
  const [scoreRange, setScoreRange] = useState<string | undefined>(undefined);

  const [form] = Form.useForm();

  const fetchCustomers = async (
    page: number,
    searchKeyword = keyword,
    tier = tierFilter,
    range = scoreRange,
  ) => {
    setLoading(true);
    try {
      let minScore: number | undefined = undefined;
      let maxScore: number | undefined = undefined;

      // Xử lý khoảng điểm
      if (range) {
        const [min, max] = range.split("-");
        minScore = min ? parseInt(min) : undefined;
        maxScore = max ? parseInt(max) : undefined;
      }

      const res = await userService.getAllCustomersForAdmin(
        page,
        10,
        searchKeyword,
        tier,
        minScore,
        maxScore,
      );

      if (res.code === 200 && res.result) {
        setCustomers(res.result.data);
        setTotal(res.result.totalElements);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách khách hàng toàn hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  const handleResetFilter = () => {
    setKeyword("");
    setTierFilter(undefined);
    setScoreRange(undefined);
    setCurrentPage(1);
    fetchCustomers(1, "", undefined, undefined);
  };

  const handleUpdateReputation = async (values: {
    points: number;
    reason: string;
  }) => {
    if (!selectedUser) return;
    try {
      const res = await userService.updateReputation(
        selectedUser.userId,
        values.points,
        values.reason,
      );
      if (res.code === 200) {
        message.success("Cập nhật điểm uy tín thành công!");
        setScoreDrawerVisible(false);
        form.resetFields();
        fetchCustomers(currentPage);
      }
    } catch (error) {
      message.error("Cập nhật thất bại");
    }
  };

  const fetchLogs = async (userId: string, page: number) => {
    setLoadingLogs(true);
    try {
      const res = await userService.getReputationLogs(userId, page, 5);
      if ((res.code === 200 || res.code === 0) && res.result) {
        if (Array.isArray(res.result)) {
          setReputationLogs(res.result);
          setTotalLogs(res.result.length);
        } else {
          setReputationLogs(res.result.data || []);
          setTotalLogs(res.result.totalElements || 0);
        }
        setLogPage(page);
      }
    } catch (error) {
      message.error("Lỗi khi tải lịch sử điểm");
    } finally {
      setLoadingLogs(false);
    }
  };

  const openScoreDrawer = (user: UserResponse) => {
    setSelectedUser(user);
    setScoreDrawerVisible(true);
  };

  const openHistoryDrawer = (user: UserResponse) => {
    setSelectedUser(user);
    setHistoryDrawerVisible(true);
    setLogPage(1);
    fetchLogs(user.userId, 1);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * 10 + index + 1,
    },
    {
      title: "Khách hàng",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: UserResponse) => (
        <div>
          <Text strong style={{ fontSize: "15px" }}>
            {text}
          </Text>
          <br />
          <Text type="secondary">{record.phone}</Text>
        </div>
      ),
    },
    {
      title: "Hạng",
      dataIndex: "memberTier",
      key: "memberTier",
      render: (tier: string) => {
        let color = "default";
        if (tier === "DIAMOND" || tier === "GOLD") color = "purple";
        if (tier === "SILVER" || tier === "BRONZE") color = "orange";
        return <Tag color={color}>{tier || "BRONZE"}</Tag>;
      },
    },
    {
      title: "Điểm uy tín",
      dataIndex: "creditScore",
      key: "creditScore",
      align: "center" as const,
      render: (score: number) => {
        const displayScore = score ?? 100;
        return (
          <Tag
            color={getScoreColor(displayScore)}
            icon={<StarOutlined />}
            style={{ padding: "4px 8px", fontSize: "14px" }}
          >
            {displayScore} / 100
          </Tag>
        );
      },
    },
    {
      title: "Tổng trận",
      dataIndex: "totalMatches",
      key: "totalMatches",
      align: "center" as const,
      render: (val: number) => <Text strong>{val ?? 0}</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (_: any, record: UserResponse) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => openScoreDrawer(record)}
          >
            Chấm điểm
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => openHistoryDrawer(record)}
          >
            Lịch sử
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FilterOutlined style={{ fontSize: 24, color: "#1890ff" }} />
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Toàn bộ Khách Hàng (Admin)
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Cột trái: Bộ lọc (Filter) */}
        <Col xs={24} lg={6} xl={5}>
          <Card
            title="Bộ lọc tìm kiếm"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Text
                  type="secondary"
                  style={{ marginBottom: 8, display: "block" }}
                >
                  Tìm kiếm
                </Text>
                <Input
                  placeholder="Tên hoặc số điện thoại..."
                  value={keyword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setKeyword(val);
                    setCurrentPage(1);
                    fetchCustomers(1, val, tierFilter, scoreRange);
                  }}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </div>

              <div>
                <Text
                  type="secondary"
                  style={{ marginBottom: 8, display: "block" }}
                >
                  Hạng thành viên
                </Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn hạng..."
                  value={tierFilter}
                  onChange={(val) => {
                    setTierFilter(val);
                    setCurrentPage(1);
                    fetchCustomers(1, keyword, val, scoreRange);
                  }}
                  allowClear
                >
                  <Option value="BRONZE">Đồng (BRONZE)</Option>
                  <Option value="SILVER">Bạc (SILVER)</Option>
                  <Option value="GOLD">Vàng (GOLD)</Option>
                  <Option value="DIAMOND">Kim Cương (DIAMOND)</Option>
                </Select>
              </div>

              <div>
                <Text
                  type="secondary"
                  style={{ marginBottom: 8, display: "block" }}
                >
                  Điểm uy tín
                </Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn khoảng điểm..."
                  value={scoreRange}
                  onChange={(val) => {
                    setScoreRange(val);
                    setCurrentPage(1);
                    fetchCustomers(1, keyword, tierFilter, val);
                  }}
                  allowClear
                >
                  <Option value="90-100">Rất tốt (90 - 100)</Option>
                  <Option value="70-89">Khá (70 - 89)</Option>
                  <Option value="50-69">Trung bình (50 - 69)</Option>
                  <Option value="30-49">Cảnh báo (30 - 49)</Option>
                  <Option value="0-29">Blacklist (Dưới 30)</Option>
                </Select>
              </div>

              <Button block onClick={handleResetFilter}>
                Làm mới bộ lọc
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Cột phải: Bảng dữ liệu */}
        <Col xs={24} lg={18} xl={19}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="userId"
              loading={loading}
              pagination={{
                current: currentPage,
                total: total,
                onChange: (page) => setCurrentPage(page),
                showTotal: (total) =>
                  `Tổng số ${total} khách hàng trên hệ thống`,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* DRAWER 1: CHẤM ĐIỂM */}
      <Drawer
        title={<Text strong>Chấm điểm khách hàng</Text>}
        width={450}
        onClose={() => setScoreDrawerVisible(false)}
        open={scoreDrawerVisible}
      >
        {selectedUser && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small" title="Thông tin tổng quan">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Họ tên:</Text> {selectedUser.userName}
                </Col>
                <Col span={12}>
                  <Text strong>SĐT:</Text> {selectedUser.phone}
                </Col>
                <Col span={12}>
                  <Text strong>Điểm uy tín:</Text>{" "}
                  <Tag color={getScoreColor(selectedUser.creditScore ?? 100)}>
                    {selectedUser.creditScore ?? 100}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Hạng:</Text>{" "}
                  <Tag color="purple">
                    {selectedUser.memberTier ?? "BRONZE"}
                  </Tag>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Điều chỉnh độ uy tín">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateReputation}
              >
                <Form.Item
                  name="points"
                  label="Số điểm (Nhập số âm để trừ điểm, dương để cộng)"
                  rules={[{ required: true, message: "Vui lòng nhập số điểm" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="VD: 5, -10, -30"
                  />
                </Form.Item>
                <Form.Item
                  name="reason"
                  label="Lý do điều chỉnh (Ghi chú nội bộ)"
                  rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="VD: Khách bùng sân không báo trước..."
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Cập nhật điểm
                </Button>
              </Form>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* DRAWER 2: LỊCH SỬ */}
      <Drawer
        title={<Text strong>Lịch sử biến động uy tín</Text>}
        width={450}
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
      >
        {selectedUser && (
          <Card bordered={false} bodyStyle={{ padding: 0 }}>
            {loadingLogs ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin />
              </div>
            ) : reputationLogs.length === 0 ? (
              <Text type="secondary">Chưa có lịch sử biến động điểm.</Text>
            ) : (
              <>
                <Timeline
                  style={{ marginTop: 20 }}
                  items={reputationLogs.map((log) => {
                    const isPositive = log.pointsChanged > 0;
                    return {
                      color: isPositive ? "green" : "red",
                      children: (
                        <>
                          <div style={{ marginBottom: 4 }}>
                            <Text
                              strong
                              type={isPositive ? "success" : "danger"}
                            >
                              {isPositive ? "+" : ""}
                              {log.pointsChanged} điểm
                            </Text>
                            <Text
                              type="secondary"
                              style={{ fontSize: "12px", marginLeft: 8 }}
                            >
                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </Text>
                          </div>
                          <div>{log.reason}</div>
                        </>
                      ),
                    };
                  })}
                />
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Pagination
                    current={logPage}
                    total={totalLogs}
                    pageSize={5}
                    onChange={(page) => fetchLogs(selectedUser.userId, page)}
                    size="small"
                    hideOnSinglePage={true}
                  />
                </div>
              </>
            )}
          </Card>
        )}
      </Drawer>
    </div>
  );
};

export default AdminCustomerManagementPage;
