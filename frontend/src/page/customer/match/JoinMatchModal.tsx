import React, { useState, useEffect } from "react";
import { Modal, Button, List, Avatar, Tag, Typography, Radio } from "antd";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import matchService from "../../../service/match/matchService";
import { message } from "antd";
import { useAuth } from "../../../context/AuthContext";
import type { MatchResponse } from "../../../types/match";

const { Text, Title } = Typography;

interface JoinMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  match: MatchResponse | null;
}

const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  match,
}) => {
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingDivide, setLoadingDivide] = useState(false);

  // State lưu trữ việc chia đội: { "userId_1": 1, "userId_2": 2 }
  const [teamAssignments, setTeamAssignments] = useState<
    Record<string, number>
  >({});

  // Cập nhật state teamAssignments mỗi khi mở Modal hoặc match thay đổi
  useEffect(() => {
    if (match && match.participants) {
      const initialAssignments: Record<string, number> = {};
      match.participants.forEach((p: any) => {
        if (p.teamNumber) {
          initialAssignments[p.userId] = p.teamNumber;
        }
      });
      setTeamAssignments(initialAssignments);
    }
  }, [match]);

  if (!match) return null;

  const isParticipant = match.participants?.some(
    (p: any) => p.userId === user?.userId,
  );
  const myParticipantInfo = match.participants?.find(
    (p: any) => p.userId === user?.userId,
  );

  // Kiểm tra xem user hiện tại có phải là Host không
  const isHost = match.hostName === user?.userName;

  const handleJoin = async () => {
    setLoadingAction(true);
    try {
      const response = await matchService.joinMatch(match.matchId);
      if (response.code === 1000 || response.code === 200) {
        message.success("Tham gia trận thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tham gia");
    } finally {
      setLoadingAction(false);
    }
  };

  // Hàm xử lý chọn đội cho từng user
  const handleTeamChange = (userId: string, teamNumber: number) => {
    setTeamAssignments((prev) => ({
      ...prev,
      [userId]: teamNumber,
    }));
  };

  // Hàm gửi API lưu đội hình
  const handleSaveTeams = async () => {
    const team1UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 1,
    );
    const team2UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 2,
    );

    setLoadingDivide(true);
    try {
      await matchService.divideTeams(match.matchId, {
        team1UserIds,
        team2UserIds,
      });
      message.success("Đã lưu đội hình thành công!");
      onSuccess(); // Refresh lại data trận đấu
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi lưu đội hình");
    } finally {
      setLoadingDivide(false);
    }
  };

  const renderFooterActions = () => {
    const actions = [];

    // Nút LƯU ĐỘI HÌNH (Chỉ Host mới thấy)
    if (
      isHost &&
      (match.status === "FULL" ||
        match.status === "CONFIRMED" ||
        match.status === "OPEN")
    ) {
      actions.push(
        <Button
          key="divide-team"
          type="primary"
          onClick={handleSaveTeams}
          loading={loadingDivide}
          className="bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg px-6 h-10"
        >
          Lưu Đội Hình
        </Button>,
      );
    }

    // 1. OPEN và CONFIRMED còn chỗ cho phép tham gia
    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant) {
        actions.push(
          <Button
            key="joined"
            disabled
            className="bg-gray-100 text-gray-500 font-semibold border-none rounded-lg px-6"
          >
            Bạn đã tham gia trận này
          </Button>,
        );
      } else {
        actions.push(
          <Button
            key="join"
            type="primary"
            onClick={handleJoin}
            loading={loadingAction}
            className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg px-8 h-10"
          >
            Tham Gia Ngay
          </Button>,
        );
      }
    }
    // 2. Chờ chốt cọc
    else if (match.status === "WAITING_DEPOSIT") {
      if (isParticipant && (myParticipantInfo as any)?.isDepositConfirmed) {
        actions.push(
          <Button
            key="deposited"
            disabled
            className="bg-green-50 text-green-600 font-semibold border-green-200 rounded-lg px-6 h-10"
          >
            <CheckCircle2 size={18} className="mr-2 inline" /> Đã xác nhận cọc
          </Button>,
        );
      } else {
        actions.push(
          <Button
            key="waiting-deposit"
            disabled
            className="bg-orange-50 text-orange-400 border-none font-semibold rounded-lg px-6"
          >
            Đang chờ chốt cọc
          </Button>,
        );
      }
    }
    // 3. Đã đủ người & chốt xong
    else if (match.status === "FULL" || match.status === "CONFIRMED") {
      actions.push(
        <Button
          key="full"
          disabled
          className="bg-green-100 text-green-700 font-semibold rounded-lg px-6 border-none"
        >
          {isParticipant
            ? "Trận đấu đã chốt - Sẵn sàng!"
            : "Trận đấu đã đủ người"}
        </Button>,
      );
    }

    // Nút Đóng mặc định
    actions.push(
      <Button key="close" onClick={onClose} className="rounded-lg h-10">
        Đóng
      </Button>,
    );

    return actions;
  };

  return (
    <Modal
      title={
        <span className="text-xl font-bold text-gray-800">
          Chi tiết trận đấu
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      footer={
        <div className="flex justify-end items-center gap-3 mt-4">
          {renderFooterActions()}
        </div>
      }
      width={500}
      centered
    >
      <div className="mt-4">
        {/* THÔNG TIN TRẬN ĐẤU */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
          <Title level={5} className="mb-3 text-blue-900 line-clamp-2">
            {match.title || `Giao lưu ${match.categoryName}`}
          </Title>
          <div className="space-y-2.5 text-gray-700">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <Text strong>
                {match.hasCourt
                  ? match.courtName
                  : typeof match.address === "string"
                  ? match.address
                  : match.address?.street +
                      ", " +
                      match.address?.ward +
                      ", " +
                      match.address?.district +
                      ", " +
                      match.address?.city?.cityName || "Tự thỏa thuận"}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-500 shrink-0" />
              <Text>
                {Array.isArray(match.startTime)
                  ? `${match.startTime[2]
                      .toString()
                      .padStart(2, "0")}/${match.startTime[1]
                      .toString()
                      .padStart(2, "0")}/${match.startTime[0]}`
                  : new Date(match.startTime).toLocaleDateString("vi-VN")}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-blue-500 shrink-0" />
              <Text>
                {(() => {
                  const { startTime, endTime } = match;

                  const extractTime = (timeData: any) => {
                    if (Array.isArray(timeData)) {
                      const h =
                        timeData[3]?.toString().padStart(2, "0") || "00";
                      const m =
                        timeData[4]?.toString().padStart(2, "0") || "00";
                      return `${h}:${m}`;
                    }
                    if (typeof timeData === "string") {
                      return timeData.includes("T")
                        ? timeData.split("T")[1].substring(0, 5)
                        : timeData.substring(0, 5);
                    }
                    return "--:--";
                  };

                  return `${extractTime(startTime)} - ${extractTime(endTime)}`;
                })()}
              </Text>
            </div>
          </div>
        </div>

        {/* DANH SÁCH NGƯỜI CHƠI & CHIA ĐỘI */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <Text strong className="text-gray-800 text-base">
              Danh sách tham gia
            </Text>
            <Text className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">
              {match.currentPlayers} / {match.maxPlayers}
            </Text>
          </div>

          {isHost && (
            <div className="mb-2 text-xs text-purple-600 flex items-center gap-1.5 bg-purple-50 p-2 rounded-lg border border-purple-100">
              <ShieldAlert size={14} />
              Bạn là Chủ phòng. Hãy chia đội cho người chơi trước khi chốt kết
              quả!
            </div>
          )}

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            <List
              dataSource={match.participants || []}
              renderItem={(player: any) => (
                <List.Item className="border-b-0 hover:bg-white transition-colors rounded-lg px-3 py-2 mb-1 flex-col items-start">
                  <div className="flex w-full justify-between items-center">
                    <List.Item.Meta
                      avatar={
                        <Avatar className="bg-blue-600 shadow-sm border border-blue-200">
                          {player.userName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <span className="font-semibold text-gray-800 flex items-center gap-2">
                          {player.userName}
                          {player.userName === match.hostName && (
                            <Tag
                              color="blue"
                              className="text-[10px] m-0 px-1 py-0 leading-tight"
                            >
                              HOST
                            </Tag>
                          )}
                        </span>
                      }
                      description={
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            Rank: {player.rankPoint || 3000}
                          </span>
                          {match.status === "WAITING_DEPOSIT" && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                player.isDepositConfirmed
                                  ? "bg-green-100 text-green-600"
                                  : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              {player.isDepositConfirmed
                                ? "Đã cọc"
                                : "Chưa cọc"}
                            </span>
                          )}
                        </div>
                      }
                    />

                    {/* UI HIỂN THỊ ĐỘI HOẶC CHỌN ĐỘI */}
                    <div className="ml-2 shrink-0">
                      {isHost ? (
                        <Radio.Group
                          size="small"
                          buttonStyle="solid"
                          value={teamAssignments[player.userId]}
                          onChange={(e) =>
                            handleTeamChange(player.userId, e.target.value)
                          }
                        >
                          <Radio.Button value={1} className="text-xs">
                            Đội 1
                          </Radio.Button>
                          <Radio.Button value={2} className="text-xs">
                            Đội 2
                          </Radio.Button>
                        </Radio.Group>
                      ) : player.teamNumber ? (
                        <Tag
                          color={player.teamNumber === 1 ? "cyan" : "purple"}
                          className="m-0 font-bold"
                        >
                          Đội {player.teamNumber}
                        </Tag>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Chưa xếp đội
                        </span>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default JoinMatchModal;
