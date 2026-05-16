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
  Button,
  message,
} from "antd";
import {
  CalendarOutlined,
  ManOutlined,
  TrophyOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import matchService from "../../../service/match/matchService.ts";
import UserSidebar from "../../../components/sidebar/UserSidebar.tsx";
import ApproveResultModal from "./my-match/ApproveResultModal.tsx";
import MatchDetailModal from "./my-match/MatchDetailModal.tsx";
import SubmitResultModal from "./my-match/SubmitResultModal.tsx";

const { Title, Text } = Typography;

const MyMatchPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const selectedMenu = "2";

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [confirmingDepositId, setConfirmingDepositId] = useState<string | null>(
    null,
  );

  // States quản lý Modals
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

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

  // Đồng bộ lại Selected Match nếu data list thay đổi
  useEffect(() => {
    if (selectedMatch) {
      const updatedMatch = matches.find(
        (m) => m.matchId === selectedMatch.matchId,
      );
      if (updatedMatch) setSelectedMatch(updatedMatch);
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

  const openModal = (
    match: any,
    modalType: "DETAIL" | "APPROVE" | "SUBMIT",
  ) => {
    setSelectedMatch(match);
    if (modalType === "DETAIL") setIsDetailModalOpen(true);
    if (modalType === "APPROVE") setIsApproveModalOpen(true);
    if (modalType === "SUBMIT") setIsSubmitModalOpen(true);
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
    note?: string,
  ) => {
    if (type === "RANKED")
      return (
        <Tag icon={<TrophyOutlined />} color="purple">
          Rank ({minRank}-{maxRank})
        </Tag>
      );
    if (type === "BET")
      return (
        <Tag icon={<FireOutlined />} color="orange">
          Kèo: {note || "Tự thỏa thuận"}
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
                          match.note,
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
                        <span>
                          <CalendarOutlined />{" "}
                          {new Date(match.startTime).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                        <Divider type="vertical" />
                        <span>
                          <ManOutlined /> {match.courtName || "Tự thỏa thuận"}
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
                      <Space
                        wrap
                        style={{ justifyContent: "flex-end", width: "100%" }}
                      >
                        {/* Đưa logic nút Cọc lên trước (nằm bên trái) */}
                        {myParticipantInfo?.depositConfirmed ? (
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
                        )}

                        <Button
                          onClick={() => openModal(match, "DETAIL")}
                          style={{ borderRadius: "8px" }}
                        >
                          Xem chi tiết
                        </Button>
                      </Space>
                    ) : match.status === "WAITING_RESULT_APPROVAL" ? (
                      <Button
                        type="primary"
                        onClick={() => openModal(match, "APPROVE")}
                        style={{
                          borderRadius: "8px",
                          background: "#f59e0b",
                          borderColor: "#f59e0b",
                        }}
                      >
                        Xem trạng thái duyệt
                      </Button>
                    ) : (match.matchType === "RANKED" ||
                        match.matchType === "BET") &&
                      (match.status === "FULL" ||
                        match.status === "CONFIRMED") ? (
                      <Button
                        type="primary"
                        onClick={() => openModal(match, "DETAIL")}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 border-none"
                        style={{ borderRadius: "8px" }}
                      >
                        Chốt kết quả / Chọn đội
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openModal(match, "DETAIL")}
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
                        match.note,
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: "13px" }}>
                      {new Date(match.startTime).toLocaleDateString("vi-VN")} •{" "}
                      {match.courtName || match.address}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Button
                    onClick={() => openModal(match, "DETAIL")}
                    type="link"
                  >
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

      <MatchDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={fetchMyMatches}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        match={selectedMatch}
      />

      <ApproveResultModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onSuccess={fetchMyMatches}
        match={selectedMatch}
      />

      <SubmitResultModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={fetchMyMatches}
        match={selectedMatch}
      />
    </div>
  );
};

export default MyMatchPage;
