import React from "react";
import { Form, Input, Button, Space, Upload } from "antd";
import { useRentalForm } from "../../context/RentalFormContext";
import { UploadOutlined } from "@ant-design/icons";

export default function Step1BasicInfo({ next }: { next: () => void }) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    updateFormData("basicInfo", values);
    next();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={formData.basicInfo}
      onFinish={onFinish}
    >
      <Form.Item
        name="rentalAreaName"
        label="Tên Tòa Nhà / Khu Vực"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="address" label="Địa chỉ">
        <Input />
      </Form.Item>

      <Space>
        <Form.Item name="" label="Giờ mở cửa">
          <Input />
        </Form.Item>
        <Form.Item name="" label="Giờ đóng cửa ">
          <Input />
        </Form.Item>
      </Space>

      <Space>
        <Form.Item name="contactName" label="Tên chủ hộ">
          <Input />
        </Form.Item>
        <Form.Item name="zalo" label="Zalo(số điện thoại)">
          <Input />
        </Form.Item>
        <Form.Item name="facebook" label="Link Facebook">
          <Input />
        </Form.Item>
       <Form.Item name="country" label="Quốc gia">
          <Input/>
       </Form.Item>
      </Space>
      <Form.Item label="Ảnh Tòa Nhà (1-2 ảnh)">
        <Upload maxCount={2} listType="picture">
          <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
        </Upload>
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Tiếp tục
      </Button>
    </Form>
  );
}
