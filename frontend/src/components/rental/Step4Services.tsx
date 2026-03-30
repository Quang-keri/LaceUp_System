import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Switch,
  InputNumber,
  Select,
  Upload,
  Card,
  Row,
  Col,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

export default function Step4Services({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();
  const [setupLater, setSetupLater] = useState(
    formData.extraServices?.setupLater || false,
  );
  const [itemGroups, setItemGroups] = useState<any[]>([]);

  // Đồng bộ data từ context khi quay lại step
  useEffect(() => {
    form.setFieldsValue({ services: formData.extraServices?.services || [] });
  }, [formData.extraServices, form]);

  // Call API lấy danh mục nhóm hàng hóa
  useEffect(() => {
    const fetchItemGroups = async () => {
      try {
        // Thay bằng API thực tế của bạn: await itemGroupService.getAll()
        const mockData = [
          { id: "FOOD", name: "Đồ ăn / Thức uống" },
          { id: "EQUIPMENT", name: "Thiết bị thuê (Vợt, Bóng...)" },
          { id: "SERVICE", name: "Dịch vụ khác (Trọng tài, Nhặt bóng...)" },
        ];
        setItemGroups(mockData);
      } catch (error) {
        console.error("Lỗi lấy danh mục nhóm hàng hóa:", error);
      }
    };
    fetchItemGroups();
  }, []);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const saveData = () => {
    const values = form.getFieldsValue();
    updateFormData("extraServices", { setupLater, services: values.services });
  };

  const onFinish = () => {
    saveData();
    next();
  };

  const handlePrev = () => {
    saveData();
    prev();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <span>Tôi sẽ thiết lập dịch vụ sau:</span>
        <Switch
          checked={setupLater}
          onChange={(checked) => setSetupLater(checked)}
        />
      </Space>

      {!setupLater && (
        <Form.List name="services">
          {(fields, { add, remove }) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {fields.map((field) => (
                <Card
                  key={field.key}
                  size="small"
                  extra={
                    <MinusCircleOutlined
                      onClick={() => remove(field.name)}
                      style={{ color: "red" }}
                    />
                  }
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, "itemGroupId"]}
                        label="Nhóm hàng/Dịch vụ"
                      >
                        <Select placeholder="Chọn nhóm">
                          {itemGroups.map((group) => (
                            <Select.Option key={group.id} value={group.id}>
                              {group.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, "serviceName"]}
                        label="Tên dịch vụ/Sản phẩm"
                      >
                        <Input placeholder="VD: Thuê vợt tennis, Nước suối..." />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, "quantity"]}
                        label="Số lượng"
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          min={0}
                          placeholder="VD: 10"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, "rentalDuration"]}
                        label="Thời gian thuê"
                      >
                        <Input placeholder="VD: 1 tiếng, Cả trận..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "price_sell"]}
                        label="Giá bán (VND)"
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "price_original"]}
                        label="Giá vốn (VND)"
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
                      <Form.Item
                        {...field}
                        name={[field.name, "serviceNote"]}
                        label="Ghi chú"
                      >
                        <Input placeholder="Ghi chú thêm..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    {...field}
                    name={[field.name, "images"]}
                    label="Hình ảnh minh họa (Tối đa 2 ảnh)"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                  >
                    <Upload
                      listType="picture-card"
                      maxCount={2}
                      multiple
                      beforeUpload={() => false}
                    >
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Tải ảnh</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Thêm dịch vụ / Hàng hóa
              </Button>
            </div>
          )}
        </Form.List>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Button onClick={handlePrev}>Quay lại</Button>
        <Button type="primary" htmlType="submit" style={{
            background: "#9156F1",
            borderColor: "#9156F1",
          }}>
          Tiếp tục
        </Button>
      </div>
    </Form>
  );
}
