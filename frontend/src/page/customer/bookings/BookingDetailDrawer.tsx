import React, { useEffect, useState } from "react";
import {
  Modal,
  Tag,
  Divider,
  Descriptions,
  Space,
  Spin,
  Row,
  Col,
  Card,
  Button,
  Modal as AntModal,
  message,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import bookingService from "../../../service/bookingService";
import type { BookingResponse, BookingStatus } from "../../../types/booking";

interface Props {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const BookingDetailModal: React.FC<Props> = ({
  bookingId,
  open,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    if (!bookingId || !open) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await bookingService.getBookingById(bookingId);
        if (res.code === 200) {
          setBooking(res.result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bookingId, open]);

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

  const handleCancelBooking = () => {
    if (!bookingId || !booking) return;

    const hoursDifference = dayjs(booking.startTime).diff(dayjs(), "hour");
    const isLateCancel = hoursDifference < 5;

    AntModal.confirm({
      title: "Xác nhận hủy booking?",
      content: isLateCancel ? (
        <span style={{ color: "#ff4d4f" }}>
          <b>CẢNH BÁO:</b> Bạn đang hủy lịch <b>QUÁ SÁT GIỜ (dưới 5h)</b>. Bạn
          sẽ <b>MẤT TIỀN CỌC</b> và <b>BỊ TRỪ 10 ĐIỂM UY TÍN</b> trên hệ thống.
          Bạn vẫn muốn tiếp tục hủy?
        </span>
      ) : (
        <span>
          Bạn đang hủy lịch trước 5h. Theo quy định, tiền cọc của bạn sẽ{" "}
          <b>KHÔNG được hoàn lại</b>. Bạn có chắc chắn muốn hủy?
        </span>
      ),
      okText: "Đồng ý hủy",
      cancelText: "Không",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          const res = await bookingService.cancelBooking(bookingId);

          if (res.code === 200) {
            message.success("Hủy đặt lịch thành công");
            setBooking((prev) =>
              prev ? { ...prev, bookingStatus: "CANCELLED" } : null,
            );

            onClose();
            if (onRefresh) onRefresh();
          }
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Hủy booking thất bại",
          );
        }
      },
    });
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Chi tiết đặt lịch </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        booking?.bookingStatus !== "CANCELLED" &&
        booking?.bookingStatus !== "COMPLETED" ? (
          <Button danger onClick={handleCancelBooking}>
            Hủy lịch
          </Button>
        ) : null
      }
      width={700}
    >
      {loading || !booking ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag
              color={statusColorMap[booking.bookingStatus]}
              icon={statusIconMap[booking.bookingStatus]}
              style={{ fontSize: 14, padding: "4px 10px" }}
            >
              {booking.bookingStatus === "BOOKED"
                ? "Đã xác nhận"
                : booking.bookingStatus === "COMPLETED"
                ? "Hoàn thành"
                : "Đã hủy"}
            </Tag>
          </div>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Mã booking">
                {booking.bookingId}
              </Descriptions.Item>

              <Descriptions.Item label="Sân">
                {booking.slots?.[0]?.courtCode || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Khu">
                {booking.rentalArea?.rentalAreaName || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày">
                {booking.startTime
                  ? dayjs(booking.startTime).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Khung giờ">
                {booking.startTime && booking.endTime
                  ? `${dayjs(booking.startTime).format("HH:mm")} - ${dayjs(
                      booking.endTime,
                    ).format("HH:mm")}`
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Người đặt">
                {booking.userName}
              </Descriptions.Item>

              <Descriptions.Item label="SĐT">
                <Space>
                  <PhoneOutlined />
                  {booking.phoneNumber}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ color: "#888" }}>Tổng tiền</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {(booking.totalPrice ?? 0).toLocaleString("vi-VN")}đ
                </div>
              </Col>

              <Col span={8}>
                <div style={{ color: "#888" }}>Đã cọc</div>
                <div style={{ color: "#faad14", fontWeight: 600 }}>
                  {booking.depositAmount?.toLocaleString("vi-VN") || 0}đ
                </div>
              </Col>

              <Col span={8}>
                <div style={{ color: "#888" }}>Còn lại</div>
                <div style={{ color: "#ff4d4f", fontWeight: 600 }}>
                  {booking.remainingAmount?.toLocaleString("vi-VN") || 0}đ
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <b>Phương thức:</b> {booking.paymentMethod}
            </div>
          </Card>

          <Card size="small">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Danh sách khung giờ
            </div>

            {booking.slots?.map((s) => (
              <div
                key={s.slotId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{s.courtCode}</div>

                  <div style={{ fontSize: 12, color: "#666" }}>
                    {dayjs(s.startTime).format("DD/MM/YYYY HH:mm")} -{" "}
                    {dayjs(s.endTime).format("HH:mm")}
                  </div>
                </div>

                <div style={{ fontWeight: 500 }}>
                  {(s.price ?? 0).toLocaleString("vi-VN")}đ
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </Modal>
  );
};

export default BookingDetailModal;
