import React, { useEffect, useState } from "react";
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
  BarChartOutlined, // <-- Thêm icon này
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import userService from "../../service/userService.ts";
import type { UserDashboardResponse, CategoryRankResponse } from "../../types/user.ts";

const { Title, Text } = Typography;

interface UserSidebarProps {
  selectedKey: string;
  dashboardData?: UserDashboardResponse | null;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ selectedKey, dashboardData }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [localDashboardData, setLocalDashboardData] = useState<UserDashboardResponse | null>(null);

  useEffect(() => {
    if (dashboardData !== undefined) {
      setLocalDashboardData(dashboardData);
    } else if (user?.userId) {
      userService.getUserDashboard(user.userId)
        .then((res) => {
          if (res.result) setLocalDashboardData(res.result);
        })
        .catch((e) => console.error("Lỗi lấy dữ liệu sidebar:", e));
    }
  }, [dashboardData, user?.userId]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMenuClick = (key: string) => {
    if (key === selectedKey) return;

    switch (key) {
      case "0":
        navigate("/dashboard");
        break;
      case "1":
        navigate("/profile");
        break;
      case "2":
        navigate("/my-matches");
        break;
      case "8": // <-- ĐIỀU HƯỚNG SANG TRANG RANK RIÊNG
        navigate("/my-ranks");
        break;
      case "7":
        navigate("/achievements");
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
      default:
        break;
    }
  };

  // --- ĐÃ SỬA LẠI HÀM HELPER ĐỂ KHÔNG BỊ BUG LÊN CAO THỦ NỮA ---
  const getRankInfo = (points: number = 0, backendDisplayRank?: string) => {
    if (points >= 3000) {
      if (backendDisplayRank === "Thách Đấu") return { name: "Thách Đấu", color: "red", image: "/challenger.png" };
      if (backendDisplayRank === "Đại Cao Thủ") return { name: "Đại Cao Thủ", color: "magenta", image: "/grand-master.png" };
      return { name: "Cao Thủ", color: "purple", image: "/master.png" };
    }

    if (points >= 2500) return { name: `Kim Cương ${5 - Math.floor((points % 500) / 100)}`, color: "blue", image: "/diamond.png" };
    if (points >= 2000) return { name: `Bạch Kim ${5 - Math.floor((points % 500) / 100)}`, color: "cyan", image: "/platinum.png" };
    if (points >= 1500) return { name: `Vàng ${5 - Math.floor((points % 500) / 100)}`, color: "gold", image: "/gold.png" };
    if (points >= 1000) return { name: `Bạc ${5 - Math.floor((points % 500) / 100)}`, color: "gray", image: "/silver.png" };
    if (points >= 500) return { name: `Đồng ${5 - Math.floor((points % 500) / 100)}`, color: "orange", image: "/bronze.png" };

    return { name: `Sắt ${5 - Math.floor(points / 100)}`, color: "default", image: "/iron.png" };
  };

  // TÌM RANK CAO NHẤT TỪ CÁC CATEGORY
  const categoryRanks: CategoryRankResponse[] = localDashboardData?.categoryRanks || [];
  const highestRank = categoryRanks.length > 0
    ? categoryRanks.reduce((max, current) => (max.rankPoint > current.rankPoint ? max : current))
    : { rankPoint: 0, displayRank: "Sắt 5", categoryName: "Chưa phân hạng" }; 

  const mainRankInfo = getRankInfo(highestRank.rankPoint, highestRank.displayRank);

  const menuItems = [
    { key: "0", icon: <DashboardOutlined />, label: "Bảng điều khiển" },
    { key: "1", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "2", icon: <HistoryOutlined />, label: "Trận đấu của tôi" },
    { key: "8", icon: <BarChartOutlined />, label: "Xếp hạng của tôi" }, // <-- Menu mới
    { key: "7", icon: <TrophyOutlined />, label: "Thành tựu" },
    { key: "3", icon: <HistoryOutlined />, label: "Lịch sử đặt sân" },
    { key: "4", icon: <SettingOutlined />, label: "Cài đặt" },
    { key: "5", icon: <SafetyCertificateOutlined />, label: "Bảo mật tài khoản" },
    { key: "6", icon: <LinkOutlined />, label: "Liên kết tài khoản" },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true, onClick: handleLogout },
  ];

  return (
    <Card style={{ borderRadius: "12px", textAlign: "center", padding: "8px" }} bordered={false}>
      <Title level={4} style={{ margin: "8px 0 0 0" }}>
        {user ? `${user.userName}` : "N/A"}
      </Title>

      {/* KHỐI HIỂN THỊ RANK ĐẠI DIỆN CAO NHẤT */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "24px" }}>
        <img
          src={mainRankInfo.image}
          alt={mainRankInfo.name}
          style={{ width: "120px", height: "120px", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <Text strong style={{ fontSize: "18px", color: "#475569" }}>
            {mainRankInfo.name}
          </Text>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Môn thi đấu tốt nhất: <span style={{ fontWeight: 600, color: "#1890ff" }}>{highestRank.categoryName || "Chưa có"}</span>
          </Text>
          <Tag color={mainRankInfo.color} style={{ margin: "8px 0 0 0", padding: "4px 16px", fontSize: "14px", borderRadius: "12px", fontWeight: "bold" }}>
            🏆 {highestRank.rankPoint} Đ
          </Tag>
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