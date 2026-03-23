import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Space,
  Button,
  message,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  WalletOutlined,
  SettingOutlined,
  LoginOutlined,
  HomeOutlined,
  CalendarOutlined,
  ReadOutlined,
  FireFilled,
  MessageOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const { Header } = Layout;

const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("accessToken"));

  useEffect(() => {
    setToken(localStorage.getItem("accessToken"));
  }, [location]);

  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    message.success("Đã đăng xuất thành công!"); // Dùng message của antd thay vì alert cho đẹp
    navigate("/");
  };

  // Menu chính giữa
  const navItems = [
    { key: "/", label: "Trang chủ" },
    { key: "/danh-sach-san", label: "Sân" },
    { key: "/cong-dong", label: "Cộng đồng" },
    { key: "/tin-tuc", label: "Tin tức" },
    { key: "/ve-chung-toi", label: "Về chúng tôi" },
  ];

  // Menu cho Avatar (Dropdown)
  const userMenuItems = isLoggedIn
    ? [
        {
          key: "/profile",
          label: "Quản lý cá nhân",
          icon: <SettingOutlined />,
          onClick: () => navigate("/profile"),
        },
        {
          key: "/booking-history",
          label: "Lịch sử đặt sân",
          icon: <SettingOutlined />,
          onClick: () => navigate("/booking-history"),
        },
        {
          key: "/wallet",
          label: "Ví của tôi",
          icon: <WalletOutlined />,
          onClick: () => navigate("/wallet"),
        },
        {
          type: "divider" as const,
        },
        {
          key: "logout",
          label: "Đăng xuất",
          icon: <LogoutOutlined />,
          danger: true,
          onClick: handleLogout,
        },
      ]
    : [
        {
          key: "/login",
          label: "Đăng nhập",
          icon: <LoginOutlined />,
          onClick: () => navigate("/login"),
        },
      ];

  const iconButtonStyle = {
    padding: "8px",
    borderRadius: "50%",
    background: "#f5f5f5",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  };

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        background: "#ffffff",
        padding: "0 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 20,
        margin: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        <img src="/logo.png" alt="Logo" style={{ width: 42, height: 42 }} />
        <span
          style={{
            fontWeight: 800,
            fontSize: 22,
            color: "#1f1f1f",
            letterSpacing: "-0.5px",
          }}
        >
          Lace<span style={{ color: "#1677ff" }}>Up</span>
        </span>
      </div>

      {/* Main Navigation */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={navItems}
        onClick={(e) => navigate(e.key)}
        style={{
          flex: 1,
          justifyContent: "center",
          borderBottom: "none",
          background: "transparent",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "70px", // Căn giữa chữ theo chiều dọc của Header
        }}
      />

      {/* Right Section: Notification & User Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginLeft: 40,
        }}
      >
        {isLoggedIn ? (
          <>
            <Badge count={2} size="small" offset={[-2, 2]}>
              <div style={iconButtonStyle} onClick={() => navigate("/chat")}>
                <MessageOutlined style={{ fontSize: 18, color: "#595959" }} />
              </div>
            </Badge>

            <Badge count={4} size="small" offset={[-2, 2]}>
              <div
                style={iconButtonStyle}
                onClick={() => navigate("/notifications")}
              >
                <BellOutlined style={{ fontSize: 18, color: "#595959" }} />
              </div>
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  size={42}
                  style={{
                    backgroundColor: "#1677ff",
                    border: "2px solid #e6f4ff",
                    cursor: "pointer",
                  }}
                  icon={<UserOutlined />}
                />
              </Space>
            </Dropdown>
          </>
        ) : (
          // Hiển thị nút Đăng nhập rõ ràng nếu chưa có token
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => navigate("/login")}
            style={{ borderRadius: "8px", fontWeight: 600 }}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
