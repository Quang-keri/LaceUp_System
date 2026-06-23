import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Typography,
  Divider,
  Space,
  Button,
  Popconfirm,
  message,
  Row,
  Col,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { MatchResponse } from "../../../types/match";
import dayjs from "dayjs";
import { Users, ShieldAlert, AlertTriangle } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import matchResultService from "../../../service/match/matchResultService.ts";

const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  match: MatchResponse | null;
  onSuccess: () => void;
}

const MatchDetailModal: React.FC<Props> = ({
  visible,
  onCancel,
  match,
  onSuccess,
}) => {
  const [resolving, setResolving] = useState(false);

  if (!match) return null;

  const pendingReport = match.reports?.find((r: any) => r.status === "PENDING");
  const disputedResult = (match as any).results?.find(
    (r: any) => r.status === "DISPUTED",
  );

  const handleResolveReport = async (reportId: string, isAccepted: boolean) => {
    setResolving(true);
    try {
      await matchService.resolveMatchReport(reportId, isAccepted);
      message.success(
        isAccepted
          ? "Đã xác nhận vi phạm và xử lý thành công!"
          : "Đã từ chối báo cáo!",
      );
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi xử lý báo cáo",
      );
    } finally {
      setResolving(false);
    }
  };

  const handleResolveDisputedResult = async (
    resultId: string,
    isApproved: boolean,
  ) => {
    setResolving(true);
    try {
      await matchResultService.respondToResult(resultId, isApproved);
      message.success(
        isApproved
          ? "Đã chốt trận đấu và phạt người vắng mặt!"
          : "Đã hủy bỏ kết quả này!",
      );
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi duyệt kết quả",
      );
    } finally {
      setResolving(false);
    }
  };

  const renderReportedUsers = (reportedUserIds: string[]) => {
    if (!reportedUserIds || reportedUserIds.length === 0)
      return <Text type="secondary">Không xác định</Text>;

    return reportedUserIds.map((userId) => {
      const p = match.participants?.find(
        (player: any) => player.userId === userId,
      );
      return (
        <Tag color="red" key={userId} className="mb-1">
          {p ? p.userName : "Người chơi (Không xác định)"}
        </Tag>
      );
    });
  };

  // Hàm Map trạng thái sang Tiếng Việt và gán màu
  const renderMatchStatus = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      OPEN: { color: "blue", text: "Đang ghép đội" },
      READY: { color: "cyan", text: "Sẵn sàng" },
      FULL: { color: "cyan", text: "Đã đủ người" },
      PLAYING: { color: "geekblue", text: "Đang diễn ra" },
      WAITING_RESULT_APPROVAL: { color: "orange", text: "Chờ duyệt kết quả" },
      DISPUTED: { color: "volcano", text: "Tranh chấp" },
      COMPLETED: { color: "green", text: "Đã kết thúc" },
      CANCELLED: { color: "red", text: "Đã hủy" },
    };

    const mapped = statusMap[status] || { color: "default", text: status };
    return (
      <Tag color={mapped.color} className="m-0 font-medium">
        {mapped.text}
      </Tag>
    );
  };

  const hasRightColumn = !!pendingReport || !!disputedResult;

  const participantColumns = [
    {
      title: "Người chơi",
      key: "user",
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            src={record.avatarUrl}
            icon={!record.avatarUrl && <UserOutlined />}
            className="bg-blue-500"
          />
          <div className="flex flex-col">
            <Text strong>{record.userName}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.phone || "No Phone"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Đội",
      dataIndex: "teamNumber",
      key: "teamNumber",
      align: "center" as const,
      width: 70,
      render: (team: number) =>
        team ? (
          <Text strong>Đội {team}</Text>
        ) : (
          <Text type="secondary" className="text-[11px] italic">
            Chưa xếp
          </Text>
        ),
    },
    {
      title: "Số slot",
      dataIndex: "playerCount",
      key: "playerCount",
      align: "center" as const,
      width: 80,
      render: (count: number) => (
        <Text type="secondary">{count || 1} Slot</Text>
      ),
    },
    {
      title: "Cần góp",
      dataIndex: "amountDue",
      key: "amountDue",
      align: "right" as const,
      width: 100,
      render: (amount: number) => (
        <span style={{ color: "#fa8c16", fontWeight: "bold" }}>
          {amount ? amount.toLocaleString("vi-VN") : "0"} đ
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "isPaid",
      key: "isPaid",
      align: "center" as const,
      width: 100,
      render: (isPaid: boolean) => (
        <Tag color={isPaid ? "blue" : "default"} className="m-0">
          {isPaid ? "ĐÃ GÓP" : "CHƯA GÓP"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span className="text-lg font-bold text-gray-800">
            Chi tiết trận:
          </span>
          <Text className="text-lg font-bold text-blue-600">
            {match.title || "Trận vãng lai"}
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1100}
      centered
    >
      <Row gutter={[24, 24]} className="mt-4">
        {/* CỘT TRÁI: CHI TIẾT TRẬN ĐẤU */}
        <Col span={hasRightColumn ? 14 : 24}>
          <Descriptions
            bordered
            column={2}
            size="small"
            className="bg-white mb-5"
          >
            <Descriptions.Item label="Sân thi đấu" span={2}>
              <Text strong className="text-blue-600 text-base">
                {match.courtName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Môn thi đấu">
              <Tag color="cyan" className="font-medium">
                {match.categoryName}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại trận">
              {match.matchType === "RANKED" && <Tag color="gold">Leo Rank</Tag>}
              {match.matchType === "BET" && <Tag color="volcano">Đá Kèo</Tag>}
              {(!match.matchType || match.matchType === "NORMAL") && (
                <Tag color="green">Giao lưu</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian" span={2}>
              <Text strong className="text-base text-gray-800">
                {dayjs(match.startTime).format("HH:mm")} -{" "}
                {dayjs(match.endTime).format("HH:mm")}
              </Text>
              <Text type="secondary" className="ml-3">
                ({dayjs(match.startTime).format("DD/MM/YYYY")})
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {/* SỬ DỤNG HÀM RENDER TRẠNG THÁI TIẾNG VIỆT TẠI ĐÂY */}
              {renderMatchStatus(match.status)}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" className="m-0 mt-2 text-gray-600">
            <Space>
              <Users size={16} />
              <span className="font-semibold text-sm">
                Danh sách người chơi ({match.currentPlayers}/{match.maxPlayers})
              </span>
            </Space>
          </Divider>

          <Table
            dataSource={match.participants || []}
            columns={participantColumns}
            rowKey="userId"
            pagination={false}
            size="small"
            locale={{ emptyText: "Chưa có người tham gia" }}
            scroll={{ y: 250 }}
            className="border shadow-sm rounded-lg mt-3"
          />
        </Col>

        {/* CỘT PHẢI: XỬ LÝ VI PHẠM / XÁC NHẬN KẾT QUẢ */}
        {hasRightColumn && (
          <Col span={10}>
            <div className="h-full bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col">
              {/* 1. NẾU CÓ REPORT VI PHẠM */}
              {pendingReport ? (
                <>
                  <div className="flex items-center gap-2 text-gray-800 mb-4 border-b border-gray-100 pb-3">
                    <ShieldAlert size={20} />
                    <span className="font-bold text-base uppercase tracking-wide">
                      Xử lý Báo cáo vi phạm
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Người tố cáo
                      </Text>
                      <div className="mt-1 font-medium text-gray-800">
                        {pendingReport.reporterName}
                      </div>
                    </div>
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Người bị tố cáo
                      </Text>
                      <div className="mt-1">
                        {renderReportedUsers(pendingReport.reportedUserIds)}
                      </div>
                    </div>
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Lý do
                      </Text>
                      <div className="mt-1">
                        <Tag color="error">
                          {pendingReport.reasonType === "ABSENT"
                            ? "Vắng mặt / Bỏ bom"
                            : pendingReport.reasonType === "BAD_BEHAVIOR"
                            ? "Hành vi tiêu cực"
                            : pendingReport.reasonType}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Chi tiết mô tả
                      </Text>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-700 text-sm italic">
                        "{pendingReport.description}"
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                    <Popconfirm
                      title="Bạn xác nhận người bị tố cáo đã vi phạm?"
                      onConfirm={() =>
                        handleResolveReport(pendingReport.reportId, true)
                      }
                      okText="Duyệt phạt"
                      cancelText="Hủy"
                    >
                      <Button
                        type="primary"
                        danger
                        loading={resolving}
                        className="flex-1 font-medium"
                      >
                        Duyệt phạt
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="Bạn muốn bác bỏ báo cáo này?"
                      onConfirm={() =>
                        handleResolveReport(pendingReport.reportId, false)
                      }
                      okText="Bác bỏ"
                      cancelText="Hủy"
                    >
                      <Button
                        loading={resolving}
                        className="flex-1 font-medium"
                      >
                        Từ chối
                      </Button>
                    </Popconfirm>
                  </div>
                </>
              ) : /* 2. NẾU CÓ KẾT QUẢ ĐANG CHỜ (DISPUTED) */
              disputedResult ? (
                <>
                  <div className="flex items-center gap-2 text-gray-800 mb-4 border-b border-gray-100 pb-3">
                    <AlertTriangle size={20} />
                    <span className="font-bold text-base uppercase tracking-wide">
                      Xác nhận vắng mặt
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="bg-blue-50 p-3 rounded border border-blue-100 text-blue-800 text-sm">
                      Người chơi đã báo cáo rằng toàn bộ đối thủ không ra sân.
                      Vui lòng kiểm tra và xác nhận chốt kết quả!
                    </div>
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Người bị báo vắng
                      </Text>
                      <div className="mt-1">
                        {renderReportedUsers(disputedResult.absentUserIds)}
                      </div>
                    </div>
                    <div>
                      <Text className="text-xs font-bold text-gray-500 uppercase">
                        Đội thắng (Được chốt)
                      </Text>
                      <div className="mt-1 font-semibold text-gray-800">
                        Đội {disputedResult.winningTeamNumber}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                    <Popconfirm
                      title="Xác nhận đối thủ vắng mặt để chốt trận?"
                      onConfirm={() =>
                        handleResolveDisputedResult(
                          disputedResult.resultId,
                          true,
                        )
                      }
                      okText="Xác nhận Phạt"
                      cancelText="Hủy"
                    >
                      <Button
                        type="primary"
                        danger
                        loading={resolving}
                        className="flex-1 font-medium"
                      >
                        Xác nhận vắng (Phạt)
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="Từ chối kết quả này?"
                      onConfirm={() =>
                        handleResolveDisputedResult(
                          disputedResult.resultId,
                          false,
                        )
                      }
                      okText="Từ chối"
                      cancelText="Hủy"
                    >
                      <Button
                        loading={resolving}
                        className="flex-1 font-medium"
                      >
                        Bác bỏ
                      </Button>
                    </Popconfirm>
                  </div>
                </>
              ) : null}
            </div>
          </Col>
        )}
      </Row>
    </Modal>
  );
};

export default MatchDetailModal;
