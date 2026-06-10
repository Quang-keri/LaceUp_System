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
import { useNavigate } from "react-router-dom";

const ticketStatusColorMap: Record<string, string> = {
  PENDING: "orange",
  SUCCESS: "green",
  BOOKED: "blue",
  COMPLETED: "green",
  FAILED: "red",
  CANCELLED: "default",
  CANCELLED_NO_REFUND: "volcano",
  REFUND_PENDING: "gold",
  REFUND_FAILED: "red",
  REFUNDED: "blue",
};

const ticketStatusLabelMap: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  SUCCESS: "Đã thanh toán",
  BOOKED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy vé",
  CANCELLED_NO_REFUND: "Đã hủy, không hoàn tiền",
  REFUND_PENDING: "Đang chờ hoàn tiền",
  REFUND_FAILED: "Hoàn tiền thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const isJoinedSharedTicket = (booking?: BookingResponse | null): boolean => {
  if (!booking) return false;

  return (
    booking.bookingType === "SHARED" &&
    (booking.sharedTicketParticipant === true || Boolean(booking.participantId))
  );
};

const BookingHistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [selectedBooking, setSelectedBooking] =
    useState<BookingResponse | null>(null);
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
        undefined,
        page,
        size,
      );

      if (response?.code === 200 && response?.result) {
        setBookings(response.result.data ?? []);

        setPagination({
          current: response.result.page ?? page,
          pageSize: response.result.size ?? size,
          total: response.result.totalElements ?? 0,
        });
      } else {
        message.error(response?.message || "Lỗi tải dữ liệu booking");
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải lịch sử booking",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings(1, pagination.pageSize, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewDetail = (booking: BookingResponse) => {
    setSelectedBookingId(booking.bookingId);
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const statusColorMap: Record<string, string> = {
    BOOKED: "blue",
    USING: "processing",
    CONFIRMED: "blue",
    COMPLETED: "green",
    CANCELLED: "red",
  };

  const statusIconMap: Record<BookingStatus | string, React.ReactNode> = {
    BOOKED: <ClockCircleOutlined />,
    USING: <ClockCircleOutlined />,
    CONFIRMED: <ClockCircleOutlined />,
    COMPLETED: <CheckCircleOutlined />,
    CANCELLED: <CloseCircleOutlined />,
  };

  const statusLabelMap: Record<string, string> = {
    BOOKED: "Đã xác nhận",
    USING: "Đang sử dụng",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };

  const columns = [
    {
      title: "Mã booking",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (id: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {id ? `${id.substring(0, 8)}...` : "---"}
        </span>
      ),
      width: 100,
    },
    {
      title: "Loại",
      key: "bookingType",
      render: (_: unknown, record: BookingResponse) =>
        isJoinedSharedTicket(record) ? (
          <Tag color="cyan">Vãng lai</Tag>
        ) : (
          <Tag color="purple">Đặt sân</Tag>
        ),
      width: 100,
    },
    {
      title: "Sân bãi",
      key: "court",
      render: (_: unknown, record: BookingResponse) => {
        const firstSlot = record.slots?.[0];
        const courtName =
          firstSlot?.courtName ||
          record.courtName ||
          firstSlot?.courtCode ||
          "-";
        const courtCode = firstSlot?.courtCode;

        return (
          <div>
            <div style={{ fontWeight: 600 }}>
              {courtName}
              {courtCode && courtName !== courtCode ? ` - ${courtCode}` : ""}
            </div>

            <div style={{ fontSize: 12, color: "#666" }}>
              <EnvironmentOutlined />{" "}
              {record.rentalArea?.rentalAreaName ||
                record.rentalAreaName ||
                "-"}
            </div>
          </div>
        );
      },
      width: 220,
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
      key: "price",
      render: (_: unknown, record: BookingResponse) => {
        const isSharedTicket = isJoinedSharedTicket(record);

        if (isSharedTicket) {
          const amount = Number(
            record.ticketAmount ??
              Number(record.pricePerTicket ?? 0) *
                Number(record.ticketQuantity ?? 1),
          );

          const isTicketCancelled = [
            "CANCELLED",
            "CANCELLED_NO_REFUND",
            "FAILED",
            "REFUNDED",
          ].includes(record.ticketPaymentStatus ?? "");

          return (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontWeight: 600,
                  color: isTicketCancelled ? "#aaa" : "orange",
                  textDecoration: isTicketCancelled ? "line-through" : "none",
                }}
              >
                {amount.toLocaleString("vi-VN")}đ
              </div>

              <div style={{ fontSize: 11, color: "#888" }}>
                {record.ticketQuantity ?? 1} vé
              </div>
            </div>
          );
        }

        const totalPrice = Number(record.totalPrice ?? 0);
        const deposit = Number(record.depositAmount ?? 0);
        const remaining = Number(record.remainingAmount ?? 0);
        const isBookingCancelled = record.bookingStatus === "CANCELLED";

        return (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: 600,
                color: isBookingCancelled ? "#aaa" : "orange",
                textDecoration: isBookingCancelled ? "line-through" : "none",
              }}
            >
              {totalPrice.toLocaleString("vi-VN")}đ
            </div>

            {deposit > 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: isBookingCancelled ? "#aaa" : "#555",
                }}
              >
                {isBookingCancelled ? "Cọc đã thu: " : "Cọc: "}
                {deposit.toLocaleString("vi-VN")}đ
              </div>
            )}

            {!isBookingCancelled && remaining > 0 && (
              <div style={{ fontSize: 11, color: "red" }}>
                Còn lại: {remaining.toLocaleString("vi-VN")}đ
              </div>
            )}

            {!isBookingCancelled && remaining === 0 && deposit > 0 && (
              <div style={{ fontSize: 11, color: "green" }}>
                Đã thanh toán hết
              </div>
            )}
          </div>
        );
      },
      align: "right" as const,
      width: 140,
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: unknown, record: BookingResponse) => {
        if (isJoinedSharedTicket(record)) {
          const ticketStatus = record.ticketPaymentStatus ?? "PENDING";

          return (
            <Tag color={ticketStatusColorMap[ticketStatus] ?? "default"}>
              {ticketStatusLabelMap[ticketStatus] ?? ticketStatus}
            </Tag>
          );
        }

        const status = record.bookingStatus;

        return (
          <Tag
            color={statusColorMap[status] ?? "default"}
            icon={statusIconMap[status]}
          >
            {statusLabelMap[status] ?? status}
          </Tag>
        );
      },
      width: 180,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: BookingResponse) => {
        const isPendingSharedTicket =
          isJoinedSharedTicket(record) &&
          Boolean(record.participantId) &&
          record.ticketPaymentStatus === "PENDING";

        if (isPendingSharedTicket) {
          return (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                navigate(`/payment-ticket/${record.participantId}`)
              }
              className="!bg-teal-500 !border-teal-500"
            >
              Thanh toán
            </Button>
          );
        }

        return (
          <Button
            size="small"
            style={{
              color: "#9156F1",
              border: "1px solid #9156F1",
            }}
            ghost
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
        );
      },
      width: 110,
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
            <CalendarOutlined style={{ marginRight: "8px" }} /> Lịch sử đặt sân
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
            rowKey={(record) =>
              record.participantId
                ? `${record.bookingId}-${record.participantId}`
                : record.bookingId
            }
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) =>
                void fetchBookings(page, pageSize, statusFilter),
            }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      <BookingDetailDrawer
        bookingId={selectedBookingId}
        initialData={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() =>
          void fetchBookings(
            pagination.current,
            pagination.pageSize,
            statusFilter,
          )
        }
      />
    </>
  );
};

export default BookingHistoryPage;
