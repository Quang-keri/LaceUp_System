import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Result } from "antd";

export default function PaymentSuccessPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-[700px] mx-auto mt-20">
      <Card>
        <Result
          status="success"
          title="Thanh toán thành công!"
          subTitle={`Mã booking của bạn: ${bookingId}`}
          extra={[
            <Button
              type="primary"
              key="booking"
              onClick={() => navigate("/customer/my-bookings")}
            >
              Xem lịch đặt sân
            </Button>,

            <Button key="home" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
