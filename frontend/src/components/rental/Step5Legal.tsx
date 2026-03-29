import React from "react";
import { Form, Input, Button } from "antd";
import { useRentalForm } from "../../context/RentalFormContext";

export default function Step5Legal({
  prev,
  submit,
}: {
  prev: () => void;
  submit: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    // Lưu step cuối vào context trước khi submit tổng
    updateFormData("legalInfo", values);
    // Gọi hàm submit truyền từ component cha (FormContainer)
    submit();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={formData.legalInfo}
      onFinish={onFinish}
    >
      <Form.Item
        name="businessLicense"
        label="Số giấy phép kinh doanh (Tùy chọn)"
      >
        <Input placeholder="Nhập số giấy phép kinh doanh" />
      </Form.Item>
      <Form.Item name="taxCode" label="Mã số thuế doanh nghiệp (Tùy chọn)">
        <Input placeholder="Nhập mã số thuế" />
      </Form.Item>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Button onClick={prev}>Quay lại</Button>
        <Button
          type="primary"
          htmlType="submit"
          style={{ background: "#52c41a" }}
        >
          Hoàn tất & Tạo khu vực
        </Button>
      </div>
    </Form>
  );
}
