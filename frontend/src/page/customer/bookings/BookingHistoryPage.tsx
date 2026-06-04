import React, { useEffect, useState } from "react";
import { Card, Table, Button, Tag, Empty, message, Spin } from "antd";
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

const BookingHistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter] = useState<BookingStatus | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchBookings = async (page = 1, size = 10, status?: BookingStatus) => {
    if (!user?.userId) {
      message.error("Vui lòng đăng nhập lại");
      return;
    }

    setLoading(true);
    try {
      const response = await bookingService.getMyBookings(
        status,
        undefined,
        undefined,
        undefined,
        page,
        size,
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
      message.error("Không thể tải lịch sử booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, pagination.pageSize, statusFilter);
    // eslint-disable-next-line
  }, []);

  const handleViewDetail = (booking: BookingResponse) => {
    setSelectedBookingId(booking.bookingId);
    setDrawerOpen(true);
  };

  // const handleStatusFilterChange = (status?: BookingStatus) => {
  //   setStatusFilter(status);
  //   fetchBookings(1, pagination.pageSize, status);
  // };

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
          {record.startTime ? dayjs(record.startTime).format("HH:mm") : "--"} -{" "}
          {record.endTime ? dayjs(record.endTime).format("HH:mm") : "--"}
        </div>
      ),
      width: 120,
    },
    {
      title: "Giá tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price?: number) => (
        <span style={{ fontWeight: 600, color: "orange" }}>
          {(price ?? 0).toLocaleString("vi-VN")}đ
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
          style={{ color: "#9156F1", border: "1px solid #9156F1" }}
          ghost
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      ),
      width: 100,
    },
  ];

  if (authLoading || !user) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Card
        title={
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            <CalendarOutlined style={{ marginRight: "8px" }} /> Lịch sử Đặt Sân
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
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      <BookingDetailDrawer
        bookingId={selectedBookingId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => fetchBookings(pagination.current, pagination.pageSize, statusFilter)}
      />
    </>
  );
};

export default BookingHistoryPage;
