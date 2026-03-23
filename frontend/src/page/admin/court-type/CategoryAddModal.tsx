import React from "react";
import { Modal, Form, Input, Row, Col } from "antd";

interface Props {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const CategoryAddModal: React.FC<Props> = ({
  open,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Thêm mới loại sân"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={600}
      okText="Thêm mới"
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

export default CategoryAddModal;
