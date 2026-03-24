import React from "react";
import { Card, Menu, Typography, Tag, Divider } from "antd";
import { DashboardOutlined, HistoryOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface PublicSidebarProps {
  targetUser: any;
  selectedKey: string;
  onMenuClick: (key: string) => void;
}

const PublicSidebar: React.FC<PublicSidebarProps> = ({
  targetUser,
  selectedKey,
  onMenuClick,
}) => {
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

  const rankInfo = getRankInfo(targetUser?.rankPoint, targetUser?.displayRank);

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan hoạt động",
    },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử đấu" },
  ];

  return (
    <Card
      style={{ borderRadius: "12px", textAlign: "center", padding: "8px" }}
      bordered={false}
    >
      <Title level={4} style={{ margin: "8px 0 0 0" }}>
        {targetUser ? targetUser.userName : "Đang tải..."}
      </Title>

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
          {targetUser?.rankPoint !== undefined && (
            <Tag
              color={rankInfo.color}
              style={{
                margin: 0,
                padding: "4px 16px",
                fontSize: "14px",
                borderRadius: "12px",
                fontWeight: "bold",
              }}
            >
              🏆 {targetUser.rankPoint} Đ
            </Tag>
          )}
        </div>
      </div>

      <Divider style={{ margin: "24px 0 16px 0" }} />

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={(e) => onMenuClick(e.key)}
        style={{ borderRight: "none", textAlign: "left" }}
      />
    </Card>
  );
};

export default PublicSidebar;
