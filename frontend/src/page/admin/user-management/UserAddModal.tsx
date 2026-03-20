import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const UserAddModal: React.FC<Props> = ({
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

  const formatDateInput = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // bỏ ký tự không phải số
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);

    if (!match) return value;

    let result = match[1];
    if (match[2]) result += "/" + match[2];
    if (match[3]) result += "/" + match[3];

    return result;
  };

  return (
    <Modal
      title="Thêm mới người dùng"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      okText="Thêm mới"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không đúng định dạng" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="example@gmail.com"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="userName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Nhập họ và tên"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                {
                  pattern: /^[0-9]+$/,
                  message: "Số điện thoại chỉ được chứa chữ số",
                },
                { min: 10, message: "Số điện thoại không hợp lệ" },
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="Nhập số điện thoại"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Divider style={{ margin: "12px 0" }} />
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vai trò"
              name="roleName"
              rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
            >
              <Select placeholder="Chọn vai trò">
                <Select.Option value="ADMIN">Quản trị viên</Select.Option>
                <Select.Option value="OWNER">Chủ Sân</Select.Option>
                <Select.Option value="STAFF">Nhân viên</Select.Option>
                <Select.Option value="RENTER">Khách thuê</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
            >
              <Select placeholder="Chọn giới tính">
                <Select.Option value="MALE">Nam</Select.Option>
                <Select.Option value="FEMALE">Nữ</Select.Option>
                <Select.Option value="OTHER">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Ngày sinh"
              name="dateOfBirth"
              rules={[
                { required: true, message: "Vui lòng chọn ngày sinh" },
                {
                  validator: (_, value) => {
                    if (value && value.isAfter(dayjs().subtract(10, "year"))) {
                      return Promise.reject(
                        new Error("Người dùng phải từ 10 tuổi trở lên"),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                onKeyDown={(e: any) => {
                  const input = e.target;
                  const value = input.value;
                  const key = e.key;

                  // 1. Cho phép các phím điều hướng và xóa hoạt động bình thường
                  if (
                    [
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                    ].includes(key)
                  ) {
                    return;
                  }

                  // 2. Chặn nếu không phải là số hoặc đã đủ 10 ký tự
                  if (!/^[0-9]$/.test(key) || value.length >= 10) {
                    e.preventDefault();
                    return;
                  }

                  // 3. Logic tự thêm số 0 và dấu /
                  // Xử lý Ngày (DD) - Nếu gõ 4-9 thì tự thành 04, 05...
                  if (value.length === 0 && parseInt(key) > 3) {
                    input.value = "0" + key + "/";
                    input.setSelectionRange(
                      input.value.length,
                      input.value.length,
                    );
                    e.preventDefault();
                  }
                  // Tự thêm / sau khi gõ xong 2 số ngày
                  // Nếu tháng bắt đầu từ 3 trở đi thì tự thêm số 0 và / luôn
                  else if (value.length === 2) {
                    if (parseInt(key) >= 3) {
                      input.value = value + "/0" + key + "/";
                    } else {
                      input.value = value + "/" + key;
                    }
                    input.setSelectionRange(
                      input.value.length,
                      input.value.length,
                    );
                    e.preventDefault();
                  }
                  // Xử lý Tháng (MM) - Nếu gõ 3-9 ở vị trí tháng thì tự thành 03, 04...
                  else if (value.length === 3 && parseInt(key) >= 3) {
                    input.value = value + "0" + key + "/";
                    input.setSelectionRange(
                      input.value.length,
                      input.value.length,
                    );
                    e.preventDefault();
                  }
                  // Tự thêm / sau khi gõ xong 2 số tháng
                  else if (value.length === 5) {
                    input.value = value + "/" + key;
                    input.setSelectionRange(
                      input.value.length,
                      input.value.length,
                    );
                    e.preventDefault();
                  }
                }}
                onChange={(date) => {
                  form.setFieldsValue({ dateOfBirth: date });
                }}
                disabledDate={(current) => {
                  // Chặn các ngày sau thời điểm (Hiện tại - 10 năm)
                  // Tức là người dùng phải sinh từ năm 2016 trở về trước (nếu hiện tại là 2026)
                  return (
                    current &&
                    current > dayjs().subtract(10, "year").endOf("day")
                  );
                }}
                // Mẹo: Đặt giá trị mặc định khi mở lịch là 10 năm trước để user đỡ phải back nhiều
                defaultPickerValue={dayjs().subtract(10, "year")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserAddModal;
