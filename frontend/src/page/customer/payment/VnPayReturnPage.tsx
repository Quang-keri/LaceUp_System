import { Button, Card, Spin, Result, Tag } from "antd";
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

export default function VnPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>({
    loading: true,
    message: "Đang xác nhận thanh toán qua VNPay...",
  });

  const vnp_TxnRef = useMemo(
    () => searchParams.get("vnp_TxnRef") || "",
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!vnp_TxnRef) {
        setState({
          loading: false,
          message: "Thiếu mã giao dịch từ cổng thanh toán VNPay",
          mode: "FAILED",
        });
        return;
      }

    
      try {
        const queryString = window.location.search; 
        const res = await paymentService.handleVnPayReturn(queryString);

        if (!mounted) return;

        if (res?.data?.code === 200) {
          const result = res?.data?.result;
          setState({
            loading: false,
            bookingId: result?.bookingId,
            message: result?.message || "Đã xử lý trạng thái thanh toán VNPay",
            mode: result?.mode,
          });
        } else {
          // Trường hợp Backend trả về ApiResponse.error()
          setState({
            loading: false,
            message: res?.data?.message || "Giao dịch không hợp lệ từ hệ thống",
            mode: "FAILED",
          });
        }
      } catch (error: any) {
        if (!mounted) return;
        setState({
          loading: false,
          message:
            error?.response?.data?.message ||
            "Không thể kết nối đến máy chủ để xác nhận",
          mode: "FAILED",
        });
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [searchParams, vnp_TxnRef]);

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
          Đang xác nhận giao dịch VNPay, vui lòng chờ trong giây lát...
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
              {vnp_TxnRef && <Tag color="blue">Mã giao dịch: {vnp_TxnRef}</Tag>}
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
