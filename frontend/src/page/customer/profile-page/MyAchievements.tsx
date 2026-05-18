import React, { useEffect, useState } from "react";
import { Card, Spin, Tooltip, Typography, Row, Col } from "antd";
import {
  FireFilled,
  StarFilled,
  CrownFilled,
  RocketFilled,
  TrophyFilled,
  SafetyCertificateFilled,
  ClockCircleFilled,
  LikeFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import achievementService from "../../../service/achievementService";
import UserSidebar from "../../../components/sidebar/UserSidebar";

const { Text } = Typography;

// Cập nhật BADGE_MAP: Bổ sung description và đồng bộ theme Cam - Tím
const BADGE_MAP: Record<string, any> = {
  FIRST_BLOOD: {
    name: "Đệ Nhất Máu",
    description: "Thắng trận đầu tiên",
    icon: <StarFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  ON_FIRE: {
    name: "Đang Trên Đà",
    description: "Thắng 5 trận liên tiếp",
    icon: <FireFilled className="text-3xl" />,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-300",
    shadow: "shadow-purple-200",
  },
  UNSTOPPABLE: {
    name: "Không Thể Cản Phá",
    description: "Thắng 10 trận liên tiếp",
    icon: <RocketFilled className="text-3xl" />,
    color: "text-orange-600",
    bg: "bg-orange-100 border-orange-400",
    shadow: "shadow-orange-300",
  },
  VETERAN: {
    name: "Lão Tướng",
    description: "Chơi đủ 100 trận",
    icon: <SafetyCertificateFilled className="text-3xl" />,
    color: "text-purple-600",
    bg: "bg-purple-100 border-purple-400",
    shadow: "shadow-purple-300",
  },
  CENTURION: {
    name: "Kẻ Chinh Phục",
    description: "Đạt mốc 50 trận thắng",
    icon: <TrophyFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  LEGEND: {
    name: "Huyền Thoại",
    description: "Chơi tổng cộng 500 trận",
    icon: <CrownFilled className="text-3xl" />,
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-500",
    shadow: "shadow-purple-400",
  },
  PERFECT_ATTENDANCE: {
    name: "Đúng Giờ Là Vàng",
    description: "Hoàn thành 20 trận không đi muộn",
    icon: <ClockCircleFilled className="text-3xl" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-300",
    shadow: "shadow-orange-200",
  },
  SPORTSMANSHIP: {
    name: "Tinh Thần Thể Thao",
    description: "10 trận liên tiếp không bị report",
    icon: <LikeFilled className="text-3xl" />,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-300",
    shadow: "shadow-purple-200",
  },
};

interface UserAchievementsProps {
  userId?: string;
}

const MyAchievements: React.FC<UserAchievementsProps> = ({ userId }) => {
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

  // Lấy ra toàn bộ keys của BADGE_MAP để render
  const achievementKeys = Object.keys(BADGE_MAP);

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
                <span className="text-xl font-bold"> Tủ Kính Thành Tựu</span>
              }
              bordered={false}
              style={{ borderRadius: "12px", minHeight: "100%" }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-4">
                {achievementKeys.map((code: string) => {
                  const config = BADGE_MAP[code];

                  // Kiểm tra xem backend trả về field là achievementCode hay achievementType
                  const achievedItem = achievements.find(
                    (a: any) =>
                      a.achievementCode === code || a.achievementType === code,
                  );
                  const isAchieved = !!achievedItem;

                  return (
                    <Tooltip
                      key={code}
                      title={
                        <div className="text-center">
                          <p className="font-bold text-base mb-1">
                            {config.name}
                          </p>
                          <p className="text-sm text-gray-200 mb-1">
                            {config.description}
                          </p>
                          {isAchieved ? (
                            <p className="text-xs italic text-green-400 mt-2">
                              Đã mở khóa:{" "}
                              {dayjs(achievedItem.achievedAt).format(
                                "DD/MM/YYYY",
                              )}
                            </p>
                          ) : (
                            <p className="text-xs italic text-gray-400 mt-2">
                               Chưa mở khóa
                            </p>
                          )}
                        </div>
                      }
                      color="#1f2937"
                      placement="top"
                    >
                      {/* Thêm class opacity-40 và grayscale nếu chưa đạt được */}
                      <div
                        className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                          isAchieved
                            ? "hover:scale-110"
                            : "opacity-40 grayscale hover:opacity-70"
                        }`}
                      >
                        <div
                          className={`w-20 h-20 flex items-center justify-center rounded-full border-2 ${config.bg} ${config.color} shadow-lg ${config.shadow} mb-3`}
                        >
                          {config.icon}
                        </div>
                        <Text
                          strong
                          className={`text-center text-sm ${
                            isAchieved ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {config.name}
                        </Text>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default MyAchievements;
