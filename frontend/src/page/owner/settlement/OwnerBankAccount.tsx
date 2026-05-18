import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
  Row,
  Col,
  ConfigProvider,
} from "antd";
import { financeService } from "../../../service/financeService";
import UserSidebar from "../../../components/sidebar/UserSidebar"; // <-- Cập nhật lại đường dẫn đúng với dự án của bạn

const { Title } = Typography;

const OwnerBankAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchBankAccount = async () => {
    try {
      setLoading(true);
      const result = await financeService.getOwnerBankAccount();

      if (result) {
        form.setFieldsValue(result?.result || result);
      }
    } catch {
      // Owner chưa có bank account thì bỏ qua
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
      message.success("Đã lưu thông tin tài khoản ngân hàng");
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi lưu tài khoản ngân hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={8} lg={6}>
          <UserSidebar selectedKey="7" />
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            bordered={false}
          >
            <Title level={4} style={{ marginBottom: "24px", color: "#1e293b" }}>
              Tài khoản ngân hàng nhận tiền
            </Title>

            <Form
              form={form}
              layout="horizontal"
              onFinish={handleSubmit}
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
              labelAlign="left"
            >
              <Form.Item
                label="Tên ngân hàng"
                name="bankName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên ngân hàng" },
                ]}
              >
                <Input
                  placeholder="VD: MB Bank, Vietcombank, Techcombank..."
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Số tài khoản"
                name="accountNumber"
                rules={[
                  { required: true, message: "Vui lòng nhập số tài khoản" },
                ]}
              >
                <Input placeholder="Nhập số tài khoản" size="large" />
              </Form.Item>

              <Form.Item
                label="Tên chủ tài khoản"
                name="accountHolderName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên chủ tài khoản",
                  },
                ]}
              >
                <Input
                  placeholder="VD: NGUYEN VAN A"
                  size="large"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>

              <Form.Item label="Chi nhánh" name="branchName">
                <Input
                  placeholder="Tên chi nhánh ngân hàng (Có thể bỏ trống)"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                wrapperCol={{ offset: 7, span: 17 }}
                style={{ width: "100px", marginTop: "32px", marginBottom: 0 }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{
                    background: "#9156F1",
                    borderRadius: "6px",
                    minWidth: "150px",
                  }}
                >
                  Lưu tài khoản
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OwnerBankAccount;
