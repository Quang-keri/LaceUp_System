import CourtScheduleTimeline from "./CourtScheduleTimeline";

export default function CourtScheduleTab({
  data,
  selectedDate,
  setActiveCourt,
  setSelectedTime,
  setSelectedDuration,
  selectedSlots,
  setSelectedSlots,
  activeTab,
}: any) {
  const courtCopyRows = (data.courts || []).flatMap((court: any) =>
    (court.courtCopies || []).map((copy: any) => ({
      ...copy,
      courtId: court.courtId,
      courtName: court.courtName,
      categoryName: court.category?.categoryName || court.categoryName,
      minPrice: court.minPrice,
      maxPrice: court.maxPrice,
      priceRules: court.priceRules || [],
      coverImage: court.coverImage,
      images: court.images || [],
      slots: copy.slots || [],
    })),
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white p-3.5 border-b border-purple-100 flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-gray-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-white border border-gray-300 rounded-full shadow-sm"></span>
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#ea580c] rounded-full shadow-sm"></span>
            <span>Đã đặt lịch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-orange-300 rounded-full shadow-sm"></span>
            <span>Đã có trận (chưa đủ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-gray-400 rounded-full shadow-sm"></span>
            <span>Khóa</span>
          </div>
        </div>

        <div className="bg-orange-50 text-[#ea580c] px-3 py-2.5 rounded-lg text-xs italic border border-orange-100">
          <b>* Lưu ý:</b>Bạn hãy lựa chọn vào khung giờ phù hợp với mình nhất
          dưới các ô dưới đây. <br />
          <b>Đăng nhập để đặt lịch</b> nhanh hơn, theo dõi lịch sử đặt sân và
          nhận thông báo ưu đãi từ chúng tôi.
          <br />
          Hệ thống chúng tôi hiện không hỗ trợ hoàn tiền, hãy chọn thời gian phù
          hợp.
        </div>
      </div>

      <div className="bg-white w-full">
        <CourtScheduleTimeline
          courts={courtCopyRows}
          selectedDate={selectedDate}
          openTime={data.openTime}
          closeTime={data.closeTime}
          selectedSlots={selectedSlots}
          setSelectedSlots={setSelectedSlots}
          activeTab={activeTab as "booking" | "match"}
          onSelectSlot={(courtCopy: any, time: string, duration: number) => {
            setActiveCourt(courtCopy);
            setSelectedTime(time);
            if (setSelectedDuration) setSelectedDuration(duration);
          }}
        />
      </div>
    </div>
  );
}
