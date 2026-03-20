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

  const columns = [
    { title: "Sân", dataIndex: "courtCode" },
    { title: "Giờ bắt đầu", dataIndex: "startTime" },
    { title: "Giờ kết thúc", dataIndex: "endTime" },
    {
      title: "Giá",
      dataIndex: "price",
      render: (price: number) => price?.toLocaleString("vi-VN") + " VND",
    },
  ];

  const status = statusMap[booking.bookingStatus] || {
    label: booking.bookingStatus,
    color: "default",
  };

  return (
    <Modal
      title="Chi tiết đơn đặt"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Descriptions column={1}>
        <Descriptions.Item label="Mã đơn đặt">
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

        <Descriptions.Item label="Tổng tiền">
          {booking.totalPrice?.toLocaleString("vi-VN")} VND
        </Descriptions.Item>

        <Descriptions.Item label="Ghi chú">{booking.note}</Descriptions.Item>
      </Descriptions>

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
