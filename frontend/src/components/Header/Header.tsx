import { Layout, Menu, Avatar, Badge } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Header } = Layout;

const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    {
      key: "/",
      label: "Home",
    },
    {
      key: "/news",
      label: "News",
    },
    {
      key: "/my-bookings",
      label: "My Bookings",
    },
  ];

  return (
    <Header
      style={{
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        Logo
        <span style={{ fontWeight: 700, fontSize: 20 }}>Lace Up</span>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={(e) => navigate(e.key)}
        style={{
          flex: 1,
          justifyContent: "center",
          borderBottom: "none",
          background: "transparent",
          fontWeight: 500,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Badge count={3} size="small">
          <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
        </Badge>

        <Avatar
          size={40}
          style={{
            backgroundColor: "#3e89de",
            cursor: "pointer",
          }}
          icon={<UserOutlined />}
        />
      </div>
    </Header>
  );
};

export default AppHeader;
