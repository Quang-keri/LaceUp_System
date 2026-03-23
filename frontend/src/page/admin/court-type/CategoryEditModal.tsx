import React, { useEffect } from "react";
import { Modal, Form, Input, Row, Col } from "antd";
import type { CategoryResponse } from "../../../types/category";

interface Props {
  open: boolean;
  loading: boolean;
  category: CategoryResponse | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const CategoryEditModal: React.FC<Props> = ({
  open,
  loading,
  category,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && category) {
      form.setFieldsValue({
        categoryName: category.categoryName,
        description: category.description,
      });
    }
  }, [open, category, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Chỉnh sửa loại sân"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={600}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Tên loại sân"
              name="categoryName"
              rules={[
                { required: true, message: "Vui lòng nhập tên loại sân" },
                { min: 2, message: "Tên loại sân phải ít nhất 2 ký tự" },
              ]}
            >
              <Input
                placeholder="Ví dụ: Sân 5 người, Sân 7 người, Cầu lông..."
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Mô tả (Tùy chọn)" name="description">
              <Input.TextArea
                placeholder="Nhập mô tả chi tiết về loại sân"
                rows={4}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CategoryEditModal;
