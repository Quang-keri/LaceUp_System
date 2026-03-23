import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Menu,
  Button,
  List,
  Tag,
  Typography,
  Divider,
  Space,
  Spin,
  Tabs,
  Modal,
  Checkbox,
  Avatar,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ManOutlined,
  TrophyOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import matchService from "../../../service/match/matchService.ts";
import { toast } from "react-toastify";
import { matchResultService } from "../../../service/match/matchResultService.ts";

const { Title, Text } = Typography;

const MyMatchPage: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState("2");

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // States cho Modal Chốt kết quả (Phe thắng/Host)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [submittingResult, setSubmittingResult] = useState(false);

  // States cho Modal Duyệt kết quả (Phe thua)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [loadingApproveResult, setLoadingApproveResult] = useState(false);

  const fetchMyMatches = async () => {
    setLoadingData(true);
    try {
      const response = await matchService.getMyMatches(1, 50);
      if (response.code === 1000 || response.code === 0) {
        setMatches(response.result.data || []);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách trận đấu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMyMatches();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
    if (key === "2") {
      // Stay on my-matches page
    } else if (key === "1") {
      navigate("/profile");
    } else if (key === "3") {
      navigate("/booking-history");
    } else if (key === "4") {
      // Navigate to settings
      toast.info("Cài đặt chưa được phát triển");
    } else if (key === "5") {
      // Navigate to security
      toast.info("Bảo mật tài khoản chưa được phát triển");
    } else if (key === "6") {
      // Navigate to linked accounts
      toast.info("Liên kết tài khoản chưa được phát triển");
    }
  };

  // ---------------- XỬ LÝ CHỐT KẾT QUẢ (HOST) ----------------
  const openResultModal = (match: any) => {
    setSelectedMatch(match);
    setWinnerIds([]);
    setIsResultModalOpen(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    if (winnerIds.length === 0) {
      return toast.warning("Vui lòng chọn ít nhất 1 người thắng!");
    }

    const loserIds = (selectedMatch.participants || [])
      .map((p: any) => p.userId)
      .filter((id: string) => !winnerIds.includes(id));

    setSubmittingResult(true);
    try {
      await matchResultService.submitMatchResult(selectedMatch.matchId, {
        winnerIds: winnerIds,
        loserIds: loserIds,
      });
      toast.success("Chốt kết quả thành công, chờ đối thủ duyệt!");
      setIsResultModalOpen(false);
      fetchMyMatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật kết quả");
    } finally {
      setSubmittingResult(false);
    }
  };

  // ---------------- XỬ LÝ DUYỆT KẾT QUẢ (PHE THUA) ----------------
  const openApproveModal = async (match: any) => {
    setSelectedMatch(match);
    setIsApproveModalOpen(true);
    setLoadingApproveResult(true);
    try {
      // Gọi API lấy thông tin kết quả của trận này ra
      const res = await matchResultService.getResultsByMatch(match.matchId);
      // Giả sử backend trả về data trong res.data hoặc res.result
      const results = res.result;

      if (results && results.length > 0) {
        // Lấy kết quả đang chờ duyệt mới nhất
        setPendingResult(results[0]);
      } else {
        toast.warning("Không tìm thấy kết quả chờ duyệt!");
        setIsApproveModalOpen(false);
      }
    } catch (error) {
      toast.error("Không thể tải thông tin kết quả");
      setIsApproveModalOpen(false);
    } finally {
      setLoadingApproveResult(false);
    }
  };

  const handleRespondResult = async (isAccepted: boolean) => {
    // Tùy theo cách DTO trả về ID của result (có thể là .id hoặc .resultId)
    const targetResultId = pendingResult?.id || pendingResult?.resultId;
    if (!targetResultId)
      return toast.error("Không tìm thấy mã kết quả hợp lệ!");

    setSubmittingResult(true);
    try {
      await matchResultService.respondToResult(targetResultId, isAccepted);
      toast.success(
        isAccepted ? "Đã xác nhận kết quả thành công!" : "Đã từ chối kết quả!",
      );
      setIsApproveModalOpen(false);
      fetchMyMatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xử lý kết quả");
    } finally {
      setSubmittingResult(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const menuItems = [
    { key: "1", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "2", icon: <HistoryOutlined />, label: "Trận đấu của tôi" },
    {
      key: "3",
      icon: <HistoryOutlined />,
      label: "Lịch sử đặt sân",
    },
    { key: "4", icon: <SettingOutlined />, label: "Cài đặt" },
    {
      key: "5",
      icon: <SafetyCertificateOutlined />,
      label: "Bảo mật tài khoản",
    },
    { key: "6", icon: <LinkOutlined />, label: "Liên kết tài khoản" },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const renderMatchTypeTag = (
    type: string,
    minRank?: number,
    maxRank?: number,
    winnerPercent?: number,
  ) => {
    if (type === "RANKED")
      return (
        <Tag icon={<TrophyOutlined />} color="purple">
          Rank ({minRank}-{maxRank})
        </Tag>
      );
    if (type === "BET")
      return (
        <Tag icon={<DollarOutlined />} color="gold">
          Kèo ({winnerPercent}%)
        </Tag>
      );
    return <Tag color="blue">Giao lưu</Tag>;
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "OPEN":
      case "CONFIRMED":
      case "FULL":
        return <Tag color="green">Sắp diễn ra</Tag>;
      case "WAITING_RESULT_APPROVAL":
        return <Tag color="orange">Chờ chốt KQ</Tag>;
      case "COMPLETED":
        return <Tag color="default">Đã hoàn thành</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Sắp diễn ra & Chờ xử lý",
      children: (
        <List
          loading={loadingData}
          dataSource={matches.filter((m) =>
            ["OPEN", "CONFIRMED", "FULL", "WAITING_RESULT_APPROVAL"].includes(
              m.status,
            ),
          )}
          renderItem={(match) => (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              }}
            >
              <Row align="middle" justify="space-between">
                <Col xs={24} md={18}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {match.title || `Giao lưu ${match.categoryName}`}
                      </Title>
                      {renderStatusTag(match.status)}
                      {renderMatchTypeTag(
                        match.matchType,
                        match.minRank,
                        match.maxRank,
                        match.winnerPercent,
                      )}
                    </Space>
                    <Space
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        marginTop: 8,
                      }}
                      wrap
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CalendarOutlined />{" "}
                        {new Date(match.startTime).toLocaleDateString("vi-VN")}{" "}
                        ({match.startTime.split("T")[1]?.substring(0, 5)})
                      </span>
                      <Divider type="vertical" />
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ManOutlined />{" "}
                        {match.courtName || match.address || "Tự thỏa thuận"}
                      </span>
                    </Space>
                  </Space>
                </Col>

                <Col
                  xs={24}
                  md={6}
                  style={{ textAlign: "right", marginTop: "10px" }}
                >
                  {match.status === "WAITING_RESULT_APPROVAL" ? (
                    <Button
                      type="primary"
                      danger
                      onClick={() => openApproveModal(match)}
                      style={{ borderRadius: "8px" }}
                    >
                      Duyệt kết quả
                    </Button>
                  ) : match.matchType === "RANKED" ||
                    match.matchType === "BET" ? (
                    <Button
                      type="primary"
                      onClick={() => openResultModal(match)}
                      style={{ borderRadius: "8px", background: "#16a34a" }}
                    >
                      Chốt kết quả
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openResultModal(match)}
                      style={{ borderRadius: "8px" }}
                    >
                      Xem chi tiết
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>
          )}
        />
      ),
    },
    {
      key: "2",
      label: "Đã hoàn thành",
      children: (
        <List
          loading={loadingData}
          dataSource={matches.filter((m) => m.status === "COMPLETED")}
          renderItem={(match) => (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: "12px",
                background: "#f8fafc",
                border: "none",
              }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <Text
                        strong
                        style={{ color: "#475569", fontSize: "16px" }}
                      >
                        {match.title || `Giao lưu ${match.categoryName}`}
                      </Text>
                      {renderStatusTag(match.status)}
                      {renderMatchTypeTag(
                        match.matchType,
                        match.minRank,
                        match.maxRank,
                        match.winnerPercent,
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: "13px" }}>
                      {new Date(match.startTime).toLocaleDateString("vi-VN")} •{" "}
                      {match.courtName || match.address}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Button onClick={() => openResultModal(match)} type="link">
                    Chi tiết
                  </Button>
                </Col>
              </Row>
            </Card>
          )}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={8} lg={6}>
          <Card
            style={{ borderRadius: "12px", textAlign: "center" }}
            bordered={false}
          >
            <Title level={4} style={{ margin: 0 }}>
              {user ? `${user.userName}` : "N/A"}
            </Title>
            <Text type="secondary">Thành viên thân thiết</Text>
            <Divider style={{ margin: "16px 0" }} />
            <Menu
              mode="inline"
              selectedKeys={[selectedMenu]}
              items={menuItems}
              onClick={(e) => handleMenuClick(e.key)}
              style={{ borderRight: "none", textAlign: "left" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card
            title={
              <span style={{ fontSize: "20px", fontWeight: 600 }}>
                Trận đấu của tôi
              </span>
            }
            bordered={false}
            style={{ borderRadius: "12px", height: "100%" }}
          >
            <Tabs defaultActiveKey="1" items={tabItems} />
          </Card>
        </Col>
      </Row>

      {/* MODAL 1: CHỐT KẾT QUẢ / XEM CHI TIẾT */}
      <Modal
        title={
          <div className="text-xl font-bold text-gray-800">
            {selectedMatch?.matchType === "NORMAL"
              ? "Chi tiết người tham gia"
              : "🏆 Chốt kết quả trận đấu"}
          </div>
        }
        open={isResultModalOpen}
        onCancel={() => setIsResultModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        {selectedMatch && (
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <p className="text-sm text-gray-500 mb-1">Trận đấu</p>
              <p className="font-bold text-gray-800 text-base">
                {selectedMatch.title ||
                  `Giao lưu ${selectedMatch.categoryName}`}
              </p>

              {selectedMatch.matchType === "BET" && (
                <p className="text-yellow-600 text-sm mt-2 font-semibold">
                  💰 Kèo chia tiền: Phe thắng trả {selectedMatch.winnerPercent}
                  %, Phe thua trả {100 - selectedMatch.winnerPercent}%
                </p>
              )}
            </div>

            <p className="font-bold text-gray-800 mb-3">
              Danh sách người chơi ({selectedMatch.participants?.length || 0}/
              {selectedMatch.maxPlayers})
            </p>

            <div className="w-full">
              <List
                dataSource={selectedMatch.participants || []}
                renderItem={(player: any) => (
                  <List.Item
                    className={`transition-colors rounded-xl px-4 py-2 mb-2 border ${
                      winnerIds.includes(player.userId)
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                    actions={[
                      (selectedMatch.matchType === "RANKED" ||
                        selectedMatch.matchType === "BET") &&
                      selectedMatch.status !== "COMPLETED" ? (
                        <Checkbox
                          checked={winnerIds.includes(player.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWinnerIds([...winnerIds, player.userId]);
                            } else {
                              setWinnerIds(
                                winnerIds.filter((id) => id !== player.userId),
                              );
                            }
                          }}
                        >
                          <span
                            className={
                              winnerIds.includes(player.userId)
                                ? "text-blue-600 font-bold"
                                : "text-gray-500"
                            }
                          >
                            Phe Thắng
                          </span>
                        </Checkbox>
                      ) : selectedMatch.status === "COMPLETED" ? (
                        <span className="text-gray-400 text-sm italic">
                          Đã chốt
                        </span>
                      ) : null,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={player.avatarUrl} className="bg-blue-600">
                          {player.userName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <span className="font-semibold text-gray-800 break-words">
                          {player.userName}
                        </span>
                      }
                      description={
                        <span className="text-xs text-gray-500">
                          Rank: {player.rankPoint || 3000}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            {(selectedMatch.matchType === "RANKED" ||
              selectedMatch.matchType === "BET") &&
              selectedMatch.status !== "COMPLETED" && (
                <div className="mt-8 flex justify-end gap-3">
                  <Button onClick={() => setIsResultModalOpen(false)}>
                    Đóng
                  </Button>
                  <Button
                    type="primary"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSubmitResult}
                    loading={submittingResult}
                  >
                    Lưu kết quả
                  </Button>
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* MODAL 2: DUYỆT KẾT QUẢ (DÀNH CHO PHE THUA) */}
      <Modal
        title={
          <div className="text-xl font-bold text-orange-600">
            ⚖️ Duyệt kết quả trận đấu
          </div>
        }
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        footer={null}
        width={400}
        centered
      >
        {loadingApproveResult ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
            <p className="mt-2 text-gray-500">Đang tải thông tin kết quả...</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
              <p className="text-sm text-gray-600 text-center">
                Đối thủ đã gửi yêu cầu chốt kết quả trận đấu{" "}
                <strong>{selectedMatch?.title}</strong>. Vui lòng xác nhận để
                hoàn tất hệ thống tính điểm/trừ tiền.
              </p>
            </div>

            {/* Bạn có thể bổ sung hiển thị danh sách người thắng/thua ở đây dựa vào pendingResult nếu backend có trả về */}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                danger
                onClick={() => handleRespondResult(false)}
                loading={submittingResult}
              >
                Từ chối kết quả
              </Button>
              <Button
                type="primary"
                onClick={() => handleRespondResult(true)}
                loading={submittingResult}
              >
                Xác nhận đúng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyMatchPage;
