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
    slots.push(`${formattedHour}:30`);
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
  selectedSlots = [],
  setSelectedSlots,
}: any) {
  const timeSlots = generateTimeSlots(openTime, closeTime);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setSelectedSlots?.([]);
  }, [selectedDate]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    if (maxScrollLeft > 0) {
      setScrollProgress((container.scrollLeft / maxScrollLeft) * 100);
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

  const getSlotAtTime = (courtCopy: any, time: string) => {
    const allSlots = courtCopy.slots || [];
    if (allSlots.length === 0) return null;

    const slotMinute = timeToMinutes(time);

    return allSlots.find((slot: any) => {
      const start = dayjs(slot.startTime);
      const end = dayjs(slot.endTime);

      if (!start.isSame(selectedDate, "day")) return false;

      const startMinute = start.hour() * 60 + start.minute();
      const endMinute = end.hour() * 60 + end.minute();

      return slotMinute >= startMinute && slotMinute < endMinute;
    });
  };

  // Thuật toán chọn / hủy slot linh hoạt (Cho phép chọn nhiều khung giờ rời rạc)
  const handleSlotClick = (
    courtCopy: any,
    idx: number,
    slotStatus?: string,
  ) => {
    if (slotStatus && ["BOOKED", "MATCH_FULL", "LOCKED"].includes(slotStatus)) {
      return;
    }

    setSelectedSlots((prev: any[]) => {
      // 1. Tách riêng các lựa chọn của các sân khác và sân hiện tại đang click
      const otherCourts = prev.filter(
        (item) => item.courtCopyId !== courtCopy.courtCopyId,
      );
      let myBlocks = prev.filter(
        (item) => item.courtCopyId === courtCopy.courtCopyId,
      );

      // 2. Tìm xem ô click (idx) có nằm trong block nào đã chọn trước đó không
      const clickedInsideIndex = myBlocks.findIndex(
        (b) => idx >= b.startIndex && idx <= b.endIndex,
      );

      if (clickedInsideIndex !== -1) {
        // TRƯỜNG HỢP A: Bấm vào ô đã chọn -> HỦY (Cắt hoặc thu hẹp block)
        const b = myBlocks[clickedInsideIndex];
        const newBlocks = [];

        // Nếu ô click không phải là ô đầu tiên, tạo phần đầu của block
        if (idx > b.startIndex) {
          newBlocks.push({ ...b, endIndex: idx - 1 });
        }
        // Nếu ô click không phải là ô cuối cùng, tạo phần đuôi của block
        if (idx < b.endIndex) {
          newBlocks.push({ ...b, startIndex: idx + 1 });
        }
        // Thay thế block cũ bằng các block mới (nếu bấm ô duy nhất thì mảng newBlocks rỗng -> Xóa luôn)
        myBlocks.splice(clickedInsideIndex, 1, ...newBlocks);
      } else {
        // TRƯỜNG HỢP B: Bấm vào ô trống -> CHỌN MỚI
        myBlocks.push({
          courtCopyId: courtCopy.courtCopyId,
          courtCode: courtCopy.courtCode,
          courtId: courtCopy.courtId,
          courtName: courtCopy.courtName,
          categoryName: courtCopy.categoryName,
          date: selectedDate.format("YYYY-MM-DD"),
          startIndex: idx,
          endIndex: idx,
          court: courtCopy, // Lưu lại nguyên object court để bên Modal tính toán priceRules
        });

        // Sort lại theo thời gian
        myBlocks.sort((a, b) => a.startIndex - b.startIndex);

        // Nối các block liền kề nhau thành 1 block lớn
        const merged = [];
        for (const block of myBlocks) {
          if (merged.length === 0) {
            merged.push(block);
          } else {
            const last = merged[merged.length - 1];
            // Nếu block này sát ngay sau block trước -> Gộp lại
            if (last.endIndex + 1 === block.startIndex) {
              last.endIndex = block.endIndex;
            } else {
              merged.push(block);
            }
          }
        }
        myBlocks = merged;
      }

      // 3. Tính toán lại startTime, endTime, duration chuẩn chỉnh cho từng block của sân này
      myBlocks = myBlocks.map((b) => {
        const startTime = timeSlots[b.startIndex];
        const endTime =
          timeSlots[b.endIndex + 1] || closeTime?.slice(0, 5) || "22:00";
        const duration = (b.endIndex - b.startIndex + 1) * 0.5;
        return { ...b, startTime, endTime, duration };
      });

      // 4. Trả về mảng tổng
      return [...otherCourts, ...myBlocks];
    });

    onSelectSlot?.(courtCopy, timeSlots[idx], 0.5);
  };

  return (
    <div className="relative w-full pb-16">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto w-full relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        <div className="w-max min-w-full">
          <div className="flex border-b border-gray-300 bg-purple-50 sticky top-0 z-40 h-12 shadow-sm">
            <div className="sticky left-0 z-50 w-28 md:w-36 flex-shrink-0 border-r border-gray-300 bg-purple-50" />

            {timeSlots.map((time, idx) => (
              <div
                key={idx}
                className="w-10 md:w-24 relative border-r border-gray-300 flex-shrink-0 bg-purple-50"
              >
                <span className="absolute top-2 left-0 -translate-x-1/2 text-[10px] md:text-xs text-gray-700 font-medium whitespace-nowrap">
                  {time}
                </span>
                <div className="absolute bottom-0 left-0 -translate-x-1/2 w-[2px] h-2 bg-[#9156F1]" />
              </div>
            ))}
          </div>

          {courts.map((court: any) => {
            // Lấy TẤT CẢ các khoảng thời gian (blocks) đang chọn của sân này
            const myBlocks = selectedSlots.filter(
              (item) => item.courtCopyId === court.courtCopyId,
            );

            return (
              <div
                key={court.courtCopyId}
                className="flex border-b border-gray-300 relative"
              >
                <div className="sticky left-0 z-30 w-28 md:w-36 flex-shrink-0 bg-purple-50 flex flex-col items-center justify-center border-r border-gray-300 text-[10px] md:text-[12px] font-medium text-purple-900 px-1 py-2 text-center shadow-[1px_0_2px_rgba(0,0,0,0.05)]">
                  <span className="leading-tight">{court.courtName}</span>
                  <span className="text-orange-600 text-[10px] md:text-[12px] font-bold mt-1">
                    {court.courtCode}
                  </span>
                </div>

                <div className="flex">
                  {timeSlots.map((time, idx) => {
                    const slot = getSlotAtTime(court, time);

                    // Kiểm tra xem idx hiện tại có rơi vào BẤT KỲ block nào của sân này không
                    const activeBlock = myBlocks.find(
                      (b) => idx >= b.startIndex && idx <= b.endIndex,
                    );
                    const isSelected = !!activeBlock;

                    let dynamicClasses =
                      "border-r border-gray-300 bg-white hover:bg-gray-50";

                    if (slot) {
                      switch (slot.slotStatus) {
                        case "BOOKED":
                          dynamicClasses =
                            "border-r border-gray-300 bg-[#ea580c]";
                          break;
                        case "MATCH_FULL":
                          dynamicClasses =
                            "border-r border-gray-300 bg-[#9156F1]";
                          break;
                        case "MATCH_PENDING":
                          dynamicClasses =
                            "border-r border-gray-300 bg-orange-300";
                          break;
                        case "LOCKED":
                          dynamicClasses =
                            "border-r border-gray-300 bg-gray-400";
                          break;
                      }
                    }

                    if (isSelected) {
                      dynamicClasses =
                        "bg-orange-50 border-y-[2px] border-y-[#ea580c] z-10 shadow-sm";

                      // Bo góc và viền trái cho ô đầu tiên của mỗi block
                      if (idx === activeBlock.startIndex) {
                        dynamicClasses +=
                          " border-l-[2px] border-l-[#ea580c] rounded-l-md";
                      }

                      // Bo góc và viền phải cho ô cuối cùng của mỗi block
                      if (idx === activeBlock.endIndex) {
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
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 max-w-sm z-30">
        <div className="bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
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
