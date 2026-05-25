import React, { useEffect, useState } from "react";
import { Modal, Radio, Tag, Avatar, Button, Spin, message, List } from "antd";
import {
  FireOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  KeyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { Trophy, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext.tsx";
import matchService from "../../../../service/match/matchService.ts";
import { matchResultService } from "../../../../service/match/matchResultService.ts";

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenSubmitModal: () => void;
  match: any;
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenSubmitModal,
  match,
}) => {
  const { user } = useAuth();

  const [teamAssignments, setTeamAssignments] = useState<
    Record<string, number>
  >({});
  const [loadingDivide, setLoadingDivide] = useState(false);
  const [matchResultData, setMatchResultData] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  useEffect(() => {
    if (isOpen && match) {
      const initial: Record<string, number> = {};
      match.participants?.forEach((p: any) => {
        if (p.teamNumber) initial[p.userId] = p.teamNumber;
      });
      setTeamAssignments(initial);

      if (match.status === "COMPLETED") {
        fetchResult();
      } else {
        setMatchResultData(null);
      }
    }
  }, [isOpen, match]);

  const fetchResult = async () => {
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
  };

  const handleSaveMyTeam = async () => {
    const team1UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 1,
    );
    const team2UserIds = Object.keys(teamAssignments).filter(
      (id) => teamAssignments[id] === 2,
    );

    const maxPerTeam = Math.ceil((match?.maxPlayers || 4) / 2);
    if (team1UserIds.length > maxPerTeam)
      return message.warning(`Đội 1 đã đầy!`);
    if (team2UserIds.length > maxPerTeam)
      return message.warning(`Đội 2 đã đầy!`);

    setLoadingDivide(true);
    try {
      await matchService.divideTeams(match.matchId, {
        team1UserIds,
        team2UserIds,
      });
      message.success("Đã cập nhật đội của bạn thành công!");
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi lưu đội");
    } finally {
      setLoadingDivide(false);
    }
  };

  const renderStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      OPEN: { text: "Đang chờ người", color: "blue" },
      READY: { text: "Sẵn sàng", color: "cyan" },
      PLAYING: { text: "Đang thi đấu", color: "geekblue" },
      COMPLETED: { text: "Đã kết thúc", color: "default" },
      CANCELLED: { text: "Đã hủy", color: "error" },
    };
    const current = statusMap[status] || { text: status, color: "default" };
    return (
      <Tag
        color={current.color}
        className="font-medium m-0 px-2.5 py-1 rounded-md border-0 bg-gray-100"
      >
        {current.text}
      </Tag>
    );
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return (
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " - " +
      date.toLocaleDateString("vi-VN")
    );
  };

  if (!match) return null;

  const isNeedSubmit =
    match.status !== "COMPLETED" && match.status !== "CANCELLED";
  const maxPerTeam = Math.ceil((match.maxPlayers || 4) / 2);
  const unassigned =
    match.participants?.filter((p: any) => !teamAssignments[p.userId]) || [];
  const currentTeam1Count = Object.values(teamAssignments).filter(
    (t) => t === 1,
  ).length;
  const currentTeam2Count = Object.values(teamAssignments).filter(
    (t) => t === 2,
  ).length;
  const isTeam1Full = currentTeam1Count >= maxPerTeam;
  const isTeam2Full = currentTeam2Count >= maxPerTeam;

  const myParticipantInfo = match.participants?.find(
    (p: any) => p.userId === user?.userId,
  );
  const isMyTeamChanged =
    teamAssignments[user?.userId as string] !== myParticipantInfo?.teamNumber;

  let finalWinningTeam: number | null = null;
  if (matchResultData) {
    if (matchResultData.winningTeamNumber) {
      finalWinningTeam = matchResultData.winningTeamNumber;
    } else if (
      matchResultData.winnerIds &&
      matchResultData.winnerIds.length > 0
    ) {
      const sampleWinner = match.participants?.find(
        (p: any) => p.userId === matchResultData.winnerIds[0],
      );
      finalWinningTeam = sampleWinner?.teamNumber || null;
    }
  }

  return (
    <Modal
      title={
        <div className="text-xl font-bold text-gray-800 flex justify-between items-center pr-6">
          <span>
            {match.status === "COMPLETED"
              ? "Chi tiết kết quả"
              : match.matchType === "NORMAL"
              ? "Chi tiết trận đấu"
              : "Đội hình trận đấu"}
          </span>
          {renderStatusTag(match.status)}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={540}
      centered
    >
      <div className="mt-5 space-y-5">
        {match.status === "COMPLETED" &&
          (loadingResult ? (
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              <Spin size="small" />
            </div>
          ) : finalWinningTeam ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-800">
              <Trophy className="text-green-600 shrink-0" size={20} />
              <div className="text-sm">
                Trận đấu đã kết thúc. Kết quả chung cuộc:{" "}
                <span className="font-bold text-green-700">
                  Đội {finalWinningTeam} chiến thắng
                </span>
                .
              </div>
            </div>
          ) : null)}

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
              {match.categoryName || "Bộ môn"}
            </span>
            <p className="font-bold text-gray-900 text-lg m-0">
              {match.title || `Giao lưu ${match.categoryName}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-3 my-1">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                <ClockCircleOutlined className="text-gray-500 text-lg" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">
                  Thời gian bắt đầu
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {formatTime(match.startTime)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                <KeyOutlined className="text-gray-500 text-lg" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Mã phòng</span>
                <span className="font-mono font-bold text-gray-800 text-sm">
                  {match.roomCode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-gray-50 p-2 rounded-lg mt-1 shrink-0">
              <EnvironmentOutlined className="text-gray-500 text-lg" />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-sm">
                {match.courtName}
              </span>
              <p className="text-xs text-gray-500 m-0 mt-0.5 leading-relaxed">
                {match.address
                  ? `${match.address.street}, ${match.address.ward}, ${match.address.city?.cityName}`
                  : "Chưa cập nhật địa chỉ"}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mt-2">
            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
              <DollarOutlined />
              <span>Giá sân tham khảo:</span>
            </div>
            <span className="font-bold text-gray-900 text-base">
              {match.courtPrice && !isNaN(Number(match.courtPrice))
                ? Number(match.courtPrice).toLocaleString("vi-VN") + " đ"
                : match.courtPrice || "Miễn phí"}
            </span>
          </div>

          {match.matchType === "BET" && (
            <p className="text-purple-600 text-sm m-0 font-medium flex items-center gap-2 mt-1">
              <FireOutlined /> Phần thưởng Kèo:{" "}
              {match.note || "Thỏa thuận tại sân"}
            </p>
          )}
        </div>

        {isNeedSubmit && unassigned.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-800 flex items-start gap-3">
            <WarningOutlined className="mt-1 text-amber-600" />
            <p className="text-sm m-0 leading-relaxed">
              Đang có{" "}
              <span className="font-bold">{unassigned.length} người chơi</span>{" "}
              chưa chọn đội hình. Cần chia đội đầy đủ để có thể báo cáo kết quả!
            </p>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-base m-0">
              Đội hình & Người chơi
            </h3>
            <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-xs">
              {match.currentPlayers} / {match.maxPlayers} thành viên
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-2 max-h-[260px] overflow-y-auto custom-scrollbar shadow-sm">
            <List
              dataSource={match.participants || []}
              renderItem={(player: any) => {
                const isMe = player.userId === user?.userId;
                const isPlayerWinner =
                  finalWinningTeam && player.teamNumber === finalWinningTeam;
                const isPlayerLoser =
                  finalWinningTeam &&
                  player.teamNumber &&
                  player.teamNumber !== finalWinningTeam;

                const exactRankObj = player.categoryRanks?.find(
                  (cr: any) => cr.categoryName === match.categoryName,
                );
                const displayRankPoint = exactRankObj
                  ? exactRankObj.rankPoint
                  : 3000;
                const pointChange =
                  matchResultData?.rankChanges?.[player.userId];

                return (
                  <List.Item
                    className={`border-b last:border-b-0 border-gray-100 px-3 py-3 flex-col items-start transition-colors ${
                      isMe ? "bg-purple-50/30 rounded-lg" : ""
                    }`}
                  >
                    <div className="flex w-full justify-between items-center">
                      <List.Item.Meta
                        avatar={
                          <Avatar className="bg-purple-100 text-purple-600 font-bold size-10">
                            {player.userName?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        }
                        title={
                          <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            {player.userName}
                            {isMe && (
                              <Tag
                                color="purple"
                                className="m-0 border-0 font-bold text-[10px]"
                              >
                                BẠN
                              </Tag>
                            )}
                          </span>
                        }
                        description={
                          <span className="text-xs text-gray-500 mt-0.5 block">
                            Điểm Rank:{" "}
                            <span className="font-semibold text-gray-700">
                              {displayRankPoint}
                            </span>
                          </span>
                        }
                      />

                      <div className="ml-3 shrink-0 flex items-center gap-3">
                        {isMe && match.status !== "COMPLETED" ? (
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
                              disabled={
                                teamAssignments[player.userId] !== 1 &&
                                isTeam1Full
                              }
                            >
                              Đội 1
                            </Radio.Button>
                            <Radio.Button
                              value={2}
                              disabled={
                                teamAssignments[player.userId] !== 2 &&
                                isTeam2Full
                              }
                            >
                              Đội 2
                            </Radio.Button>
                          </Radio.Group>
                        ) : player.teamNumber ? (
                          <span className="font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-md text-xs">
                            Đội {player.teamNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Chưa chọn đội
                          </span>
                        )}

                        {match.status === "COMPLETED" && (
                          <div className="flex items-center gap-2">
                            {isPlayerWinner && (
                              <span className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-50 px-2 py-1 rounded-md">
                                <CheckCircle2 size={14} /> THẮNG
                              </span>
                            )}
                            {isPlayerLoser && (
                              <span className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-md">
                                <XCircle size={14} /> THUA
                              </span>
                            )}

                            {isMe && pointChange !== undefined && (
                              <span
                                className={`flex items-center justify-center min-w-[44px] font-bold text-xs px-2 py-1 rounded-md ${
                                  pointChange > 0
                                    ? "bg-green-100 text-green-700"
                                    : pointChange < 0
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {pointChange > 0 && (
                                  <ArrowUpOutlined className="mr-1 text-[10px]" />
                                )}
                                {pointChange < 0 && (
                                  <ArrowDownOutlined className="mr-1 text-[10px]" />
                                )}
                                {pointChange === 0 && (
                                  <MinusCircle size={12} className="mr-1" />
                                )}
                                {pointChange > 0
                                  ? `+${pointChange}`
                                  : pointChange}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <Button
            onClick={onClose}
            className="rounded-lg font-medium h-10 px-6"
          >
            Đóng
          </Button>

          {isMyTeamChanged && (
            <Button
              type="primary"
              className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg font-medium h-10 px-6"
              onClick={handleSaveMyTeam}
              loading={loadingDivide}
            >
              Lưu đội hình
            </Button>
          )}

          {isNeedSubmit &&
            unassigned.length === 0 &&
            ["READY", "PLAYING", "DISPUTED"].includes(match.status) && (
              <Button
                type="primary"
                className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg font-medium h-10 px-6"
                onClick={() => {
                  onClose();
                  onOpenSubmitModal();
                }}
              >
                Báo cáo kết quả
              </Button>
            )}
        </div>
      </div>
    </Modal>
  );
};

export default MatchDetailModal;
