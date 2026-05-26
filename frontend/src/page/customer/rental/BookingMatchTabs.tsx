import { useState } from "react";
import { Tabs, ConfigProvider } from "antd";
import CourtBookingPanel from "./CourtBookingPanel";
import CreateMatchForm from "./CreateMatchForm";
import dayjs from "dayjs";

export default function BookingMatchTabs({
  court,
  data,
  onBook,
  selectedDate,
  selectedTime,
  selectedDuration,
}: {
  court: any;
  data: any;
  onBook: (data: any) => void;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
  selectedDuration?: number;
}) {
  const [activeTab, setActiveTab] = useState("booking");

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
                    court={court}
                    onBook={onBook}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    selectedDuration={selectedDuration}
                  />
                </div>
              ),
            },
            {
              key: "match",
              label: <span className="font-bold text-base px-4">Ghép kèo</span>,
              children: (
                <div className="px-6 pb-6">
                  <ConfigProvider
                    theme={{
                      token: {
                        colorPrimary: "#9156F1",
                      },
                    }}
                  >
                    <CreateMatchForm
                      court={court}
                      address={data?.address}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                    />
                  </ConfigProvider>
                </div>
              ),
            },
          ]}
        />
      </ConfigProvider>
    </div>
  );
}
