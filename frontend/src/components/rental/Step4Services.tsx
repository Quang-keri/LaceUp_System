import React, { useState } from "react";
import { Form, Input, Button, Space, Switch, InputNumber } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
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

  const onFinish = (values: any) => {
    updateFormData("extraServices", { setupLater, services: values.services });
    next();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ services: formData.extraServices?.services || [] }}
      onFinish={onFinish}
    >
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
            <>
              {fields.map((field) => (
                <Space
                  key={field.key}
                  align="baseline"
                  style={{ display: "flex", marginBottom: 8 }}
                >
                  <Form.Item
                    {...field}
                    name={[field.name, "serviceName"]}
                    label="Tên dịch vụ"
                  >
                    <Input placeholder="VD: Thuê vợt tennis" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "price"]}
                    label="Giá dịch vụ"
                  >
                    <InputNumber
                      style={{ width: 150 }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                  <MinusCircleOutlined
                    onClick={() => remove(field.name)}
                    style={{ color: "red" }}
                  />
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Thêm dịch vụ
              </Button>
            </>
          )}
        </Form.List>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Button onClick={prev}>Quay lại</Button>
        <Button type="primary" htmlType="submit">
          Tiếp tục
        </Button>
      </div>
    </Form>
  );
}
