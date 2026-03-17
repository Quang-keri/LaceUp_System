import {
  Modal,
  Form,
  InputNumber,
  TimePicker,
  Select,
  DatePicker,
  message,
} from "antd";
import { useEffect } from "react";
import CourtPriceService from "../../../service/courtPriceService";

export default function CreateCourtPriceModal({
  open,
  onClose,
  courtId,
  onSuccess,
}: any) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        courtId,
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        pricePerHour: values.pricePerHour,
        priceType: values.priceType,
        specificDate: values.specificDate?.format("YYYY-MM-DD"),
        priority: values.priority,
      };

      await CourtPriceService.createCourtPrice(payload);

      message.success("Tạo giá thành công");
      onClose();
      onSuccess();
    } catch {
      message.error("Lỗi tạo giá");
    }
  };

  return (
    <Modal
      title="Tạo giá sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item name="pricePerHour" label="Giá" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="priceType" label="Type">
          <Select
            options={[
              { label: "Thường", value: "NORMAL" },
              { label: "Cao điểm", value: "PEAK" },
              { label: "Cuối tuần", value: "WEEKEND" },
              { label: "Sự kiện", value: "EVENT" },
              { label: "Khác", value: "OTHER" },
            ]}
          />
        </Form.Item>

        <Form.Item name="specificDate" label="Ngày">
          <DatePicker />
        </Form.Item>

        <Form.Item name="priority" label="Độ ưu tiên">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="VD : nhập số 1 , số càng cao độ ưu tiện càng cao cho khung giờ"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
