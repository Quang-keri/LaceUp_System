import { Modal, Descriptions, Table, Tag } from "antd";
import type { BookingResponse } from "../../../types/booking";

interface Props {
  open: boolean;
  booking: BookingResponse | null;
  onClose: () => void;
}

export default function BookingDetailModal({ open, booking, onClose }: Props) {
  if (!booking) return null;

  const statusMap: Record<string, { label: string; color: string }> = {
    BOOKED: { label: "Đã đặt", color: "blue" },
    CONFIRMED: { label: "Đã xác nhận", color: "green" },
    COMPLETED: { label: "Hoàn thành", color: "purple" },
    CANCELLED: { label: "Đã hủy", color: "red" },
    PENDING: { label: "Chờ xử lý", color: "orange" },
  };

  const status = statusMap[booking.bookingStatus] || {
    label: booking.bookingStatus,
    color: "default",
  };

  // ✅ PAYMENT LOGIC CHUẨN (fix gia hạn)
  const total = booking.totalPrice || 0;
  const deposit = booking.depositAmount || 0;
  const remaining = booking.remainingAmount ?? Math.max(total - deposit, 0);
  const paid = total - remaining;

  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

  const columns = [
    { title: "Sân", dataIndex: "courtCode" },
    {
      title: "Giờ bắt đầu",
      dataIndex: "startTime",
      render: (v: string) => new Date(v).toLocaleString("vi-VN"),
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "endTime",
      render: (v: string) => new Date(v).toLocaleString("vi-VN"),
    },
    {
      title: "Giá",
      dataIndex: "price",
      render: (price: number) => price?.toLocaleString("vi-VN") + " VND",
    },
  ];

  return (
    <Modal
      title="Chi tiết đơn đặt"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {/* 🧾 INFO */}
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Mã đơn">
          {booking.bookingId}
        </Descriptions.Item>

        <Descriptions.Item label="Khách hàng">
          {booking.userName}
        </Descriptions.Item>

        <Descriptions.Item label="Điện thoại">
          {booking.phoneNumber}
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>

        {/* 💰 Tổng */}
        <Descriptions.Item label="Tổng tiền">
          <b style={{ color: "#1677ff", fontSize: 16 }}>
            {total.toLocaleString("vi-VN")} VND
          </b>
        </Descriptions.Item>

        {/* 💵 Đã trả */}
        <Descriptions.Item label="Đã thanh toán">
          <span style={{ color: "#52c41a", fontWeight: 500 }}>
            {paid.toLocaleString("vi-VN")} VND
          </span>
        </Descriptions.Item>

        {/* 💸 Còn lại */}
        <Descriptions.Item label="Còn lại cần thu">
          <b style={{ color: "#ff4d4f", fontSize: 16 }}>
            {remaining.toLocaleString("vi-VN")} VND
          </b>
        </Descriptions.Item>
      </Descriptions>

      {/* 📊 PROGRESS BAR */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            height: 8,
            background: "#f0f0f0",
            borderRadius: 4,
          }}
        ></div>
      </div>

      <Table
        style={{ marginTop: 20 }}
        columns={columns}
        dataSource={booking.slots}
        pagination={false}
        rowKey="slotId"
      />
    </Modal>
  );
}
