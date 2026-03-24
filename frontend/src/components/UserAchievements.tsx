import React, { useEffect, useState } from "react";
import { Card, Spin, Empty, Tooltip, Typography, Row, Col } from "antd";
import {
  FireFilled,
  StarFilled,
  CrownFilled,
  RocketFilled,
  QuestionOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import achievementService from "../service/achievementService";
import UserSidebar from "./sidebar/UserSidebar";

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

interface UserAchievementsProps {
  userId?: string;
}

const UserAchievements: React.FC<UserAchievementsProps> = ({ userId }) => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      try {
        let res;
        if (userId) {
          res = await achievementService.getUserAchievements(userId);
        } else {
          res = await achievementService.getMyAchievements();
        }

        let safeArray: any[] = [];
        if (Array.isArray(res)) {
          safeArray = res;
        } else if (res && Array.isArray(res.result)) {
          safeArray = res.result;
        }

        setAchievements(safeArray);
      } catch (error) {
        console.error("Lỗi lấy thành tựu: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
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
        {/* CỘT TRÁI: HIỂN THỊ SIDEBAR */}
        <Col xs={24} md={8} lg={6}>
          <UserSidebar selectedKey="7" />
        </Col>

        {/* CỘT PHẢI: HIỂN THỊ TỦ KÍNH THÀNH TỰU */}
        <Col xs={24} md={16} lg={18}>
          {loading ? (
            <Card
              style={{ borderRadius: "12px", minHeight: "300px" }}
              bordered={false}
            >
              <div className="flex justify-center items-center py-20">
                <Spin size="large" />
              </div>
            </Card>
          ) : (
            <Card
              title={
                <span className="text-xl font-bold">🎖️ Tủ Kính Thành Tựu</span>
              }
              bordered={false}
              style={{ borderRadius: "12px", minHeight: "100%" }}
            >
              {achievements.length === 0 ? (
                <Empty description="Bạn chưa đạt được thành tựu nào. Hãy tham gia thi đấu ngay!" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-4">
                  {achievements.map((item: any, index: number) => {
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
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UserAchievements;