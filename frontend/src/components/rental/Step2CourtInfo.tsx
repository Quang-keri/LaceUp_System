import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Space, Select, Switch, Upload } from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";
import amenityService from "../../service/amenityService";
import categoryService from "../../service/categoryService";

export default function Step2CourtInfo({
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);

  // Bắt buộc: Đồng bộ dữ liệu từ Context vào Form khi quay lại bước này
  useEffect(() => {
    form.setFieldsValue({ courts: formData.courts });
  }, [formData.courts, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, ameRes] = await Promise.all([
          categoryService.getAllCategories(),
          amenityService.getAllAmenities(),
        ]);
        setCategories(catRes.result.data);
        setAmenities(ameRes.result);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  // Hàm chuẩn hóa fileList cho Ant Design Upload
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // Hàm xử lý lưu dữ liệu chung cho cả Next và Prev
  const saveData = () => {
    const values = form.getFieldsValue();
    const mergedCourts = (values.courts || []).map(
      (court: any, index: number) => {
        const existing = formData.courts?.[index] || {};
        // Merge: Giữ lại các field cũ (prices, courtCopies) và ghi đè field mới từ form (bao gồm cả courtImages)
        return { ...existing, ...court };
      },
    );
    updateFormData("courts", mergedCourts);
  };

  const onFinish = () => {
    saveData();
    next();
  };

  const handlePrev = () => {
    saveData();
    prev();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      <Form.List name="courts">
        {(fields, { add, remove }) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {fields.map((field) => (
              <Card
                key={field.key}
                title={
                  <span style={{ color: "#1890ff" }}>
                    Loại sân #{field.name + 1}
                  </span>
                }
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(field.name)}
                  />
                }
                style={{ border: "1px solid #d9d9d9" }}
              >
                <Space wrap size="large" align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "courtName"]}
                    label="Tên loại sân"
                    rules={[{ required: true, message: "Nhập tên loại sân" }]}
                  >
                    <Input
                      placeholder="VD: Sân Tennis chuẩn ATP"
                      style={{ width: 250 }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    name={[field.name, "categoryId"]}
                    label="Môn thể thao"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Chọn môn" style={{ width: 150 }}>
                      {categories.map((c: any) => (
                        <Select.Option key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...field}
                    name={[field.name, "surfaceType"]}
                    label="Mặt sân"
                  >
                    <Input
                      placeholder="VD: thảm pvc, cỏ nhân tạo..."
                      style={{ width: 250 }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    name={[field.name, "indoor"]}
                    label="Trong nhà?"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                </Space>

                <Form.Item
                  {...field}
                  name={[field.name, "amenityIds"]}
                  label="Tiện ích"
                >
                  <Select mode="multiple" placeholder="Chọn tiện ích">
                    {amenities.map((a: any) => (
                      <Select.Option key={a.amenityId} value={a.amenityId}>
                        {a.amenityName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* UPLOAD TỪNG LOẠI SÂN: Đã cấu hình lấy fileList */}
                <Form.Item
                  {...field}
                  name={[field.name, "courtImages"]}
                  label="Hình ảnh thực tế (Tối đa 5 ảnh)"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={5}
                    multiple
                    beforeUpload={() => false}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải ảnh</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Card>
            ))}
            <Button
              type="primary"
              ghost
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
              size="large"
            >
              THÊM LOẠI SÂN MỚI
            </Button>
          </div>
        )}
      </Form.List>

      <div
        style={{
          marginTop: 32,
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
        }}
      >
        <Button onClick={handlePrev} size="large">
          Quay lại
        </Button>
        <Button type="primary" htmlType="submit" size="large">
          Tiếp tục
        </Button>
      </div>
    </Form>
  );
}
