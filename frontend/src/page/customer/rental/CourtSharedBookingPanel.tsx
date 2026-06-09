import { Button, Empty, Select, Alert, ConfigProvider } from "antd";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

export interface PriceRule {
  startTime?: string;
  endTime?: string;
  dayType?: "WEEKDAY" | "WEEKEND" | string;
  specificDate?: string;
  startDate?: string;
  endDate?: string;
  priority?: number;
  pricePerHour?: number;
}

export interface SlotItem {
  courtCopyId: string | number;
  courtId?: string | number;
  courtCode?: string;
  courtName?: string;
  categoryName?: string;
  date: string;
  startTime: string;
  endTime: string;
  price?: number;
  minPrice?: number;
  priceRules?: PriceRule[];
  court?: {
    categoryName?: string;
    priceRules?: PriceRule[];
    minPrice?: number;
    price?: number;
  };
}

interface CourtSharedBookingPanelProps {
  selectedSlots: SlotItem[];
  priceRules?: PriceRule[];
  onBook: (maxParticipants: number, hostSlots: number) => void;
}

export default function CourtSharedBookingPanel({
  selectedSlots = [],
  priceRules = [],
  onBook,
}: CourtSharedBookingPanelProps) {
  const firstSlot = selectedSlots[0];
  const categoryName = (
    firstSlot?.categoryName ||
    firstSlot?.court?.categoryName ||
    ""
  ).toLowerCase();

  const isBongDa =
    categoryName.includes("bóng đá") || categoryName.includes("football");
  const minSelectable = isBongDa ? 10 : 2;
  const maxSelectable = isBongDa ? 30 : 10;

  const [maxParticipants, setMaxParticipants] = useState<number>(minSelectable);
  const [hostSlots, setHostSlots] = useState<number>(1);

  useEffect(() => {
    setMaxParticipants(minSelectable);
    setHostSlots(1);
  }, [minSelectable]);

  const uniqueCourts = new Set(selectedSlots.map((s) => s.courtCopyId));
  const isMultipleCourts = uniqueCourts.size > 1;

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [hour, minute] = timeStr.split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
  };

  const calculateSingleSlotPrice = (item: SlotItem): number => {
    const slotDate = dayjs(item.date);
    const formattedDate = slotDate.format("YYYY-MM-DD");
    const isWeekend = slotDate.day() === 0 || slotDate.day() === 6;
    const dayTypeTarget = isWeekend ? "WEEKEND" : "WEEKDAY";

    const slotStartMin = timeToMinutes(item.startTime);
    const slotEndMin = timeToMinutes(item.endTime);

    const targetRules: PriceRule[] =
      item.priceRules || item.court?.priceRules || priceRules || [];
    const fallbackPrice =
      Number(item.minPrice) ||
      Number(item.price) ||
      Number(item.court?.minPrice) ||
      Number(item.court?.price) ||
      0;

    let totalPrice = 0;
    for (
      let currentMin = slotStartMin;
      currentMin < slotEndMin;
      currentMin += 30
    ) {
      const matchedRules = targetRules.filter((rule: PriceRule) => {
        if (!rule.startTime || !rule.endTime) return false;
        const ruleStartMin = timeToMinutes(rule.startTime);
        const ruleEndMin = timeToMinutes(rule.endTime);

        if (currentMin < ruleStartMin || currentMin >= ruleEndMin) return false;
        if (rule.dayType && rule.dayType !== dayTypeTarget) return false;
        if (rule.specificDate && rule.specificDate !== formattedDate)
          return false;
        if (rule.startDate && rule.endDate) {
          return (
            formattedDate >= rule.startDate && formattedDate <= rule.endDate
          );
        }
        return true;
      });

      matchedRules.sort(
        (a: PriceRule, b: PriceRule) =>
          (Number(b.priority) || 0) - (Number(a.priority) || 0),
      );

      const activeRule = matchedRules[0];
      const pricePerHour = activeRule
        ? Number(activeRule.pricePerHour || 0)
        : fallbackPrice;

      totalPrice += pricePerHour * 0.5;
    }
    return Math.round(totalPrice);
  };

  const totalFieldPrice = selectedSlots.reduce(
    (sum, item) => sum + calculateSingleSlotPrice(item),
    0,
  );

  const SURCHARGE_RATE = 1.2;
  const pricePerTicket =
    maxParticipants > 0
      ? Math.ceil((totalFieldPrice * SURCHARGE_RATE) / maxParticipants)
      : 0;

  const maxParticipantsOptions = Array.from(
    { length: maxSelectable - minSelectable + 1 },
    (_, i) => {
      const val = minSelectable + i;
      return { value: val, label: `${val} Người` };
    },
  );

  const hostSlotsOptions = Array.from({ length: maxParticipants }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} Người (Bao gồm bạn)`,
  }));

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#ea580c" } }}>
      <div className="animate-in fade-in duration-300">
        <div className="mb-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
          <p className="text-sm text-orange-900 font-semibold">
            Đặt sân vãng lai
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Môn thể thao:{" "}
            <b className="uppercase text-orange-600">
              {firstSlot?.categoryName ||
                firstSlot?.court?.categoryName ||
                "Hệ thống"}
            </b>
          </p>
        </div>

        {selectedSlots.length === 0 ? (
          <Empty description="Chưa chọn sân nào trên lịch" />
        ) : isMultipleCourts ? (
          <Alert
            message="Lỗi chọn sân"
            description="Chức năng Vãng lai chỉ hỗ trợ trên 1 sân duy nhất. Vui lòng bỏ chọn các sân khác."
            type="error"
            showIcon
            className="mb-4"
          />
        ) : (
          <>
            <div className="space-y-3 mb-4 max-h-[160px] overflow-y-auto pr-1">
              {selectedSlots.map((item: SlotItem, idx: number) => (
                <div
                  key={`${item.courtCopyId}-${item.date}-${idx}`}
                  className="border border-orange-100 rounded-xl p-3 bg-orange-50/40"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800">
                        {item.courtName || "Sân"}{" "}
                        <span className="text-orange-600">
                          - {item.courtCode}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {dayjs(item.date).format("DD/MM/YYYY")} •{" "}
                        {item.startTime} - {item.endTime}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center">
                      <p className="font-bold text-base text-orange-600">
                        {calculateSingleSlotPrice(item).toLocaleString("vi-VN")}{" "}
                        đ
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <span className="text-gray-600 font-medium text-xs block mb-1">
                Số lượng người phe của bạn:
              </span>
              <Select
                value={hostSlots}
                onChange={(val) => setHostSlots(val)}
                className="w-full"
                options={hostSlotsOptions}
              />
            </div>

            <div className="mb-4">
              <span className="text-gray-600 font-medium text-xs block mb-1">
                Tổng số người chơi tối đa của kèo này:
              </span>
              <Select
                value={maxParticipants}
                onChange={(val) => {
                  setMaxParticipants(val);
                  if (hostSlots > val) setHostSlots(val);
                }}
                className="w-full"
                options={maxParticipantsOptions}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-gray-500">
                <span>Tổng tiền thuê sân (Giá gốc):</span>
                <span className="font-medium">
                  {totalFieldPrice.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Số slot phe bạn giữ:</span>
                <span className="font-medium text-orange-600">
                  {hostSlots} Slot
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500 mt-2 border-t border-dashed border-gray-300 pt-2">
                <span>Giá mỗi vé bán ra trên App (*):</span>
                <span className="font-bold text-gray-700">
                  {pricePerTicket.toLocaleString("vi-VN")} đ/người
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-end">
                <span className="text-gray-700 font-bold text-sm">
                  Bạn thanh toán trước:
                </span>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-orange-500">
                    {totalFieldPrice.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-gray-500 font-medium ml-1">đ</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 italic text-justify leading-tight">
                (*) Hệ thống tự động cộng thêm 20% vào giá vé lẻ để bù đắp rủi
                ro trống slot và công tổ chức trận đấu cho bạn. Bạn sẽ thu lại
                khoản tiền này trực tiếp từ người tham gia.
              </p>
            </div>

            <Button
              type="primary"
              onClick={() => onBook(maxParticipants, hostSlots)}
              className="w-full h-[48px] text-base font-bold rounded-xl !bg-[#ea580c] !border-[#ea580c] hover:!bg-[#c2410c] hover:!border-[#c2410c]"
            >
              Đặt sân vãng lai Ngay
            </Button>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}
