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
  Button,
  Card,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect } from "react";
import CourtPriceService from "../../../service/courtPriceService";

export default function CreateCourtPriceModal({
  open,
  onClose,
  courtId,
  onSuccess,
  openTime,
  closeTime,
}: any) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open]);

  // Cập nhật lại AutoFill: Có cả dayType và priceType
  const handleAutoFill = () => {
    form.setFieldsValue({
      prices: [
        {
          dayType: "WEEKDAY",
          priceType: "NORMAL",
          startTime: dayjs("05:00", "HH:mm"),
          endTime: dayjs("12:00", "HH:mm"),
          pricePerHour: 90000,
        },
        {
          dayType: "WEEKDAY",
          priceType: "NORMAL",
          startTime: dayjs("12:00", "HH:mm"),
          endTime: dayjs("18:00", "HH:mm"),
          pricePerHour: 80000,
        },
        {
          dayType: "WEEKDAY",
          priceType: "NORMAL",
          startTime: dayjs("18:00", "HH:mm"),
          endTime: dayjs("22:00", "HH:mm"),
          pricePerHour: 100000,
        },
        {
          dayType: "WEEKEND",
          priceType: "NORMAL",
          startTime: dayjs("05:00", "HH:mm"),
          endTime: dayjs("12:00", "HH:mm"),
          pricePerHour: 110000,
        },
        {
          dayType: "WEEKEND",
          priceType: "NORMAL",
          startTime: dayjs("12:00", "HH:mm"),
          endTime: dayjs("18:00", "HH:mm"),
          pricePerHour: 100000,
        },
        {
          dayType: "WEEKEND",
          priceType: "NORMAL",
          startTime: dayjs("18:00", "HH:mm"),
          endTime: dayjs("22:00", "HH:mm"),
          pricePerHour: 120000,
        },
      ],
      priority: 1,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const { dateRange, specificDate, priority, prices } = values;
      const startDate = dateRange ? dateRange[0].format("YYYY-MM-DD") : null;
      const endDate = dateRange ? dateRange[1].format("YYYY-MM-DD") : null;
      const specDate = specificDate?.format("YYYY-MM-DD");

      const promises = prices.map((p: any) => {
        return CourtPriceService.createCourtPrice({
          courtId,
          startTime: p.startTime?.format("HH:mm"),
          endTime: p.endTime?.format("HH:mm"),
          startDate,
          endDate,
          specificDate: specDate,
          pricePerHour: p.pricePerHour,
          priceType: p.priceType,
          dayType: p.dayType, // Gửi field mới xuống backend
          priority: priority || 1,
        });
      });

      await Promise.all(promises);
      message.success("Đã lưu bảng giá thành công!");
      onClose();
      onSuccess();
    } catch {
      message.error("Lỗi khi tạo bảng giá");
    }
  };

  const timeValidator = (_: any, value: dayjs.Dayjs) => {
    if (!value || !openTime || !closeTime) return Promise.resolve();

    const timeStr = value.format("HH:mm");
    const openStr = openTime.substring(0, 5);
    const closeStr = closeTime.substring(0, 5);

    if (timeStr < openStr || timeStr > closeStr) {
      return Promise.reject(new Error(`Giờ mở cửa: ${openStr} - ${closeStr}`));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Thiết kế bảng giá sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={900} // Nới form rộng thêm một chút cho vừa 2 cột Select
      okText="Lưu bảng giá"
      okButtonProps={{ style: { background: "#ea580c" } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ prices: [{}] }}
      >
        {/* PHẦN 1: NGÀY ÁP DỤNG */}
        <Card
          size="small"
          title="1. Chọn thời gian áp dụng"
          className="mb-4 bg-gray-50"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dateRange"
                label="Khoảng ngày (Dành cho Sự kiện / Giai đoạn)"
              >
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="specificDate" label="Ngày Lễ duy nhất">
                <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="priority" label="Độ ưu tiên" initialValue={1}>
                <InputNumber style={{ width: "100%" }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <p className="text-xs text-gray-400 italic">
            * Để trống nếu muốn áp dụng làm giá mặc định hàng năm.
          </p>
        </Card>

        {/* PHẦN 2: THỨ - GIỜ - GIÁ */}
        <div className="flex justify-between items-end mb-2">
          <h4 className="font-bold">2. Chi tiết khung giờ & Giá</h4>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleAutoFill}
            style={{ color: "#ea580c", borderColor: "#ea580c" }}
          >
            Dùng mẫu chuẩn (T2-CN)
          </Button>
        </div>

        {/* Header giả cho Table */}
        <Row
          gutter={8}
          className="mb-2 px-2 text-gray-500 font-semibold text-center"
        >
          <Col span={5}>Thứ</Col>
          <Col span={4}>Loại</Col>
          <Col span={7}>Khung giờ</Col>
          <Col span={6}>Giá / Giờ (VNĐ)</Col>
          <Col span={2}></Col>
        </Row>

        <Form.List name="prices">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row
                  gutter={8}
                  key={key}
                  align="middle"
                  className="mb-3 bg-white p-2 rounded border border-gray-100 hover:border-orange-200 transition-all"
                >
                  {/* Cột Thứ (dayType) */}
                  <Col span={5}>
                    <Form.Item
                      {...restField}
                      name={[name, "dayType"]}
                      rules={[{ required: true, message: "Chọn Thứ" }]}
                      className="mb-0"
                    >
                      <Select placeholder="Chọn Thứ">
                        <Select.Option value="WEEKDAY">T2 - T6</Select.Option>
                        <Select.Option value="WEEKEND">T7 - CN</Select.Option>
                        <Select.Option value="ALL">Tất cả</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* Cột Loại (priceType) */}
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "priceType"]}
                      rules={[{ required: true, message: "Chọn Loại" }]}
                      className="mb-0"
                    >
                      <Select placeholder="Loại">
                        <Select.Option value="NORMAL">Thường</Select.Option>
                        <Select.Option value="HOLIDAY">Ngày Lễ</Select.Option>
                        <Select.Option value="EVENT">Sự kiện</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={7}>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item
                        {...restField}
                        name={[name, "startTime"]}
                        rules={[
                          { required: true, message: "Nhập giờ" },
                          { validator: timeValidator },
                        ]}
                        className="mb-0"
                      >
                        <TimePicker
                          format="HH:mm"
                          placeholder="Bắt đầu"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "endTime"]}
                        rules={[
                          { required: true, message: "Nhập giờ" },
                          { validator: timeValidator },
                        ]}
                        className="mb-0"
                      >
                        <TimePicker
                          format="HH:mm"
                          placeholder="Kết thúc"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Space.Compact>
                  </Col>

                  {/* Cột Giá tiền (pricePerHour) */}
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "pricePerHour"]}
                      rules={[{ required: true, message: "Nhập giá" }]}
                      className="mb-0"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        placeholder="Giá tiền"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={2} className="text-center">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      disabled={fields.length === 1}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                className="mt-2"
              >
                Thêm khung giờ
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
