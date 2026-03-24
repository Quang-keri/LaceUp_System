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
    message.success("Đã đăng xuất thành công!");
    navigate("/");
  };

  const navItems = [
    { key: "/", label: "Trang chủ" },
    { key: "/danh-sach-san", label: "Sân" },
    { key: "/cong-dong", label: "Cộng đồng" },
    { key: "/tin-tuc", label: "Tin tức" },
    { key: "/ve-chung-toi", label: "Về chúng tôi" },
  ];

  const userMenuItems = isLoggedIn
    ? [
        {
          key: "/dashboard",
          label: "Quản lý cá nhân",
          icon: <SettingOutlined />,
          onClick: () => navigate("/dashboard"),
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
        { type: "divider" as const },
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
    <div style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px" }}>
      <Header
        style={{
          background: "#ffffff",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          height: "70px",
          lineHeight: "70px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            height: "100%",
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

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={navItems}
            onClick={(e) => navigate(e.key)}
            style={{
              borderBottom: "none",
              background: "transparent",
              fontWeight: 500,
              fontSize: "16px",
              minWidth: "400px",
              justifyContent: "center",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            height: "100%",
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
    </div>
  );
};

export default AppHeader;
