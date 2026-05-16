import React, { useState, useMemo } from "react";
import { Modal, Radio, Checkbox, Button, message, Tag, Avatar } from "antd";
import { Trophy, UserX } from "lucide-react";
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

  // Lọc danh sách người chơi theo đội (Bỏ qua những ai chưa có team)
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

  // Reset state mỗi khi mở lại modal
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
        <div className="flex items-center gap-2 text-xl font-black text-slate-800">
          <Trophy className="text-amber-500" size={24} />
          Chốt Kết Quả Trận Đấu
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
    >
      <div className="mt-4 space-y-6">
        {/* CHỌN ĐỘI THẮNG */}
        <div>
          <div className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-3">
            1. Ai là người chiến thắng?
          </div>

          <Radio.Group
            className="w-full grid grid-cols-2 gap-3 custom-radio-team"
            onChange={(e) => setWinningTeam(e.target.value)}
            value={winningTeam}
          >
            <Radio.Button
              value={1}
              className="h-auto p-3 text-center rounded-xl border border-slate-200"
            >
              <div className="font-bold text-lg text-cyan-700 mb-2">Đội 1</div>
              <div className="flex flex-wrap justify-center gap-1">
                {team1.map((p: any) => (
                  <Tag key={p.userId} color="cyan">
                    {p.userName}
                  </Tag>
                ))}
              </div>
            </Radio.Button>

            <Radio.Button
              value={2}
              className="h-auto p-3 text-center rounded-xl border border-slate-200"
            >
              <div className="font-bold text-lg text-purple-700 mb-2">
                Đội 2
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {team2.map((p: any) => (
                  <Tag key={p.userId} color="purple">
                    {p.userName}
                  </Tag>
                ))}
              </div>
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* ĐIỂM DANH VẮNG MẶT */}
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
          <div className="flex items-center gap-2 font-bold text-rose-800 uppercase text-xs tracking-wider mb-3">
            <UserX size={16} /> 2. Điểm danh (Báo vắng mặt)
          </div>
          <p className="text-xs text-rose-600 mb-3 italic">
            * Đánh dấu những người bỏ kèo/không ra sân. Những người này sẽ bị
            trừ 20 điểm uy tín.
          </p>

          <Checkbox.Group
            className="w-full flex flex-col gap-2"
            onChange={(checkedValues) =>
              setAbsentUsers(checkedValues as string[])
            }
            value={absentUsers}
          >
            {allPlayers.map((player: any) => (
              <Checkbox
                key={player.userId}
                value={player.userId}
                className="ml-0 bg-white p-2 rounded-lg border border-rose-100 flex items-center"
              >
                <div className="flex items-center gap-2">
                  <Avatar size="small" className="bg-rose-200 text-rose-700">
                    {player.userName.charAt(0)}
                  </Avatar>
                  <span className="font-semibold text-slate-700">
                    {player.userName}
                  </span>
                </div>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>

        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-base border-0"
        >
          Gửi Báo Cáo
        </Button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-radio-team .ant-radio-button-wrapper-checked {
          background-color: #f0f9ff !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 1px #3b82f6 !important;
        }
      `,
        }}
      />
    </Modal>
  );
};

export default SubmitResultModal;
