import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Divider,
  Select,
  Space,
  Button,
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
} from "recharts";

const { Option } = Select;
import { CheckCircle, CreditCard } from "lucide-react";
import reportService from "../../../service/reportService.ts";
import type { DashboardData } from "../../../types/dashboard.ts";

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [range, setRange] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await reportService.getFullDashboard(range);
        setStats(response.result);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );
  if (!stats) return <div>Không có dữ liệu hiển thị.</div>;

  const COLORS: Record<string, string> = {
    BOOKED: "#1890ff",
    COMPLETED: "#52c41a",
    CANCELLED: "#f5222d",
    FAILED: "#fa8c16",
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

  // Xử lý dữ liệu biểu đồ
  const bookingChartData = Object.entries(stats.bookingStats).map(
    ([name, value]) => ({
      name: translate(name),
      originalName: name,
      value,
    }),
  );

  const paymentChartData = Object.entries(stats.paymentStats).map(
    ([name, value]) => ({
      name: translate(name),
      originalName: name,
      value,
    }),
  );

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "24px" }}>Tổng quan hệ thống</h2>

      <Space style={{ marginBottom: "24px" }}>
        {/* Nút Tháng trước */}
        <Button
          type={range === "yesterday" ? "primary" : "default"}
          onClick={() => setRange("yesterday")}
        >
          Hôm qua
        </Button>

        <Button
          type={range === "today" ? "primary" : "default"}
          onClick={() => setRange("today")}
        >
          Hôm nay
        </Button>

        <Button
          type={range === "this_week" ? "primary" : "default"}
          onClick={() => setRange("this_week")}
        >
          Tuần này
        </Button>

        <Button
          type={range === "this_month" ? "primary" : "default"}
          onClick={() => setRange("this_month")}
        >
          Tháng này
        </Button>

        <Button
          type={range === "last_month" ? "primary" : "default"}
          onClick={() => setRange("last_month")}
        >
          Tháng trước
        </Button>

        <Button
          type={range === "this_year" ? "primary" : "default"}
          onClick={() => setRange("this_year")}
        >
          Năm nay
        </Button>

        <Button
          type={range === "last_year" ? "primary" : "default"}
          onClick={() => setRange("last_year")}
        >
          Năm trước
        </Button>

        {/* SELECT CHỌN KHOẢNG THỜI GIAN */}
        <Select
          value={range}
          style={{ width: 160 }}
          onChange={(val) => setRange(val)}
        >
          <Option value="all">Tất cả thời gian</Option>
          <Option value="24h">24 giờ qua</Option>
          <Option value="7d">7 ngày qua</Option>
          <Option value="30d">30 ngày qua</Option>
          <Option value="1y">1 năm qua</Option> {/* THÊM MỚI */}
        </Select>

        {range !== "all" && (
          <Button onClick={() => setRange("all")} type="link" danger>
            Xóa lọc
          </Button>
        )}
      </Space>

      {/* Row 1: Thống kê tổng quát & Doanh thu */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              precision={0}
              suffix="VNĐ"
              valueStyle={{ color: "#20cf13" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Thanh toán thành công"
              value={stats.paymentStats.COMPLETED || 0}
              prefix={<CheckCircle size={18} color={COLORS.COMPLETED} />}
              valueStyle={{ color: COLORS.COMPLETED }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="horizontal" dashed>
        <span style={{ float: "left" }}>Thống kê giao dịch (Payment)</span>
      </Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu từng tháng (Năm nay)" bordered={false}>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      new Intl.NumberFormat("vi-VN").format(value) + " VNĐ",
                      "Doanh thu",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#1890ff"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tỷ lệ thanh toán" bordered={false} height="100%">
            {/* Biểu đồ */}
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell
                        key={`pay-cell-${index}`}
                        fill={COLORS[entry.originalName] || "#ccc"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Phần hiển thị số liệu ngang hàng */}
            <Divider style={{ margin: "12px 0" }} />
            <Row gutter={[16, 12]}>
              {Object.entries(stats.paymentStats).map(([key, value]) => (
                <Col span={12} key={key}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between", // Đẩy text và số về 2 đầu hoặc dùng flex-start tùy ý
                      gap: "8px",
                    }}
                  >
                    {/* Icon và Status */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CreditCard size={14} color={COLORS[key]} />
                      <span style={{ fontSize: "13px", color: "#8c8c8c" }}>
                        {translate(key)}:
                      </span>
                    </div>

                    {/* Giá trị số nằm ngang hàng */}
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: COLORS[key],
                      }}
                    >
                      {value as number}
                    </span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider orientation="horizontal">Thống kê đặt sân (Booking)</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Tỷ lệ đặt phòng" bordered={false}>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={bookingChartData.filter((d) => d.value > 0)}
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {bookingChartData.map((entry, index) => (
                      <Cell
                        key={`pie-${index}`}
                        fill={COLORS[entry.originalName]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Trạng thái đặt sân" bordered={false}>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={bookingChartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" barSize={50}>
                    {bookingChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.originalName]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
