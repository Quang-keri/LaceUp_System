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
} from "antd";
import { StarOutlined, HistoryOutlined, EditOutlined } from "@ant-design/icons";
import { userService } from "../../../service/userService";
import type { ReputationLogResponse, UserResponse } from "../../../types/user";
import CustomerFilter from "./CustomerFilter";

const { Title, Text } = Typography;

const getScoreColor = (score: number) => {
  if (score >= 90) return "success";
  if (score >= 70) return "processing";
  if (score >= 50) return "warning";
  if (score >= 30) return "volcano";
  return "error";
};

const CustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [scoreDrawerVisible, setScoreDrawerVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [reputationLogs, setReputationLogs] = useState<ReputationLogResponse[]>(
    [],
  );
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

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

      if (range) {
        const [min, max] = range.split("-");
        minScore = min ? parseInt(min) : undefined;
        maxScore = max ? parseInt(max) : undefined;
      }

      const res = await userService.getOwnerCustomers(
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
      message.error("Lỗi khi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  const handleFilterChange = (key: string, value: any) => {
    let newKeyword = keyword;
    let newTier = tierFilter;
    let newRange = scoreRange;

    if (key === "keyword") newKeyword = value;
    if (key === "tierFilter") newTier = value;
    if (key === "scoreRange") newRange = value;

    setKeyword(newKeyword);
    setTierFilter(newTier);
    setScoreRange(newRange);
    setCurrentPage(1);
    fetchCustomers(1, newKeyword, newTier, newRange);
  };

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
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="!mb-0">
            Quản lý Khách Hàng
          </Title>
          <Typography.Text type="secondary">
            Theo dõi danh sách khách hàng và quản lý điểm uy tín
          </Typography.Text>
        </div>
      </div>

      {/* --- CHIA LAYOUT 2 CỘT Ở ĐÂY --- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cột trái: Sidebar Filter */}
        <div className="w-full lg:w-1/4 xl:w-1/5">
          <CustomerFilter
            keyword={keyword}
            tierFilter={tierFilter}
            scoreRange={scoreRange}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
          />
        </div>

        {/* Cột phải: Bảng dữ liệu */}
        <div className="w-full lg:w-3/4 xl:w-4/5">
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="userId"
            loading={loading}
            pagination={{
              current: currentPage,
              total: total,
              onChange: (page) => setCurrentPage(page),
              showTotal: (total) => `Tổng số ${total} khách hàng`,
            }}
            className="shadow-sm border rounded-lg"
          />
        </div>
      </div>

      <Drawer
        title="Chấm điểm khách hàng"
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
                  label="Số điểm (Nhập số âm để trừ điểm, số dương để cộng)"
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

      <Drawer
        title="Lịch sử biến động uy tín"
        width={450}
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
      >
        {selectedUser && (
          <Card bordered={false}>
            {loadingLogs ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin />
              </div>
            ) : reputationLogs.length === 0 ? (
              <Text type="secondary">Chưa có lịch sử biến động điểm.</Text>
            ) : (
              <>
                <Timeline
                  items={reputationLogs.map((log) => {
                    const isPositive = log.pointsChanged > 0;
                    return {
                      color: isPositive ? "blue" : "red",
                      children: (
                        <>
                          <div style={{ marginBottom: 4 }}>
                            <Text
                              strong
                              style={{
                                color: isPositive ? "#1677ff" : "#ff4d4f",
                              }}
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

export default CustomerManagementPage;
