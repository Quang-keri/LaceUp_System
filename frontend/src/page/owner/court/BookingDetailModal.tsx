import { Modal, Descriptions, Tag, Empty } from "antd";
import dayjs from "dayjs";
import type { SlotResponse, CourtCopyResponse } from "../../../types/court";

interface Props {
  open: boolean;
  onClose: () => void;
  slot?: SlotResponse;
  courtCopy?: CourtCopyResponse;
}

export default function BookingDetailModal({
  open,
  onClose,
  slot,
  courtCopy,
}: Props) {
  if (!slot || !courtCopy) {
    return (
      <Modal title="Chi tiết slot" open={open} onCancel={onClose} footer={null}>
        <Empty description="Không có dữ liệu" />
      </Modal>
    );
  }

  const booking = slot.bookingShortResponse;
  const startTime = slot.startTime
    ? dayjs(slot.startTime).format("HH:mm DD/MM/YYYY")
    : "";
  const endTime = slot.endTime
    ? dayjs(slot.endTime).format("HH:mm DD/MM/YYYY")
    : "";

  return (
    <Modal
      title="Chi tiết slot"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Sân con">
          <strong>{courtCopy.courtCode}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái sân">
          <Tag color={courtCopy.status === "ACTIVE" ? "green" : "red"}>
            {courtCopy.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian">
          <div style={{ lineHeight: 1.8 }}>
            <p>
              <strong>Bắt đầu:</strong> {startTime}
            </p>
            <p>
              <strong>Kết thúc:</strong> {endTime}
            </p>
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái slot">
          <Tag color={slot.slotStatus === "BOOKED" ? "red" : "green"}>
            {slot.slotStatus === "BOOKED" ? "Đã đặt" : "Có sẵn"}
          </Tag>
        </Descriptions.Item>

        {booking && slot.slotStatus === "BOOKED" && (
          <>
            <Descriptions.Item label="Tên khách hàng">
              <strong>{booking.userName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {booking.userPhone}
            </Descriptions.Item>
            {booking.note && (
              <Descriptions.Item label="Ghi chú">
                <em>{booking.note}</em>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Mã đặt">
              <code>{booking.bookingId}</code>
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Modal>
  );
}
