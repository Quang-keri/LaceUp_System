import React from "react";
import { Modal, Form, Select, Input } from "antd";
import { BookingStatus } from "../../../types/booking";
import type { BookingResponse } from "../../../types/booking";
import "./BookingStatusUpdateModal.css";

interface Props {
  open: boolean;
  loading: boolean;
  booking: BookingResponse | null;
  onCancel: () => void;
  onSubmit: (values: { bookingStatus: BookingStatus; note?: string }) => void;
}

const BookingStatusUpdateModal: React.FC<Props> = ({
  open,
  loading,
  booking,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  const statusOptions = [
    { label: "Đã xác nhận", value: BookingStatus.BOOKED },
    { label: "Hoàn thành", value: BookingStatus.COMPLETED },
    { label: "Hủy", value: BookingStatus.CANCELLED },
  ];

  const statusColors: Record<string, string> = {
    [BookingStatus.BOOKED]: "#1890ff",
    [BookingStatus.COMPLETED]: "#52c41a",
    [BookingStatus.CANCELLED]: "#f5222d",
  };

  return (
    <Modal
      title={
        <div className="booking-status-title">
          <span>Cập nhật trạng thái đặt sân</span>
          {booking && (
            <span className="booking-id-small">
              Mã: {booking.bookingId?.substring(0, 8)}...
            </span>
          )}
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={500}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* Current Status */}
        {booking && (
          <div
            className="current-status-info"
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#f5f7fa",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <strong>Trạng thái hiện tại:</strong>
            </div>
            <div
              style={{
                color: statusColors[booking.bookingStatus] || "#666",
                fontWeight: "600",
              }}
            >
              {statusOptions.find((opt) => opt.value === booking.bookingStatus)
                ?.label || booking.bookingStatus}
            </div>
          </div>
        )}

        {/* Status Select */}
        <Form.Item
          label="Trạng thái mới"
          name="bookingStatus"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          initialValue={booking?.bookingStatus}
        >
          <Select
            placeholder="Chọn trạng thái"
            options={statusOptions}
            size="large"
          />
        </Form.Item>

        {/* Note/Reason */}
        <Form.Item label="Ghi chú (Tùy chọn)" name="note">
          <Input.TextArea
            placeholder="Lý do cập nhật trạng thái (VD: Khách hủy, hoàn thành thành công)"
            rows={3}
          />
        </Form.Item>

        {/* Booking Info Summary */}
        {booking && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
              marginTop: "16px",
              fontSize: "13px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong>Chi tiết đặt sân:</strong>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <div>
                <span style={{ color: "#666" }}>Khách:</span> {booking.userName}
              </div>
              <div>
                <span style={{ color: "#666" }}>SĐT:</span>{" "}
                {booking.phoneNumber}
              </div>
              <div>
                <span style={{ color: "#666" }}>Sân:</span> {booking.courtName}
              </div>
              <div>
                <span style={{ color: "#666" }}>Giá:</span>{" "}
                {booking.totalPrice?.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default BookingStatusUpdateModal;
