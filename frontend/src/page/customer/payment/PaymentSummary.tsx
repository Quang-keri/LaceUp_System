import { Card, Button, Radio } from "antd";

interface Props {
  intent: any;
  contact: any;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  onConfirm: () => void;
  loading: boolean;
}

export default function PaymentSummary({
  intent,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  loading,
}: Props) {
  return (
    <Card title="Thanh toán">
      <div style={{ marginBottom: 16 }}>
        <b>Số sân:</b> {intent.slots?.length || 0}
      </div>

      {/* Payment method */}
      <Card style={{ marginTop: 20 }}>
        <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>

        <Radio.Group
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <Radio value="CASH">Thanh toán tại sân</Radio>
          <Radio value="MOMO">Ví MoMo</Radio>
          <Radio value="VNPAY">VNPay</Radio>
        </Radio.Group>
      </Card>

      <div style={{ marginBottom: 16, marginTop: 16 }}>
        <b>Tổng tiền:</b> {intent.previewPrice?.toLocaleString("vi-VN") || 0}{" "}
        VNĐ
      </div>

      <Button type="primary" block loading={loading} onClick={onConfirm}>
        Thanh toán
      </Button>
    </Card>
  );
}
