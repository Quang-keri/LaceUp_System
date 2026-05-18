import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Spin,
  Statistic,
  message,
  Tooltip,
  Typography,
  Empty,
} from "antd";
import {
  TrophyOutlined,
  ScheduleOutlined,
  StarOutlined,
  FireFilled,
  StarFilled,
  CrownFilled,
  RocketFilled,
  QuestionOutlined,
  LikeFilled,
  ClockCircleFilled,
  TrophyFilled,
  SafetyCertificateFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import userService from "../../../service/userService";
import achievementService from "../../../service/achievementService";
import type { UserDashboardResponse } from "../../../types/user";

const { Text } = Typography;

const BADGE_MAP: Record<string, any> = {
  FIRST_BLOOD: {
    name: "Đệ Nhất Máu",
    icon: <StarFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  ON_FIRE: {
    name: "Đang Trên Đà",
    icon: <FireFilled className="text-3xl" />,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-300",
    shadow: "shadow-purple-200",
  },
  UNSTOPPABLE: {
    name: "Không Thể Cản Phá",
    icon: <RocketFilled className="text-3xl" />,
    color: "text-orange-600",
    bg: "bg-orange-100 border-orange-400",
    shadow: "shadow-orange-300",
  },
  VETERAN: {
    name: "Lão Tướng",
    icon: <SafetyCertificateFilled className="text-3xl" />,
    color: "text-purple-600",
    bg: "bg-purple-100 border-purple-400",
    shadow: "shadow-purple-300",
  },
  CENTURION: {
    name: "Kẻ Chinh Phục",
    icon: <TrophyFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  LEGEND: {
    name: "Huyền Thoại",
    icon: <CrownFilled className="text-3xl" />,
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-500",
    shadow: "shadow-purple-400",
  },
  PERFECT_ATTENDANCE: {
    name: "Đúng Giờ Là Vàng",
    icon: <ClockCircleFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  SPORTSMANSHIP: {
    name: "Tinh Thần Thể Thao",
    icon: <LikeFilled className="text-3xl" />,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-300",
    shadow: "shadow-purple-200",
  },
};

interface PlayerDashboardProps {
  userId: string;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] =
    useState<UserDashboardResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;
    userService
      .getUserDashboard(userId)
      .then((res) => setDashboardData(res.result))
      .catch(() => message.error("Không thể tải dữ liệu tổng quan."))
      .finally(() => setLoadingDashboard(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    achievementService
      .getUserAchievements(userId)
      .then((res) => {
        let safeArray = Array.isArray(res)
          ? res
          : res && Array.isArray(res.result)
          ? res.result
          : [];
        safeArray.sort(
          (a, b) =>
            new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
        );
        setRecentAchievements(safeArray.slice(0, 4));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingAchievements(false));
  }, [userId]);

  return (
    <>
      <Card
        title={
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            Tổng quan hoạt động
          </span>
        }
        bordered={false}
        style={{ borderRadius: "12px", marginBottom: "24px" }}
      >
        {loadingDashboard ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{ background: "#f0f5ff", borderColor: "#d6e4ff" }}
              >
                <Statistic
                  title="Trận đã tham gia"
                  value={dashboardData?.totalMatches || 0}
                  prefix={<ScheduleOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{ background: "#f6ffed", borderColor: "#d9f7be" }}
              >
                <Statistic
                  title="Tỉ lệ thắng tổng"
                  value={dashboardData?.winRate || 0}
                  suffix="%"
                  prefix={<TrophyOutlined style={{ color: "#52c41a" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size="small"
                style={{ background: "#fffbe6", borderColor: "#ffe58f" }}
              >
                <Statistic
                  title="Điểm uy tín"
                  value={100}
                  prefix={<StarOutlined style={{ color: "#faad14" }} />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Card
        title={<span className="text-xl font-bold"> Thành Tựu Mới Nhất</span>}
        bordered={false}
        style={{ borderRadius: "12px", minHeight: "200px" }}
      >
        {loadingAchievements ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" />
          </div>
        ) : recentAchievements.length === 0 ? (
          <Empty description="Bạn chưa đạt được thành tựu nào. Hãy tham gia thi đấu ngay!" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-4">
            {recentAchievements.map((item: any, index: number) => {
              const config = BADGE_MAP[item.achievementCode] || {
                name: "Huy hiệu bí ẩn",
                icon: <QuestionOutlined className="text-3xl" />,
                color: "text-gray-500",
                bg: "bg-gray-50 border-gray-200",
                shadow: "shadow-gray-200",
              };
              return (
                <Tooltip
                  key={item.id || index}
                  color="#1f2937"
                  placement="top"
                  title={
                    <div className="text-center">
                      <p className="font-bold text-base mb-1">{config.name}</p>
                      <p className="text-sm text-gray-200 mb-1">
                        {item.description}
                      </p>
                      <p className="text-xs italic text-gray-400">
                        Đạt được: {dayjs(item.achievedAt).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  }
                >
                  <div className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110">
                    <div
                      className={`w-20 h-20 flex items-center justify-center rounded-full border-2 ${config.bg} ${config.color} shadow-lg ${config.shadow} mb-3`}
                    >
                      {config.icon}
                    </div>
                    <Text strong className="text-gray-700 text-center text-sm">
                      {config.name}
                    </Text>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};

export default PlayerDashboard;
