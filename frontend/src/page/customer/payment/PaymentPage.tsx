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

  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [contact, setContact] = useState({
    name: "",
    phone: "",
    note: "",
  });

  // load booking intent
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
    } catch (error) {
      message.error("Không tải được booking");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // confirm payment
  const handleConfirm = async () => {
    if (!intent) return;

    try {
      setConfirming(true);

      const res = await paymentService.checkout(
        intent.bookingIntentId,
        paymentMethod,
      );

      if (res.code === 201) {
        message.success("Thanh toán thành công");

        navigate(`/payment-success/${res.result.bookingId}`);
      } else {
        message.error(res.message || "Thanh toán thất bại");
      }
    } catch (error) {
      message.error("Thanh toán thất bại, vui lòng thử lại sau.");
    } finally {
      setConfirming(false);
    }
  };

  // loading screen
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
        {/* LEFT */}
        <Col xs={24} lg={16}>
          <BookingContactForm formData={contact} setFormData={setContact} />

          <div className="mt-4">
            <BookingInfoList intent={intent} />
          </div>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={8}>
          <PaymentSummary
            intent={intent}
            contact={contact}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onConfirm={handleConfirm}
            loading={confirming}
          />
        </Col>
      </Row>
    </div>
  );
}
