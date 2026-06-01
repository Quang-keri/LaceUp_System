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
  Tag,
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
import { TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import reportService from "../../../service/reportService.ts";
import type { DashboardData } from "../../../types/dashboard.ts";
import { useOutletContext } from "react-router-dom";

const { Title, Text } = Typography;

const OwnerDashboard: React.FC = () => {
  const { isDark } = useOutletContext<{ isDark: boolean }>();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData | null>(null);

  // State riêng cho Pie Chart
  const [pieChartType, setPieChartType] = useState<"booking" | "payment">(
    "booking",
  );
  const [pieRange, setPieRange] = useState("this_month");
  const [pieStats, setPieStats] = useState<DashboardData | null>(null);

  const chartTextColor = isDark ? "rgba(255, 255, 255, 0.65)" : "#666";
  const chartGridColor = isDark ? "#303030" : "#f0f0f0";
  const commonTooltipStyle = {
    borderRadius: 8,
    border: isDark ? "1px solid #303030" : "none",
    backgroundColor: isDark ? "#141414" : "#fff",
    color: isDark ? "#fff" : "#000",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  const currentYear = new Date().getFullYear();

  const [overviewYear, setOverviewYear] = useState<number>(currentYear);
  const [overviewMonth, setOverviewMonth] = useState<number | null>(null); // null = Cả năm
  const [overviewChartData, setOverviewChartData] = useState<any[]>([]);

  // 1. Gọi API Biểu đồ tổng quan cho OWNER
  useEffect(() => {
    const loadOverviewChart = async () => {
      try {
        const response = await reportService.getOverviewChartOwner(
          overviewYear,
          overviewMonth,
        );
        setOverviewChartData(response.result);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu biểu đồ tổng quan:", error);
      }
    };
    loadOverviewChart();
  }, [overviewYear, overviewMonth]);

  // 2. Gọi API cho toàn bộ Dashboard OWNER (Mặc định lấy "this_month")
  useEffect(() => {
    const loadMainData = async () => {
      setLoading(true);
      try {
        const response = await reportService.getDashboardOwner("this_month");
        setStats(response.result);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMainData();
  }, []);

  // 3. Gọi API RIÊNG cho phần Pie Chart mỗi khi pieRange thay đổi
  useEffect(() => {
    const loadPieData = async () => {
      try {
        const response = await reportService.getDashboardOwner(pieRange);
        setPieStats(response.result);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Pie Chart:", error);
      }
    };
    loadPieData();
  }, [pieRange]);

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

  const STATUS_COLORS: Record<string, string> = {
    BOOKED: "#18cdff",
    USING: "blue",
    COMPLETED: "#722ed1",
    CANCELLED: "#fa8c16",
    PENDING: "#fadb14",
    SUCCESS: "#52c41a",
    FAILED: "#ff4d4f",
  };

  const translate = (key: string) => {
    const map: Record<string, string> = {
      BOOKED: "Đã đặt",
      COMPLETED: "Hoàn thành",
      USING: "Đang dùng",
      CANCELLED: "Đã hủy",
      PENDING: "Đang chờ",
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
    };
    return map[key] || key;
  };

  const currentPieData = pieStats || stats;

  const bookingChartData = Object.entries(
    currentPieData?.bookingStats || {},
  ).map(([name, value]) => ({
    name: translate(name),
    originalName: name,
    value: value as number,
  }));

  const paymentChartData = Object.entries(
    currentPieData?.paymentStats || {},
  ).map(([name, value]) => ({
    name: translate(name),
    originalName: name,
    value: value as number,
  }));

  const activePieData =
    pieChartType === "booking" ? bookingChartData : paymentChartData;
  const totalPieValue = activePieData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // const tableColumns = [
  //   {
  //     title: "Mã Đơn",
  //     dataIndex: "id",
  //     key: "id",
  //     render: (text: string) => <a>{text}</a>,
  //   },
  //   { title: "Khách hàng", dataIndex: "customer", key: "customer" },
  //   { title: "Cơ sở / Sân", dataIndex: "room", key: "room" },
  //   {
  //     title: "Trạng thái",
  //     dataIndex: "status",
  //     key: "status",
  //     render: (status: string) => (
  //       <Tag color={STATUS_COLORS[status] || "default"}>
  //         {translate(status).toUpperCase()}
  //       </Tag>
  //     ),
  //   },
  //   {
  //     title: "Tổng tiền",
  //     dataIndex: "amount",
  //     key: "amount",
  //     render: (amount: number) => (
  //       <Text strong>{new Intl.NumberFormat("vi-VN").format(amount)} ₫</Text>
  //     ),
  //   },
  // ];

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
        <Title
          level={3}
          style={{ margin: 0, color: isDark ? "#fff" : "inherit" }}
        >
          Tổng quan hệ thống
        </Title>
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
              {(stats.revenueGrowth || 0) >= 0 ? (
                <Tag color="success" icon={<ArrowUpRight size={14} />}>
                  {(stats.revenueGrowth || 0).toFixed(1)}% so với tháng trước
                </Tag>
              ) : (
                <Tag color="error" icon={<ArrowDownRight size={14} />}>
                  {Math.abs(stats.revenueGrowth || 0).toFixed(1)}% so với tháng
                  trước
                </Tag>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4} style={{ flex: "1 1 20%" }}>
          <Card bordered={false} style={{ height: "100%" }}>
            <Statistic
              title={<Text type="secondary">Tỷ lệ hủy</Text>}
              value={(
                (((stats.bookingStats?.CANCELLED || 0) as number) /
                  Math.max(
                    1,
                    Object.values(stats.bookingStats || {}).reduce(
                      (a, b) => a + (b as number),
                      0,
                    ),
                  )) *
                100
              ).toFixed(1)}
              suffix="%"
              valueStyle={{ color: "#ff4d4f" }}
            />
            <div style={{ marginTop: 8 }}>
              {(stats.cancellationRateGrowth || 0) <= 0 ? (
                <Tag color="success" icon={<ArrowDownRight size={14} />}>
                  {Math.abs(stats.cancellationRateGrowth || 0).toFixed(1)}% so
                  với tháng trước
                </Tag>
              ) : (
                <Tag color="error" icon={<ArrowUpRight size={14} />}>
                  {(stats.cancellationRateGrowth || 0).toFixed(1)}% so với tháng
                  trước
                </Tag>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Biến động 7 ngày gần đây" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={stats.dailyStats7d}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    stroke={chartTextColor}
                  />

                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${v / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                    stroke={chartTextColor}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    stroke={chartTextColor}
                  />

                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={customTooltipFormatter as any}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ color: chartTextColor }}
                  />

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
          <Card
            title="Phân tích chi tiết"
            bordered={false}
            extra={
              <Space>
                <Select
                  value={pieChartType}
                  onChange={setPieChartType}
                  options={[
                    { label: "Trạng thái đặt sân", value: "booking" },
                    { label: "Trạng thái thanh toán", value: "payment" },
                  ]}
                  style={{ width: 180 }}
                />

                <Select
                  value={pieRange}
                  style={{ width: 150 }}
                  onChange={(value) => setPieRange(value)}
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
              </Space>
            }
          >
            <div style={{ width: "100%", height: 350 }}>
              {totalPieValue === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Empty description="Thời gian này không có dữ liệu" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={activePieData}
                      innerRadius={85}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke={isDark ? "none" : "#fff"}
                    >
                      {activePieData.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={STATUS_COLORS[entry.originalName] || "#ccc"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={commonTooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ color: chartTextColor }}
                      formatter={(value, entry: any) => {
                        return (
                          <span style={{ color: chartTextColor }}>
                            {value}: <strong>{entry.payload.value}</strong>
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title={`Phân tích tổng quan ${
              overviewMonth
                ? `Tháng ${overviewMonth}/${overviewYear}`
                : `Năm ${overviewYear}`
            }`}
            bordered={false}
            extra={
              <Space>
                <Select
                  value={overviewMonth}
                  style={{ width: 120 }}
                  onChange={(value) => setOverviewMonth(value)}
                  options={[
                    { label: "Cả năm", value: null },
                    ...Array.from({ length: 12 }, (_, i) => ({
                      label: `Tháng ${i + 1}`,
                      value: i + 1,
                    })),
                  ]}
                />
                <Select
                  value={overviewYear}
                  style={{ width: 100 }}
                  onChange={(value) => {
                    setOverviewMonth(null);
                    setOverviewYear(value);
                  }}
                  options={[
                    { label: currentYear.toString(), value: currentYear },
                    {
                      label: (currentYear - 1).toString(),
                      value: currentYear - 1,
                    },
                    {
                      label: (currentYear - 2).toString(),
                      value: currentYear - 2,
                    },
                  ]}
                />
              </Space>
            }
          >
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <ComposedChart data={overviewChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ed1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    stroke={chartTextColor}
                  />

                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                    stroke={chartTextColor}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    stroke={chartTextColor}
                  />

                  <Tooltip
                    contentStyle={commonTooltipStyle}
                    formatter={customTooltipFormatter as any}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ color: chartTextColor }}
                  />

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
    </div>
  );
};

export default OwnerDashboard;
