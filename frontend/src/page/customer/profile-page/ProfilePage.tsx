import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Menu,
  Form,
  Input,
  Button,
  Checkbox,
  List,
  Tag,
  Typography,
  Divider,
  Space,
  Spin,
  message,
  Select,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import userService from "../../../service/userService.ts";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

const ProfilePage: React.FC = () => {
  const { user, logout, isLoading, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
      console.error(error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật",
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
    if (key === "2") {
      navigate("/my-matches");
    } else if (key === "3") {
      navigate("/booking-history");
    } else if (key === "1") {
      // Stay on profile page
    } else if (key === "4") {
      // Navigate to settings
      message.info("Cài đặt chưa được phát triển");
    } else if (key === "5") {
      // Navigate to security
      message.info("Bảo mật tài khoản chưa được phát triển");
    } else if (key === "6") {
      // Navigate to linked accounts
      message.info("Liên kết tài khoản chưa được phát triển");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Menu Sidebar Trái
  const menuItems = [
    { key: "1", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "2", icon: <HistoryOutlined />, label: "Trận đấu của tôi" },
    {
      key: "3",
      icon: <HistoryOutlined />,
      label: "Lịch sử đặt sân",
    },
    { key: "4", icon: <SettingOutlined />, label: "Cài đặt" },
    {
      key: "5",
      icon: <SafetyCertificateOutlined />,
      label: "Bảo mật tài khoản",
    },
    { key: "6", icon: <LinkOutlined />, label: "Liên kết tài khoản" },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Dữ liệu hoạt động gần đây
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
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        {/* Cột 1: Sidebar Menu */}
        <Col xs={24} md={8} lg={6}>
          <Card
            style={{ borderRadius: "12px", textAlign: "center" }}
            bordered={false}
          >
            {/*<Avatar*/}
            {/*    size={80}*/}
            {/*    src={user?.avatar}*/}
            {/*    style={{ backgroundColor: '#e6f4ff', color: '#1677ff', fontSize: '32px', marginBottom: '16px' }}*/}
            {/*>*/}
            {/*    /!* Nếu không có avatar thì hiện chữ cái đầu của tên *!/*/}
            {/*    {user?.userName}*/}
            {/*</Avatar>*/}
            <Title level={4} style={{ margin: 0 }}>
              {user ? `${user.userName}` : "N/A"}
            </Title>
            <Text type="secondary">Thành viên thân thiết</Text>

            {/* HIỂN THỊ ĐIỂM RANK Ở ĐÂY */}
            {user?.rankPoint !== undefined && (
              <div style={{ marginTop: "12px" }}>
                <Tag
                  color="gold"
                  style={{
                    padding: "4px 16px",
                    fontSize: "14px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    border: "1px solid #ffe58f",
                  }}
                >
                  🏆 Điểm Rank: {user.rankPoint}
                </Tag>
              </div>
            )}

            <Divider style={{ margin: "16px 0" }} />

            <Menu
              mode="inline"
              selectedKeys={[selectedMenu]}
              items={menuItems}
              onClick={(e) => handleMenuClick(e.key)}
              style={{ borderRight: "none", textAlign: "left" }}
            />
          </Card>
        </Col>

        {/* Cột 2: Form Thông tin cá nhân */}
        <Col xs={24} md={16} lg={12}>
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

              {/* THÊM GIỚI TÍNH VÀ TUỔI */}
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
                    user?.age !== undefined && user.age > 0
                      ? `${user.age} tuổi`
                      : "Chưa cập nhật"
                  }
                  disabled={true}
                />
              </Form.Item>

              {/* Section checkbox giữ nguyên logic của bạn */}
              <Form.Item label="Môn thể thao" name="sports">
                <Checkbox.Group>
                  <Space direction="horizontal" wrap>
                    <Checkbox value="football">Bóng đá</Checkbox>
                    <Checkbox value="badminton">Cầu lông</Checkbox>
                    {/* ... */}
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
                        form.resetFields();
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

        {/* Cột 3: Thống kê & Hoạt động */}
        <Col xs={24} md={24} lg={6}>
          {/* Card Thể thao */}
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

          {/* Card Hoạt động gần đây */}
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
                    title={item.sport + " - " + item.location}
                    description={
                      <Space>
                        <Text type="secondary">{item.date}</Text>
                        <Tag
                          color={item.status === "confirmed" ? "green" : "red"}
                        >
                          {item.status === "confirmed"
                            ? "Đã xác nhận"
                            : "Đã hủy"}
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
    </div>
  );
};

export default ProfilePage;
