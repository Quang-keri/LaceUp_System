import React, { useState, useMemo } from "react";
import { Modal, Checkbox, Button, message, Avatar } from "antd";
import { Trophy, UserX, CheckCircle2, AlertTriangle } from "lucide-react";
import matchService from "../../../../service/match/matchService.ts";

interface SubmitResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  match: any;
}

const SubmitResultModal: React.FC<SubmitResultModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  match,
}) => {
  const [loading, setLoading] = useState(false);
  const [winningTeam, setWinningTeam] = useState<number | null>(null);
  const [absentUsers, setAbsentUsers] = useState<string[]>([]);

  const { team1, team2, allPlayers } = useMemo(() => {
    if (!match?.participants) return { team1: [], team2: [], allPlayers: [] };
    return {
      team1: match.participants.filter((p: any) => p.teamNumber === 1),
      team2: match.participants.filter((p: any) => p.teamNumber === 2),
      allPlayers: match.participants,
    };
  }, [match]);

  const handleSubmit = async () => {
    if (!winningTeam) {
      return message.warning("Vui lòng chọn đội chiến thắng!");
    }

    setLoading(true);
    try {
      const payload = {
        matchId: match.matchId,
        winningTeamNumber: winningTeam,
        absentUserIds: absentUsers,
      };

      const response = await matchService.submitResult(payload);
      if (response.code === 200) {
        message.success("Đã gửi kết quả thành công, chờ đối thủ xác nhận!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi gửi kết quả!");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setWinningTeam(null);
      setAbsentUsers([]);
    }
  }, [isOpen]);

  if (!match) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 text-lg font-bold text-gray-800">
          <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
            <Trophy className="text-amber-500" size={20} />
          </div>
          Chốt Kết Quả Trận Đấu
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
    >
      <div className="mt-5 space-y-5">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            1. Đội hình nào chiến thắng?
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setWinningTeam(1)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                winningTeam === 1
                  ? "border-orange-500 bg-orange-50/40 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              {winningTeam === 1 && (
                <CheckCircle2
                  className="absolute top-3 right-3 text-orange-500 fill-white"
                  size={18}
                />
              )}
              <div className="font-extrabold text-base text-orange-600 mb-2">
                Đội 1
              </div>
              <div className="flex flex-col gap-1.5">
                {team1.map((p: any) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-gray-100"
                  >
                    <Avatar
                      size={18}
                      className="bg-orange-100 text-orange-600 text-[10px] font-bold"
                    >
                      {p.userName?.charAt(0)}
                    </Avatar>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {p.userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => setWinningTeam(2)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                winningTeam === 2
                  ? "border-purple-500 bg-purple-50/40 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              {winningTeam === 2 && (
                <CheckCircle2
                  className="absolute top-3 right-3 text-purple-500 fill-white"
                  size={18}
                />
              )}
              <div className="font-extrabold text-base text-purple-600 mb-2">
                Đội 2
              </div>
              <div className="flex flex-col gap-1.5">
                {team2.map((p: any) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-gray-100"
                  >
                    <Avatar
                      size={18}
                      className="bg-purple-100 text-purple-600 text-[10px] font-bold"
                    >
                      {p.userName?.charAt(0)}
                    </Avatar>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {p.userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100/70">
          <div className="flex items-center gap-2 font-bold text-rose-800 text-xs uppercase tracking-wider mb-1.5">
            <UserX size={15} /> 2. Điểm danh thành viên vắng mặt
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-rose-600/90 mb-3 leading-relaxed">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>
              Đánh dấu những người chơi không ra sân/bỏ kèo. Thành viên bị chọn
              sẽ bị trừ 20 điểm uy tín hệ thống.
            </span>
          </div>

          <Checkbox.Group
            className="w-full grid grid-cols-2 gap-2"
            onChange={(checkedValues) =>
              setAbsentUsers(checkedValues as string[])
            }
            value={absentUsers}
          >
            {allPlayers.map((player: any) => (
              <label
                key={player.userId}
                className={`flex items-center justify-between bg-white p-2.5 rounded-xl border cursor-pointer transition-all ${
                  absentUsers.includes(player.userId)
                    ? "border-rose-300 bg-rose-50/30"
                    : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    size="small"
                    className="bg-gray-100 text-gray-600 shrink-0 text-xs font-semibold"
                  >
                    {player.userName?.charAt(0)}
                  </Avatar>
                  <span className="text-xs font-semibold text-gray-700 truncate">
                    {player.userName}
                  </span>
                </div>
                <Checkbox
                  value={player.userId}
                  className="m-0 custom-rose-checkbox"
                />
              </label>
            ))}
          </Checkbox.Group>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl font-medium px-6"
          >
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 border-none hover:opacity-90 font-bold text-white shadow-sm"
          >
            Gửi báo cáo kết quả
          </Button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-rose-checkbox .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #e11d48 !important;
            border-color: #e11d48 !important;
          }
          .custom-rose-checkbox .ant-checkbox-wrapper:hover .ant-checkbox-inner, 
          .custom-rose-checkbox .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #e11d48 !important;
          }
        `,
        }}
      />
    </Modal>
  );
};

export default SubmitResultModal;
