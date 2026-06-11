import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  InputNumber,
  message,
  Modal,
  Progress,
  Tag,
  Typography,
} from "antd";
import { Calendar, Clock, Ticket, Users, UserRoundPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import bookingService from "../../../service/bookingService";
import type { SharedBookingPublicResponse } from "../../../types/booking";
import { useAuth } from "../../../context/AuthContext";

const { Text } = Typography;

interface SharedBookingCardProps {
  booking: SharedBookingPublicResponse;
  onJoinSuccess: () => void;
}

const SharedBookingCard: React.FC<SharedBookingCardProps> = ({
  booking,
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [joining, setJoining] = useState(false);

  const currentParticipants = Number(booking.currentParticipants ?? 0);

  const reservedParticipants = Number(
    booking.reservedParticipants ?? booking.currentParticipants ?? 0,
  );

  const maxParticipants = Number(booking.maxParticipants ?? 0);
  const remainingSlots = Number(booking.remainingSlots ?? 0);
  const minParticipants = Number(booking.minParticipants ?? 0);
  const pricePerTicket = Number(booking.pricePerTicket ?? 0);

  const progressPercent = useMemo(() => {
    if (maxParticipants <= 0) return 0;

    return Math.min((reservedParticipants / maxParticipants) * 100, 100);
  }, [reservedParticipants, maxParticipants]);

  const formatDate = (dateValue: string) => {
    if (!dateValue) return "--/--/----";
    return new Date(dateValue).toLocaleDateString("vi-VN");
  };

  const formatTime = (dateValue: string) => {
    if (!dateValue) return "--:--";

    if (dateValue.includes("T")) {
      return dateValue.split("T")[1].substring(0, 5);
    }

    return new Date(dateValue).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenJoinModal = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!user) {
      message.warning("Vui lòng đăng nhập để tham gia vãng lai!");
      navigate("/login");
      return;
    }

    if (remainingSlots <= 0) {
      message.warning("Trận vãng lai đã đủ người!");
      return;
    }

    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleJoin = async () => {
    if (quantity <= 0) {
      message.warning("Số lượng vé phải lớn hơn 0!");
      return;
    }

    if (quantity > remainingSlots) {
      message.warning(`Chỉ còn ${remainingSlots} vé trống!`);
      return;
    }

    try {
      setJoining(true);

      const response = await bookingService.joinSharedBooking(
        booking.bookingId,
        quantity,
      );

      if (response?.code === 200 || response?.code === 1000) {
        setIsModalOpen(false);
        message.success("Đăng ký vãng lai thành công!");
        onJoinSuccess();
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tham gia trận vãng lai",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <Card
        hoverable
        className="rounded-2xl border-orange-200 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 flex flex-col"
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div className="p-4 pb-3 flex flex-col">
          <div className="mb-4 flex h-6 items-center justify-between gap-2">
            <Tag
              color="orange"
              icon={<Ticket size={12} className="inline mr-1" />}
              className="font-bold rounded-md m-0"
            >
              Vãng lai
            </Tag>

            <Tag
              color="cyan"
              bordered={false}
              className="font-semibold rounded-md m-0"
            >
              Tối thiểu {minParticipants} người
            </Tag>
          </div>

          <h3 className="mt-1 mb-1 h-7 truncate pr-4 text-xl font-bold leading-7 text-orange-500">
            {booking.categoryName || "Trận vãng lai"}
          </h3>

          <div className="mb-3 h-5 truncate text-sm font-semibold leading-5 text-slate-500">
            <span className="text-slate-400">Sân: </span>
            {booking.courtName || booking.courtCode || "Sân chưa xác định"}

            {booking.courtCode && booking.courtName && (
              <span className="ml-1 text-slate-400">({booking.courtCode})</span>
            )}
          </div>

          <div className="mb-3 h-6 text-slate-600">
            <div className="flex h-6 items-center gap-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <Text className="text-sm font-medium text-slate-600">
                  {formatDate(booking.startTime)}
                </Text>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <Text className="text-sm font-medium text-slate-600">
                  {formatTime(booking.startTime)} -{" "}
                  {formatTime(booking.endTime)}
                </Text>
              </div>
            </div>
          </div>

          <div className="mb-1 flex h-5 items-center justify-between text-xs font-semibold">
            <div className="min-w-0 flex items-center gap-1.5 text-slate-600">
              <Users size={14} className="shrink-0" />
              <span className="truncate">
                Đã đăng ký: {reservedParticipants}/{maxParticipants} người
              </span>
            </div>

            <span
              className={`ml-2 shrink-0 ${
                remainingSlots > 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {remainingSlots > 0
                ? `Còn ${remainingSlots} slot`
                : "Đã đủ người"}
            </span>
          </div>

          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor="#f97316"
            size="small"
            className="m-0"
          />
        </div>

        <div className="flex min-h-[72px] items-center justify-between gap-3 border-t border-orange-100 bg-orange-50/50 p-3">
          <div className="min-w-0 flex-1">
            <Text strong className="text-slate-800 text-base block">
              {pricePerTicket.toLocaleString("vi-VN")}đ{" "}
              <span className="text-xs text-slate-500 font-normal">
                / người
              </span>
            </Text>

            <Text className="block truncate text-xs text-slate-500">
              Đã xác nhận: {currentParticipants} người
            </Text>
          </div>

          <Button
            type="primary"
            icon={<UserRoundPlus size={15} />}
            disabled={remainingSlots <= 0}
            onClick={handleOpenJoinModal}
            className="shrink-0 rounded-xl font-semibold text-sm shadow-sm"
            style={{
              backgroundColor: remainingSlots > 0 ? "#f97316" : undefined,
              borderColor: remainingSlots > 0 ? "#f97316" : undefined,
            }}
          >
            {remainingSlots > 0 ? "Tham gia" : "Đã đầy"}
          </Button>
        </div>
      </Card>

      <Modal
        title={
          <span className="text-orange-500 font-bold text-lg">
            Tham gia trận vãng lai
          </span>
        }
        open={isModalOpen}
        onOk={handleJoin}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={joining}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        width={420}
        okButtonProps={{
          style: {
            backgroundColor: "#f97316",
            borderColor: "#f97316",
          },
        }}
      >
        <div className="py-4">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
            <div className="font-bold text-slate-800">
              {booking.categoryName || "Trận vãng lai"}
            </div>

            <div className="text-sm text-slate-500 mt-1">
              {booking.rentalAreaName}
            </div>

            <div className="text-sm text-slate-500">
              {formatDate(booking.startTime)} • {formatTime(booking.startTime)}{" "}
              - {formatTime(booking.endTime)}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600">Số vé còn lại:</span>
            <span className="font-bold text-emerald-600">
              {remainingSlots} vé
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">Số lượng vé:</span>

            <InputNumber
              min={1}
              max={remainingSlots}
              value={quantity}
              onChange={(value) => setQuantity(value || 1)}
              size="large"
              className="w-24"
            />
          </div>

          <div className="flex justify-between items-center mt-4 text-base">
            <span className="font-semibold text-slate-700">Tổng tiền:</span>

            <span className="font-bold text-orange-500">
              {(pricePerTicket * quantity).toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SharedBookingCard;
