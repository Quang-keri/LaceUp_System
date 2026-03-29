import React from "react";
import { Form, Input, Button, Card, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

export default function Step3CourtCopy({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  // Khởi tạo data courtCopies dựa trên số lượng loại sân đã tạo
  const initialCopies = formData.courts?.map((court: any) => ({
    courtTypeName: court?.courtName || "Loại sân chưa đặt tên",
    copies: [],
  }));

  const onFinish = (values: any) => {
    updateFormData("courtCopies", values.courtCopies);
    next();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        courtCopies: formData.courtCopies?.length
          ? formData.courtCopies
          : initialCopies,
      }}
      onFinish={onFinish}
    >
      <Form.List name="courtCopies">
        {(fields) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map((field, index) => (
              <Card
                key={field.key}
                title={`Nhập mã cho: ${form.getFieldValue([
                  "courtCopies",
                  index,
                  "courtTypeName",
                ])}`}
              >
                <Form.List name={[field.name, "copies"]}>
                  {(copyFields, { add, remove }) => (
                    <>
                      {copyFields.map((copyField) => (
                        <Space key={copyField.key} align="baseline">
                          <Form.Item
                            {...copyField}
                            name={[copyField.name, "courtCode"]}
                            label="Mã sân (VD: Sân 1, Tầng 2-A)"
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="Nhập mã sân thực tế" />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => remove(copyField.name)}
                            style={{ color: "red" }}
                          />
                        </Space>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                      >
                        Thêm mã sân
                      </Button>
                    </>
                  )}
                </Form.List>
              </Card>
            ))}
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
