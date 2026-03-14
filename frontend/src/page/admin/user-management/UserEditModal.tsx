import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Row, Col } from "antd";
import dayjs from "dayjs";
import type { UserResponse } from "../../../types/user.ts";

interface Props {
  open: boolean;
  user: UserResponse | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const UserEditModal: React.FC<Props> = ({
  open,
  user,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        ...user,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
    }
  }, [user, open, form]);

  return (
    <Modal
      title="Chỉnh sửa người dùng"
      open={open}
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Họ và tên"
              name="userName"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giới tính" name="gender">
              <Select>
                <Select.Option value="MALE">Nam</Select.Option>
                <Select.Option value="FEMALE">Nữ</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserEditModal;
