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
  Avatar,
  Button,
  Radio,
} from "antd";
import {
  CalendarOutlined,
  ManOutlined,
  TrophyOutlined,
  DollarOutlined,
  WarningOutlined,
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

  // States cho Modal Chốt kết quả & Chia đội
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const [winningTeamNumber, setWinningTeamNumber] = useState<number | null>(
    null,
  );
  const [submittingResult, setSubmittingResult] = useState(false);

  // States lấy kết quả trận đã kết thúc
  const [matchResultData, setMatchResultData] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // States cho mọi người tự chọn đội
  const [teamAssignments, setTeamAssignments] = useState<
    Record<string, number>
  >({});
  const [loadingDivide, setLoadingDivide] = useState(false);

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

  // Đồng bộ lại Selected Match
  useEffect(() => {
    if (selectedMatch) {
      const updatedMatch = matches.find(
        (m) => m.matchId === selectedMatch.matchId,
      );
      if (updatedMatch) {
        setSelectedMatch(updatedMatch);
        const currentAssignments: Record<string, number> = {};
        updatedMatch.participants?.forEach((p: any) => {
          if (p.teamNumber) currentAssignments[p.userId] = p.teamNumber;
        });
        setTeamAssignments(currentAssignments);
      }
    }
  }, [matches]);

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

  // Mở modal chi tiết & Tự động gọi API lấy kết quả nếu trận COMPLETED
  const openResultModal = async (match: any) => {
    setSelectedMatch(match);
    setWinningTeamNumber(null);
    setMatchResultData(null); // Reset dữ liệu cũ

    const initial: Record<string, number> = {};
    match.participants?.forEach((p: any) => {
      if (p.teamNumber) initial[p.userId] = p.teamNumber;
    });
    setTeamAssignments(initial);

    setIsResultModalOpen(true);

    // GỌI API LẤY KẾT QUẢ CHO TRẬN HOÀN THÀNH
    if (match.status === "COMPLETED") {
      setLoadingResult(true);
      try {
        const res = await matchResultService.getResultsByMatch(match.matchId);
        if (res.result && res.result.length > 0) {
          setMatchResultData(res.result[0]);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin kết quả:", error);
      } finally {
        setLoadingResult(false);
      }
    }
  };

  const handleSaveMyTeam = async () => {
    const team1UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 1,
    );
    const team2UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 2,
    );

    const maxPerTeam = Math.ceil((selectedMatch?.maxPlayers || 4) / 2);
    if (team1UserIds.length > maxPerTeam)
      return message.warning(`Đội 1 đã đầy! Tối đa ${maxPerTeam} người/đội.`);
    if (team2UserIds.length > maxPerTeam)
      return message.warning(`Đội 2 đã đầy! Tối đa ${maxPerTeam} người/đội.`);

    setLoadingDivide(true);
    try {
      await matchService.divideTeams(selectedMatch.matchId, {
        team1UserIds,
        team2UserIds,
      });
      message.success("Đã cập nhật đội của bạn thành công!");
      fetchMyMatches();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi lưu đội");
    } finally {
      setLoadingDivide(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;
    if (!winningTeamNumber)
      return message.warning("Vui lòng chọn đội chiến thắng!");

    setSubmittingResult(true);
    try {
      await matchResultService.submitMatchResult(
        selectedMatch.matchId,
        winningTeamNumber,
      );
      message.success("Chốt kết quả thành công, chờ đối thủ duyệt!");
      setIsResultModalOpen(false);
      fetchMyMatches();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi cập nhật kết quả");
    } finally {
      setSubmittingResult(false);
    }
  };

  const openApproveModal = async (match: any) => {
    setSelectedMatch(match);
    setIsApproveModalOpen(true);
    setLoadingApproveResult(true);
    setIsSubmitter(false);
    try {
      const res = await matchResultService.getResultsByMatch(match.matchId);
      if (res.result && res.result.length > 0) {
        setPendingResult(res.result[0]);
        if (res.result[0].submitterId === user?.userId) setIsSubmitter(true);
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

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );

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
              "WAITING_DEPOSIT",
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
                          {Array.isArray(match.startTime)
                            ? `${match.startTime[2]
                                .toString()
                                .padStart(2, "0")}/${match.startTime[1]
                                .toString()
                                .padStart(2, "0")}/${match.startTime[0]}`
                            : new Date(match.startTime).toLocaleDateString(
                                "vi-VN",
                              )}
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
                        Chốt kết quả / Chọn đội
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
                      {Array.isArray(match.startTime)
                        ? `${match.startTime[2]
                            .toString()
                            .padStart(2, "0")}/${match.startTime[1]
                            .toString()
                            .padStart(2, "0")}/${match.startTime[0]}`
                        : new Date(match.startTime).toLocaleDateString(
                            "vi-VN",
                          )}{" "}
                      • {match.courtName || match.address}
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

      {/* MODAL 1: XEM CHI TIẾT / CHỌN ĐỘI / CHỐT KẾT QUẢ */}
      <Modal
        title={
          <div className="text-xl font-bold text-gray-800">
            {selectedMatch?.status === "COMPLETED"
              ? "Chi tiết kết quả"
              : selectedMatch?.matchType === "NORMAL"
              ? "Chi tiết trận đấu"
              : "🏆 Chốt kết quả & Đội hình"}
          </div>
        }
        open={isResultModalOpen}
        onCancel={() => setIsResultModalOpen(false)}
        footer={null}
        width={550}
        centered
      >
        {selectedMatch && (
          <div className="mt-4">
            {/* THÔNG TIN TRẬN */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Trận đấu</p>
              <p className="font-bold text-gray-800 text-base">
                {selectedMatch.title ||
                  `Giao lưu ${selectedMatch.categoryName}`}
              </p>
              {selectedMatch.matchType === "BET" && (
                <p className="text-yellow-600 text-sm mt-2 font-semibold">
                  Kèo chia tiền: Phe thắng trả {selectedMatch.winnerPercent}
                  %, Phe thua trả {100 - selectedMatch.winnerPercent}%
                </p>
              )}
            </div>

            <div className="w-full">
              {(() => {
                const team1 =
                  selectedMatch.participants?.filter(
                    (p: any) => p.teamNumber === 1,
                  ) || [];
                const team2 =
                  selectedMatch.participants?.filter(
                    (p: any) => p.teamNumber === 2,
                  ) || [];
                const unassigned =
                  selectedMatch.participants?.filter(
                    (p: any) => !p.teamNumber,
                  ) || [];
                const isNeedSubmit =
                  (selectedMatch.matchType === "RANKED" ||
                    selectedMatch.matchType === "BET") &&
                  selectedMatch.status !== "COMPLETED";

                const maxPerTeam = Math.ceil(
                  (selectedMatch.maxPlayers || 4) / 2,
                );
                const currentTeam1Count = Object.values(teamAssignments).filter(
                  (t) => t === 1,
                ).length;
                const currentTeam2Count = Object.values(teamAssignments).filter(
                  (t) => t === 2,
                ).length;
                const isTeam1Full = currentTeam1Count >= maxPerTeam;
                const isTeam2Full = currentTeam2Count >= maxPerTeam;

                const myParticipantInfo = selectedMatch.participants?.find(
                  (p: any) => p.userId === user?.userId,
                );
                const isMyTeamChanged =
                  teamAssignments[user?.userId as string] !==
                  myParticipantInfo?.teamNumber;

                // LOGIC TÌM ĐỘI CHIẾN THẮNG
                let finalWinningTeam: number | null = null;
                if (matchResultData) {
                  if (matchResultData.winningTeamNumber) {
                    finalWinningTeam = matchResultData.winningTeamNumber;
                  } else if (
                    matchResultData.winnerIds &&
                    matchResultData.winnerIds.length > 0
                  ) {
                    const sampleWinner = selectedMatch.participants?.find(
                      (p: any) => p.userId === matchResultData.winnerIds[0],
                    );
                    finalWinningTeam = sampleWinner?.teamNumber || null;
                  }
                }

                return (
                  <>
                    {/* KHU VỰC HIỂN THỊ ĐỘI CHIẾN THẮNG (KHI COMPLETED) */}
                    {selectedMatch.status === "COMPLETED" &&
                      (loadingResult ? (
                        <div className="flex justify-center p-4 mb-4">
                          <Spin />
                        </div>
                      ) : finalWinningTeam ? (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 text-center shadow-sm">
                          <p className="text-3xl mb-1 m-0"></p>
                          <p className="font-extrabold text-green-700 text-lg m-0 uppercase tracking-wide">
                            Đội {finalWinningTeam} Chiến Thắng
                          </p>
                        </div>
                      ) : null)}

                    {/* BẢNG CHỌN ĐỘI THẮNG ĐỂ CHỐT KẾT QUẢ */}
                    {isNeedSubmit && unassigned.length === 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-800 m-0">
                            Vui lòng chọn đội chiến thắng:
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div
                            onClick={() => setWinningTeamNumber(1)}
                            className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              winningTeamNumber === 1
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-100 bg-white hover:border-blue-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`font-bold text-base ${
                                  winningTeamNumber === 1
                                    ? "text-blue-700"
                                    : "text-gray-700"
                                }`}
                              >
                                Đội 1
                              </span>
                              <Radio checked={winningTeamNumber === 1} />
                            </div>
                            <div className="text-xs text-gray-500">
                              {team1.map((p: any) => p.userName).join(", ")}
                            </div>
                          </div>
                          <div
                            onClick={() => setWinningTeamNumber(2)}
                            className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              winningTeamNumber === 2
                                ? "border-purple-500 bg-purple-50 shadow-sm"
                                : "border-gray-100 bg-white hover:border-purple-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`font-bold text-base ${
                                  winningTeamNumber === 2
                                    ? "text-purple-700"
                                    : "text-gray-700"
                                }`}
                              >
                                Đội 2
                              </span>
                              <Radio checked={winningTeamNumber === 2} />
                            </div>
                            <div className="text-xs text-gray-500">
                              {team2.map((p: any) => p.userName).join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CẢNH BÁO NẾU CÓ NGƯỜI CHƯA CHỌN ĐỘI */}
                    {isNeedSubmit && unassigned.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4 text-orange-700 flex items-start gap-2">
                        <WarningOutlined className="mt-1" />
                        <p className="text-sm m-0 leading-tight">
                          Đang có {unassigned.length} người chơi chưa chọn đội.{" "}
                          <br />
                          <span className="font-semibold">
                            Bắt buộc tất cả phải chọn đội thì mới có thể chốt
                            kết quả!
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-gray-800 m-0">
                        Danh sách người chơi
                      </p>
                      <Text className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">
                        {selectedMatch.currentPlayers} /{" "}
                        {selectedMatch.maxPlayers}
                      </Text>
                    </div>

                    {/* LIST NGƯỜI CHƠI */}
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <List
                        dataSource={selectedMatch.participants || []}
                        renderItem={(player: any) => {
                          const isMe = player.userId === user?.userId;

                          // Kiểm tra người này thắng hay thua
                          const isPlayerWinner =
                            finalWinningTeam &&
                            player.teamNumber === finalWinningTeam;
                          const isPlayerLoser =
                            finalWinningTeam &&
                            player.teamNumber &&
                            player.teamNumber !== finalWinningTeam;

                          return (
                            <List.Item
                              className={`border border-gray-200 transition-colors rounded-lg px-3 py-2 mb-2 flex-col items-start ${
                                isMe
                                  ? "bg-indigo-50 border-indigo-200"
                                  : "bg-white"
                              }`}
                            >
                              <div className="flex w-full justify-between items-center">
                                <List.Item.Meta
                                  avatar={
                                    <Avatar className="bg-blue-600">
                                      {player.userName?.charAt(0)}
                                    </Avatar>
                                  }
                                  title={
                                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                                      {player.userName}{" "}
                                      {isMe && (
                                        <span className="text-indigo-600 text-xs">
                                          (Bạn)
                                        </span>
                                      )}
                                    </span>
                                  }
                                  description={
                                    <span className="text-xs text-gray-500">
                                      Rank: {player.rankPoint || 3000}
                                    </span>
                                  }
                                />

                                {/* CHỖ CHỌN ĐỘI HOẶC HIỆN KẾT QUẢ THẮNG/THUA */}
                                <div className="ml-2 shrink-0 flex items-center gap-2">
                                  {isMe &&
                                  selectedMatch.status !== "COMPLETED" ? (
                                    <Radio.Group
                                      size="small"
                                      buttonStyle="solid"
                                      value={teamAssignments[player.userId]}
                                      onChange={(e) =>
                                        setTeamAssignments((prev) => ({
                                          ...prev,
                                          [player.userId]: e.target.value,
                                        }))
                                      }
                                    >
                                      <Radio.Button
                                        value={1}
                                        className="text-xs"
                                        disabled={
                                          teamAssignments[player.userId] !==
                                            1 && isTeam1Full
                                        }
                                      >
                                        Đội 1
                                      </Radio.Button>
                                      <Radio.Button
                                        value={2}
                                        className="text-xs"
                                        disabled={
                                          teamAssignments[player.userId] !==
                                            2 && isTeam2Full
                                        }
                                      >
                                        Đội 2
                                      </Radio.Button>
                                    </Radio.Group>
                                  ) : player.teamNumber ? (
                                    <Tag
                                      color={
                                        player.teamNumber === 1
                                          ? "blue"
                                          : "purple"
                                      }
                                      className="m-0 font-bold"
                                    >
                                      Đội {player.teamNumber}
                                    </Tag>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">
                                      Chưa chọn
                                    </span>
                                  )}

                                  {/* TAG THẮNG/THUA NẾU TRẬN ĐÃ KẾT THÚC */}
                                  {selectedMatch.status === "COMPLETED" &&
                                    (isPlayerWinner ? (
                                      <span className="text-green-700 font-extrabold text-[11px] bg-green-100 border border-green-300 px-2 py-1 rounded-full shadow-sm ml-2 tracking-wide">
                                        THẮNG
                                      </span>
                                    ) : isPlayerLoser ? (
                                      <span className="text-red-600 font-extrabold text-[11px] bg-red-50 border border-red-200 px-2 py-1 rounded-full shadow-sm ml-2 tracking-wide">
                                        THUA
                                      </span>
                                    ) : null)}
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    </div>

                    {/* FOOTER NÚT BẤM */}
                    <div className="mt-6 flex justify-end gap-3">
                      <Button onClick={() => setIsResultModalOpen(false)}>
                        Đóng
                      </Button>

                      {isMyTeamChanged ? (
                        <Button
                          type="primary"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleSaveMyTeam}
                          loading={loadingDivide}
                        >
                          Xác nhận đội của tôi
                        </Button>
                      ) : (
                        isNeedSubmit &&
                        unassigned.length === 0 && (
                          <Button
                            type="primary"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleSubmitResult}
                            loading={submittingResult}
                          >
                            Xác nhận kết quả
                          </Button>
                        )
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: DUYỆT KẾT QUẢ */}
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
            <p className="mt-2 text-gray-500">Đang tải...</p>
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
                  Vui lòng chờ đối thủ xác nhận.
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
                    <strong>{selectedMatch?.title}</strong>. Vui lòng xác nhận.
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
