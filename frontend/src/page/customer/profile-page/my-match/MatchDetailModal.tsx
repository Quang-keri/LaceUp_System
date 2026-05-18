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
      READY: { text: "Sẵn sàng", color: "success" },
      PLAYING: { text: "Đang thi đấu", color: "processing" },
      COMPLETED: { text: "Đã kết thúc", color: "default" },
      CANCELLED: { text: "Đã hủy", color: "error" },
    };
    const current = statusMap[status] || { text: status, color: "default" };
    return (
      <Tag
        color={current.color}
        className="font-semibold m-0 px-2.5 py-0.5 rounded-md"
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
      " " +
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
              : "🏆 Đội hình trận đấu"}
          </span>
          {renderStatusTag(match.status)}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
    >
      <div className="mt-4 space-y-4">
        {/* BANNER HIỂN THỊ ĐỘI THẮNG */}
        {match.status === "COMPLETED" &&
          (loadingResult ? (
            <div className="flex justify-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Spin size="small" />
            </div>
          ) : finalWinningTeam ? (
            <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl flex items-center gap-2.5 text-emerald-800">
              <Trophy className="text-emerald-600 shrink-0" size={18} />
              <div className="text-xs font-medium">
                Trận đấu đã kết thúc. Kết quả chung cuộc:{" "}
                <span className="font-bold text-emerald-700">
                  Đội {finalWinningTeam} chiến thắng
                </span>
                .
              </div>
            </div>
          ) : null)}

        {/* THÔNG TIN CHI TIẾT TRẬN ĐẤU */}
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/60 flex flex-col gap-2.5">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
              Tên trận / Bộ môn
            </span>
            <p className="font-extrabold text-gray-800 text-base m-0">
              {match.title || `Giao lưu ${match.categoryName}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-b border-gray-200/50 py-2 my-0.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockCircleOutlined className="text-orange-500" />
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">
                  Bắt đầu
                </span>
                <span className="font-bold text-gray-700 text-xs">
                  {formatTime(match.startTime)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <KeyOutlined className="text-purple-500" />
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">
                  Mã phòng
                </span>
                <span className="font-mono font-black text-gray-800 text-xs">
                  {match.roomCode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <EnvironmentOutlined className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-gray-800 text-xs">
                {match.courtName}
              </span>
              <p className="text-[11px] text-gray-400 m-0 font-medium">
                {match.address
                  ? `${match.address.street}, ${match.address.ward}, ${match.address.city?.cityName}`
                  : "Chưa cập nhật địa chỉ"}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200/60 text-xs mt-0.5">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <DollarOutlined className="text-green-600 font-bold" />
              <span>Giá sân tham khảo:</span>
            </div>
            <span className="font-black text-orange-600 text-sm">
              {match.courtPrice && !isNaN(Number(match.courtPrice))
                ? Number(match.courtPrice).toLocaleString("vi-VN") + " đ"
                : match.courtPrice || "Miễn phí"}
            </span>
          </div>

          {match.matchType === "BET" && (
            <p className="text-orange-600 text-xs m-0 font-bold flex items-center gap-2 pt-0.5">
              <FireOutlined /> Phần thưởng Kèo:{" "}
              {match.note || "Thỏa thuận tại sân"}
            </p>
          )}
        </div>

        {/* CẢNH BÁO CHƯA CHỌN ĐỘI */}
        {isNeedSubmit && unassigned.length > 0 && (
          <div className="bg-orange-50/50 border border-orange-200 p-3 rounded-xl text-orange-700 flex items-start gap-2">
            <WarningOutlined className="mt-0.5" />
            <p className="text-xs m-0 leading-tight font-medium">
              Đang có{" "}
              <span className="font-bold">{unassigned.length} người chơi</span>{" "}
              chưa chọn đội hình. Bắt buộc tất cả thành viên phải chọn đội thì
              mới có thể gửi báo cáo kết quả trận đấu!
            </p>
          </div>
        )}

        {/* TIÊU ĐỀ DANH SÁCH NGƯỜI CHƠI */}
        <div className="flex justify-between items-center pt-1">
          <p className="font-bold text-gray-800 text-sm m-0">
            Danh sách người chơi
          </p>
          <span className="text-purple-600 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full text-[11px]">
            {match.currentPlayers} / {match.maxPlayers} thành viên
          </span>
        </div>

        {/* LIST NGƯỜI CHƠI */}
        <div className="bg-gray-50/40 rounded-xl border border-gray-100 p-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
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

              // Lấy điểm cộng trừ từ Backend
              const pointChange = matchResultData?.rankChanges?.[player.userId];

              return (
                <List.Item
                  className={`border transition-all rounded-xl px-3 py-2 mb-1.5 flex-col items-start ${
                    isMe
                      ? "bg-purple-50/40 border-purple-200/70"
                      : "bg-white border-gray-200/60 shadow-2xs"
                  }`}
                >
                  <div className="flex w-full justify-between items-center">
                    <List.Item.Meta
                      avatar={
                        <Avatar className="bg-gradient-to-tr from-orange-500 to-purple-600 font-bold size-8 text-xs">
                          {player.userName?.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                          {player.userName}
                          {isMe && (
                            <span className="text-purple-600 text-[10px] font-extrabold bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                              (Bạn)
                            </span>
                          )}
                        </span>
                      }
                      description={
                        <span className="text-[11px] text-gray-400 font-medium">
                          Rank {match.categoryName}:{" "}
                          <span className="text-orange-500 font-bold">
                            {displayRankPoint}
                          </span>
                        </span>
                      }
                    />

                    <div className="ml-2 shrink-0 flex items-center gap-2">
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
                          className="custom-radio-team-detail"
                        >
                          <Radio.Button
                            value={1}
                            disabled={
                              teamAssignments[player.userId] !== 1 &&
                              isTeam1Full
                            }
                            className="text-[11px] font-semibold"
                          >
                            Đội 1
                          </Radio.Button>
                          <Radio.Button
                            value={2}
                            disabled={
                              teamAssignments[player.userId] !== 2 &&
                              isTeam2Full
                            }
                            className="text-[11px] font-semibold"
                          >
                            Đội 2
                          </Radio.Button>
                        </Radio.Group>
                      ) : player.teamNumber ? (
                        <Tag
                          color={player.teamNumber === 1 ? "orange" : "purple"}
                          className="m-0 font-bold px-2.5 py-0.5 rounded-md text-[11px]"
                        >
                          Đội {player.teamNumber}
                        </Tag>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium">
                          Chưa chọn đội
                        </span>
                      )}

                      {/* BADGE THẮNG / THUA & ĐIỂM CỘNG TRỪ */}
                      {match.status === "COMPLETED" && (
                        <>
                          {isPlayerWinner ? (
                            <span className="flex items-center gap-1 text-green-700 font-black text-[10px] bg-green-50 border border-green-200 px-2 py-0.5 rounded-md shadow-2xs">
                              <CheckCircle2
                                size={11}
                                className="text-green-600"
                              />{" "}
                              THẮNG
                            </span>
                          ) : isPlayerLoser ? (
                            <span className="flex items-center gap-1 text-red-600 font-black text-[10px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-md shadow-2xs">
                              <XCircle size={11} className="text-red-500" />{" "}
                              THUA
                            </span>
                          ) : null}

                          {/* SỬA Ở ĐÂY: Thêm isMe && vào trước điều kiện */}
                          {isMe && pointChange !== undefined && (
                            <span
                              className={`flex items-center justify-center min-w-[38px] font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-2xs border ${
                                pointChange > 0
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : pointChange < 0
                                  ? "bg-rose-50 text-rose-600 border-rose-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {pointChange > 0 && (
                                <ArrowUpOutlined className="mr-0.5" />
                              )}
                              {pointChange < 0 && (
                                <ArrowDownOutlined className="mr-0.5" />
                              )}
                              {pointChange === 0 && (
                                <MinusCircle size={10} className="mr-0.5" />
                              )}
                              {pointChange > 0
                                ? `+${pointChange}`
                                : pointChange}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>

        {/* FOOTER ACTION BUTTONS */}
        <div className="mt-5 flex justify-end gap-3 border-t pt-4 border-gray-100">
          <Button
            onClick={onClose}
            className="rounded-xl font-semibold h-10 px-5 text-gray-500 hover:text-gray-700"
          >
            Đóng
          </Button>

          {isMyTeamChanged && (
            <Button
              type="primary"
              className="bg-purple-600 hover:bg-purple-700 border-none rounded-xl font-bold h-10 px-5 shadow-sm"
              onClick={handleSaveMyTeam}
              loading={loadingDivide}
            >
              Xác nhận đội của tôi
            </Button>
          )}

          {isNeedSubmit &&
            unassigned.length === 0 &&
            ["READY", "PLAYING", "DISPUTED"].includes(match.status) && (
              <Button
                type="primary"
                className="bg-gradient-to-r from-orange-500 to-purple-600 border-none hover:opacity-90 font-bold text-white rounded-xl h-10 px-6 shadow-md"
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
