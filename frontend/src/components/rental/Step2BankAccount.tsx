import React, { useEffect } from "react";
import { Form, Input, Button, Card, Row, Col } from "antd";
import { BankOutlined, LeftOutlined } from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

export default function Step2BankAccount({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(formData.bankAccount);
  }, [formData.bankAccount, form]);

  const onFinish = (values: any) => {
    updateFormData("bankAccount", values);
    next();
  };

  const handlePrev = () => {
    updateFormData("bankAccount", form.getFieldsValue());
    prev();
  };

  return (
    <Card title="Thông tin tài khoản ngân hàng" bordered={false}>
      <Form
        form={form}
        layout="vertical"
        initialValues={formData.bankAccount}
        onFinish={onFinish}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="bankName"
              label="Tên ngân hàng"
              rules={[
                { required: true, message: "Vui lòng nhập tên ngân hàng" },
              ]}
            >
              <Input size="large" placeholder="VD: Vietcombank, MB Bank..." />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="accountNumber"
              label="Số tài khoản"
              rules={[
                { required: true, message: "Vui lòng nhập số tài khoản" },
                {
                  pattern: /^[0-9]{6,30}$/,
                  message: "Số tài khoản không hợp lệ",
                },
              ]}
            >
              <Input size="large" placeholder="Nhập số tài khoản" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="accountHolderName"
              label="Tên chủ tài khoản"
              rules={[
                { required: true, message: "Vui lòng nhập tên chủ tài khoản" },
              ]}
            >
              <Input size="large" placeholder="VD: NGUYEN VAN A" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="branchName" label="Chi nhánh ngân hàng">
              <Input size="large" placeholder="VD: Chi nhánh TP.HCM" />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <Button onClick={handlePrev} icon={<LeftOutlined />} size="large">
            Quay lại
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<BankOutlined />}
            size="large"
            style={{ background: "#9156F1", borderColor: "#9156F1" }}
          >
            Tiếp tục
          </Button>
        </div>
      </Form>
    </Card>
  );
}
