import { Modal, Form, Select, Input } from "antd";

interface Props {
  open: boolean;
  form: any;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

export default function BookingStatusModal({
  open,
  form,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <Modal
      title="Cập nhật trạng thái"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
