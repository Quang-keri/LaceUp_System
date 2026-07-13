import { useEffect } from "react";
import { Form, Input, Button, Upload, Card, Row, Col } from "antd";
import {
  UploadOutlined,
  LeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

interface Step5Props {
  prev: () => void;
  submit: (finalLegalData: any) => void;
  loading?: boolean;
}

export default function Step6Legal({
  prev,
  submit,
  loading = false,
}: Step5Props) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  useEffect(() => {
    if (formData.legalInfo) {
      form.setFieldsValue(formData.legalInfo);
    }
  }, [formData.legalInfo, form]);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = (values: any) => {
    updateFormData("legalInfo", values);
    submit(values);
  };

  const handlePrev = () => {
    const currentValues = form.getFieldsValue();
    updateFormData("legalInfo", currentValues);
    prev();
  };

  return (
    <Card title="Thông tin pháp lý & Hoàn tất" bordered={false}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={formData.legalInfo}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="companyName"
              label="Tên công ty/Cơ sở kinh doanh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên công ty/cơ sở kinh doanh",
                },
              ]}
            >
              <Input
                placeholder="Nhập tên công ty hoặc cơ sở kinh doanh"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="responsiblePersonName"
              label="Tên người đại diện pháp luật"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên người đại diện pháp luật",
                },
              ]}
            >
              <Input
                placeholder="Nhập tên người chịu trách nhiệm pháp lý"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="address"
              label="Địa chỉ đăng ký kinh doanh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập địa chỉ đăng ký kinh doanh",
                },
              ]}
            >
              <Input
                placeholder="Nhập địa chỉ ghi trên giấy phép"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="businessLicense"
              label="Số giấy phép kinh doanh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số giấy phép kinh doanh",
                },
              ]}
            >
              <Input placeholder="Nhập số giấy phép kinh doanh" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="taxCode"
              label="Mã số thuế doanh nghiệp"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mã số thuế doanh nghiệp",
                },
              ]}
            >
              <Input placeholder="Nhập mã số thuế" size="large" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="legalNote"
              label="Ghi chú pháp lý hoặc nội quy khu vực (Tùy chọn)"
            >
              <Input.TextArea
                rows={4}
                placeholder="Ví dụ: Giấy phép đang trong quá trình gia hạn, hoặc các quy định riêng của sân..."
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="legalImages"
              label="Hình ảnh giấy tờ pháp lý (Tối đa 3 ảnh)"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[
                {
                  required: true,
                  message: "Vui lòng tải lên hình ảnh giấy tờ pháp lý",
                },
              ]}
            >
              <Upload
                listType="picture-card"
                maxCount={3}
                multiple
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                </div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Button
            onClick={handlePrev}
            icon={<LeftOutlined />}
            size="large"
            disabled={loading}
            style={{ width: "150px" }}
          >
            Quay lại
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<CheckCircleOutlined />}
            size="large"
            loading={loading}
            style={{ background: "#9156F1", borderColor: "#9156F1" }}
          >
            {loading
              ? "Đang xử lý vui lòng đợi 30 giây..."
              : "Hoàn tất & Tạo khu vực"}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
