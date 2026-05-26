import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Typography, message, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { financeService } from "../../../service/financeService";

const { Title } = Typography;

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const OwnerBankAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchBankAccount = async () => {
    try {
      setLoading(true);
      const result = await financeService.getOwnerBankAccount();

      if (result) {
        const bankData = result?.result || result;

        form.setFieldsValue({
          ...bankData,
          qrCodeFile: bankData.qrCode
            ? [
                {
                  uid: "-1",
                  name: "qr-code.png",
                  status: "done",
                  url: bankData.qrCode,
                },
              ]
            : undefined,
        });
      }
    } catch {
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

      const qrFile = values.qrCodeFile?.[0]?.originFileObj;

      const requestJson = {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolderName: values.accountHolderName,
        branchName: values.branchName || "",
        qrCode: values.qrCodeFile?.[0]?.url || "",
      };

      await financeService.saveOwnerBankAccount(requestJson, qrFile);
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
    <Card
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        height: "100%",
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
          rules={[{ required: true, message: "Vui lòng nhập tên ngân hàng" }]}
        >
          <Input
            placeholder="VD: MB Bank, Vietcombank, Techcombank..."
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Số tài khoản"
          name="accountNumber"
          rules={[{ required: true, message: "Vui lòng nhập số tài khoản" }]}
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
          label="Ảnh mã QR (Tùy chọn)"
          name="qrCodeFile"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            accept="image/*"
            beforeUpload={() => false}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
            </div>
          </Upload>
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
              border: "none",
            }}
          >
            Lưu tài khoản
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OwnerBankAccount;
