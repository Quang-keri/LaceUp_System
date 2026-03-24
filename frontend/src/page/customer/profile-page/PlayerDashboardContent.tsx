import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Tooltip,
  Typography,
  Empty,
  Progress,
  Skeleton,
  Divider,
  Tag,
} from "antd";
import {
  TrophyOutlined,
  FireFilled,
  StarFilled,
  CrownFilled,
  RocketFilled,
  QuestionOutlined,
  ThunderboltFilled,
  SafetyCertificateFilled,
  PlayCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import userService from "../../../service/userService";
import achievementService from "../../../service/achievementService";
import type { UserDashboardResponse } from "../../../types/user";

const { Text, Title } = Typography;

const BADGE_MAP: Record<string, any> = {
  FIRST_BLOOD: {
    name: "Chiến Công Đầu",
    icon: <StarFilled className="text-4xl" />,
    color: "text-blue-500",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    shadow: "shadow-blue-200",
  },
  ON_FIRE: {
    name: "Chuỗi Thắng",
    icon: <FireFilled className="text-4xl" />,
    color: "text-orange-500",
    bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
    shadow: "shadow-orange-200",
  },
  UNSTOPPABLE: {
    name: "Không Thể Cản Phá",
    icon: <RocketFilled className="text-4xl" />,
    color: "text-red-500",
    bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
    shadow: "shadow-red-200",
  },
  VETERAN: {
    name: "Lão Tướng",
    icon: <CrownFilled className="text-4xl" />,
    color: "text-yellow-500",
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300",
    shadow: "shadow-yellow-300",
  },
};

interface PlayerDashboardContentProps {
  userId: string;
}

const PlayerDashboardContent: React.FC<PlayerDashboardContentProps> = ({
  userId,
}) => {
  const [dashboardData, setDashboardData] =
    useState<UserDashboardResponse | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Gọi song song 2 API để tiết kiệm thời gian tải
        const [dashRes, achRes] = await Promise.all([
          userService.getUserDashboard(userId).catch(() => null),
          achievementService.getUserAchievements(userId).catch(() => []),
        ]);

        if (dashRes && dashRes.result) {
          setDashboardData(dashRes.result);
        }

        let achArray: any[] = [];
        if (Array.isArray(achRes)) {
          achArray = achRes;
        } else if (achRes && Array.isArray(achRes.result)) {
          achArray = achRes.result;
        }

        // Sắp xếp giảm dần và lấy 8 cái mới nhất
        achArray.sort(
          (a, b) =>
            new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
        );
        setRecentAchievements(achArray.slice(0, 8));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  // Hàm đánh giá uy tín
  const getReputationStatus = (score: number = 0) => {
    if (score >= 95)
      return (
        <Tag color="success" className="rounded-full px-3">
          Gương mẫu
        </Tag>
      );
    if (score >= 80)
      return (
        <Tag color="processing" className="rounded-full px-3">
          Tốt
        </Tag>
      );
    if (score >= 60)
      return (
        <Tag color="warning" className="rounded-full px-3">
          Bình thường
        </Tag>
      );
    return (
      <Tag color="error" className="rounded-full px-3">
        Cần cải thiện
      </Tag>
    );
  };

  if (loading) {
    return (
      <Card
        style={{ borderRadius: "16px", minHeight: "600px" }}
        bordered={false}
        className="shadow-sm"
      >
        <Skeleton
          active
          avatar={{ size: 100, shape: "circle" }}
          paragraph={{ rows: 4 }}
        />
        <Divider />
        <Skeleton active title={false} paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. KHỐI THỐNG KÊ CHIẾN TÍCH (HERO BANNER) */}
      <Card
        bordered={false}
        style={{ borderRadius: "16px", background: "#ffffff" }}
        className="shadow-sm overflow-hidden relative"
        bodyStyle={{ padding: "32px 24px" }}
      >
        <Title level={4} className="mb-6 flex items-center gap-2 text-gray-800">
          <ThunderboltFilled className="text-yellow-500" /> Thống Kê Tham Chiến
        </Title>

        <Row gutter={[24, 24]} align="middle" justify="center">
          {/* Tỉ lệ thắng - Biểu đồ tròn nổi bật */}
          <Col
            xs={24}
            sm={12}
            md={8}
            className="flex flex-col items-center justify-center border-r border-gray-100 last:border-0 md:last:border-r"
          >
            <Progress
              type="dashboard"
              percent={dashboardData?.winRate || 0}
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
              size={140}
              format={(percent) => (
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {percent}%
                  </span>
                  <span className="text-xs text-gray-400">Tỉ lệ thắng</span>
                </div>
              )}
            />
          </Col>

          {/* Tổng số trận */}
          <Col
            xs={24}
            sm={12}
            md={8}
            className="flex flex-col items-center justify-center border-r border-gray-100 last:border-0 md:last:border-r"
          >
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-3">
              <PlayCircleFilled className="text-4xl text-blue-500" />
            </div>
            <Text className="text-4xl font-black text-gray-800 tracking-tight">
              {dashboardData?.totalMatches || 0}
            </Text>
            <Text className="text-gray-500 font-medium">Trận Đã Chơi</Text>
          </Col>

          {/* Điểm uy tín */}
          <Col
            xs={24}
            sm={12}
            md={8}
            className="flex flex-col items-center justify-center"
          >
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mb-3">
              <SafetyCertificateFilled className="text-4xl text-green-500" />
            </div>
            <Text className="text-4xl font-black text-gray-800 tracking-tight">
              {dashboardData?.reputationScore || 100}
            </Text>
            <Text className="text-gray-500 font-medium mb-1">Điểm Uy Tín</Text>
            {getReputationStatus(dashboardData?.reputationScore || 100)}
          </Col>
        </Row>
      </Card>

      {/* 2. KHỐI THÀNH TỰU ĐẠT ĐƯỢC */}
      <Card
        bordered={false}
        style={{ borderRadius: "16px", background: "#ffffff" }}
        className="shadow-sm"
        bodyStyle={{ padding: "24px" }}
      >
        <div className="flex items-center justify-between mb-6">
          <Title
            level={4}
            className="m-0 flex items-center gap-2 text-gray-800"
          >
            <TrophyOutlined className="text-yellow-500" /> Bộ Sưu Tập Thành Tựu
          </Title>
          <Tag color="gold" className="rounded-full px-3 py-1 font-bold">
            {recentAchievements.length} Thành tựu
          </Tag>
        </div>

        {recentAchievements.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-400">
                Chưa có thành tựu nào được ghi nhận.
              </span>
            }
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {recentAchievements.map((item: any, index: number) => {
              const config = BADGE_MAP[item.achievementCode] || {
                name: item.achievementName || "Huy hiệu ẩn",
                icon: <QuestionOutlined className="text-4xl" />,
                color: "text-gray-500",
                bg: "bg-gray-50 border-gray-200",
                shadow: "shadow-gray-200",
              };

              return (
                <Tooltip
                  key={item.id || index}
                  color="#1e293b" // Slate-800
                  placement="top"
                  title={
                    <div className="text-center p-1">
                      <p className="font-bold text-base mb-1 text-yellow-400">
                        {config.name}
                      </p>
                      <p className="text-sm text-gray-200 mb-2">
                        {item.description}
                      </p>
                      <div className="bg-slate-700/50 rounded p-1 inline-block">
                        <p className="text-xs italic text-gray-400 m-0">
                          Đạt được:{" "}
                          {dayjs(item.achievedAt).format("DD/MM/YYYY")}
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div
                      className={`w-24 h-24 flex items-center justify-center rounded-full border-4 ${config.bg} ${config.color} shadow-lg ${config.shadow} mb-3 group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-300`}
                    >
                      {config.icon}
                    </div>
                    <Text
                      strong
                      className="text-gray-700 text-center text-sm group-hover:text-blue-600 transition-colors"
                    >
                      {config.name}
                    </Text>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerDashboardContent;
