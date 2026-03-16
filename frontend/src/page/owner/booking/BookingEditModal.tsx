import {
  Modal,
  Form,
  Select,
  Input,
  Divider,
  DatePicker,
  Space,
  Typography,
} from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  open: boolean;
  booking: any;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

export default function BookingEditModal({
  open,
  booking,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();

  // Load dữ liệu cũ vào form khi mở Modal
  useEffect(() => {
    if (open && booking) {
      form.setFieldsValue({
        bookerName: booking.userName,
        bookerPhone: booking.phoneNumber,
        status: booking.bookingStatus,
        notes: booking.note,
        // Chuyển format slot từ string sang dayjs để DatePicker dùng được
        slots: booking.slots?.map((slot: any) => ({
          slotId: slot.slotId,
          timeRange: [dayjs(slot.startTime), dayjs(slot.endTime)],
          courtCode: slot.courtCode,
        })),
      });
    }
  }, [open, booking, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Format lại dữ liệu trước khi gửi về Backend
      const payload = {
        bookerName: values.bookerName,
        bookerPhone: values.bookerPhone,
        bookingStatus: values.status,
        note: values.notes,
        slots: values.slots?.map((s: any) => ({
          slotId: s.slotId,
          startTime: s.timeRange[0].toISOString(),
          endTime: s.timeRange[1].toISOString(),
        })),
      };
      onSubmit(payload);
    });
  };

  return (
    <Modal
      title="Cập nhật thông tin Booking"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={700}
      okText="Lưu thay đổi"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Form.Item label="Tên khách hàng" name="bookerName">
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="bookerPhone">
            <Input />
          </Form.Item>
        </div>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: "Chờ xác nhận", value: "PENDING" },
              { label: "Đã xác nhận", value: "CONFIRMED" },
              { label: "Hoàn thành", value: "COMPLETED" },
              { label: "Hủy", value: "CANCELLED" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider orientation="left">Danh sách Slot (Khung giờ)</Divider>

        <Form.List name="slots">
          {(fields) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    background: "#f5f5f5",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <Space align="baseline">
                    <Text strong>
                      Sân: {form.getFieldValue(["slots", name, "courtCode"])}
                    </Text>
                    <Form.Item
                      {...restField}
                      name={[name, "timeRange"]}
                      label="Thời gian"
                      rules={[{ required: true, message: "Thiếu thời gian" }]}
                    >
                      <DatePicker.RangePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                      />
                    </Form.Item>
                    {/* Giữ lại slotId để backend biết update slot nào */}
                    <Form.Item name={[name, "slotId"]} hidden>
                      <Input />
                    </Form.Item>
                  </Space>
                </div>
              ))}
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
