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
} from "@ant-design/icons";
import dayjs from "dayjs";
import UserSidebar from "../../../components/sidebar/UserSidebar";
import userService from "../../../service/userService";
import achievementService from "../../../service/achievementService";
import type { UserDashboardResponse } from "../../../types/user";

const { Text } = Typography;

const BADGE_MAP: Record<string, any> = {
  FIRST_BLOOD: {
    name: "Chiến Công Đầu",
    icon: <StarFilled className="text-3xl" />,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    shadow: "shadow-blue-200",
  },
  ON_FIRE: {
    name: "Đang Cháy",
    icon: <FireFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    shadow: "shadow-orange-200",
  },
  UNSTOPPABLE: {
    name: "Không Thể Cản Phá",
    icon: <RocketFilled className="text-3xl" />,
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    shadow: "shadow-red-200",
  },
  VETERAN: {
    name: "Lão Tướng",
    icon: <CrownFilled className="text-3xl" />,
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-300",
    shadow: "shadow-yellow-300",
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
    const fetchDashboardInfo = async () => {
      if (!userId) return;

      try {
        setLoadingDashboard(true);
        const response = await userService.getUserDashboard(userId);
        const data = response.result;
        setDashboardData(data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
        message.error("Không thể tải dữ liệu tổng quan.");
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardInfo();
  }, [userId]);

  useEffect(() => {
    const fetchRecentAchievements = async () => {
      if (!userId) return;

      try {
        setLoadingAchievements(true);
        const res = await achievementService.getUserAchievements(userId);

        let safeArray: any[] = [];
        if (Array.isArray(res)) {
          safeArray = res;
        } else if (res && Array.isArray(res.result)) {
          safeArray = res.result;
        }

        safeArray.sort(
          (a, b) =>
            new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
        );
        setRecentAchievements(safeArray.slice(0, 4));
      } catch (error) {
        console.error("Lỗi lấy thành tựu gần đây: ", error);
      } finally {
        setLoadingAchievements(false);
      }
    };

    fetchRecentAchievements();
  }, [userId]);

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        {/* TRUYỀN DỮ LIỆU SANG SIDEBAR ĐỂ KHÔNG PHẢI GỌI LẠI API */}
        <Col xs={24} md={8} lg={6}>
          <UserSidebar selectedKey="0" dashboardData={dashboardData} />
        </Col>

        <Col xs={24} md={16} lg={18}>
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
            title={
              <span className="text-xl font-bold"> Thành Tựu Mới Nhất</span>
            }
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
                      title={
                        <div className="text-center">
                          <p className="font-bold text-base mb-1">
                            {config.name}
                          </p>
                          <p className="text-sm text-gray-200 mb-1">
                            {item.description}
                          </p>
                          <p className="text-xs italic text-gray-400">
                            Đạt được:{" "}
                            {dayjs(item.achievedAt).format("DD/MM/YYYY")}
                          </p>
                        </div>
                      }
                      color="#1f2937"
                      placement="top"
                    >
                      <div className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110">
                        <div
                          className={`w-20 h-20 flex items-center justify-center rounded-full border-2 ${config.bg} ${config.color} shadow-lg ${config.shadow} mb-3`}
                        >
                          {config.icon}
                        </div>
                        <Text
                          strong
                          className="text-gray-700 text-center text-sm"
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
        </Col>
      </Row>
    </div>
  );
};

export default PlayerDashboard;
