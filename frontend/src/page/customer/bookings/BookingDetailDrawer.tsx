import React, { useEffect, useMemo, useState } from "react";
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
  NumberOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import bookingService from "../../../service/bookingService";
import type { BookingResponse, BookingStatus } from "../../../types/booking";

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

interface Props {
  bookingId: string | null;
  initialData?: BookingResponse | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const BookingDetailDrawer: React.FC<Props> = ({
  bookingId,
  initialData,
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

        if (res.code === 200 && res.result) {
          const apiData = res.result as BookingResponse;

          /*
           * API chi tiết booking đôi khi không trả metadata riêng của vé
           * và có thể trả slots/rentalArea thiếu hơn API my-bookings.
           * Vì vậy phải merge có điều kiện, không ghi đè dữ liệu tốt bằng null.
           */
          const mergedData: BookingResponse = {
            ...initialData,
            ...apiData,

            bookingType: initialData?.bookingType ?? apiData.bookingType,

            participantId: initialData?.participantId ?? apiData.participantId,

            ticketQuantity:
              initialData?.ticketQuantity ?? apiData.ticketQuantity,

            ticketAmount: initialData?.ticketAmount ?? apiData.ticketAmount,

            ticketPaymentStatus:
              initialData?.ticketPaymentStatus ?? apiData.ticketPaymentStatus,

            ticketPaymentProofUrl:
              initialData?.ticketPaymentProofUrl ??
              apiData.ticketPaymentProofUrl,

            sharedTicketParticipant:
              initialData?.sharedTicketParticipant ??
              apiData.sharedTicketParticipant,

            transactionCode:
              apiData.transactionCode ?? initialData?.transactionCode,

            paymentMethod: apiData.paymentMethod ?? initialData?.paymentMethod,

            rentalArea: apiData.rentalArea?.rentalAreaName
              ? apiData.rentalArea
              : initialData?.rentalArea ?? apiData.rentalArea,

            rentalAreaName:
              apiData.rentalAreaName ?? initialData?.rentalAreaName,

            courtName: apiData.courtName ?? initialData?.courtName,

            slots: apiData.slots?.length
              ? apiData.slots
              : initialData?.slots ?? [],

            startTime: apiData.startTime ?? initialData?.startTime,

            endTime: apiData.endTime ?? initialData?.endTime,
          };

          setBooking(mergedData);
        } else {
          message.error(res.message || "Không thể tải chi tiết booking");
        }
      } catch (error: any) {
        message.error(
          error?.response?.data?.message || "Không thể tải chi tiết booking",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [bookingId, open, initialData]);

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

  const isSharedTicket = useMemo(
    () =>
      booking?.bookingType === "SHARED" &&
      (booking.sharedTicketParticipant === true ||
        Boolean(booking.participantId)),
    [booking],
  );

  const ticketStatus = booking?.ticketPaymentStatus ?? "PENDING";

  const firstSlot = booking?.slots?.[0];

  const courtName =
    firstSlot?.courtName || booking?.courtName || firstSlot?.courtCode || "-";

  const courtCode = firstSlot?.courtCode || "-";

  const rentalAreaName =
    booking?.rentalArea?.rentalAreaName || booking?.rentalAreaName || "-";

  const transactionCode = booking?.transactionCode || "-";

  const ticketAmount = useMemo(() => {
    if (!booking) return 0;

    return Number(
      booking.ticketAmount ??
        Number(booking.pricePerTicket ?? 0) *
          Number(booking.ticketQuantity ?? 1),
    );
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking || !booking.startTime) return false;

    const hasStarted = !dayjs(booking.startTime).isAfter(dayjs());
    if (hasStarted) return false;

    if (isSharedTicket) {
      return ![
        "CANCELLED",
        "CANCELLED_NO_REFUND",
        "REFUND_PENDING",
        "REFUND_FAILED",
        "REFUNDED",
        "FAILED",
        "COMPLETED",
      ].includes(ticketStatus);
    }

    return !["CANCELLED", "COMPLETED"].includes(booking.bookingStatus);
  }, [booking, isSharedTicket, ticketStatus]);

  const handleCancelBooking = () => {
    if (!bookingId || !booking) return;

    const hoursDifference = dayjs(booking.startTime).diff(dayjs(), "hour");
    const isLateCancel = hoursDifference < 5;

    AntModal.confirm({
      title: isSharedTicket
        ? "Xác nhận hủy vé vãng lai?"
        : "Xác nhận hủy đặt sân?",
      content: isSharedTicket ? (
        <span>
          Bạn đang yêu cầu hủy vé vãng lai. Theo quy định, tiền mua vé sẽ
          <b> không được hoàn lại</b>. Bạn có chắc chắn muốn hủy?
        </span>
      ) : isLateCancel ? (
        <span style={{ color: "#ff4d4f" }}>
          <b>CẢNH BÁO:</b> Bạn đang hủy lịch quá sát giờ, dưới 5 giờ. Bạn sẽ
          <b> mất tiền cọc</b> và <b>bị trừ 10 điểm uy tín</b>. Bạn vẫn muốn
          tiếp tục hủy?
        </span>
      ) : (
        <span>
          Bạn đang hủy lịch đặt sân. Theo quy định, tiền cọc sẽ
          <b> không được hoàn lại</b>. Bạn có chắc chắn muốn hủy?
        </span>
      ),
      okText: "Đồng ý hủy",
      cancelText: "Không",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          if (isSharedTicket) {
            if (!booking.participantId) {
              message.error("Không tìm thấy mã vé vãng lai");
              return;
            }

            const res = await bookingService.cancelSharedTicketByUser(
              booking.participantId,
            );

            if (res.code === 200) {
              message.success("Hủy vé vãng lai thành công");

              const nextTicketStatus =
                res.result?.paymentStatus ?? "CANCELLED_NO_REFUND";

              setBooking((previous) =>
                previous
                  ? {
                      ...previous,
                      ticketPaymentStatus: nextTicketStatus,
                    }
                  : null,
              );

              onClose();
              onRefresh?.();
            }

            return;
          }

          const res = await bookingService.cancelBooking(bookingId);

          if (res.code === 200) {
            message.success("Hủy đặt lịch thành công");
            onClose();
            onRefresh?.();
          }
        } catch (error: any) {
          message.error(
            error?.response?.data?.message ||
              (isSharedTicket ? "Hủy vé thất bại" : "Hủy booking thất bại"),
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
          <span>Chi tiết {isSharedTicket ? "vé vãng lai" : "đặt lịch"}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        canCancel ? (
          <Button danger onClick={handleCancelBooking}>
            Hủy {isSharedTicket ? "vé" : "lịch"}
          </Button>
        ) : null
      }
      width={760}
      destroyOnClose
    >
      {loading || !booking ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            {isSharedTicket ? (
              <Tag
                color={ticketStatusColorMap[ticketStatus] ?? "default"}
                style={{ fontSize: 14, padding: "4px 10px" }}
              >
                {ticketStatusLabelMap[ticketStatus] ?? ticketStatus}
              </Tag>
            ) : (
              <Tag
                color={statusColorMap[booking.bookingStatus] ?? "default"}
                icon={statusIconMap[booking.bookingStatus]}
                style={{ fontSize: 14, padding: "4px 10px" }}
              >
                {statusLabelMap[booking.bookingStatus] ?? booking.bookingStatus}
              </Tag>
            )}
          </div>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Mã booking">
                {booking.bookingId}
              </Descriptions.Item>

              {isSharedTicket && (
                <Descriptions.Item label="Mã giao dịch">
                  <Space>
                    <NumberOutlined />
                    {transactionCode}
                  </Space>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Tên sân">{courtName}</Descriptions.Item>

              <Descriptions.Item label="Mã sân">{courtCode}</Descriptions.Item>

              <Descriptions.Item label="Khu">
                {rentalAreaName}
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

              {!isSharedTicket && (
                <>
                  <Descriptions.Item label="Người đặt">
                    {booking.userName || "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="SĐT">
                    <Space>
                      <PhoneOutlined />
                      {booking.phoneNumber || "-"}
                    </Space>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              {isSharedTicket ? (
                <>
                  <Col span={12}>
                    <div style={{ color: "#888" }}>Số tiền vé</div>

                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: "orange",
                      }}
                    >
                      {ticketAmount.toLocaleString("vi-VN")}đ
                      <span
                        style={{
                          fontSize: 13,
                          color: "#888",
                          marginLeft: 6,
                          fontWeight: 400,
                        }}
                      >
                        ({booking.ticketQuantity ?? 1} vé)
                      </span>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ color: "#888" }}>Trạng thái vé</div>

                    <div
                      style={{
                        color:
                          ticketStatus === "SUCCESS" ||
                          ticketStatus === "COMPLETED"
                            ? "#52c41a"
                            : ticketStatus === "PENDING" ||
                              ticketStatus === "REFUND_PENDING"
                            ? "#faad14"
                            : ticketStatus === "REFUNDED"
                            ? "#1677ff"
                            : "#ff4d4f",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      {ticketStatusLabelMap[ticketStatus] ?? ticketStatus}
                    </div>
                  </Col>
                </>
              ) : (
                <>
                  <Col span={8}>
                    <div style={{ color: "#888" }}>Tổng tiền</div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                      {Number(booking.totalPrice ?? 0).toLocaleString("vi-VN")}đ
                    </div>
                  </Col>

                  <Col span={8}>
                    <div style={{ color: "#888" }}>Đã cọc</div>
                    <div
                      style={{
                        color: "#faad14",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      {Number(booking.depositAmount ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </div>
                  </Col>

                  <Col span={8}>
                    <div style={{ color: "#888" }}>Còn lại</div>
                    <div
                      style={{
                        color: "#ff4d4f",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      {Number(booking.remainingAmount ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </div>
                  </Col>
                </>
              )}
            </Row>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <b>Phương thức:</b>{" "}
              {booking.paymentMethod ||
                (isSharedTicket ? "VIET_QR" : "Chưa xác định")}
            </div>
          </Card>

          <Card size="small">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              {isSharedTicket
                ? "Thông tin sân tham gia"
                : "Danh sách khung giờ"}
            </div>

            {booking.slots?.length ? (
              booking.slots.map((slot) => (
                <div
                  key={slot.slotId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {slot.courtName ||
                        booking.courtName ||
                        slot.courtCode ||
                        "-"}
                      {slot.courtCode &&
                      (slot.courtName || booking.courtName) !== slot.courtCode
                        ? ` - ${slot.courtCode}`
                        : ""}
                    </div>

                    <div style={{ fontSize: 12, color: "#666" }}>
                      {dayjs(slot.startTime).format("DD/MM/YYYY HH:mm")} -{" "}
                      {dayjs(slot.endTime).format("HH:mm")}
                    </div>
                  </div>

                  {!isSharedTicket && (
                    <div style={{ fontWeight: 500 }}>
                      {Number(slot.price ?? 0).toLocaleString("vi-VN")}đ
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: "#999" }}>Chưa có thông tin khung giờ.</div>
            )}
          </Card>
        </>
      )}
    </Modal>
  );
};

export default BookingDetailDrawer;
