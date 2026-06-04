import React, { useState } from "react";
import {
  Card,
  Tag,
  Typography,
  Button,
  Space,
  Progress,
  message,
  Modal,
  InputNumber,
} from "antd";
import { Calendar, Clock, Users, Trophy, Flame, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MatchResponse } from "../../../types/match.ts";
import matchService from "../../../service/match/matchService.ts";
import { useAuth } from "../../../context/AuthContext.tsx";

const { Text } = Typography;

interface MatchCardProps {
  match: MatchResponse;
  onOpenJoinModal: (match: MatchResponse) => void;
  onJoinSuccess: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onOpenJoinModal,
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Các state quản lý Modal chọn số lượng người
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [isJoining, setIsJoining] = useState(false);

  const formatDate = (dateData: any) => {
    if (Array.isArray(dateData))
      return `${dateData[2].toString().padStart(2, "0")}/${dateData[1]
        .toString()
        .padStart(2, "0")}/${dateData[0]}`;
    return new Date(dateData).toLocaleDateString("vi-VN");
  };

  const formatTime = (timeData: any) => {
    if (Array.isArray(timeData))
      return `${(timeData[3]?.toString() || "00").padStart(2, "0")}:${(
        timeData[4]?.toString() || "00"
      ).padStart(2, "0")}`;
    if (typeof timeData === "string" && timeData.includes("T"))
      return timeData.split("T")[1].substring(0, 5);
    return "--:--";
  };

  const isValidPrice = (price: any) =>
    price != null && price !== "" && !isNaN(Number(price));

  // -------- LOGIC TÍNH TÓAN SỐ NGƯỜI TỐI ĐA --------
  // Số người 1 team (Giả sử chia làm 2 team)
  const maxTeamSize = Math.max(1, Math.floor((match.maxPlayers || 2) / 2));
  // Số lượng tối đa được chọn = Min của (Số người 1 team) và (Số slot còn trống)
  const maxAllowed = Math.min(maxTeamSize, match.remainingSlots);

