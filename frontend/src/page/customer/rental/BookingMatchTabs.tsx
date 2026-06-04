import { Tabs, ConfigProvider } from "antd";
import dayjs from "dayjs";

import CourtBookingPanel from "./CourtBookingPanel";
import CreateMatchForm from "./CreateMatchForm";

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
  onBook: () => void;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
  selectedDuration?: number;
  selectedSlots?: SelectedSlot[];
  priceRules?: CourtPriceResponse[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  setActiveTab,
}: BookingMatchTabsProps) {
  return (
    <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: activeTab === "booking" ? "#ea580c" : "#9156F1",
          },
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className="pt-4 custom-tabs"
          items={[
            {
              key: "booking",
              label: <span className="font-bold text-base px-4">Đặt sân</span>,
              children: (
                <div className="px-6 pb-6">
                  <CourtBookingPanel
                    selectedSlots={selectedSlots}
                    priceRules={priceRules}
                    onBook={onBook}
                  />
                </div>
              ),
            },
            {
              key: "match",
              label: <span className="font-bold text-base px-4">Ghép kèo</span>,
              children: (
                <div className="px-6 pb-6">
                  {selectedSlots.length > 0 ? (
                    <ConfigProvider
                      theme={{
                        token: {
                          colorPrimary: "#9156F1",
                        },
                      }}
                    >
                      <CreateMatchForm
                        court={court}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        selectedDuration={selectedDuration}
                      />
                    </ConfigProvider>
                  ) : (
                    // Hiển thị giao diện trống khi chưa chọn lịch (Giống với Booking)
                    <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-xl mt-4">
                      <div className="bg-gray-50 p-4 rounded-full mb-3">
                        <svg
                          className="w-12 h-12 text-gray-300"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 4h-2V3a1 1 0 00-2 0v1H9V3a1 1 0 00-2 0v1H5C3.89 4 3 4.9 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 font-medium">
                        Chưa chọn sân nào trên lịch
                      </p>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </ConfigProvider>
    </div>
  );
}
