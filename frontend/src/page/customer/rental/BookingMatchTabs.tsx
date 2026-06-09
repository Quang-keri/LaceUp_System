import { Tabs, ConfigProvider } from "antd";
import dayjs from "dayjs";

import CourtBookingPanel from "./CourtBookingPanel";
import CreateMatchForm from "./CreateMatchForm";
import JoinSharedBookingPanel from "./JoinSharedBookingPanel";

import type { CourtResponse, CourtPriceResponse } from "../../../types/court";
import type { RentalAreaResponse } from "../../../types/rental";

export interface SelectedSlot {
  courtCopyId: string | number;
  date: string;
  startTime: string;
  endTime: string;
}

interface BookingMatchTabsProps {
  court: CourtResponse | null;
  data: RentalAreaResponse | null;
  onBook: (
    bookingType: "PRIVATE" | "SHARED",
    extraData?: { maxParticipants?: number; hostSlots?: number },
  ) => void;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
  selectedDuration?: number;
  selectedSlots?: SelectedSlot[];
  priceRules?: CourtPriceResponse[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedJoinableSlot?: any;
  onJoinShared?: (bookingId: string, quantity: number) => void;
}

export default function BookingMatchTabs({
  court,
  onBook,
  selectedDate,
  selectedTime,
  selectedDuration,
  selectedSlots = [],
  priceRules = [],
  activeTab,
  selectedJoinableSlot,
  onJoinShared,
  setActiveTab,
}: BookingMatchTabsProps) {
  const tabItems = [
    {
      key: "booking",
      label: <span className="font-bold text-sm px-2">Đặt sân</span>,
      children: (
        <div className="px-6 pb-6">
          <CourtBookingPanel
            selectedSlots={selectedSlots}
            priceRules={priceRules}
            onBook={() => onBook("PRIVATE")}
          />
        </div>
      ),
    },
    {
      key: "shared",
      label: <span className="font-bold text-sm px-2">Vãng lai </span>,
      children: (
        <div className="px-6 pb-6">
          {selectedJoinableSlot ? (
            <JoinSharedBookingPanel
              slotInfo={selectedJoinableSlot}
              onConfirmJoin={(bookingId, quantity) =>
                onJoinShared?.(bookingId, quantity)
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-xl mt-4">
              <p className="text-gray-400 font-medium text-center">
                Vui lòng chọn ô <b>Đang mở Vãng Lai </b> (màu xanh ngọc) <br />{" "}
                trên lịch để tham gia!
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "match",
      label: <span className="font-bold text-sm px-2">Tìm Đối</span>,
      children: (
        <div className="px-6 pb-6">
          {selectedSlots.length > 0 ? (
            <ConfigProvider theme={{ token: { colorPrimary: "#9156F1" } }}>
              <CreateMatchForm
                court={court}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedDuration={selectedDuration}
              />
            </ConfigProvider>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-xl mt-4">
              <p className="text-gray-400 font-medium">
                Chưa chọn sân nào trên lịch
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  const primaryColor =
    activeTab === "shared"
      ? "#14b8a6"
      : activeTab === "match"
      ? "#9156F1"
      : "#ea580c";

  return (
    <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: primaryColor,
          },
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className="pt-4 custom-tabs"
          items={tabItems}
        />
      </ConfigProvider>
    </div>
  );
}
