import React, { useContext, useEffect, useState } from "react";
import { TrophyOutlined, FireOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext";
import userService from "../../../service/userService";
import leaderboardService from "../../../service/leaderboardService";
import type { UserDashboardResponse } from "../../../types/user";
import { CategoryContext } from "../../../context/CategoryContext";
import {
  Avatar,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";

const { Title, Text } = Typography;

interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string | null;
  rankPoint: number;
  displayRank: string;
  winRate: number;
  currentWinStreak: number;
  totalMatches: number;
  stt?: number;
  isAppendedMe?: boolean;
}

interface MyLeaderboardStats {
  currentRankPosition: number;
  totalUsersInCategory: number;
  topPercentage: number;
  myStats: LeaderboardEntry | null;
}

const MyRanks: React.FC = () => {
  const { user } = useAuth();
  const { categories, loading: isCategoryLoading } =
    useContext(CategoryContext);

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [dashboardData, setDashboardData] =
    useState<UserDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Định nghĩa kiểu dữ liệu rõ ràng cho State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [myStats, setMyStats] = useState<MyLeaderboardStats | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].categoryId);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (user?.userId) {
      userService
        .getUserDashboard(user.userId)
        .then((res) => {
          setDashboardData(res.result);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchLeaderboardData(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const fetchLeaderboardData = async (categoryId: string) => {
    setLoadingLeaderboard(true);
    try {
      // 1. Gọi API lấy dữ liệu Top 100 trước
      const top100Res = await leaderboardService.getTop100ByCategory(
        categoryId as any,
      );
      let allTop: LeaderboardEntry[] = [];

      if (top100Res && top100Res.code === 200) {
        allTop = top100Res.result || [];
      }

      // Xử lý cắt lấy Top 10 ban đầu
      const displayData: LeaderboardEntry[] = allTop
        .slice(0, 10)
        .map((item, index: number) => ({
          ...item,
          stt: index + 1,
        }));

      let stats: MyLeaderboardStats | null = null;
      try {
        const myStatsRes = await leaderboardService.getMyLeaderboardStats(
          categoryId as any,
        );
        if (myStatsRes && myStatsRes.code === 200) {
          stats = myStatsRes.result || null;
        }
      } catch (e) {
        console.error(
          "Không lấy được thứ hạng cá nhân (User chưa phân hạng hoặc lỗi API):",
          e,
        );
      }

      if (stats) {
        const amIInTop10 = displayData.some(
          (item) => item.userId === user?.userId,
        );

        if (!amIInTop10 && stats.myStats) {
          displayData.push({
            ...stats.myStats,
            stt: stats.currentRankPosition,
            isAppendedMe: true,
          });
        }
      }

      setLeaderboardData(displayData);
      setMyStats(stats);
    } catch (error) {
      console.error("Lỗi nghiêm trọng khi tải bảng xếp hạng:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getRankInfo = (points: number = 0) => {
    if (points >= 3000)
      return { name: "Cao Thủ", color: "purple", image: "/master.png" };
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
      name: `Sắt ${5 - Math.floor(points / 100)}`,
      color: "default",
      image: "/iron.png",
    };
  };

  // Định nghĩa chặt chẽ kiểu dữ liệu cho các cột dữ liệu Table
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 80,
      align: "center" as const,
      render: (record: LeaderboardEntry) => {
        const stt = record.stt;
        if (stt === 1)
          return (
            <Avatar
              style={{
                backgroundColor: "#eab308",
                color: "white",
                fontWeight: "bold",
              }}
            >
              1
            </Avatar>
          );
        if (stt === 2)
          return (
            <Avatar
              style={{
                backgroundColor: "#9ca3af",
                color: "white",
                fontWeight: "bold",
              }}
            >
              2
            </Avatar>
          );
        if (stt === 3)
          return (
            <Avatar
              style={{
                backgroundColor: "#ea580c",
                color: "white",
                fontWeight: "bold",
              }}
            >
              3
            </Avatar>
          );
        return (
          <Text strong className="text-gray-500 text-lg">
            {stt}
          </Text>
        );
      },
    },
    {
      title: "Người chơi",
      key: "user",
      render: (record: LeaderboardEntry) => (
        <Space>
          <Avatar
            src={
              record.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.userName}`
            }
          />
          <Text
            strong
            className={record.userId === user?.userId ? "text-orange-600" : ""}
          >
            {record.userName} {record.userId === user?.userId && "(Bạn)"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Cấp bậc",
      key: "rankLevel",
      render: (record: LeaderboardEntry) => {
        const rankInfo = getRankInfo(record.rankPoint);
        return (
          <Space>
            <img
              src={rankInfo.image}
              alt="rank"
              className="w-8 h-8 object-contain"
            />
            <Text
              strong
              style={{
                color:
                  rankInfo.color === "default" ? "#6b7280" : rankInfo.color,
              }}
            >
              {rankInfo.name}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Điểm xếp hạng",
      dataIndex: "rankPoint",
      key: "rankPoint",
      align: "center" as const,
      render: (val: number) => (
        <Tag
          color="purple"
          className="text-sm font-bold border-none bg-purple-100 text-purple-700"
        >
          {val} Đ
        </Tag>
      ),
    },
    {
      title: "Tỉ lệ thắng",
      key: "winRate",
      align: "center" as const,
      render: (record: LeaderboardEntry) => (
        <Space direction="vertical" size={0} className="w-full items-center">
          <Text className="text-xs text-gray-500">
            {record.totalMatches} trận
          </Text>
          <Text
            strong
            className={
              record.winRate >= 60 ? "text-orange-500" : "text-gray-600"
            }
          >
            {record.winRate}% <FireOutlined />
          </Text>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Card
        bordered={false}
        style={{ borderRadius: "12px", minHeight: "400px" }}
      >
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const renderPersonalStats = () =>
    !dashboardData?.categoryRanks ||
    dashboardData.categoryRanks.length === 0 ? (
      <Empty description="Bạn chưa tham gia trận xếp hạng nào." />
    ) : (
      <Row gutter={[16, 16]}>
        {dashboardData.categoryRanks.map((item) => {
          const rankInfo = getRankInfo(item.rankPoint);
          return (
            <Col xs={24} sm={12} lg={12} key={item.categoryId}>
              <Card className="shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <img
                    src={rankInfo.image}
                    alt="rank"
                    className="w-20 h-20 object-contain drop-shadow-md"
                  />
                  <div className="flex-1">
                    <Text strong className="text-lg text-purple-700 block mb-1">
                      {item.categoryName}
                    </Text>
                    <Text strong className="text-gray-800 block text-base">
                      {rankInfo.name} -{" "}
                      <span className="text-orange-600">
                        {item.rankPoint} Đ
                      </span>
                    </Text>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Số trận: {item.totalMatches}</span>
                      <span>Tỉ lệ thắng: {item.winRate}%</span>
                    </div>
                    <Progress
                      percent={item.winRate}
                      size="small"
                      showInfo={false}
                      strokeColor={{ "0%": "#a855f7", "100%": "#f97316" }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );

  const renderLeaderboard = () => (
    <div className="pt-2">
      <div className="flex justify-between items-center mb-6">
        <Title level={5} className="m-0 text-purple-800">
          <TrophyOutlined className="mr-2 text-orange-500" />
          Top 10 Cao Thủ
        </Title>
        <Select
          placeholder="Chọn bộ môn"
          style={{ width: 200 }}
          value={selectedCategoryId}
          onChange={(value) => setSelectedCategoryId(value)}
          loading={isCategoryLoading || loadingLeaderboard}
          options={categories.map((cat) => ({
            value: cat.categoryId,
            label: cat.categoryName,
          }))}
        />
      </div>

      {myStats && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-xl">
          <Row align="middle" justify="space-between">
            <Col>
              <Text className="text-gray-600">Thứ hạng hiện tại của bạn:</Text>
              <br />
              <Title level={3} className="m-0 text-purple-700">
                Hạng {myStats.currentRankPosition}
              </Title>
            </Col>
            <Col className="text-right">
              <Text className="text-gray-600">Vượt qua</Text>
              <br />
              <Tag
                color="orange"
                className="m-0 text-lg py-1 px-3 rounded-lg font-bold"
              >
                Top {myStats.topPercentage}%
              </Tag>
            </Col>
          </Row>
        </Card>
      )}

      <Table
        dataSource={leaderboardData}
        columns={columns}
        rowKey={(record: LeaderboardEntry) =>
          record.userId + (record.isAppendedMe ? "_me" : "")
        }
        pagination={false}
        loading={loadingLeaderboard}
        className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
        rowClassName={(record: LeaderboardEntry) => {
          let classes = record.userId === user?.userId ? "bg-orange-50" : "";
          if (record.isAppendedMe)
            classes += " border-t-2 border-dashed border-orange-300";
          return classes;
        }}
      />
    </div>
  );

  return (
    <Card
      bordered={false}
      style={{ borderRadius: "12px", minHeight: "400px", padding: "0" }}
      bodyStyle={{ paddingTop: 0 }}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: (
              <span className="font-semibold text-base">Thống kê của tôi</span>
            ),
            children: renderPersonalStats(),
          },
          {
            key: "2",
            label: (
              <span className="font-semibold text-base">Bảng xếp hạng</span>
            ),
            children: renderLeaderboard(),
          },
        ]}
      />
    </Card>
  );
};

export default MyRanks;
