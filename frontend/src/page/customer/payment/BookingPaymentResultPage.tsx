import { Alert, Button, Card, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import paymentService from "../../../service/payment/paymentService";

type ResultState = {
  loading: boolean;
  bookingId?: string;
  message: string;
  mode?: string;
};

export default function BookingPaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>({
    loading: true,
    message: "Đang xác nhận thanh toán...",
  });

  const orderCode = useMemo(
    () => searchParams.get("orderCode") || "",
    [searchParams],
  );
  const status = useMemo(
    () => searchParams.get("status") || "",
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!orderCode) {
        if (!mounted) return;
        setState({
          loading: false,
          message: "Thiếu orderCode từ cổng thanh toán",
          mode: "FAILED",
        });
        return;
      }

      try {
        const res = await paymentService.handleBookingPaymentResult({ orderCode, status });
        const result = res?.data?.result;
        if (!mounted) return;
        setState({
          loading: false,
          bookingId: result?.bookingId,
          message: result?.message || "Đã xử lý trạng thái thanh toán",
          mode: result?.mode,
        });
      } catch (error) {
        if (!mounted) return;
        setState({
          loading: false,
          message: "Không thể xác nhận kết quả thanh toán",
          mode: "FAILED",
        });
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [orderCode, status]);

  if (state.loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <div className="flex items-center gap-3">
            <Spin />
            <span>Đang xác nhận giao dịch...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card title="Kết quả thanh toán booking">
        <Alert
          type={
            state.mode === "BOOKED"
              ? "success"
              : state.mode === "PENDING"
              ? "info"
              : "error"
          }
          message={state.message}
          showIcon
        />

        <div className="mt-5 flex gap-3">
          {state.bookingId ? (
            <Button
              type="primary"
              onClick={() => navigate(`/payment/success/${state.bookingId}`)}
            >
              Xem chi tiết booking
            </Button>
          ) : (
            <Button type="primary" onClick={() => navigate("/wallet")}>
              Về ví
            </Button>
          )}
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
      </Card>
    </div>
  );
}
