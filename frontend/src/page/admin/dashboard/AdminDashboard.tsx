import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Select,
  Space,
  Typography,
  Table,
  Tag,
  List,
  Avatar,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  Clock,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  Zap,
} from "lucide-react";
import reportService from "../../../service/reportService.ts";
import type { DashboardData } from "../../../types/dashboard.ts";

const { Title, Text } = Typography;

// Style dùng chung cho tất cả các Tooltip của biểu đồ
const commonTooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [range, setRange] = useState("this_month");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await reportService.getDashboardAdmin(range);
        setStats(response.result);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);

  if (loading)
    return (
      <Spin
        size="large"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      />
    );
  if (!stats) return <div>Không có dữ liệu hiển thị.</div>;

  const COLORS: Record<string, string> = {
    BOOKED: "#1890ff",
    COMPLETED: "#52c41a",
    CANCELLED: "#ff4d4f",
    FAILED: "#fa8c16",
    SUCCESS: "#52c41a",
  };

  const translate = (key: string) => {
    const map: Record<string, string> = {
      BOOKED: "Đã đặt",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
    };
    return map[key] || key;
  };

  const bookingChartData = Object.entries(stats.bookingStats).map(
    ([name, value]) => ({
      name: translate(name),
      originalName: name,
      value,
    }),
  );

  // --- MOCK DATA (Thay bằng API thật) ---
  const recentBookingsMock = [
    {
      key: "1",
      id: "#BK001",
      customer: "Nguyễn Văn A",
      room: "Sân bóng số 1",
      status: "COMPLETED",
      amount: 300000,
      date: "10 phút trước",
    },
    {
      key: "2",
      id: "#BK002",
      customer: "Trần Thị B",
      room: "Sân bóng số 3",
      status: "BOOKED",
      amount: 450000,
      date: "1 giờ trước",
    },
    {
      key: "3",
      id: "#BK003",
      customer: "Lê Văn C",
      room: "Sân bóng số 1",
      status: "CANCELLED",
      amount: 300000,
      date: "3 giờ trước",
    },
    {
      key: "4",
      id: "#BK004",
      customer: "Phạm D",
      room: "Sân bóng số 2",
      status: "COMPLETED",
      amount: 500000,
      date: "Hôm qua",
    },
  ];

  const tableColumns = [
    {
      title: "Mã Đơn",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <a>{text}</a>,
    },
    { title: "Khách hàng", dataIndex: "customer", key: "customer" },
    { title: "Cơ sở / Sân", dataIndex: "room", key: "room" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={COLORS[status] || "default"}>
          {translate(status).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong>{new Intl.NumberFormat("vi-VN").format(amount)} ₫</Text>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header & Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Tổng quan hệ thống
        </Title>
        <Select
          value={range}
          style={{ width: 200 }}
          onChange={(value) => setRange(value)}
          options={[
            { label: "Hôm nay", value: "today" },
            { label: "Hôm qua", value: "yesterday" },
            { label: "7 ngày qua", value: "7d" },
            { label: "30 ngày qua", value: "30d" },
            { label: "Tuần này", value: "this_week" },
            { label: "Tuần trước", value: "last_week" },
            { label: "Tháng này", value: "this_month" },
            { label: "Tháng trước", value: "last_month" },
            { label: "Năm nay", value: "this_year" },
            { label: "Năm trước", value: "last_year" },
            { label: "Tất cả thời gian", value: "all" },
          ]}
        />
      </div>

      {/* Row 1: Key Metrics - Dùng flex 20% để 5 thẻ chia đều bằng nhau tuyệt đối */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Doanh thu tháng</Text>}
              value={stats.totalRevenue}
              suffix="₫"
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
              prefix={<TrendingUp size={18} />}
            />
            <div style={{ marginTop: 8 }}>
              {stats.revenueGrowth >= 0 ? (
                <Tag color="success" icon={<ArrowUpRight size={14} />}>
                  {stats.revenueGrowth.toFixed(1)}% so với tháng trước
                </Tag>
              ) : (
                <Tag color="error" icon={<ArrowDownRight size={14} />}>
                  {Math.abs(stats.revenueGrowth).toFixed(1)}% so với tháng trước
                </Tag>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Tỷ lệ lấp đầy</Text>}
              value={stats.occupancyRate}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
              prefix={<Percent size={18} style={{ marginRight: 8 }} />}
            />
            <Text type="secondary" size="small">
              Dựa trên tổng slot hiện có
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Giờ cao điểm</Text>}
              value={stats.peakHour}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<Zap size={18} style={{ marginRight: 8 }} />}
            />
            <Text type="secondary" size="small">
              Lượng đặt sân nhiều nhất
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Người dùng mới</Text>}
              value={stats.newUsersCount}
              valueStyle={{ color: "#722ed1" }}
              prefix={<Users size={18} style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Tỷ lệ hủy</Text>}
              value={(
                (((stats.bookingStats.CANCELLED || 0) as number) /
                  Object.values(stats.bookingStats).reduce(
                    (a, b) => a + (b as number),
                    1,
                  )) *
                100
              ).toFixed(1)}
              suffix="%"
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Biến động doanh thu (Chia đều 12-12) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Biến động doanh thu 7 ngày gần đây" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={stats.dailyRevenue7d}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `${v / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={(val: number) => [
                      new Intl.NumberFormat("vi-VN").format(val) + " ₫",
                      "Doanh thu",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#13c2c2"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân tích doanh thu theo tháng" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={stats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={(val: number) => [
                      new Intl.NumberFormat("vi-VN").format(val) + " VNĐ",
                      "Doanh thu",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1890ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Trạng thái đặt sân (Chia đều 12-12) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái đặt sân (Số lượng)" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={bookingChartData} margin={{ top: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f5f5f5" }}
                    contentStyle={commonTooltipStyle}
                  />
                  <Bar dataKey="value" barSize={40} radius={[4, 4, 0, 0]}>
                    {bookingChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.originalName] || "#ccc"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Phân bổ trạng thái" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={bookingChartData.filter((d) => d.value > 0)}
                    innerRadius={85}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bookingChartData.map((entry, index) => (
                      <Cell
                        key={`pie-${index}`}
                        fill={COLORS[entry.originalName]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={commonTooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Bảng dữ liệu chi tiết & Top danh mục */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={16}>
          <Card
            style={{ height: "100%" }}
            title={
              <Space>
                <Clock size={18} color="#1890ff" />
                <span>Lượt đặt mới nhất</span>
              </Space>
            }
            bordered={false}
          >
            <Table
              columns={tableColumns}
              dataSource={recentBookingsMock}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{ height: "100%" }}
            title={
              <Space>
                <Trophy size={18} color="#fa8c16" />
                <span>Top Sân hoạt động</span>
              </Space>
            }
            bordered={false}
          >
            <List
              itemLayout="horizontal"
              dataSource={stats.topCourts}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            index === 0
                              ? "#f5222d"
                              : index === 1
                              ? "#fa8c16"
                              : index === 2
                              ? "#fadb14"
                              : "#d9d9d9",
                          color: index < 3 ? "#fff" : "#000",
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={<Text strong>{item.courtName}</Text>}
                    description={`${item.bookingCount} lượt đặt`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
