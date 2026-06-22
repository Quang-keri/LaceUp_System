import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Spin,
  Typography,
  Empty,
  Progress,
  Tabs,
  Select,
  Table,
  Space,
  Avatar,
  Tag,
} from "antd";
import { TrophyOutlined, CrownFilled, FireOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext";
import userService from "../../../service/userService";
import type { UserDashboardResponse } from "../../../types/user";
import leaderboardService from "../../../service/leaderboardService";

const { Title, Text } = Typography;
const { Option } = Select;

const MyRanks: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<UserDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State cho Bảng xếp hạng
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [top100, setTop100] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Lấy dữ liệu cá nhân ban đầu
  useEffect(() => {
    if (user?.userId) {
      userService
        .getUserDashboard(user.userId)
        .then((res) => {
          setDashboardData(res.result);
          // Set mặc định chọn bộ môn đầu tiên cho Bảng xếp hạng nếu có
          if (
            res.result?.categoryRanks &&
            res.result.categoryRanks.length > 0
          ) {
            setSelectedCategory(res.result.categoryRanks[0].categoryId);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Lấy dữ liệu Bảng xếp hạng khi chọn bộ môn
  useEffect(() => {
    if (selectedCategory) {
      fetchLeaderboardData(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchLeaderboardData = async (categoryId: number) => {
    setLoadingLeaderboard(true);
    try {
      const [top100Res, myStatsRes] = await Promise.all([
        leaderboardService.getTop100ByCategory(categoryId),
        leaderboardService.getMyLeaderboardStats(categoryId),
      ]);

      if (top100Res.code === 200) setTop100(top100Res.result || []);
      if (myStatsRes.code === 200) setMyStats(myStatsRes.result || null);
    } catch (error) {
      console.error("Lỗi khi tải bảng xếp hạng:", error);
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

  // Cột cho bảng Top 100
  const columns = [
    {
      title: "Hạng",
      key: "rank",
      width: 80,
      align: "center" as const,
      render: (_: any, __: any, index: number) => {
        const rank = index + 1;
        if (rank === 1)
          return <CrownFilled className="text-3xl text-yellow-500" />;
        if (rank === 2)
          return <CrownFilled className="text-3xl text-gray-400" />;
        if (rank === 3)
          return <CrownFilled className="text-3xl text-orange-600" />;
        return (
          <Text strong className="text-gray-500 text-lg">
            {rank}
          </Text>
        );
      },
    },
    {
      title: "Người chơi",
      key: "user",
      render: (record: any) => (
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
      render: (record: any) => {
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
      render: (record: any) => (
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

  // TAB 1: THỐNG KÊ CÁ NHÂN
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
                      strokeColor={{ "0%": "#a855f7", "100%": "#f97316" }} // Chuyển sắc Tím -> Cam
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );

  // TAB 2: BẢNG XẾP HẠNG
  const renderLeaderboard = () => (
    <div className="pt-2">
      <div className="flex justify-between items-center mb-6">
        <Title level={5} className="m-0 text-purple-800">
          <TrophyOutlined className="mr-2 text-orange-500" />
          Top 100 Cao Thủ
        </Title>
        <Select
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={{ width: 200 }}
          placeholder="Chọn bộ môn"
          className="rounded-lg"
        >
          {dashboardData?.categoryRanks?.map((cat) => (
            <Option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </Option>
          ))}
        </Select>
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
        dataSource={top100}
        columns={columns}
        rowKey="userId"
        pagination={false}
        loading={loadingLeaderboard}
        className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
        rowClassName={(record) =>
          record.userId === user?.userId ? "bg-orange-50" : ""
        }
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
