import React, { useEffect, useState } from "react";
import { Modal, Radio, Tag, Avatar, Button, Spin, message, List } from "antd";
import { FireOutlined, WarningOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../context/AuthContext.tsx";
import matchService from "../../../../service/match/matchService.ts";
import { matchResultService } from "../../../../service/match/matchResultService.ts";

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Để refresh list ở trang chính
  onOpenSubmitModal: () => void; // Mở modal báo cáo kết quả
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

  // Khởi tạo state khi mở modal
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

  if (!match) return null;

  const isNeedSubmit =
    (match.matchType === "RANKED" || match.matchType === "BET") &&
    match.status !== "COMPLETED";
  const maxPerTeam = Math.ceil((match.maxPlayers || 4) / 2);
  const unassigned =
    match.participants?.filter((p: any) => !p.teamNumber) || [];
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
        <div className="text-xl font-bold text-gray-800">
          {match.status === "COMPLETED"
            ? "Chi tiết kết quả"
            : match.matchType === "NORMAL"
            ? "Chi tiết trận đấu"
            : "🏆 Đội hình trận đấu"}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={550}
      centered
    >
      <div className="mt-4">
        {/* THÔNG TIN TRẬN */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Trận đấu</p>
          <p className="font-bold text-gray-800 text-base">
            {match.title || `Giao lưu ${match.categoryName}`}
          </p>
          {match.matchType === "BET" && (
            <p className="text-orange-600 text-sm mt-2 font-semibold flex items-center gap-2">
              <FireOutlined /> Phần thưởng Kèo:{" "}
              {match.note || "Thỏa thuận tại sân"}
            </p>
          )}
        </div>

        {match.status === "COMPLETED" &&
          (loadingResult ? (
            <div className="flex justify-center p-4 mb-4">
              <Spin />
            </div>
          ) : finalWinningTeam ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 text-center shadow-sm">
              <p className="font-extrabold text-green-700 text-lg m-0 uppercase tracking-wide">
                Đội {finalWinningTeam} Chiến Thắng
              </p>
            </div>
          ) : null)}

        {isNeedSubmit && unassigned.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4 text-orange-700 flex items-start gap-2">
            <WarningOutlined className="mt-1" />
            <p className="text-sm m-0 leading-tight">
              Đang có {unassigned.length} người chơi chưa chọn đội.
              <br />
              <span className="font-semibold">
                Bắt buộc tất cả phải chọn đội thì mới có thể gửi báo cáo kết
                quả!
              </span>
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-gray-800 m-0">Danh sách người chơi</p>
          <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">
            {match.currentPlayers} / {match.maxPlayers}
          </span>
        </div>

        {/* LIST NGƯỜI CHƠI */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
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

              return (
                <List.Item
                  className={`border border-gray-200 transition-colors rounded-lg px-3 py-2 mb-2 flex-col items-start ${
                    isMe ? "bg-indigo-50 border-indigo-200" : "bg-white"
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
                        >
                          <Radio.Button
                            value={1}
                            className="text-xs"
                            disabled={
                              teamAssignments[player.userId] !== 1 &&
                              isTeam1Full
                            }
                          >
                            Đội 1
                          </Radio.Button>
                          <Radio.Button
                            value={2}
                            className="text-xs"
                            disabled={
                              teamAssignments[player.userId] !== 2 &&
                              isTeam2Full
                            }
                          >
                            Đội 2
                          </Radio.Button>
                        </Radio.Group>
                      ) : player.teamNumber ? (
                        <Tag
                          color={player.teamNumber === 1 ? "blue" : "purple"}
                          className="m-0 font-bold"
                        >
                          Đội {player.teamNumber}
                        </Tag>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Chưa chọn
                        </span>
                      )}

                      {match.status === "COMPLETED" &&
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
          <Button onClick={onClose}>Đóng</Button>
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
                className="bg-gradient-to-r from-orange-500 to-purple-600 border-none hover:opacity-90 font-semibold text-white"
                onClick={() => {
                  onClose();
                  onOpenSubmitModal();
                }}
              >
                Báo cáo kết quả
              </Button>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MatchDetailModal;
