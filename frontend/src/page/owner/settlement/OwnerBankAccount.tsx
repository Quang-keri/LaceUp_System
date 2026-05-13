import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { financeService } from "../../../service/financeService";

const { Title } = Typography;

const OwnerBankAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchBankAccount = async () => {
    try {
      setLoading(true);
      const result = await financeService.getOwnerBankAccount();

      if (result) {
        form.setFieldsValue(result);
      }
    } catch {
      // owner chưa có bank account thì bỏ qua
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await financeService.saveOwnerBankAccount(values);
      message.success("Đã lưu tài khoản ngân hàng");
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi lưu tài khoản ngân hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 700 }}>
      <Title level={4}>Tài khoản ngân hàng nhận tiền</Title>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Tên ngân hàng"
          name="bankName"
          rules={[{ required: true, message: "Vui lòng nhập tên ngân hàng" }]}
        >
          <Input placeholder="VD: MB Bank, Vietcombank..." />
        </Form.Item>

        <Form.Item
          label="Số tài khoản"
          name="accountNumber"
          rules={[{ required: true, message: "Vui lòng nhập số tài khoản" }]}
        >
          <Input placeholder="Nhập số tài khoản" />
        </Form.Item>

        <Form.Item
          label="Tên chủ tài khoản"
          name="accountHolderName"
          rules={[
            { required: true, message: "Vui lòng nhập tên chủ tài khoản" },
          ]}
        >
          <Input placeholder="VD: NGUYEN VAN A" />
        </Form.Item>

        <Form.Item label="Chi nhánh" name="branchName">
          <Input placeholder="Có thể bỏ trống" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu tài khoản
        </Button>
      </Form>
    </Card>
  );
};

export default OwnerBankAccount;
