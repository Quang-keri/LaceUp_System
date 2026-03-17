import {
  Modal,
  Form,
  InputNumber,
  TimePicker,
  Select,
  DatePicker,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import CourtPriceService from "../../../service/courtPriceService";

export default function UpdateCourtPriceModal({
  open,
  onClose,
  data,
  onSuccess,
}: any) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (data && open) {
      form.setFieldsValue({
        ...data,
        startTime: dayjs(data.startTime, "HH:mm"),
        endTime: dayjs(data.endTime, "HH:mm"),
        specificDate: data.specificDate ? dayjs(data.specificDate) : null,
      });
    }
  }, [data, open]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        pricePerHour: values.pricePerHour,
        priceType: values.priceType,
        specificDate: values.specificDate?.format("YYYY-MM-DD"),
        priority: values.priority,
      };

      await CourtPriceService.updateCourtPrice(data.courtPriceId, payload);

      message.success("Cập nhật thành công");
      onClose();
      onSuccess();
    } catch {
      message.error("Lỗi update");
    }
  };

  return (
    <Modal
      title="Cập nhật giá sân"
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
              { label: "Kì nghỉ", value: "HOLIDAY" },
              { label: "Cuối tuần", value: "WEEKEND" },
              { label: "Sự kiện", value: "EVENT" },
              { label: "Khác", value: "OTHER" },
            ]}
          />
        </Form.Item>

        <Form.Item name="specificDate" label="Ngày">
          <DatePicker />
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
