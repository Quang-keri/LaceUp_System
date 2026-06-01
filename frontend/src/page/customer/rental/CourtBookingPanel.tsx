import { Button, Empty } from "antd";
import dayjs from "dayjs";

interface CourtBookingPanelProps {
  selectedSlots: any[];
  priceRules?: any[];
  onBook: () => void;
}

export default function CourtBookingPanel({
  selectedSlots = [],
  priceRules = [],
  onBook,
}: CourtBookingPanelProps) {


   

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;

    const [hour, minute] = timeStr.split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
  };

  const calculateSingleSlotPrice = (item: any) => {
    const slotDate = dayjs(item.date);
    const formattedDate = slotDate.format("YYYY-MM-DD");

    const isWeekend = slotDate.day() === 0 || slotDate.day() === 6;
    const dayTypeTarget = isWeekend ? "WEEKEND" : "WEEKDAY";

    const slotStartMin = timeToMinutes(item.startTime);
    const slotEndMin = timeToMinutes(item.endTime);

    const targetRules =
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
      const matchedRules = targetRules.filter((rule: any) => {
        if (!rule.startTime || !rule.endTime) return false;

        const ruleStartMin = timeToMinutes(rule.startTime);
        const ruleEndMin = timeToMinutes(rule.endTime);

        const isTimeMatch =
          currentMin >= ruleStartMin && currentMin < ruleEndMin;

        if (!isTimeMatch) return false;

        if (rule.dayType && rule.dayType !== dayTypeTarget) return false;

        if (rule.specificDate) {
          return rule.specificDate === formattedDate;
        }

        if (rule.startDate && rule.endDate) {
          return (
            formattedDate >= rule.startDate && formattedDate <= rule.endDate
          );
        }

        return true;
      });

      matchedRules.sort(
        (a: any, b: any) =>
          (Number(b.priority) || 0) - (Number(a.priority) || 0),
      );

      const activeRule = matchedRules[0];

      const pricePerHour = activeRule
        ? Number(activeRule.pricePerHour)
        : fallbackPrice;

      totalPrice += pricePerHour * 0.5;
    }

    return Math.round(totalPrice);
  };

  const total = selectedSlots.reduce(
    (sum, item) => sum + calculateSingleSlotPrice(item),
    0,
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
        <p className="text-sm text-orange-900 font-semibold">Các sân đã chọn</p>
      </div>

      {selectedSlots.length === 0 ? (
        <Empty description="Chưa chọn sân nào trên lịch" />
      ) : (
        <div className="space-y-3 mb-5 max-h-[320px] overflow-y-auto pr-1">
          {selectedSlots.map((item: any, idx: number) => {
            const currentPrice = calculateSingleSlotPrice(item);

            return (
              <div
                key={`${item.courtCopyId}-${item.date}-${item.startTime}-${idx}`}
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
                      {dayjs(item.date).format("DD/MM/YYYY")} • {item.startTime}{" "}
                      - {item.endTime}
                    </p>

                    <p className="text-xs font-medium text-[#9156F1] mt-1">
                      Loại sân: {item.categoryName || "Sân thể thao"}
                    </p>

                    <p className="text-xs font-medium text-gray-500 mt-1">
                      Thời lượng: {item.duration || 1} giờ
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center">
                    <p className="font-bold text-lg text-orange-600 whitespace-nowrap">
                      {currentPrice.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 mb-6 border-t border-gray-100 pt-4">
        <span className="text-gray-600 font-medium pb-1">Tổng tiền</span>

        <span className="text-3xl font-extrabold text-orange-500">
          {total.toLocaleString("vi-VN")}
        </span>

        <span className="text-gray-500 font-medium pb-1">VNĐ</span>
      </div>

      <Button
        type="primary"
        disabled={selectedSlots.length === 0}
        onClick={onBook}
        className="w-full h-[52px] text-base font-bold rounded-xl mt-2
          !bg-[#ea580c] !border-[#ea580c]
          hover:!bg-[#c2410c] hover:!border-[#c2410c]"
      >
        Đặt sân ngay
      </Button>
    </div>
  );
}
