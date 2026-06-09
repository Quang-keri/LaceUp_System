import { Button, ConfigProvider, InputNumber, Spin, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import bookingService from "../../../service/bookingService";

interface JoinSharedBookingPanelProps {
  slotInfo: any;
  onConfirmJoin: (bookingId: string, quantity: number) => void;
}

export default function JoinSharedBookingPanel({
  slotInfo,
  onConfirmJoin,
}: JoinSharedBookingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const bookingId = slotInfo?.bookingId;

  useEffect(() => {
    if (!bookingId) {
      setBookingDetail(null);
      setErrorMessage("Không tìm thấy mã booking của trận vãng lai.");
      return;
    }

    let isMounted = true;

    const fetchBookingDetail = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setBookingDetail(null);
        setQuantity(1);

        const response = await bookingService.getBookingById(bookingId);

        if (!isMounted) return;

        const result = response?.result ?? null;

        if (!result) {
          setErrorMessage("Không tìm thấy thông tin trận vãng lai.");
          return;
        }

        if (result.bookingType !== "SHARED") {
          setErrorMessage("Booking này không phải là trận vãng lai.");
          return;
        }

        setBookingDetail(result);
      } catch (error: any) {
        if (!isMounted) return;

        const apiMessage =
          error?.response?.data?.message ||
          "Không thể tải thông tin kèo vãng lai này.";

        setErrorMessage(apiMessage);
        message.error(apiMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBookingDetail();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const firstSlot = useMemo(() => {
    return bookingDetail?.slots?.[0] ?? null;
  }, [bookingDetail]);

  const price = Number(bookingDetail?.pricePerTicket ?? 0);

  const currentParticipants = Number(bookingDetail?.currentParticipants ?? 0);

  const maxParticipants = Number(bookingDetail?.maxParticipants ?? 0);

  const remainingSlots = Math.max(maxParticipants - currentParticipants, 0);

  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;

  const hasValidTicketInformation = price > 0 && maxParticipants > 0;

  const startTime = bookingDetail?.startTime ?? firstSlot?.startTime ?? null;

  const endTime = bookingDetail?.endTime ?? firstSlot?.endTime ?? null;

  const isExpired =
    !startTime ||
    !dayjs(startTime).isValid() ||
    !dayjs(startTime).isAfter(dayjs());

  const totalAmount = price * quantity;

  const courtName =
    slotInfo?.courtCopy?.courtName || firstSlot?.courtName || "Sân thể thao";

  const courtCode =
    slotInfo?.courtCopy?.courtCode || firstSlot?.courtCode || "";

  useEffect(() => {
    if (remainingSlots <= 0) {
      setQuantity(1);
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(Math.max(currentQuantity, 1), remainingSlots),
    );
  }, [remainingSlots]);

  const handleQuantityChange = (value: number | null) => {
    const nextQuantity = Number(value ?? 1);

    if (remainingSlots <= 0) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.min(Math.max(nextQuantity, 1), remainingSlots));
  };

  const handleConfirmJoin = () => {
    const targetBookingId = bookingDetail?.bookingId ?? bookingId;

    if (!targetBookingId) {
      message.error("Không tìm thấy mã booking của trận vãng lai.");
      return;
    }

    if (isExpired) {
      message.warning("Trận vãng lai đã bắt đầu hoặc đã kết thúc.");
      return;
    }

    if (!hasValidTicketInformation) {
      message.error("Kèo chưa có thông tin giá vé hợp lệ.");
      return;
    }

    if (remainingSlots <= 0 || isFull) {
      message.warning("Kèo vãng lai đã đủ người.");
      return;
    }

    if (quantity < 1 || quantity > remainingSlots) {
      message.warning(`Kèo chỉ còn ${remainingSlots} chỗ trống.`);
      return;
    }

    onConfirmJoin(targetBookingId, quantity);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Spin size="large" />

        <p className="text-sm text-gray-500 mt-4">
          Đang tải thông tin trận vãng lai...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium">{errorMessage}</p>
      </div>
    );
  }

  if (!bookingDetail) {
    return (
      <div className="p-6 text-center text-gray-500">
        Không tìm thấy thông tin trận vãng lai.
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#14b8a6",
          borderRadius: 10,
        },
      }}
    >
      <div className="animate-in fade-in duration-300">
        <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
          <p className="text-sm text-teal-900 font-semibold">
            Tham Gia trận vãng lai
          </p>

          <p className="text-xs text-teal-700 mt-1">
            Cùng giao lưu thể thao và kết bạn mới!
          </p>
        </div>

        <div className="border border-teal-100 rounded-xl p-3 bg-teal-50/40 mb-4">
          <p className="font-bold text-gray-800">
            {courtName}

            {courtCode && <span className="text-teal-600"> - {courtCode}</span>}
          </p>

          {startTime && endTime && (
            <p className="text-sm text-gray-500 mt-1">
              {dayjs(startTime).format("DD/MM/YYYY")} •{" "}
              {dayjs(startTime).format("HH:mm")} -{" "}
              {dayjs(endTime).format("HH:mm")}
            </p>
          )}
        </div>

        {isExpired && (
          <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-600">
              Kèo Vãng Lai đã bắt đầu hoặc đã kết thúc.
            </p>

            <p className="text-xs text-red-500 mt-1">
              Bạn không thể đăng ký tham gia kèo này.
            </p>
          </div>
        )}

        {!hasValidTicketInformation ? (
          <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-600">
              Kèo Vãng Lai chưa có thông tin giá vé hoặc số lượng người tối đa.
            </p>

            <p className="text-xs text-red-500 mt-1">
              Kèo này có thể được tạo trước khi hệ thống cập nhật chức năng giá
              vé. Vui lòng tạo lại kèo mới.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Số lượng hiện tại:</span>

                <span
                  className={`font-bold ${
                    isFull ? "text-red-500" : "text-teal-600"
                  }`}
                >
                  {currentParticipants} / {maxParticipants} người
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Số chỗ còn lại:</span>

                <span
                  className={`font-bold ${
                    remainingSlots <= 0 ? "text-red-500" : "text-teal-600"
                  }`}
                >
                  {remainingSlots} chỗ
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-end gap-3">
                <span className="text-gray-700 font-bold">Giá một vé:</span>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-teal-600">
                    {price.toLocaleString("vi-VN")}
                  </span>

                  <span className="text-gray-500 font-medium ml-1">
                    đ/người
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Số người đăng ký:
                </span>

                <span className="text-xs text-gray-500">
                  Tối đa {remainingSlots} người
                </span>
              </div>

              <InputNumber
                min={1}
                max={Math.max(remainingSlots, 1)}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isExpired || isFull || remainingSlots <= 0}
                className="w-full"
                size="large"
              />
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>
                  {quantity} người × {price.toLocaleString("vi-VN")}đ
                </span>

                <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>

              <div className="border-t border-teal-100 pt-3 flex justify-between items-end">
                <span className="font-bold text-gray-800">
                  Tổng thanh toán:
                </span>

                <div>
                  <span className="text-2xl font-extrabold text-teal-600">
                    {totalAmount.toLocaleString("vi-VN")}
                  </span>

                  <span className="text-gray-500 ml-1">đ</span>
                </div>
              </div>
            </div>
          </>
        )}

        <Button
          type="primary"
          disabled={
            isExpired ||
            isFull ||
            !hasValidTicketInformation ||
            remainingSlots <= 0 ||
            quantity < 1 ||
            quantity > remainingSlots
          }
          onClick={handleConfirmJoin}
          className={`
            w-full h-[52px] text-base font-bold rounded-xl
            ${
              !isExpired &&
              !isFull &&
              hasValidTicketInformation &&
              remainingSlots > 0
                ? "!bg-teal-500 !border-teal-500 hover:!bg-teal-600 hover:!border-teal-600"
                : ""
            }
          `}
        >
          {!hasValidTicketInformation
            ? "Kèo Chưa Có Giá Vé"
            : isExpired
            ? "Kèo Đã Bắt Đầu"
            : isFull || remainingSlots <= 0
            ? "Kèo Này Đã Đầy"
            : `Tham Gia ${quantity} Người • ${totalAmount.toLocaleString(
                "vi-VN",
              )}đ`}
        </Button>
      </div>
    </ConfigProvider>
  );
}
