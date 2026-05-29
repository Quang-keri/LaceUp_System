import dayjs from "dayjs";
import { useRef, useState, useEffect } from "react";
import { message } from "antd";

const generateTimeSlots = (openTimeStr: string, closeTimeStr: string) => {
  const slots = [];
  const startHour = openTimeStr ? parseInt(openTimeStr.split(":")[0], 10) : 5;
  const endHour = closeTimeStr ? parseInt(closeTimeStr.split(":")[0], 10) : 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const formattedHour = hour.toString().padStart(2, "0");
    slots.push(`${formattedHour}:00`);

    if (hour !== endHour) {
      slots.push(`${formattedHour}:30`);
    }
  }

  return slots;
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export default function CourtScheduleTimeline({
  courts,
  selectedDate,
  onSelectSlot,
  openTime,
  closeTime,
}: any) {
  const timeSlots = generateTimeSlots(openTime, closeTime);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [selection, setSelection] = useState<{
    courtId: string;
    anchor: number;
    startIndex: number;
    endIndex: number;
  } | null>(null);

  useEffect(() => {
    setSelection(null);
  }, [selectedDate]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft > 0) {
        const progress = (container.scrollLeft / maxScrollLeft) * 100;
        setScrollProgress(progress);
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setScrollProgress(value);

    const container = scrollContainerRef.current;
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      container.scrollLeft = (value / 100) * maxScrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [courts, timeSlots]);

  const getSlotAtTime = (court: any, time: string) => {
    const allSlots =
      court.courtCopies?.flatMap((copy: any) => copy.slots || []) || [];
    if (allSlots.length === 0) return null;

    const slotMinute = timeToMinutes(time);

    return allSlots.find((slot: any) => {
      const start = dayjs(slot.startTime);
      const end = dayjs(slot.endTime);
      const sameDay = start.isSame(selectedDate, "day");

      if (!sameDay) return false;

      const startMinute = start.hour() * 60 + start.minute();
      const endMinute = end.hour() * 60 + end.minute();
      return slotMinute >= startMinute && slotMinute < endMinute;
    });
  };

  const handleSlotClick = (court: any, idx: number, slotStatus?: string) => {
    if (slotStatus && ["BOOKED", "MATCH_FULL", "LOCKED"].includes(slotStatus)) {
      return;
    }

    if (
      selection &&
      selection.courtId === court.courtId &&
      idx >= selection.startIndex &&
      idx <= selection.endIndex
    ) {
      setSelection(null);
      return;
    }

    const isSlotBlocked = (index: number) => {
      if (index < 0 || index >= timeSlots.length) return true;
      const t = timeSlots[index];
      const s = getSlotAtTime(court, t);
      return s && ["BOOKED", "MATCH_FULL", "LOCKED"].includes(s.slotStatus);
    };

    let newSelection;

    if (!selection || selection.courtId !== court.courtId) {
      if (!isSlotBlocked(idx + 1)) {
        newSelection = {
          courtId: court.courtId,
          anchor: idx,
          startIndex: idx,
          endIndex: idx + 1,
        };
      } else if (!isSlotBlocked(idx - 1)) {
        newSelection = {
          courtId: court.courtId,
          anchor: idx,
          startIndex: idx - 1,
          endIndex: idx,
        };
      } else {
        message.warning(
          "Cần tối thiểu 1 giờ (2 ô liên tiếp) trống để đặt sân!",
        );
        return;
      }
    } else {
      let start = Math.min(selection.anchor, idx);
      let end = Math.max(selection.anchor, idx);

      if (end - start === 0) {
        if (!isSlotBlocked(start + 1)) {
          end = start + 1;
        } else if (!isSlotBlocked(start - 1)) {
          start = start - 1;
        } else {
          message.warning(
            "Cần tối thiểu 1 giờ (2 ô liên tiếp) trống để đặt sân!",
          );
          return;
        }
      }

      if (end - start + 1 > 8) {
        message.info("Bạn chỉ được phép đặt tối đa 4 giờ!");
        if (idx === end) {
          end = start + 7;
        } else {
          start = end - 7;
        }
      }

      let hasConflict = false;
      for (let i = start; i <= end; i++) {
        if (isSlotBlocked(i)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        if (!isSlotBlocked(idx + 1)) {
          newSelection = {
            courtId: court.courtId,
            anchor: idx,
            startIndex: idx,
            endIndex: idx + 1,
          };
        } else if (!isSlotBlocked(idx - 1)) {
          newSelection = {
            courtId: court.courtId,
            anchor: idx,
            startIndex: idx - 1,
            endIndex: idx,
          };
        } else {
          message.warning("Khu vực này không đủ 1 giờ trống liền mạch!");
          return;
        }
      } else {
        newSelection = {
          courtId: court.courtId,
          anchor: selection.anchor,
          startIndex: start,
          endIndex: end,
        };
      }
    }

    setSelection(newSelection);

    const durationInHours =
      (newSelection.endIndex - newSelection.startIndex + 1) * 0.5;
    const startTime = timeSlots[newSelection.startIndex];

    onSelectSlot(court, startTime, durationInHours);
  };

  return (
    <div className="relative w-full pb-16">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto w-full relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        <div className="w-max min-w-full">
          {/* Timeline Header - Thay đổi sang màu tím nhạt bg-purple-50 */}
          <div className="flex border-b border-gray-300 bg-purple-50 sticky top-0 z-40 h-10 md:h-12 shadow-sm">
            <div className="sticky left-0 z-50 w-16 md:w-36 flex-shrink-0 border-r border-gray-300 bg-purple-50" />

            {timeSlots.map((time, idx) => (
              <div
                key={idx}
                className="w-10 md:w-24 relative border-r border-gray-300 flex-shrink-0 bg-purple-50"
              >
                <span
                  className={`absolute top-2 text-[10px] md:text-xs text-gray-700 font-medium whitespace-nowrap ${
                    idx === 0 ? "left-1.5" : "left-0 -translate-x-1/2"
                  }`}
                >
                  {time}
                </span>

                {/* Vạch chia giờ - Đổi sang màu tím đậm hoặc cam */}
                <div
                  className={`absolute bottom-0 w-[2px] h-1.5 md:h-2 bg-[#9156F1] ${
                    idx === 0 ? "left-0" : "left-0 -translate-x-1/2"
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {courts.map((court: any) => (
            <div
              key={court.courtId}
              className="flex border-b border-gray-300 relative"
            >
              {/* Tên sân - Đổi sang tone tím nhạt */}
              <div className="sticky left-0 z-30 w-16 md:w-36 flex-shrink-0 bg-purple-50 flex items-center justify-center border-r border-gray-300 text-[10px] md:text-[13px] font-medium text-purple-900 px-1 md:px-4 py-2 md:py-3 break-words text-center shadow-[1px_0_2px_rgba(0,0,0,0.05)]">
                <span className="leading-tight">{court.courtName}</span>
              </div>

              <div className="flex">
                {timeSlots.map((time, idx) => {
                  const slot = getSlotAtTime(court, time);

                  const isSelected =
                    selection !== null &&
                    selection.courtId === court.courtId &&
                    idx >= selection.startIndex &&
                    idx <= selection.endIndex;

                  let dynamicClasses =
                    "border-r border-gray-300 bg-white hover:bg-gray-50";

                  if (slot) {
                    switch (slot.slotStatus) {
                      case "BOOKED": // Cập nhật đúng màu Đã đặt lịch
                        dynamicClasses =
                          "border-r border-gray-300 bg-[#ea580c]";
                        break;
                      case "MATCH_FULL": // Cập nhật đúng màu Đã có trận
                        dynamicClasses =
                          "border-r border-gray-300 bg-[#9156F1]";
                        break;
                      case "MATCH_PENDING": // Đã có trận (chưa đủ)
                        dynamicClasses =
                          "border-r border-gray-300 bg-orange-300";
                        break;
                      case "LOCKED": // Khóa
                        dynamicClasses = "border-r border-gray-300 bg-gray-400";
                        break;
                      default:
                        dynamicClasses =
                          "border-r border-gray-300 bg-[#ea580c]";
                    }
                  }

                  // Cập nhật trạng thái đang được chọn (Selected) theo màu Cam để đồng bộ với nút "Đặt sân ngay"
                  if (isSelected) {
                    dynamicClasses =
                      "bg-orange-50 border-y-[2px] border-y-[#ea580c] z-10 shadow-sm";

                    if (idx === selection.startIndex) {
                      dynamicClasses +=
                        " border-l-[2px] border-l-[#ea580c] rounded-l-md";
                    }
                    if (idx === selection.endIndex) {
                      dynamicClasses +=
                        " border-r-[2px] border-r-[#ea580c] rounded-r-md";
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        handleSlotClick(court, idx, slot?.slotStatus)
                      }
                      className={`relative w-10 md:w-24 h-10 md:h-16 flex-shrink-0 transition-all cursor-pointer overflow-hidden ${dynamicClasses}`}
                    ></div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 max-w-sm z-30">
        <div className="bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200 flex items-center justify-center">
          <input
            type="range"
            min="0"
            max="100"
            value={scrollProgress}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9156F1]"
          />
        </div>
      </div>
    </div>
  );
}
