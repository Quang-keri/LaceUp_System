import React, { useState } from "react";
import {
  Button,
  Card,
  InputNumber,
  message,
  Modal,
  Progress,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Calendar,
  Clock,
  Crown,
  Flame,
  Smile,
  Trophy,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { MatchResponse } from "../../../types/match";
import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";

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

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [isJoining, setIsJoining] = useState(false);

  const formatDate = (dateData: any) => {
    if (Array.isArray(dateData)) {
      return `${dateData[2].toString().padStart(2, "0")}/${dateData[1]
        .toString()
        .padStart(2, "0")}/${dateData[0]}`;
    }

    return new Date(dateData).toLocaleDateString("vi-VN");
  };

  const formatTime = (timeData: any) => {
    if (Array.isArray(timeData)) {
      return `${(timeData[3]?.toString() || "00").padStart(2, "0")}:${(
        timeData[4]?.toString() || "00"
      ).padStart(2, "0")}`;
    }

    if (typeof timeData === "string" && timeData.includes("T")) {
      return timeData.split("T")[1].substring(0, 5);
    }

    return "--:--";
  };

  const isValidPrice = (price: any) =>
    price != null && price !== "" && !Number.isNaN(Number(price));

  const maxTeamSize = Math.max(1, Math.floor((match.maxPlayers || 2) / 2));

  const maxAllowed = Math.min(maxTeamSize, match.remainingSlots);

  const unitPrice = isValidPrice(match.courtPrice)
    ? Math.round(Number(match.courtPrice) / (match.maxPlayers || 1))
    : null;

  const handleOpenPlayerCountModal = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!user) {
      message.warning("Vui lòng đăng nhập để tham gia trận đấu!");
      navigate("/login");
      return;
    }

    setPlayerCount(1);
    setIsJoinModalOpen(true);
  };

  const handleConfirmJoin = async (event?: React.MouseEvent) => {
    event?.stopPropagation();

    try {
      setIsJoining(true);

      const response = await matchService.joinMatch(match.matchId, playerCount);

      if (response.code === 200 || response.code === 1000) {
        setIsJoinModalOpen(false);
        onJoinSuccess();

        if (response.result?.checkoutUrl) {
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
      (participant: any) =>
        participant.userId === user?.userId &&
        participant.isCancelled === false,
    );

    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant) {
        return (
          <Button
            disabled
            className="shrink-0 rounded-xl font-semibold text-sm"
          >
            Đã Tham Gia
          </Button>
        );
      }

      return (
        <Button
          type="primary"
          onClick={handleOpenPlayerCountModal}
          className="shrink-0 rounded-xl font-semibold text-sm shadow-sm"
          style={{
            backgroundColor: "#9156F1",
            borderColor: "#9156F1",
          }}
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
            className="shrink-0 rounded-xl font-semibold text-sm shadow-sm"
          >
            Sẵn Sàng
          </Button>
        );
      }

      return (
        <Button disabled className="shrink-0 rounded-xl font-semibold text-sm">
          Đã Đầy
        </Button>
      );
    }

    return (
      <Button disabled className="shrink-0 rounded-xl font-semibold text-sm">
        Đã Chốt
      </Button>
    );
  };

  return (
    <>
      <Card
        hoverable
        onClick={() => onOpenJoinModal(match)}
        className="rounded-2xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col"
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div className="relative p-4 pb-3 flex flex-col">
          <div className="mb-4 flex h-6 items-center justify-between gap-2">
            <div className="min-w-0">
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
                  className="max-w-full truncate font-bold border-green-100 rounded-md m-0"
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
              className="shrink-0 font-bold tracking-wider rounded-md m-0"
            >
              MÃ: {match.roomCode || "TRỐNG"}
            </Tag>
          </div>

          <h3 className="mt-1 mb-1 h-7 truncate pr-4 text-xl font-bold leading-7 text-purple-600">
            {match.categoryName}
          </h3>

          <div className="mb-3 h-5 truncate text-sm font-semibold leading-5 text-slate-500">
            <span className="text-slate-400">Sân: </span>
            {match.courtName || "Sân không xác định"}
          </div>

          <div className="mb-3 h-6 text-slate-600">
            <div className="flex h-6 items-center gap-4 whitespace-nowrap">
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

          <div className="mb-1 flex h-5 items-center justify-between text-xs font-semibold">
            <div className="min-w-0 flex items-center gap-1.5 text-slate-600">
              <Users size={14} className="shrink-0" />
              <span className="truncate">
                Giá: {match.currentPlayers}/{match.maxPlayers} người
              </span>
            </div>

            <span className="ml-2 shrink-0 text-emerald-600">
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

        <div className="flex min-h-[72px] items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 p-3">
          <div className="min-w-0 flex-1">
            {unitPrice !== null ? (
              <Text strong className="text-slate-800 text-base block">
                {unitPrice.toLocaleString("vi-VN")}đ{" "}
                <span className="text-xs text-slate-500 font-normal">
                  / người
                </span>
              </Text>
            ) : (
              <Text className="block truncate font-medium text-slate-500 text-sm">
                Sân tự thỏa thuận
              </Text>
            )}

            {match.host ? (
              <Tooltip
                title={`SĐT: ${match.host.phone || "Chưa cập nhật"}`}
                placement="bottomLeft"
              >
                <div className="flex min-w-0 items-center gap-1 text-xs text-orange-600 font-medium cursor-help">
                  <Crown size={12} className="shrink-0 text-orange-500" />
                  <span className="truncate">Host: {match.host.userName}</span>
                </div>
              </Tooltip>
            ) : (
              <div className="h-4" />
            )}
          </div>

          {renderActionButton()}
        </div>
      </Card>

      <div onClick={(event) => event.stopPropagation()}>
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
          okButtonProps={{
            style: {
              backgroundColor: "#f97316",
              borderColor: "#f97316",
            },
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
                onChange={(value) => setPlayerCount(value || 1)}
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
