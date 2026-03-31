import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
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
  Button,
} from "antd";
import {
  CalendarOutlined,
  ManOutlined,
  TrophyOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import matchService from "../../../service/match/matchService.ts";
import { message } from "antd";
import { matchResultService } from "../../../service/match/matchResultService.ts";

import UserSidebar from "../../../components/sidebar/UserSidebar.tsx";

const { Title, Text } = Typography;

const MyMatchPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const selectedMenu = "2";

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [confirmingDepositId, setConfirmingDepositId] = useState<string | null>(
    null,
  );

  // States cho Modal Chốt kết quả (Phe thắng/Host)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [submittingResult, setSubmittingResult] = useState(false);

  // States cho Modal Duyệt kết quả (Phe thua)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [loadingApproveResult, setLoadingApproveResult] = useState(false);
  const [isSubmitter, setIsSubmitter] = useState(false);

  const fetchMyMatches = async () => {
    setLoadingData(true);
    try {
      const response = await matchService.getMyMatches(1, 50);
      if (response.code === 200) {
        setMatches(response.result.data || []);
      }
    } catch (error) {
      message.error("Không thể tải danh sách trận đấu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMyMatches();
  }, []);

  // ---------------- XÁC NHẬN CỌC ----------------
  const handleConfirmDeposit = async (matchId: string) => {
    setConfirmingDepositId(matchId);
    try {
      const response = await matchService.confirmDeposit(matchId);
      if (response.code === 200) {
        message.success("Đã xác nhận cọc thành công!");
        fetchMyMatches();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi xác nhận cọc");
    } finally {
      setConfirmingDepositId(null);
    }
  };

  // ---------------- XỬ LÝ CHỐT KẾT QUẢ (HOST/PHE THẮNG) ----------------
  const openResultModal = (match: any) => {
    setSelectedMatch(match);
    setWinnerIds([]);
    setIsResultModalOpen(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    if (winnerIds.length === 0) {
      return message.warning("Vui lòng chọn ít nhất 1 người thắng!");
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
      message.success("Chốt kết quả thành công, chờ đối thủ duyệt!");
      setIsResultModalOpen(false);
      fetchMyMatches();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi cập nhật kết quả");
    } finally {
      setSubmittingResult(false);
    }
  };

  // ---------------- XỬ LÝ DUYỆT KẾT QUẢ (PHE THUA / ĐỐI THỦ) ----------------
  const openApproveModal = async (match: any) => {
    setSelectedMatch(match);
    setIsApproveModalOpen(true);
    setLoadingApproveResult(true);
    setIsSubmitter(false);
    try {
      const res = await matchResultService.getResultsByMatch(match.matchId);
      const results = res.result;

      if (results && results.length > 0) {
        const resultItem = results[0];
        setPendingResult(resultItem);

        if (resultItem.submitterId === user?.userId) {
          setIsSubmitter(true);
        }
      } else {
        message.warning("Không tìm thấy kết quả chờ duyệt!");
        setIsApproveModalOpen(false);
      }
    } catch (error) {
      message.error("Không thể tải thông tin kết quả");
      setIsApproveModalOpen(false);
    } finally {
      setLoadingApproveResult(false);
    }
  };

  const handleRespondResult = async (isAccepted: boolean) => {
    const targetResultId = pendingResult?.id || pendingResult?.resultId;
    if (!targetResultId)
      return message.error("Không tìm thấy mã kết quả hợp lệ!");

    setSubmittingResult(true);
    try {
      await matchResultService.respondToResult(targetResultId, isAccepted);
      message.success(
        isAccepted ? "Đã xác nhận kết quả thành công!" : "Đã từ chối kết quả!",
      );
      setIsApproveModalOpen(false);
      fetchMyMatches();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi xử lý kết quả");
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
      case "WAITING_DEPOSIT":
        return <Tag color="warning">Chờ chốt cọc</Tag>;
      case "WAITING_RESULT_APPROVAL":
        return <Tag color="orange">Chờ đối thủ duyệt KQ</Tag>;
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
            [
              "OPEN",
              "CONFIRMED",
              "FULL",
              "WAITING_DEPOSIT", // <--- Thêm trạng thái này vào filter
              "WAITING_RESULT_APPROVAL",
            ].includes(m.status),
          )}
          renderItem={(match) => {
            const myParticipantInfo = match.participants?.find(
              (p: any) => p.userId === user?.userId,
            );

            return (
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
                          {formatMatchDate(match.startTime)} (
                          {formatMatchTime(match.startTime)})
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
                          {match.courtName ||
                            (typeof match.address === "object"
                              ? `${match.address.ward}, ${match.address.district}`
                              : match.address) ||
                            "Tự thỏa thuận"}
                        </span>
                      </Space>
                    </Space>
                  </Col>

                  <Col
                    xs={24}
                    md={6}
                    style={{ textAlign: "right", marginTop: "10px" }}
                  >
                    {match.status === "WAITING_DEPOSIT" ? (
                      myParticipantInfo?.depositConfirmed ? (
                        <Button
                          disabled
                          style={{
                            borderRadius: "8px",
                            background: "#f0fdf4",
                            color: "#16a34a",
                            borderColor: "#bbf7d0",
                          }}
                        >
                          Đã xác nhận cọc
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          loading={confirmingDepositId === match.matchId}
                          onClick={() => handleConfirmDeposit(match.matchId)}
                          style={{
                            borderRadius: "8px",
                            background: "#f97316",
                            borderColor: "#f97316",
                          }}
                        >
                          Xác nhận cọc
                        </Button>
                      )
                    ) : match.status === "WAITING_RESULT_APPROVAL" ? (
                      <Button
                        type="primary"
                        onClick={() => openApproveModal(match)}
                        style={{ borderRadius: "8px", background: "#f59e0b" }}
                      >
                        Xem trạng thái duyệt
                      </Button>
                    ) : (match.matchType === "RANKED" ||
                        match.matchType === "BET") &&
                      (match.status === "FULL" ||
                        match.status === "CONFIRMED") ? (
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
            );
          }}
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

  const formatMatchDate = (timeArray: any) => {
    if (Array.isArray(timeArray)) {
      const [year, month, day] = timeArray;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year}`;
    }
    return "N/A";
  };

  const formatMatchTime = (timeArray: any) => {
    if (Array.isArray(timeArray)) {
      const [, , , hour, minute] = timeArray;
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }
    return "--:--";
  };

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
          <UserSidebar selectedKey={selectedMenu} />
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

      {/* MODAL 2: DUYỆT KẾT QUẢ / HOẶC THÔNG BÁO CHỜ DUYỆT */}
      <Modal
        title={
          <div className="text-xl font-bold text-orange-600">
            {isSubmitter
              ? "⏳ Trạng thái kết quả"
              : "⚖️ Duyệt kết quả trận đấu"}
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
            {isSubmitter ? (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
                <p className="text-4xl mb-3">🕒</p>
                <p className="text-blue-800 font-semibold mb-2">
                  Bạn đã gửi kết quả thành công!
                </p>
                <p className="text-sm text-blue-600">
                  Vui lòng chờ đối thủ xác nhận để hệ thống hoàn tất việc cộng
                  điểm/trừ tiền.
                </p>
                <Button
                  type="primary"
                  className="mt-6 w-full"
                  onClick={() => setIsApproveModalOpen(false)}
                >
                  Đóng
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-gray-600 text-center">
                    Đối thủ đã gửi yêu cầu chốt kết quả trận đấu{" "}
                    <strong>{selectedMatch?.title}</strong>. Vui lòng xác nhận
                    để hoàn tất hệ thống tính điểm/trừ tiền.
                  </p>
                </div>

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
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyMatchPage;
