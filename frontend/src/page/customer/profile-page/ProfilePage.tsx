import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  List,
  Tag,
  Typography,
  Space,
  message,
  Select,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import userService from "../../../service/userService.ts";

const { Text } = Typography;
const { Option } = Select;

const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        userName: user.userName,
        email: user.email,
        phone: user.phone || "",
        dob: user.dateOfBirth || "",
        gender: user.gender || "",
      });
    }
  }, [user, form]);

  const handleSave = async (values: any) => {
    if (!user?.userId) return;
    setLoadingSave(true);
    try {
      await userService.updateUser(user.userId, {
        userName: values.userName,
        phone: values.phone,
        dateOfBirth: values.dob,
        gender: values.gender,
      });
      message.success("Cập nhật thông tin thành công!");
      await refreshProfile();
      setIsEditing(false);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật",
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const recentActivities = [
    {
      id: 1,
      sport: "Bóng đá",
      location: "Sân Chảo Lửa",
      date: "15 Thg 3",
      status: "confirmed",
    },
    {
      id: 2,
      sport: "Cầu lông",
      location: "Sân Kỳ Hòa",
      date: "10 Thg 3",
      status: "canceled",
    },
  ];

  return (
    <Row gutter={[24, 24]}>
      {/* KHỐI TRÁI CỦA NỘI DUNG CHÍNH (Form) */}
      <Col xs={24} lg={16}>
        <Card
          title={
            <span style={{ fontSize: "20px", fontWeight: 600 }}>
              Hồ sơ của tôi
            </span>
          }
          extra={
            !isEditing && (
              <Button type="primary" onClick={() => setIsEditing(true)}>
                Chỉnh sửa hồ sơ
              </Button>
            )
          }
          bordered={false}
          style={{ borderRadius: "12px", height: "100%" }}
        >
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={handleSave}
            disabled={!isEditing}
          >
            <Form.Item label="Tên" name="userName">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input size="large" disabled={true} />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Giới tính" name="gender">
              <Select size="large" placeholder="Chọn giới tính">
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
                <Option value="Other">Khác</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Ngày sinh" name="dob">
              <Input size="large" placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="Tuổi">
              <Input
                size="large"
                value={
                  user?.age && user.age > 0
                    ? `${user.age} tuổi`
                    : "Chưa cập nhật"
                }
                disabled={true}
              />
            </Form.Item>
            <Form.Item label="Môn thể thao" name="sports">
              <Checkbox.Group>
                <Space direction="horizontal" wrap>
                  <Checkbox value="football">Bóng đá</Checkbox>
                  <Checkbox value="badminton">Cầu lông</Checkbox>
                </Space>
              </Checkbox.Group>
            </Form.Item>
            {isEditing && (
              <Form.Item style={{ marginTop: "24px" }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loadingSave}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button
                    size="large"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) form.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            )}
          </Form>
        </Card>
      </Col>

      {/* KHỐI PHẢI CỦA NỘI DUNG CHÍNH (Thống kê) */}
      <Col xs={24} lg={8}>
        <Card
          title="Các môn đang chơi"
          bordered={false}
          style={{ borderRadius: "12px", marginBottom: "24px" }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div
                style={{
                  textAlign: "center",
                  padding: "12px",
                  background: "#f0f2f5",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "24px" }}>⚽</div>
                <Text strong>12</Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Trận bóng
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div
                style={{
                  textAlign: "center",
                  padding: "12px",
                  background: "#fff1f0",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "24px" }}>🏸</div>
                <Text strong>4</Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Trận cầu
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          title="Hoạt động gần đây"
          bordered={false}
          style={{ borderRadius: "12px" }}
        >
          <List
            itemLayout="horizontal"
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.status === "confirmed" ? (
                      <CheckCircleOutlined
                        style={{
                          color: "#52c41a",
                          fontSize: "20px",
                          marginTop: "4px",
                        }}
                      />
                    ) : (
                      <CloseCircleOutlined
                        style={{
                          color: "#ff4d4f",
                          fontSize: "20px",
                          marginTop: "4px",
                        }}
                      />
                    )
                  }
                  title={`${item.sport} - ${item.location}`}
                  description={
                    <Space>
                      <Text type="secondary">{item.date}</Text>
                      <Tag
                        color={item.status === "confirmed" ? "green" : "red"}
                      >
                        {item.status === "confirmed" ? "Đã xác nhận" : "Đã hủy"}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProfilePage;
