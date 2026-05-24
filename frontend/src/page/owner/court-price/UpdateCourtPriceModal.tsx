import {
  Modal,
  Form,
  InputNumber,
  TimePicker,
  Select,
  DatePicker,
  message,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import CourtPriceService from "../../../service/courtPriceService";

export default function UpdateCourtPriceModal({
  open,
  onClose,
  data,
  onSuccess,
  openTime,
  closeTime,
}: any) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (data && open) {
      form.setFieldsValue({
        ...data,
        startTime: dayjs(data.startTime, "HH:mm"),
        endTime: dayjs(data.endTime, "HH:mm"),
        dateRange:
          data.startDate && data.endDate
            ? [dayjs(data.startDate), dayjs(data.endDate)]
            : null,
        specificDate: data.specificDate ? dayjs(data.specificDate) : null,
        dayType: data.dayType || "WEEKDAY", // Load data cũ lên
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
        startDate: values.dateRange
          ? values.dateRange[0].format("YYYY-MM-DD")
          : null,
        endDate: values.dateRange
          ? values.dateRange[1].format("YYYY-MM-DD")
          : null,
        pricePerHour: values.pricePerHour,
        priceType: values.priceType,
        dayType: values.dayType, // Gửi dayType lên
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

  // LOGIC VALIDATION
  const timeValidator = (_: any, value: dayjs.Dayjs) => {
    if (!value || !openTime || !closeTime) return Promise.resolve();

    const timeStr = value.format("HH:mm");
    const openStr = openTime.substring(0, 5);
    const closeStr = closeTime.substring(0, 5);

    if (timeStr < openStr || timeStr > closeStr) {
      return Promise.reject(
        new Error(`Giờ mở cửa từ ${openStr} đến ${closeStr}`),
      );
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Cập nhật giá sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Bắt đầu"
              rules={[{ required: true }, { validator: timeValidator }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="Kết thúc"
              rules={[{ required: true }, { validator: timeValidator }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dayType" label="Thứ" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="WEEKDAY">T2 - T6</Select.Option>
                <Select.Option value="WEEKEND">T7 - CN</Select.Option>
                <Select.Option value="ALL">Tất cả</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priceType"
              label="Loại giá"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="NORMAL">Bình thường</Select.Option>
                <Select.Option value="HOLIDAY">Ngày Lễ</Select.Option>
                <Select.Option value="EVENT">Sự kiện</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pricePerHour"
              label="Giá mỗi giờ"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="Độ ưu tiên">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dateRange" label="Khoảng ngày (Sự kiện)">
              <DatePicker.RangePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="specificDate" label="Ngày cụ thể">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