  // Mở popup chọn số lượng
  const handleOpenPlayerCountModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      message.warning("Vui lòng đăng nhập để tham gia trận đấu!");
      navigate("/login");
      return;
    }
    setPlayerCount(1); // Reset về 1 mỗi khi mở
    setIsJoinModalOpen(true);
  };

  // Xác nhận gọi API tham gia
  const handleConfirmJoin = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsJoining(true);
    try {
      const response = await matchService.joinMatch(match.matchId, playerCount);
      if (response.code === 200 || response.code === 1000) {
        setIsJoinModalOpen(false);
        onJoinSuccess();

        // Backend trả về CheckoutResponse. Xử lý redirect thanh toán nếu có:
        if (response.result && response.result.checkoutUrl) {
          message.success("Đang chuyển hướng thanh toán...");
          window.location.href = response.result.checkoutUrl;
        } else {
          message.success("Tham gia trận thành công!");
          navigate("/my-matches");
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tham gia");
    } finally {
      setIsJoining(false);
    }
  };

  const renderActionButton = () => {
    const isParticipant = match.participants?.some(
      (p: any) => p.userId === user?.userId,
    );

    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant) {
        return (
          <Button disabled className="rounded-xl font-semibold text-sm">
            Đã Tham Gia
          </Button>
        );
      }
      return (
        <Button
          type="primary"
          onClick={handleOpenPlayerCountModal} // Sửa ở đây
          className="rounded-xl font-semibold text-sm shadow-sm"
          style={{ backgroundColor: "#9156F1", borderColor: "#9156F1" }}
        >
          Tham Gia
        </Button>
      );
    }

    if (["READY", "CONFIRMED", "FULL"].includes(match.status)) {
      if (isParticipant) {
        return (
          <Button
            type="primary"
            disabled
            className="rounded-xl font-semibold text-sm shadow-sm"
            style={{ backgroundColor: "#9156F1", borderColor: "#9156F1" }}
          >
            Sẵn Sàng
          </Button>
        );
      }
      return (
        <Button disabled className="rounded-xl font-semibold text-sm">
          Đã Đầy
        </Button>
      );
    }

    return (
      <Button disabled className="rounded-xl font-semibold text-sm">
        Đã Chốt
      </Button>
    );
  };

  return (
    <>
      <Card
        hoverable
        onClick={() => onOpenJoinModal(match)}
        className="rounded-2xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 h-full flex flex-col"
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          },
        }}
      >
        <div className="p-4 pb-2 flex-grow relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              {match.matchType === "RANKED" && (
                <Tag
                  color="purple"
                  icon={<Trophy size={12} className="inline mr-1" />}
                  className="font-bold border-purple-100 rounded-md m-0"
                >
                  Rank ({match.minRank}-{match.maxRank})
                </Tag>
              )}
              {match.matchType === "BET" && (
                <Tag
                  color="green"
                  icon={<Flame size={12} className="inline mr-1" />}
                  className="font-bold border-green-100 rounded-md m-0"
                >
                  Kèo: {match.note || "Tự thỏa thuận"}
                </Tag>
              )}
              {match.matchType !== "RANKED" && match.matchType !== "BET" && (
                <Tag
                  color="blue"
                  icon={<Smile size={12} className="inline mr-1" />}
                  className="font-bold border-blue-100 rounded-md m-0"
                >
                  Giao lưu
                </Tag>
              )}
            </div>

            <Tag
              color="orange"
              bordered={false}
              className="font-bold tracking-wider rounded-md m-0"
            >
              MÃ: {match.roomCode || "TRỐNG"}
            </Tag>
          </div>
          <h3 className="text-xl font-bold text-purple-600 pr-4 line-clamp-2 mt-1">
            {match.categoryName}
          </h3>
          <div className="space-y-2 mb-2 text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <Text className="text-sm font-medium text-slate-600">
                  {formatDate(match.startTime)}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <Text className="text-sm font-medium text-slate-600">
                  {formatTime(match.startTime)} - {formatTime(match.endTime)}
                </Text>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users size={14} />
              <span>
                {match.currentPlayers}/{match.maxPlayers} người
              </span>
            </div>
            <span className="text-emerald-600">
              Còn {match.remainingSlots} slot
            </span>
          </div>
          <Progress
            percent={Math.min(
              (match.currentPlayers / (match.maxPlayers || 1)) * 100,
              100,
            )}
            showInfo={false}
            strokeColor="#9156F1"
            size="small"
            className="m-0"
          />
        </div>

        <div className="bg-slate-50/80 border-t border-slate-100 p-3 mt-auto flex justify-between items-center">
          <div>
            {isValidPrice(match.courtPrice) ? (
              <Text strong className="text-slate-800 text-base block">
                {Number(match.courtPrice).toLocaleString()}đ
              </Text>
            ) : (
              <Text className="font-medium text-slate-500 text-sm block">
                Sân tự thỏa thuận
              </Text>
            )}
            <Text
              className="text-[12px] text-slate-500 font-medium mt-0.5 cursor-pointer hover:text-purple-600 hover:underline transition-colors block"
              onClick={(e) => {
                e.stopPropagation();
                const hostUser = match.participants?.find(
                  (p: any) => p.userName === match.hostName,
                );
                const hostId = (match as any).hostId || hostUser?.userId;
                if (hostId) navigate(`/player/${hostId}`);
                else message.info("Không tìm thấy thông tin hồ sơ của Host!");
              }}
            >
              Host:{" "}
              <span className="text-purple-600 font-semibold">
                {match.hostName}
              </span>
            </Text>
          </div>
          <Space>{renderActionButton()}</Space>
        </div>
      </Card>

      <div onClick={(e) => e.stopPropagation()}>
        <Modal
          title={
            <span className="text-purple-600 font-bold text-lg">
              Xác nhận tham gia
            </span>
          }
          open={isJoinModalOpen}
          onOk={handleConfirmJoin}
          onCancel={() => setIsJoinModalOpen(false)}
          confirmLoading={isJoining}
          okText="Xác nhận"
          cancelText="Hủy"
          centered
          width={400}
          // Đổi màu nút Xác nhận mặc định của Antd sang màu Cam
          okButtonProps={{
            style: { backgroundColor: "#f97316", borderColor: "#f97316" },
            className: "font-semibold shadow-sm hover:opacity-90",
          }}
        >
          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600">Số slot trống hiện tại:</span>
              <span className="font-bold text-orange-500">
                {match.remainingSlots} slot
              </span>
            </div>
            <div className="flex justify-between items-center mb-5">
              <span className="text-slate-600">Giới hạn mỗi lượt đăng ký:</span>
              <span className="font-bold text-purple-600">
                Tối đa {maxTeamSize} người (1 đội)
              </span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/50 p-4 rounded-xl border border-purple-200">
              <span className="font-semibold text-slate-700">
                Số lượng tham gia:
              </span>
              <InputNumber
                min={1}
                max={maxAllowed}
                value={playerCount}
                onChange={(val) => setPlayerCount(val || 1)}
                className="w-24 font-bold text-center"
                size="large"
              />
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default MatchCard;
