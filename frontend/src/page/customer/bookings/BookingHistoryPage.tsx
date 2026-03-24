import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Empty,
  message,
  Spin,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { BookingResponse, BookingStatus } from "../../../types/booking";
import bookingService from "../../../service/bookingService";
import { useAuth } from "../../../context/AuthContext";
import "./BookingHistoryPage.css";
import BookingDetailDrawer from "./BookingDetailDrawer";

import UserSidebar from "../../../components/sidebar/UserSidebar.tsx";

const BookingHistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const selectedMenu = "3";

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ DRAWER
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ FILTER
  const [statusFilter, setStatusFilter] = useState<BookingStatus | undefined>();

  // ✅ PAGINATION
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ================= FETCH =================
  const fetchBookings = async (page = 1, size = 10, status?: BookingStatus) => {
    if (!user?.userId) {
      message.error("Vui lòng đăng nhập lại");
      return;
    }

    setLoading(true);
    try {
      const response = await bookingService.getMyBookings(
        user.userId,
        page,
        size,
        status,
      );

      if (response?.code === 200 && response?.result) {
        setBookings(response.result.data);
        setPagination({
          current: page,
          pageSize: size,
          total: response.result.totalElements,
        });
      } else {
        message.error("Lỗi tải dữ liệu booking");
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      message.error("Không thể tải lịch sử booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, pagination.pageSize, statusFilter);
    // eslint-disable-next-line
  }, []);

  // ================= ACTION =================
  const handleViewDetail = (booking: BookingResponse) => {
    setSelectedBookingId(booking.bookingId);
    setDrawerOpen(true);
  };

  const handleStatusFilterChange = (status?: BookingStatus) => {
    setStatusFilter(status);
    fetchBookings(1, pagination.pageSize, status);
  };

  // ================= MAP =================
  const statusColorMap: Record<string, string> = {
    BOOKED: "blue",
    CONFIRMED: "blue",
    COMPLETED: "green",
    CANCELLED: "red",
  };

  const statusIconMap: Record<BookingStatus | string, React.ReactNode> = {
    BOOKED: <ClockCircleOutlined />,
    CONFIRMED: <ClockCircleOutlined />,
    COMPLETED: <CheckCircleOutlined />,
    CANCELLED: <CloseCircleOutlined />,
  };

  const statusLabelMap: Record<string, string> = {
    BOOKED: "Đã xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Hủy",
  };

  const columns = [
    {
      title: "Mã booking",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (id: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {id.substring(0, 8)}...
        </span>
      ),
      width: 100,
    },
    {
      title: "Sân bãi",
      key: "court",
      render: (_: unknown, record: BookingResponse) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.slots?.[0]?.courtCode || "-"}
          </div>

          <div style={{ fontSize: 12, color: "#666" }}>
            <EnvironmentOutlined /> {record.rentalArea?.rentalAreaName || "-"}
          </div>
        </div>
      ),
      width: 180,
    },
    {
      title: "Ngày",
      key: "date",
      render: (_: unknown, record: BookingResponse) =>
        record.startTime ? dayjs(record.startTime).format("DD/MM/YYYY") : "-",
      width: 120,
    },
    {
      title: "Khung giờ",
      key: "time",
      render: (_: unknown, record: BookingResponse) => (
        <div style={{ fontSize: 13 }}>
          {record.startTime ? dayjs(record.startTime).format("HH:mm") : "--"}
          {" - "}
          {record.endTime ? dayjs(record.endTime).format("HH:mm") : "--"}
        </div>
      ),
      width: 120,
    },
    {
      title: "Giá tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: "#1890ff" }}>
          {price?.toLocaleString("vi-VN")}đ
        </span>
      ),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      key: "bookingStatus",
      render: (status: BookingStatus) => (
        <Tag color={statusColorMap[status]} icon={statusIconMap[status]}>
          {statusLabelMap[status]}
        </Tag>
      ),
      width: 130,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: BookingResponse) => (
        <Button
          size="small"
          type="primary"
          ghost
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      ),
      width: 100,
    },
  ];

  // ================= AUTH CHECK =================
  if (authLoading || !user) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      className="booking-history-page"
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        {/* SIDEBAR */}
        <Col xs={24} md={8} lg={6}>
          <UserSidebar selectedKey={selectedMenu} />
        </Col>

        {/* NỘI DUNG CHÍNH (TABLE) */}
        <Col xs={24} md={16} lg={18}>
          <Card
            title={
              <span style={{ fontSize: "20px", fontWeight: 600 }}>
                <CalendarOutlined style={{ marginRight: "8px" }} />
                Lịch sử Đặt Sân
              </span>
            }
            bordered={false}
            style={{ borderRadius: "12px", height: "100%" }}
          >
            {bookings.length === 0 && !loading ? (
              <Empty description="Chưa có booking nào" />
            ) : (
              <Table
                columns={columns}
                dataSource={bookings}
                loading={loading}
                rowKey="bookingId"
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  onChange: (page, pageSize) =>
                    fetchBookings(page, pageSize, statusFilter),
                }}
                scroll={{ x: "max-content" }} // Thêm scroll ngang cho table trên mobile
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* DRAWER CHI TIẾT */}
      <BookingDetailDrawer
        bookingId={selectedBookingId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default BookingHistoryPage;
