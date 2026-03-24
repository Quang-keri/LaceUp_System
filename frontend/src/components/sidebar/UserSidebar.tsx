import React from "react";
import { Card, Menu, Typography, Tag, Divider, message } from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";

const { Title, Text } = Typography;

interface UserSidebarProps {
  selectedKey: string;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ selectedKey }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMenuClick = (key: string) => {
    if (key === selectedKey) return;

    switch (key) {
      case "0": // <-- Xử lý điều hướng cho Dashboard
        navigate("/dashboard");
        break;
      case "1":
        navigate("/profile");
        break;
      case "2":
        navigate("/my-matches");
        break;
      case "3":
        navigate("/booking-history");
        break;
      case "4":
        message.info("Cài đặt chưa được phát triển");
        break;
      case "5":
        message.info("Bảo mật tài khoản chưa được phát triển");
        break;
      case "6":
        message.info("Liên kết tài khoản chưa được phát triển");
        break;
      case "7":
        navigate("/achievements");
        break;
      default:
        break;
    }
  };

  // --- HÀM HELPER TÍNH TOÁN RANK VÀ LẤY ẢNH ---
  const getRankInfo = (points: number = 0, backendDisplayRank?: string) => {
    if (
      points >= 3000 ||
      (backendDisplayRank && backendDisplayRank !== "Kim Cương 1")
    ) {
      if (backendDisplayRank === "Thách Đấu")
        return { name: "Thách Đấu", color: "red", image: "/challenger.png" };
      if (backendDisplayRank === "Đại Cao Thủ")
        return {
          name: "Đại Cao Thủ",
          color: "magenta",
          image: "/grand-master.png",
        };
      return { name: "Cao Thủ", color: "purple", image: "/master.png" };
    }

    if (points >= 2500)
      return {
        name: `Kim Cương ${5 - Math.floor((points % 500) / 100)}`,
        color: "blue",
        image: "/diamond.png",
      };
    if (points >= 2000)
      return {
        name: `Bạch Kim ${5 - Math.floor((points % 500) / 100)}`,
        color: "cyan",
        image: "/platinum.png",
      };
    if (points >= 1500)
      return {
        name: `Vàng ${5 - Math.floor((points % 500) / 100)}`,
        color: "gold",
        image: "/gold.png",
      };
    if (points >= 1000)
      return {
        name: `Bạc ${5 - Math.floor((points % 500) / 100)}`,
        color: "gray",
        image: "/silver.png",
      };
    if (points >= 500)
      return {
        name: `Đồng ${5 - Math.floor((points % 500) / 100)}`,
        color: "orange",
        image: "/bronze.png",
      };

    return {
      name: `Sắt ${5 - Math.floor((points % 500) / 100)}`,
      color: "default",
      image: "/iron.png",
    };
  };

  const rankInfo = getRankInfo(user?.rankPoint, user?.displayRank);

  // <-- THÊM BẢNG ĐIỀU KHIỂN VÀO ĐẦU MẢNG MENU
  const menuItems = [
    { key: "0", icon: <DashboardOutlined />, label: "Bảng điều khiển" },
    { key: "1", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "2", icon: <HistoryOutlined />, label: "Trận đấu của tôi" },
    { key: "7", icon: <TrophyOutlined />, label: "Thành tựu" },
    { key: "3", icon: <HistoryOutlined />, label: "Lịch sử đặt sân" },
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

  return (
    <Card
      style={{ borderRadius: "12px", textAlign: "center", padding: "8px" }}
      bordered={false}
    >
      <Title level={4} style={{ margin: "8px 0 0 0" }}>
        {user ? `${user.userName}` : "N/A"}
      </Title>

      {/* KHỐI HIỂN THỊ RANK */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "20px",
          marginTop: "16px",
          paddingLeft: "12px",
        }}
      >
        <img
          src={rankInfo.image}
          alt={rankInfo.name}
          style={{ width: "128px", height: "128px", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <Text strong style={{ fontSize: "18px", color: "#475569" }}>
            {rankInfo.name}
          </Text>

          {user?.rankPoint !== undefined && (
            <Tag
              color={rankInfo.color}
              style={{
                margin: 0,
                padding: "4px 16px",
                fontSize: "14px",
                borderRadius: "12px",
                fontWeight: "bold",
                border: "1px solid transparent",
              }}
            >
              🏆 {user.rankPoint} Đ
            </Tag>
          )}
        </div>
      </div>

      <Divider style={{ margin: "24px 0 16px 0" }} />

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={(e) => handleMenuClick(e.key)}
        style={{ borderRight: "none", textAlign: "left" }}
      />
    </Card>
  );
};

export default UserSidebar;
