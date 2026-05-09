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
  Empty,
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
  Area,
  ComposedChart,
  Line,
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

const commonTooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const OwnerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [range, setRange] = useState("this_month");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await reportService.getDashboardOwner(range);
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

  // Bảng màu chuẩn Cam - Tím và các trạng thái
  const STATUS_COLORS: Record<string, string> = {
    BOOKED: "#9254de", // Tím nhạt
    COMPLETED: "#722ed1", // Tím đậm (Thành công/Hoàn thành)
    CANCELLED: "#fa8c16", // Cam (Đã hủy)
    PENDING: "#fadb14", // Vàng (Đang chờ)
    SUCCESS: "#52c41a", // Xanh lá (Thanh toán thành công)
    FAILED: "#ff4d4f", // Đỏ (Thất bại)
  };

  const translate = (key: string) => {
    const map: Record<string, string> = {
      BOOKED: "Đã đặt",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      PENDING: "Đang chờ",
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
    };
    return map[key] || key;
  };

  const bookingChartData = Object.entries(stats.bookingStats)
    .filter(([_, value]) => (value as number) > 0)
    .map(([name, value]) => ({
      name: translate(name),
      originalName: name,
      value: value as number,
    }));

  const paymentChartData = Object.entries(stats.paymentStats)
    .filter(([_, value]) => (value as number) > 0)
    .map(([name, value]) => ({
      name: translate(name),
      originalName: name,
      value: value as number,
    }));

  // Mock data tạm cho bảng Lượt đặt mới nhất (Thay bằng API thật nếu có)
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
        <Tag color={STATUS_COLORS[status] || "default"}>
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

  const customTooltipFormatter = (val: number, name: string) => {
    if (name === "revenue")
      return [new Intl.NumberFormat("vi-VN").format(val) + " ₫", "Doanh thu"];
    if (name === "bookingCount") return [val + " lượt", "Số lượt đặt"];
    return [val, name];
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Tổng quan cơ sở
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Doanh thu</Text>}
              value={stats.totalRevenue}
              suffix="₫"
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
              prefix={<TrendingUp size={18} />}
            />
            <div style={{ marginTop: 8 }}>
              {stats.revenueGrowth >= 0 ? (
                <Tag color="success" icon={<ArrowUpRight size={14} />}>
                  {stats.revenueGrowth.toFixed(1)}% so với kỳ trước
                </Tag>
              ) : (
                <Tag color="error" icon={<ArrowDownRight size={14} />}>
                  {Math.abs(stats.revenueGrowth).toFixed(1)}% so với kỳ trước
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
              Dựa trên tổng slot của cơ sở
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
              title={<Text type="secondary">Khách hàng mới</Text>}
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

      {/* Row 2: Biểu đồ đa trục */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Biến động 7 ngày gần đây" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={stats.dailyStats7d}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />

                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${v / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={customTooltipFormatter}
                  />
                  <Legend verticalAlign="top" height={36} />

                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Doanh thu"
                    fill="#722ed1"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="bookingCount"
                    name="Số lượt đặt"
                    fill="#fa8c16"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân tích theo tháng" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <ComposedChart data={stats.monthlyStats}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ed1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />

                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={customTooltipFormatter}
                  />
                  <Legend verticalAlign="top" height={36} />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#722ed1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bookingCount"
                    name="Số lượt đặt"
                    stroke="#fa8c16"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Biểu đồ tròn trạng thái Booking và Payment */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái đặt sân" bordered={false}>
            <div
              style={{
                width: "100%",
                height: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {bookingChartData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={bookingChartData}
                      innerRadius={85}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingChartData.map((entry, index) => (
                        <Cell
                          key={`pie-booking-${index}`}
                          fill={STATUS_COLORS[entry.originalName] || "#ccc"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={commonTooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Chưa có lượt đặt sân nào" />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Trạng thái thanh toán" bordered={false}>
            <div
              style={{
                width: "100%",
                height: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {paymentChartData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      innerRadius={85}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell
                          key={`pie-payment-${index}`}
                          fill={STATUS_COLORS[entry.originalName] || "#ccc"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={commonTooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Chưa có giao dịch thanh toán nào" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Bảng dữ liệu chi tiết */}
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

export default OwnerDashboard;
