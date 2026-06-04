import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Popconfirm,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext.tsx";
import matchService from "../../../service/match/matchService.ts";
import ApproveResultModal from "./my-match/ApproveResultModal.tsx";
import MatchDetailModal from "./my-match/MatchDetailModal.tsx";
import SubmitResultModal from "./my-match/SubmitResultModal.tsx";

const { Title, Text } = Typography;

const MyMatchPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchMyMatches = async () => {
    setLoadingData(true);
    try {
      const response = await matchService.getMyMatches(1, 50);
      if (response.code === 200) setMatches(response.result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách trận đấu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMyMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      const updatedMatch = matches.find(
        (m) => m.matchId === selectedMatch.matchId,
      );
      if (updatedMatch) setSelectedMatch(updatedMatch);
    }
  }, [matches]);

  const openModal = (
    match: any,
    modalType: "DETAIL" | "APPROVE" | "SUBMIT",
  ) => {
    setSelectedMatch(match);
    if (modalType === "DETAIL") setIsDetailModalOpen(true);
    if (modalType === "APPROVE") setIsApproveModalOpen(true);
    if (modalType === "SUBMIT") setIsSubmitModalOpen(true);
  };

  const handleLeaveMatch = async (matchId: string) => {
    try {
      await matchService.leaveMatch(matchId);
      message.success("Đã rút lui khỏi trận đấu thành công!");
      fetchMyMatches();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể rời trận lúc này!",
      );
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
    note?: string,
  ) => {
    if (type === "RANKED")
      return (
        <Tag icon={<TrophyOutlined />} color="purple" className="font-semibold">
          Rank ({minRank}-{maxRank})
        </Tag>
      );
    if (type === "BET")
      return (
        <Tag icon={<FireOutlined />} color="orange" className="font-semibold">
          Kèo: {note || "Tự thỏa thuận"}
        </Tag>
      );
    return (
      <Tag color="blue" className="font-semibold">
        Giao lưu
      </Tag>
    );
  };

  const renderStatusTag = (status: string, isMeCancelled?: boolean) => {
    if (isMeCancelled) {
      return <Tag color="error">Đã rút lui</Tag>;
    }

    switch (status) {
      case "OPEN":
        return <Tag color="blue">Đang chờ người</Tag>;
      case "PENDING":
        return (
          <Tag color="gold" className="font-semibold">
            Chờ thanh toán
          </Tag>
        );
      case "READY":
        return <Tag color="green">Sẵn sàng chiến</Tag>;
      case "PLAYING":
        return <Tag color="processing">Đang chiến</Tag>;
      case "WAITING_RESULT_APPROVAL":
        return <Tag color="warning">Chờ duyệt KQ</Tag>;
      case "DISPUTED":
        return <Tag color="error">Tranh chấp</Tag>;
      case "COMPLETED":
        return <Tag color="default">Đã hoàn thành</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
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
          dataSource={matches.filter((m) => {
            const myParticipantInfo = m.participants?.find(
              (p: any) => p.userId === user?.userId,
            );
            return (
              [
                "OPEN",
                "PENDING",
                "READY",
                "PLAYING",
                "WAITING_RESULT_APPROVAL",
                "DISPUTED",
              ].includes(m.status) && !myParticipantInfo?.isCancelled
            );
          })}
          renderItem={(match) => {
            // KHAI BÁO BIẾN Ở ĐẦY ĐỂ DÙNG CHUNG CHO CẢ KHỐI CARD
            const myParticipantInfo = match.participants?.find(
              (p: any) => p.userId === user?.userId,
            );
            const needsPayment =
              myParticipantInfo &&
              myParticipantInfo.amountDue > 0 &&
              !myParticipantInfo.isPaid;

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
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size={2}>
                      <Space wrap>
                        <Title
                          level={5}
                          style={{ margin: 0, color: "#1e293b" }}
                        >
                          {match.title || `Giao lưu ${match.categoryName}`}
                        </Title>
                        {renderStatusTag(
                          match.status,
                          myParticipantInfo?.isCancelled,
                        )}
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
                          fontSize: "13px",
                          marginTop: 6,
                        }}
                        wrap
                      >
                        <span>
                          <CalendarOutlined className="text-orange-500" />{" "}
                          {new Date(match.startTime).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}{" "}
                          {new Date(match.startTime).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                        <Divider type="vertical" />
                        <span>
                          <EnvironmentOutlined className="text-purple-500" />{" "}
                          {match.courtName || "Tự thỏa thuận"}
                        </span>
                      </Space>
                    </Space>
                  </Col>

                  <Col
                    xs={24}
                    md={12}
                    style={{ textAlign: "right", marginTop: "8px" }}
                  >
                    <Space
                      wrap
                      style={{ justifyContent: "flex-end", width: "100%" }}
                    >
                      {["OPEN", "PENDING", "READY"].includes(match.status) && (
                        <Popconfirm
                          title="Xác nhận rời trận đấu"
                          description={
                            <div>
                              Bạn có chắc muốn rút khỏi trận này?
                              <br />
                              <span style={{ color: "red" }}>
                                Lưu ý: Rời trận dưới 24h sẽ mất phí đã đóng
                                <br />
                                và bị trừ 10 điểm uy tín.
                              </span>
                            </div>
                          }
                          onConfirm={() => handleLeaveMatch(match.matchId)}
                          okText="Đồng ý rời"
                          cancelText="Đóng"
                        >
                          <Button
                            danger
                            type="dashed"
                            style={{ borderRadius: "8px" }}
                          >
                            Rút lui
                          </Button>
                        </Popconfirm>
                      )}

                      {needsPayment &&
                        !["COMPLETED", "CANCELLED"].includes(match.status) && (
                          <Button
                            type="primary"
                            onClick={() =>
                              navigate(`/payment/match/${match.matchId}`)
                            }
                            className="bg-gradient-to-r from-orange-500 to-purple-600 border-none hover:opacity-90 font-medium"
                            style={{ borderRadius: "8px" }}
                          >
                            Thanh toán ngay
                          </Button>
                        )}

                      {match.status === "WAITING_RESULT_APPROVAL" ? (
                        <Button
                          type="primary"
                          onClick={() => openModal(match, "APPROVE")}
                          style={{
                            borderRadius: "8px",
                            background: "#f59e0b",
                            borderColor: "#f59e0b",
                          }}
                        >
                          Xử lý kết quả
                        </Button>
                      ) : ["READY", "PLAYING", "DISPUTED"].includes(
                          match.status,
                        ) && !needsPayment ? (
                        <Button
                          type="primary"
                          onClick={() => openModal(match, "DETAIL")}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 border-none hover:opacity-90 font-medium"
                          style={{ borderRadius: "8px" }}
                        >
                          Đội hình / Báo KQ
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openModal(match, "DETAIL")}
                          style={{ borderRadius: "8px" }}
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </Space>
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
      label: "Đã hoàn thành & Đã hủy",
      children: (
        <List
          loading={loadingData}
          dataSource={matches.filter((m) => {
            const myParticipantInfo = m.participants?.find(
              (p: any) => p.userId === user?.userId,
            );
            return (
              ["COMPLETED", "CANCELLED"].includes(m.status) ||
              myParticipantInfo?.isCancelled
            );
          })}
          renderItem={(match) => {
            // FIX LỖI Ở ĐÂY: Phải khai báo biến trước khi return giao diện
            const myParticipantInfo = match.participants?.find(
              (p: any) => p.userId === user?.userId,
            );

            return (
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
                      <Space wrap>
                        <Text
                          strong
                          style={{ color: "#475569", fontSize: "15px" }}
                        >
                          {match.title || `Giao lưu ${match.categoryName}`}
                        </Text>
                        {renderStatusTag(
                          match.status,
                          myParticipantInfo?.isCancelled,
                        )}
                        {renderMatchTypeTag(
                          match.matchType,
                          match.minRank,
                          match.maxRank,
                          match.note,
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        {new Date(match.startTime).toLocaleDateString("vi-VN")}{" "}
                        • {match.courtName || "Sân tự do"}
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Button
                      onClick={() => openModal(match, "DETAIL")}
                      type="link"
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Chi tiết
                    </Button>
                  </Col>
                </Row>
              </Card>
            );
          }}
        />
      ),
    },
  ];

  return (
    <>
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
    </>
  );
};

export default MyMatchPage;
