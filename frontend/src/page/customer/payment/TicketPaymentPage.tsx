import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Radio,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import bookingService from "../../../service/bookingService";
import paymentService from "../../../service/payment/paymentService";

const { Title, Text } = Typography;

type PaymentMethod = "PAY_OS" | "VN_PAY" | "VIET_QR";

const formatCurrency = (value?: number | null) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const getPaymentStatusConfig = (status?: string) => {
  switch (String(status || "").toUpperCase()) {
    case "SUCCESS":
      return {
        color: "success",
        label: "Đã thanh toán",
      };

    case "PENDING":
      return {
        color: "warning",
        label: "Chờ thanh toán",
      };

    case "FAILED":
      return {
        color: "error",
        label: "Thanh toán thất bại",
      };

    case "REFUNDED":
      return {
        color: "default",
        label: "Đã hoàn tiền",
      };

    case "CANCELLED":
      return {
        color: "default",
        label: "Đã hủy",
      };

    default:
      return {
        color: "default",
        label: "Chưa thanh toán",
      };
  }
};

export default function TicketPaymentPage() {
  const { participantId } = useParams<{
    participantId: string;
  }>();

  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [participant, setParticipant] = useState<any>(null);
  const [bookingDetail, setBookingDetail] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAY_OS");

  useEffect(() => {
    if (!participantId) {
      message.error("Thông tin vé không hợp lệ");
      navigate("/");
      return;
    }

    loadPaymentInformation(participantId);
  }, [participantId]);

  const loadPaymentInformation = async (id: string) => {
    try {
      setPageLoading(true);

      // Lấy thông tin người tham gia/vé
      const participantResponse = await bookingService.getTicketParticipant(id);

      const participantData =
        participantResponse?.result ?? participantResponse;

      if (!participantData) {
        message.error("Không tìm thấy thông tin vé");
        navigate("/");
        return;
      }

      setParticipant(participantData);

      // Dùng bookingId của vé để lấy đầy đủ thông tin sân
      if (participantData.bookingId) {
        const bookingResponse = await bookingService.getBookingById(
          participantData.bookingId,
        );

        const bookingData = bookingResponse?.result ?? bookingResponse;

        setBookingDetail(bookingData);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải thông tin thanh toán",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const slots = useMemo(() => {
    return bookingDetail?.slots || [];
  }, [bookingDetail]);

  const firstSlot = slots.length > 0 ? slots[0] : null;
  const lastSlot = slots.length > 0 ? slots[slots.length - 1] : null;

  const startTime = firstSlot?.startTime || bookingDetail?.startTime || null;

  const endTime = lastSlot?.endTime || bookingDetail?.endTime || null;

  const rentalAreaName =
    bookingDetail?.rentalAreaName ||
    bookingDetail?.rentalArea?.rentalAreaName ||
    "Chưa có thông tin cơ sở";

  const courtName =
    firstSlot?.courtName || bookingDetail?.courtName || "Chưa có thông tin sân";

  const courtCode = firstSlot?.courtCode || bookingDetail?.courtCode || "";

  const ticketQuantity =
    participant?.ticketQuantity ||
    participant?.quantity ||
    participant?.playerCount ||
    1;

  const amountPaid = Number(
    participant?.amountPaid ?? participant?.ticketAmount ?? 0,
  );

  const paymentStatus = getPaymentStatusConfig(
    participant?.paymentStatus || participant?.ticketPaymentStatus,
  );

  const handlePayment = async () => {
    if (!participantId) {
      message.error("Không tìm thấy mã vé");
      return;
    }

    if (amountPaid <= 0) {
      message.warning("Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setConfirming(true);

      const response = await paymentService.checkoutSharedTicket({
        participantId,
        paymentMethod,
      });

      const result = response?.result ?? response;

      if (result?.mode === "REDIRECT" && result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      if (paymentMethod === "VIET_QR" || result?.mode === "PENDING") {
        message.info(
          result?.message || "Vui lòng chuyển khoản và tải ảnh xác nhận",
        );

        navigate(`/payment-ticket/${participantId}/proof`);

        return;
      }

      if (result?.mode === "BOOKED") {
        message.success("Thanh toán vé thành công");

        await loadPaymentInformation(participantId);
        return;
      }

      message.error(
        result?.message || response?.message || "Không thể khởi tạo thanh toán",
      );
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          "Thanh toán thất bại, vui lòng thử lại",
      );
    } finally {
      setConfirming(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="text-center">
          <Title level={4}>Không tìm thấy thông tin vé</Title>

          <Button onClick={() => navigate("/")}>Trở về trang chủ</Button>
        </Card>
      </div>
    );
  }

  const isPaid =
    String(
      participant?.paymentStatus || participant?.ticketPaymentStatus || "",
    ).toUpperCase() === "SUCCESS";

  return (
    <div className="mx-auto mt-6 max-w-[1100px] px-4 pb-10">
      <div className="mb-5">
        <Title level={3} style={{ marginBottom: 4 }}>
          Thanh toán trận vãng lai
        </Title>

        <Text type="secondary">Kiểm tra thông tin vé trước khi thanh toán</Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* CỘT TRÁI */}
        <Col xs={24} lg={16}>
          <Card
            title="Thông tin người đăng ký"
            className="mb-4"
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" size={10} className="w-full">
              <div className="flex items-center gap-2">
                <UserOutlined className="text-teal-600" />

                <Text type="secondary">Người đăng ký:</Text>

                <Text strong>
                  {participant?.userName ||
                    bookingDetail?.userName ||
                    "Chưa cập nhật"}
                </Text>
              </div>

              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-teal-600" />

                <Text type="secondary">Số điện thoại:</Text>

                <Text strong>
                  {participant?.userPhone ||
                    bookingDetail?.phoneNumber ||
                    "Chưa cập nhật"}
                </Text>
              </div>

              <div className="flex items-center gap-2">
                <TeamOutlined className="text-teal-600" />

                <Text type="secondary">Số lượng vé:</Text>

                <Text strong>{ticketQuantity} vé</Text>
              </div>

              <div className="flex items-center gap-2">
                <Text type="secondary">Trạng thái:</Text>

                <Tag color={paymentStatus.color}>{paymentStatus.label}</Tag>

                {participant?.isHost && <Tag color="cyan">Người tạo kèo</Tag>}
              </div>
            </Space>
          </Card>

          <Card title="Chi tiết trận vãng lai" style={{ borderRadius: 12 }}>
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <Text className="mb-1 block text-xs font-bold uppercase text-teal-600">
                  Thông tin sân
                </Text>

                <Title level={4} style={{ margin: 0 }}>
                  {courtName}

                  {courtCode && (
                    <span className="ml-2 text-teal-600">- {courtCode}</span>
                  )}
                </Title>
              </div>

              <Space direction="vertical" size="middle">
                <div className="flex items-start gap-2">
                  <EnvironmentOutlined className="mt-1 text-teal-600" />

                  <div>
                    <Text strong>Cơ sở:</Text> <Text>{rentalAreaName}</Text>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarOutlined className="mt-1 text-orange-500" />

                  <div>
                    <Text strong>Ngày chơi:</Text>{" "}
                    <Text>
                      {startTime
                        ? dayjs(startTime).format("DD/MM/YYYY")
                        : "Chưa cập nhật"}
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ClockCircleOutlined className="mt-1 text-orange-500" />

                  <div>
                    <Text strong>Thời gian:</Text>{" "}
                    <Text>
                      {startTime ? dayjs(startTime).format("HH:mm") : "--:--"} -{" "}
                      {endTime ? dayjs(endTime).format("HH:mm") : "--:--"}
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ShopOutlined className="mt-1 text-teal-600" />

                  <div>
                    <Text strong>Mã đặt sân:</Text>{" "}
                    <Text
                      code
                      copyable={
                        bookingDetail?.bookingId
                          ? {
                              text: bookingDetail.bookingId,
                            }
                          : false
                      }
                    >
                      {bookingDetail?.bookingId
                        ?.substring(0, 8)
                        .toUpperCase() ||
                        participant?.bookingId?.substring(0, 8).toUpperCase() ||
                        "Chưa có"}
                    </Text>
                  </div>
                </div>
              </Space>

              {(bookingDetail?.note || bookingDetail?.notes) && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <Text italic type="secondary">
                    Ghi chú: {bookingDetail.note || bookingDetail.notes}
                  </Text>
                </div>
              )}

              {slots.length > 1 && (
                <div>
                  <Text strong className="mb-3 block">
                    Các khung giờ đã đặt
                  </Text>

                  <Space direction="vertical" className="w-full" size={8}>
                    {slots.map((slot: any, index: number) => (
                      <div
                        key={slot.slotId || `${slot.startTime}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <Text strong>{slot.courtName || courtName}</Text>

                          {slot.courtCode && (
                            <Text type="secondary" className="ml-2">
                              {slot.courtCode}
                            </Text>
                          )}
                        </div>

                        <Text>
                          {dayjs(slot.startTime).format("HH:mm")} -{" "}
                          {dayjs(slot.endTime).format("HH:mm")}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* CỘT PHẢI */}
        <Col xs={24} lg={8}>
          <Card
            title="Tóm tắt thanh toán"
            className="shadow-sm"
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" size="middle" className="w-full">
              <div className="flex justify-between">
                <Text type="secondary">Số lượng vé:</Text>

                <Text strong>{ticketQuantity} vé</Text>
              </div>

              {ticketQuantity > 1 && (
                <div className="flex justify-between">
                  <Text type="secondary">Giá trung bình mỗi vé:</Text>

                  <Text strong>
                    {formatCurrency(amountPaid / ticketQuantity)} đ
                  </Text>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 p-4">
                <Text className="font-medium text-teal-800">
                  Tổng thanh toán:
                </Text>

                <Text className="text-xl font-bold text-teal-600">
                  {formatCurrency(amountPaid)} đ
                </Text>
              </div>

              <Divider className="my-1" />

              <div>
                <Text strong className="mb-3 block text-gray-700">
                  Phương thức thanh toán
                </Text>

                <Radio.Group
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  disabled={isPaid}
                  className="flex w-full flex-col gap-3"
                >
                  <Radio value="PAY_OS" className="font-semibold text-gray-700">
                    <Space>
                      <WalletOutlined className="text-teal-600" />
                      Ví điện tử PayOS
                    </Space>
                  </Radio>

                  <Radio value="VN_PAY" className="font-semibold text-gray-700">
                    <Space>
                      <CreditCardOutlined className="text-blue-500" />
                      Cổng thanh toán VNPay
                    </Space>
                  </Radio>
                </Radio.Group>
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={confirming}
                disabled={isPaid || amountPaid <= 0}
                onClick={handlePayment}
                className="
    mt-2 h-12
    !border-teal-500 !bg-teal-500
    text-base font-bold !text-white
    shadow-md transition-colors
    hover:!border-teal-600 hover:!bg-teal-600
    disabled:!border-gray-300 disabled:!bg-gray-300
  "
                style={{ borderRadius: 8 }}
              >
                {isPaid
                  ? "Vé đã được thanh toán"
                  : `Thanh toán ${formatCurrency(amountPaid)} đ`}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
