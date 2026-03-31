import React, { useEffect, useState } from "react";
import { List, Tag, Typography, Spin, Empty, Space } from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { matchService } from "../../../service/match/matchService";
import { message } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface PlayerMatchHistoryProps {
  userId: string;
}

const PlayerMatchHistory: React.FC<PlayerMatchHistoryProps> = ({ userId }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await matchService.getUserMatchHistory(userId, 1, 10);
        const data = response.result?.data;
        setMatches(data);
      } catch (error) {
        message.error("Không thể tải lịch sử đấu");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spin />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Empty
        description="Người chơi này chưa có lịch sử đấu nào."
        className="py-10"
      />
    );
  }

  return (
    <List
      dataSource={matches}
      renderItem={(match) => (
        <List.Item className="bg-white border border-gray-100 rounded-xl mb-3 p-4 hover:shadow-md transition-shadow">
          <div className="w-full flex justify-between items-center">
            <Space direction="vertical" size={2}>
              <Text strong className="text-base text-gray-800">
                {match.title || `Giao lưu ${match.categoryName}`}
              </Text>

              <Space className="text-xs text-gray-500 mt-1" wrap>
                <span className="flex items-center gap-1">
                  <CalendarOutlined />{" "}
                  {dayjs(match.startTime).format("DD/MM/YYYY HH:mm")}
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <EnvironmentOutlined /> {match.courtName || "Sân thỏa thuận"}
                </span>
              </Space>

              <Space className="mt-2">
                {match.matchType === "RANKED" ? (
                  <Tag color="purple" icon={<TrophyOutlined />}>
                    Đấu Rank
                  </Tag>
                ) : (
                  <Tag color="blue">Giao lưu</Tag>
                )}
              </Space>
            </Space>

            <div className="text-right flex flex-col items-end">
              <Tag
                color="default"
                className="px-3 py-1 font-bold text-sm rounded-lg m-0"
              >
                Đã hoàn thành
              </Tag>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
};

export default PlayerMatchHistory;
