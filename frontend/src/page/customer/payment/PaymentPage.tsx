import { useEffect, useState } from "react";
import { Row, Col, Spin, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";

import BookingInfoList from "../bookings/BookingInfoList";
import BookingContactForm from "../bookings/BookingContactForm";
import PaymentSummary from "./PaymentSummary";

import bookingService from "../../../service/bookingService";
import paymentService from "../../../service/payment/paymentService";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [intent, setIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Thêm state isDeposit
  const [isDeposit, setIsDeposit] = useState(false); // Mặc định là trả full
  const [paymentMethod, setPaymentMethod] = useState("PAY_OS");
  const [contact, setContact] = useState({
    userName: "",
    userPhone: "",
    note: "",
  });

  useEffect(() => {
    if (!bookingId) {
      message.error("Booking không hợp lệ");
      navigate("/");
      return;
    }
    loadIntent();
  }, [bookingId]);

  const loadIntent = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookingIntent(bookingId);
      setIntent(data);

      setContact({
        userName: data.bookerName ?? "",
        userPhone: data.bookerPhone ?? "",
        note: data.note ?? "",
      });
    } catch (error) {
      message.error("Không tải được booking");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!intent) return;

    try {
      setConfirming(true);
      const res = await paymentService.checkoutPayment(
        intent.bookingIntentId,
        paymentMethod,
        isDeposit,
      );

      const result = res?.result;

      if (res.code === 201 && result) {
        if (result.mode === "REDIRECT" && result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }

        if (result.mode === "PENDING") {
          message.info(result.message || "Đang chờ xác nhận thanh toán");
          return;
        }

        if (result.mode === "BOOKED" && result.bookingId) {
          message.success("Thanh toán thành công");
          navigate(`/payment-success/${result.bookingId}`);
          return;
        }
      } else {
        message.error(res.message || "Thanh toán thất bại");
      }
    } catch (error) {
      message.error("Thanh toán thất bại, vui lòng thử lại sau.");
    } finally {
      setConfirming(false);
    }
  };
  if (loading || !intent) {
    return (
      <div className="flex justify-center mt-24">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto mt-6 px-4">
      <Row gutter={20}>
        <Col xs={24} lg={16}>
          <BookingContactForm
            formData={contact}
            setFormData={setContact}
            readonly
          />
          <div className="mt-4">
            <BookingInfoList intent={intent} />
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <PaymentSummary
            intent={intent}
            contact={contact}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isDeposit={isDeposit} // Truyền props mới
            setIsDeposit={setIsDeposit}
            onConfirm={handleConfirm}
            loading={confirming}
          />
        </Col>
      </Row>
    </div>
  );
}
