import { Layout, Menu, Avatar, Badge, Dropdown, Space } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined, WalletOutlined, SettingOutlined, LoginOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Header } = Layout;

const AppHeader = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Kiểm tra trạng thái đăng nhập
    const isLoggedIn = !!localStorage.getItem("accessToken");

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        alert("Đã đăng xuất!");
        navigate("/");
    };

    // Menu chính giữa
    const navItems = [
        { key: "/", label: "Home" },
        { key: "/news", label: "News" },
        { key: "/my-bookings", label: "My Bookings" },
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
            {/* Logo Section */}
            <div
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => navigate("/")}
            >
                <span style={{ fontWeight: 700, fontSize: 20 }}>Lace Up</span>
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
                }}
            />

            {/* Right Section: Notification & User Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {isLoggedIn && (
                    <Badge count={3} size="small">
                        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                    </Badge>
                )}

                <Dropdown
                    menu={{ items: userMenuItems }}
                    trigger={["click"]}
                    placement="bottomRight"
                >
                    <Space style={{ cursor: "pointer" }}>
                        <Avatar
                            size={40}
                            style={{ backgroundColor: "#3e89de" }}
                            icon={<UserOutlined />}
                        />
                    </Space>
                </Dropdown>
            </div>
        </Header>
    );
};

export default AppHeader;