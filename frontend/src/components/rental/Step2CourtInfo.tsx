import React from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  Switch,
  InputNumber,
  TimePicker,
  Upload,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

export default function Step2CourtInfo({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    updateFormData("courts", values.courts);
    next();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ courts: formData.courts }}
      onFinish={onFinish}
    >
      <Form.List name="courts">
        {(fields, { add, remove }) => (
          <div style={{ display: "flex", rowGap: 16, flexDirection: "column" }}>
            {fields.map((field) => (
              <Card
                size="small"
                title={`Loại Sân ${field.name + 1}`}
                key={field.key}
                extra={
                  <MinusCircleOutlined
                    onClick={() => remove(field.name)}
                    style={{ color: "red" }}
                  />
                }
              >
                <Space
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...field}
                    name={[field.name, "courtName"]}
                    label="Tên loại sân (VD: Sân cỏ 5 người)"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Tên loại sân" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "surfaceType"]}
                    label="Loại mặt sân"
                  >
                    <Select placeholder="Chọn mặt sân" style={{ width: 150 }}>
                      <Select.Option value="Cỏ nhân tạo">
                        Cỏ nhân tạo
                      </Select.Option>
                      <Select.Option value="Đất nện">Đất nện</Select.Option>
                      <Select.Option value="Sàn gỗ">Sàn gỗ</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "indoor"]}
                    label="Trong nhà?"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Space>

                <Form.Item
                  {...field}
                  name={[field.name, "amenities"]}
                  label="Tiện ích sân"
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn tiện ích (Trà đá, Wifi, Bóng...)"
                  >
                    <Select.Option value="wifi">Wifi miễn phí</Select.Option>
                    <Select.Option value="water">Trà đá</Select.Option>
                    <Select.Option value="ball">Bóng thi đấu</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item {...field} label="Ảnh sân chi tiết (2-6 ảnh)">
                  <Upload maxCount={6} listType="picture" multiple>
                    <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                  </Upload>
                </Form.Item>

                {/* Nested Form: Giá động theo giờ */}
                <Form.List name={[field.name, "prices"]}>
                  {(priceFields, { add: addPrice, remove: removePrice }) => (
                    <div
                      style={{
                        background: "#f5f5f5",
                        padding: 16,
                        borderRadius: 8,
                      }}
                    >
                      <p style={{ fontWeight: "bold" }}>
                        Cài đặt giá động theo giờ
                      </p>
                      {priceFields.map((priceField) => (
                        <Space key={priceField.key} align="baseline">
                          <Form.Item
                            {...priceField}
                            name={[priceField.name, "timeRange"]}
                            label="Khung giờ"
                            rules={[{ required: true }]}
                          >
                            <TimePicker.RangePicker format="HH:mm" />
                          </Form.Item>
                          <Form.Item
                            {...priceField}
                            name={[priceField.name, "pricePerHour"]}
                            label="Giá/Giờ (VNĐ)"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              style={{ width: 150 }}
                              formatter={(value) =>
                                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                            />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => removePrice(priceField.name)}
                            style={{ color: "red" }}
                          />
                        </Space>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => addPrice()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Thêm khung giá
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
            >
              Thêm Loại Sân
            </Button>
          </div>
        )}
      </Form.List>
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Button onClick={prev}>Quay lại</Button>
        <Button type="primary" htmlType="submit">
          Tiếp tục
        </Button>
      </div>
    </Form>
  );
}
