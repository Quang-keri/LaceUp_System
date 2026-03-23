import { Alert, Button, Card, Spin, Result, Tag } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
} from "@ant-design/icons";
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
        setState({
          loading: false,
          message: "Thiếu orderCode từ cổng thanh toán",
          mode: "FAILED",
        });
        return;
      }

      try {
        const res = await paymentService.handleBookingPaymentResult({
          orderCode,
          status,
        });

        const result = res?.data?.result;

        if (!mounted) return;

        setState({
          loading: false,
          bookingId: result?.bookingId,
          message: result?.message || "Đã xử lý trạng thái thanh toán",
          mode: result?.mode,
        });
      } catch (error) {
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

 
  const getResultProps = () => {
    switch (state.mode) {
      case "BOOKED":
        return {
          status: "success",
          icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
          title: "Thanh toán thành công",
          subTitle: state.message,
        };
      case "PENDING":
        return {
          status: "info",
          icon: <ClockCircleFilled style={{ color: "#faad14" }} />,
          title: "Đang xử lý thanh toán",
          subTitle: state.message,
        };
      default:
        return {
          status: "error",
          icon: <CloseCircleFilled style={{ color: "#ff4d4f" }} />,
          title: "Thanh toán thất bại",
          subTitle: state.message,
        };
    }
  };

  if (state.loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Spin size="large" />
        <div className="mt-3 text-gray-500">
          Đang xác nhận giao dịch, vui lòng chờ...
        </div>
      </div>
    );
  }

  const resultProps = getResultProps();

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Card className="shadow-lg rounded-2xl">
        <Result
          status={resultProps.status as any}
          icon={resultProps.icon}
          title={resultProps.title}
          subTitle={
            <div className="flex flex-col items-center gap-2">
              <span>{resultProps.subTitle}</span>
              {orderCode && <Tag color="blue">Mã giao dịch: {orderCode}</Tag>}
            </div>
          }
        />

        <div className="flex justify-center gap-3 mt-4">
          {state.bookingId && state.mode === "BOOKED" && (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(`/booking/${state.bookingId}`)}
            >
              Xem chi tiết booking
            </Button>
          )}

          {state.mode === "FAILED" && (
            <Button danger size="large" onClick={() => navigate("/")}>
              Thử lại
            </Button>
          )}

          <Button size="large" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  );
}
