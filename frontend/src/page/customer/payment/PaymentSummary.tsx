import { Card, Button, Radio, Divider } from "antd";

interface Props {
  intent: any;
  contact: any;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isDeposit: boolean;
  setIsDeposit: (val: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}

export default function PaymentSummary({
  intent,
  paymentMethod,
  setPaymentMethod,
  isDeposit,
  setIsDeposit,
  onConfirm,
  loading,
}: Props) {
  const totalPrice = intent.previewPrice || 0;
  const depositPrice = totalPrice * 0.5; // Cọc 50%
  const amountToPay = isDeposit ? depositPrice : totalPrice;

  return (
    <Card title="Thanh toán">
      <div style={{ marginBottom: 16 }}>
        <b>Số sân:</b> {intent.slots?.length || 0}
      </div>

      <Card size="small" style={{ marginTop: 20 }}>
        <h3 className="font-semibold mb-3">Hình thức thanh toán</h3>
        <Radio.Group
          value={isDeposit}
          onChange={(e) => setIsDeposit(e.target.value)}
          className="flex flex-col gap-2"
        >
          <Radio value={true}>
            Đặt cọc (50%):{" "}
            <span className="font-semibold text-purple-600">
              {depositPrice.toLocaleString("vi-VN")} VNĐ
            </span>
          </Radio>
          <Radio value={false}>
            Thanh toán toàn bộ (100%):{" "}
            <span className="font-semibold text-purple-600">
              {totalPrice.toLocaleString("vi-VN")} VNĐ
            </span>
          </Radio>
        </Radio.Group>
      </Card>

      <Card size="small" style={{ marginTop: 20 }}>
        <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>
        <Radio.Group
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="flex flex-col gap-2"
        >
          <Radio value="PAY_OS">Chuyển khoản PAY OS</Radio>
             <Radio value="VN_PAY">Chuyển khoản VNPay</Radio>
          <Radio value="CASH">Thanh toán tại sân (Tiền mặt)</Radio>

        </Radio.Group>
      </Card>

      <Divider />

      <div className="flex justify-between items-center mb-4 text-lg">
        <b>Cần thanh toán:</b>
        <span className="font-bold text-red-600 text-xl">
          {amountToPay.toLocaleString("vi-VN")} VNĐ
        </span>
      </div>

      <Button
        type="primary"
        size="large"
        block
        loading={loading}
        onClick={onConfirm}
      >
        Xác nhận thanh toán
      </Button>
    </Card>
  );
}
