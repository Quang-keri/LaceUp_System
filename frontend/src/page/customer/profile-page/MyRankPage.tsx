// src/pages/user/MyRanks.tsx
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spin, Typography, Empty, Progress } from "antd";
import { useAuth } from "../../../context/AuthContext";
import UserSidebar from "../../../components/sidebar/UserSidebar";
import userService from "../../../service/userService";
import type { UserDashboardResponse } from "../../../types/user";

const { Title, Text } = Typography;

const MyRanks: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.userId) {
      userService.getUserDashboard(user.userId)
        .then((res) => setDashboardData(res.result))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Hàm helper dùng chung (bạn có thể đưa ra utils nếu muốn)
  const getRankInfo = (points: number = 0) => {
    if (points >= 3000) return { name: "Cao Thủ", color: "purple", image: "/master.png" };
    if (points >= 2500) return { name: `Kim Cương ${5 - Math.floor((points % 500) / 100)}`, color: "blue", image: "/diamond.png" };
    if (points >= 2000) return { name: `Bạch Kim ${5 - Math.floor((points % 500) / 100)}`, color: "cyan", image: "/platinum.png" };
    if (points >= 1500) return { name: `Vàng ${5 - Math.floor((points % 500) / 100)}`, color: "gold", image: "/gold.png" };
    if (points >= 1000) return { name: `Bạc ${5 - Math.floor((points % 500) / 100)}`, color: "gray", image: "/silver.png" };
    if (points >= 500) return { name: `Đồng ${5 - Math.floor((points % 500) / 100)}`, color: "orange", image: "/bronze.png" };
    return { name: `Sắt ${5 - Math.floor(points / 100)}`, color: "default", image: "/iron.png" };
  };

  return (
    <div style={{ padding: "24px", backgroundColor: "#f5f7fa", minHeight: "calc(100vh - 70px)" }}>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={8} lg={6}>
          {/* Key "8" để Sidebar sáng lên (active) */}
          <UserSidebar selectedKey="8" dashboardData={dashboardData} />
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card
            title={<Title level={4} style={{ margin: 0 }}> Xếp hạng từng bộ môn</Title>}
            bordered={false}
            style={{ borderRadius: "12px", minHeight: "400px" }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
            ) : !dashboardData?.categoryRanks || dashboardData.categoryRanks.length === 0 ? (
              <Empty description="Bạn chưa tham gia trận xếp hạng nào." />
            ) : (
              <Row gutter={[16, 16]}>
                {dashboardData.categoryRanks.map((item) => {
                  const rankInfo = getRankInfo(item.rankPoint);
                  return (
                    <Col xs={24} sm={12} lg={12} key={item.categoryId}>
                      <Card className="shadow-sm border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-4">
                          <img src={rankInfo.image} alt="rank" className="w-20 h-20 object-contain" />
                          <div className="flex-1">
                            <Text strong className="text-lg text-blue-600 block mb-1">{item.categoryName}</Text>
                            <Text strong className="text-gray-700 block">{rankInfo.name} - {item.rankPoint} Đ</Text>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Số trận: {item.totalMatches}</span>
                              <span>Tỉ lệ thắng: {item.winRate}%</span>
                            </div>
                            <Progress percent={item.winRate} size="small" showInfo={false} strokeColor="#52c41a" />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyRanks;