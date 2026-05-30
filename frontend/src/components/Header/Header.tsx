import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Button,
  message,
  ConfigProvider,
  Grid,
  Drawer,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  WalletOutlined,
  SettingOutlined,
  LoginOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const { Header } = Layout;
const { useBreakpoint } = Grid;

const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [drawerVisible, setDrawerVisible] = useState(false);

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
    { key: "/home", label: "Trang chủ" },
    { key: "/map", label: "Bản đồ" },
    { key: "/courts", label: "Sân" },
    { key: "/comunity", label: "Cộng đồng" },
    { key: "/news", label: "Tin tức" },
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

        ...(user?.role === "OWNER"
          ? [
              {
                key: "/owner",
                label: "Quản lí cơ sở",
                icon: <SettingOutlined />,
                onClick: () => navigate("/owner"),
              },
              {
                key: "/bank-account",
                label: "Tài khoản của tôi",
                icon: <WalletOutlined />,
                onClick: () => navigate("/owner/bank-account"),
              },
            ]
          : []),

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

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: isMobile ? "5px" : "10px",
      }}
    >
      <ConfigProvider
  theme={{
    token: {
      colorPrimary: "#9156F1",
    },
    components: {
      Menu: {
        itemSelectedColor: "#9156F1",
        itemHoverColor: "#9156F1",
        horizontalItemSelectedColor: "#9156F1",
      },
    },
  }}
>
        <Header
          style={{
            background: "#ffffff",
            padding: isMobile ? "0 16px" : "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            height: "70px",
            lineHeight: "70px",
          }}
        >
          <Link to={"/home"}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                height: "100%",
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: 42, height: 42 }}
              />
              {!isMobile && (
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: "#1f1f1f",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Lace<span style={{ color: "#9156F1" }}>Up</span>
                </span>
              )}
            </div>
          </Link>

          {!isMobile && (
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
                  fontWeight: 600,
                  fontSize: "16px",
                  minWidth: "400px",
                  justifyContent: "center",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 12 : 24,
              height: "100%",
            }}
          >
            {isLoggedIn ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Space style={{ cursor: "pointer" }}>
                  <Avatar
                    size={42}
                    style={{
                      backgroundColor: "#9156F1",
                      border: "2px solid #f3eaff",
                    }}
                    icon={<UserOutlined />}
                  />
                </Space>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                size={isMobile ? "middle" : "large"}
                icon={<LoginOutlined />}
                onClick={() => navigate("/login")}
                style={{
                  borderRadius: "12px",
                  fontWeight: 600,
                  background: "#9156F1",
                  borderColor: "#9156F1",
                }}
              >
                {!isMobile && "Đăng nhập"}
              </Button>
            )}

            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setDrawerVisible(true)}
              />
            )}
          </div>
        </Header>

        <Drawer
          title={<span style={{ fontWeight: 800 }}>LaceUp Menu</span>}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{ body: { padding: 0 } }}
          width={250}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={navItems}
            onClick={(e) => {
              navigate(e.key);
              setDrawerVisible(false);
            }}
            style={{ borderRight: "none", fontSize: "16px", fontWeight: 500 }}
          />
        </Drawer>
      </ConfigProvider>
    </div>
  );
};

export default AppHeader;
