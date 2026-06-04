import dayjs from "dayjs";
import { useRef, useState, useEffect } from "react";

import type { CourtCopyResponse } from "../../../types/court";
import type { SlotResponse } from "../../../types/slot";

export interface TimelineCourt extends Omit<CourtCopyResponse, "courtCopyId"> {
  courtCopyId: string | number;
  courtId: string | number;
  courtName: string;
  categoryName?: string;
  slots?: SlotResponse[];
}

export interface SelectedBlock {
  courtCopyId: string | number;
  courtCode: string;
  courtId: string | number;
  courtName: string;
  categoryName?: string;
  date: string;
  startIndex: number;
  endIndex: number;
  court: TimelineCourt;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface CourtScheduleTimelineProps {
  courts: TimelineCourt[];
  selectedDate: dayjs.Dayjs;
  onSelectSlot?: (
    courtCopy: TimelineCourt,
    time: string,
    duration: number,
  ) => void;
  openTime?: string;
  closeTime?: string;
  selectedSlots?: SelectedBlock[];
  setSelectedSlots: React.Dispatch<React.SetStateAction<SelectedBlock[]>>;
  activeTab: "booking" | "match";
}

const generateTimeSlots = (openTimeStr?: string, closeTimeStr?: string) => {
  const slots: string[] = [];
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
  activeTab,
}: CourtScheduleTimelineProps) {
  const timeSlots = generateTimeSlots(openTime, closeTime);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setSelectedSlots?.([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getSlotAtTime = (
    courtCopy: TimelineCourt,
    time: string,
  ): SlotResponse | null => {
    const allSlots = courtCopy.slots || [];
    if (allSlots.length === 0) return null;

    const slotMinute = timeToMinutes(time);

    return (
      allSlots.find((slot) => {
        if (!slot.startTime || !slot.endTime) return false;
        const start = dayjs(slot.startTime);
        const end = dayjs(slot.endTime);

        if (!start.isSame(selectedDate, "day")) return false;

        const startMinute = start.hour() * 60 + start.minute();
        const endMinute = end.hour() * 60 + end.minute();

        return slotMinute >= startMinute && slotMinute < endMinute;
      }) || null
    );
  };

  const handleSlotClick = (
    courtCopy: TimelineCourt,
    idx: number,
    slotStatus?: string,
  ) => {
    if (slotStatus && ["BOOKED", "MATCH_FULL", "LOCKED"].includes(slotStatus)) {
      return;
    }

    let nextSelectedSlots: SelectedBlock[] = [];

    const createNewBlock = (index: number) => ({
      courtCopyId: courtCopy.courtCopyId,
      courtCode: courtCopy.courtCode,
      courtId: courtCopy.courtId,
      courtName: courtCopy.courtName,
      categoryName: courtCopy.categoryName,
      date: selectedDate.format("YYYY-MM-DD"),
      startIndex: index,
      endIndex: index,
      court: courtCopy,
    });

    if (activeTab === "match") {
      const myBlocks = selectedSlots.filter(
        (b) => b.courtCopyId === courtCopy.courtCopyId,
      );
      let newBlocks: SelectedBlock[] = [];

      if (myBlocks.length === 0) {
        newBlocks = [createNewBlock(idx)];
      } else {
        const block = { ...myBlocks[0] };

        if (idx === block.startIndex - 1) {
          block.startIndex = idx;
          newBlocks = [block];
        } else if (idx === block.endIndex + 1) {
          block.endIndex = idx;
          newBlocks = [block];
        } else if (idx === block.startIndex) {
          block.startIndex += 1;
          if (block.startIndex <= block.endIndex) newBlocks = [block];
        } else if (idx === block.endIndex) {
          block.endIndex -= 1;
          if (block.startIndex <= block.endIndex) newBlocks = [block];
        } else {
          newBlocks = [createNewBlock(idx)];
        }
      }

      const finalBlocks = newBlocks.map((b) => ({
        ...b,
        startTime: timeSlots[b.startIndex],
        endTime: timeSlots[b.endIndex + 1] || closeTime?.slice(0, 5) || "22:00",
        duration: (b.endIndex - b.startIndex + 1) * 0.5,
      }));

      nextSelectedSlots = finalBlocks;

      if (finalBlocks.length > 0) {
        onSelectSlot?.(
          courtCopy,
          finalBlocks[0].startTime,
          finalBlocks[0].duration,
        );
      } else {
        onSelectSlot?.(courtCopy, "", 0);
      }
    } else {
      const otherCourts = selectedSlots.filter(
        (item) => item.courtCopyId !== courtCopy.courtCopyId,
      );
      const myBlocks = selectedSlots.filter(
        (item) => item.courtCopyId === courtCopy.courtCopyId,
      );

      const clickedIdx = myBlocks.findIndex(
        (b) => idx >= b.startIndex && idx <= b.endIndex,
      );

      if (clickedIdx !== -1) {
        const b = myBlocks[clickedIdx];
        myBlocks.splice(clickedIdx, 1);
        if (idx > b.startIndex) myBlocks.push({ ...b, endIndex: idx - 1 });
        if (idx < b.endIndex) myBlocks.push({ ...b, startIndex: idx + 1 });
      } else {
        myBlocks.push(createNewBlock(idx));
      }

      myBlocks.sort((a, b) => a.startIndex - b.startIndex);
      const merged: SelectedBlock[] = [];
      for (const block of myBlocks) {
        if (
          merged.length > 0 &&
          merged[merged.length - 1].endIndex + 1 === block.startIndex
        ) {
          merged[merged.length - 1].endIndex = block.endIndex;
        } else {
          merged.push(block);
        }
      }

      const finalBlocks = merged.map((b) => ({
        ...b,
        startTime: timeSlots[b.startIndex],
        endTime: timeSlots[b.endIndex + 1] || closeTime?.slice(0, 5) || "22:00",
        duration: (b.endIndex - b.startIndex + 1) * 0.5,
      }));

      nextSelectedSlots = [...otherCourts, ...finalBlocks];

      const activeBlock = finalBlocks.find(
        (b) => idx >= b.startIndex && idx <= b.endIndex,
      );
      if (activeBlock && activeBlock.startTime && activeBlock.duration) {
        onSelectSlot?.(courtCopy, activeBlock.startTime, activeBlock.duration);
      } else {
        onSelectSlot?.(courtCopy, "", 0);
      }
    }

    setSelectedSlots(nextSelectedSlots);
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

          {courts.map((court) => {
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

                    if (isSelected && activeBlock) {
                      dynamicClasses =
                        "bg-orange-50 border-y-[2px] border-y-[#ea580c] z-10 shadow-sm";

                      if (idx === activeBlock.startIndex) {
                        dynamicClasses +=
                          " border-l-[2px] border-l-[#ea580c] rounded-l-md";
                      }

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
