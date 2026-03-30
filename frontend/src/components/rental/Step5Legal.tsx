import React, { useEffect } from "react";
import { Form, Input, Button, Upload, Card } from "antd";
import {
  UploadOutlined,
  LeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

interface Step5Props {
  prev: () => void;
  // submit nhận dữ liệu mới nhất trực tiếp từ Form để tránh delay của Context
  submit: (finalLegalData: any) => void;
  loading?: boolean; // Hiệu ứng chờ khi đang gọi API ở trang cha
}

export default function Step5Legal({
  prev,
  submit,
  loading = false,
}: Step5Props) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  // 1. Đồng bộ dữ liệu từ Context vào Form khi khởi tạo (nếu có dữ liệu cũ)
  useEffect(() => {
    if (formData.legalInfo) {
      form.setFieldsValue(formData.legalInfo);
    }
  }, [formData.legalInfo, form]);

  // 2. Chuẩn hóa danh sách file cho Ant Design Upload
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // 3. Xử lý khi nhấn "Hoàn tất & Tạo khu vực"
  const onFinish = (values: any) => {
    // Lưu vào Context (để nếu API lỗi, quay lại vẫn còn dữ liệu)
    updateFormData("legalInfo", values);

    // Gửi TRỰC TIẾP 'values' lên hàm submit của cha
    // Đây là chìa khóa để giải quyết việc "ấn lần 2 mới lưu"
    submit(values);
  };

  // 4. Xử lý khi nhấn "Quay lại"
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
        <Form.Item
          name="businessLicense"
          label="Số giấy phép kinh doanh (Tùy chọn)"
        >
          <Input placeholder="Nhập số giấy phép kinh doanh" size="large" />
        </Form.Item>

        <Form.Item name="taxCode" label="Mã số thuế doanh nghiệp (Tùy chọn)">
          <Input placeholder="Nhập mã số thuế" size="large" />
        </Form.Item>

        <Form.Item
          name="legalNote"
          label="Ghi chú pháp lý hoặc nội quy khu vực (Tùy chọn)"
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Giấy phép đang trong quá trình gia hạn, hoặc các quy định riêng của sân..."
          />
        </Form.Item>

        <Form.Item
          name="legalImages"
          label="Hình ảnh giấy tờ pháp lý (Tối đa 3 ảnh)"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            listType="picture-card"
            maxCount={3}
            multiple
            beforeUpload={() => false} // Không tự động upload lên server ngay
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
            </div>
          </Upload>
        </Form.Item>

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
            disabled={loading} // Khóa nút khi đang gửi data
            style={{ width: "150px" }}
          >
            Quay lại
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<CheckCircleOutlined />}
            size="large"
            loading={loading} // Hiển thị vòng xoay loading
            style={{
              background: "#52c41a",
              borderColor: "#52c41a",
              flex: 1,
            }}
          >
            {loading ? "Đang xử lý..." : "Hoàn tất & Tạo khu vực"}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
