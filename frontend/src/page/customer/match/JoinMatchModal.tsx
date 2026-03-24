import React, { useState } from "react";
import { Modal, Button, List, Avatar, Tag, Typography } from "antd";
import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import matchService from "../../../service/match/matchService";
import { toast } from "react-toastify";
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

  if (!match) return null;

  const isParticipant = match.participants?.some(
    (p: any) => p.userId === user?.userId,
  );
  const myParticipantInfo = match.participants?.find(
    (p: any) => p.userId === user?.userId,
  );

  const handleJoin = async () => {
    setLoadingAction(true);
    try {
      const response = await matchService.joinMatch(match.matchId);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Tham gia trận thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tham gia");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDeposit = async () => {
    setLoadingAction(true);
    try {
      const response = await matchService.confirmDeposit(match.matchId);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Đã xác nhận cọc thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xác nhận cọc");
    } finally {
      setLoadingAction(false);
    }
  };

  const renderFooterActions = () => {
    // 1. OPEN và CONFIRMED còn chỗ cho phép tham gia
    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant) {
        return (
          <Button
            disabled
            className="bg-gray-100 text-gray-500 font-semibold border-none rounded-lg px-6"
          >
            Bạn đã tham gia trận này
          </Button>
        );
      }
      return (
        <Button
          type="primary"
          onClick={handleJoin}
          loading={loadingAction}
          className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg px-8 h-10"
        >
          Tham Gia Ngay
        </Button>
      );
    }

    // 2. Chờ chốt cọc
    if (match.status === "WAITING_DEPOSIT") {
      if (isParticipant) {
        if ((myParticipantInfo as any)?.isDepositConfirmed) {
          return (
            <Button
              disabled
              className="bg-green-50 text-green-600 font-semibold border-green-200 rounded-lg px-6 h-10"
            >
              <CheckCircle2 size={18} className="mr-2 inline" /> Đã xác nhận cọc
            </Button>
          );
        }
        return (
          <Button
            type="primary"
            onClick={handleConfirmDeposit}
            loading={loadingAction}
            className="bg-orange-500 hover:bg-orange-600 font-semibold rounded-lg px-8 h-10 animate-pulse border-none"
          >
            Xác Nhận Cọc Ngay
          </Button>
        );
      }
      return (
        <Button
          disabled
          className="bg-gray-100 text-gray-400 font-semibold rounded-lg px-6"
        >
          Đang chờ chốt cọc
        </Button>
      );
    }

    // 3. Đã đủ người & chốt xong
    if (match.status === "FULL" || match.status === "CONFIRMED") {
      return (
        <Button
          disabled
          className="bg-green-100 text-green-700 font-semibold rounded-lg px-6 border-none"
        >
          {isParticipant
            ? "Trận đấu đã chốt - Sẵn sàng!"
            : "Trận đấu đã đủ người"}
        </Button>
      );
    }

    // 4. Các trạng thái khác (COMPLETED, v.v.)
    return (
      <Button onClick={onClose} className="rounded-lg">
        Đóng
      </Button>
    );
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
        <div className="flex justify-end gap-3 mt-4">
          {renderFooterActions()}
        </div>
      }
      width={500}
      centered
    >
      <div className="mt-4">
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
                  : match.address || "Tự thỏa thuận"}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-500 shrink-0" />
              <Text>
                {new Date(match.startTime).toLocaleDateString("vi-VN")}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-blue-500 shrink-0" />
              <Text>
                {match.startTime.split("T")[1]?.substring(0, 5)} -{" "}
                {match.endTime.split("T")[1]?.substring(0, 5)}
              </Text>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <Text strong className="text-gray-800 text-base">
              Danh sách tham gia
            </Text>
            <Text className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">
              {match.currentPlayers} / {match.maxPlayers}
            </Text>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
            <List
              dataSource={match.participants || []}
              renderItem={(player: any) => (
                <List.Item className="border-b-0 hover:bg-white transition-colors rounded-lg px-3 py-2 mb-1">
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
                            {player.isDepositConfirmed ? "Đã cọc" : "Chưa cọc"}
                          </span>
                        )}
                      </div>
                    }
                  />
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
