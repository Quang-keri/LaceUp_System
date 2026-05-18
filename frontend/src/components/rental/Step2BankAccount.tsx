import React, { useEffect } from "react";
import { Form, Input, Button, Card, Row, Col, Select, Avatar } from "antd";
import { BankOutlined, LeftOutlined } from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";
import { BANKS, type Bank } from "../../utils/banks";
import bankAccountService from "../../service/bankAccountService";
export default function Step2BankAccount({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  const banks = BANKS;
  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    try {
      const response = await bankAccountService.getMyBankAccount();

      const bankAccount = response?.result;

      if (!bankAccount) return;

      const selectedBank = banks.find(
        (bank) =>
          bank.shortName === bankAccount.bankName ||
          bank.name === bankAccount.bankName,
      );

      const values = {
        bankName: selectedBank?.shortName || bankAccount.bankName,
        bankFullName: selectedBank?.name || bankAccount.bankName,
        bankCode: selectedBank?.code,
        bankBin: selectedBank?.bin,
        bankLogo: selectedBank?.logo,

        accountNumber: bankAccount.accountNumber,
        accountHolderName: bankAccount.accountHolderName,
        branchName: bankAccount.branchName,
      };

      form.setFieldsValue(values);

      updateFormData("bankAccount", values);
    } catch (error) {
      console.log("Chưa có tài khoản ngân hàng", error);
    }
  };

  const handleBankChange = (value?: string) => {
    if (!value) {
      form.setFieldsValue({
        bankName: undefined,
        bankFullName: undefined,
        bankCode: undefined,
        bankBin: undefined,
        bankLogo: undefined,
      });
      return;
    }

    const selectedBank = banks.find((bank) => bank.shortName === value);

    form.setFieldsValue({
      bankName: selectedBank?.shortName,
      bankFullName: selectedBank?.name,
      bankCode: selectedBank?.code,
      bankBin: selectedBank?.bin,
      bankLogo: selectedBank?.logo,
    });
  };

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
                { required: true, message: "Vui lòng chọn tên ngân hàng" },
              ]}
            >
              <Select
                showSearch
                allowClear
                size="large"
                placeholder="Chọn ngân hàng"
                optionFilterProp="label"
                onChange={handleBankChange}
                options={banks.map((bank) => ({
                  label: `${bank.shortName} - ${bank.name}`,
                  value: bank.shortName,
                  bank,
                }))}
                optionRender={(option) => {
                  const bank = option.data.bank as Bank;

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Avatar src={bank.logo} size={28} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{bank.shortName}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {bank.name}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </Form.Item>

            <Form.Item name="bankFullName" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="bankCode" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="bankBin" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="bankLogo" hidden>
              <Input />
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
