export default function OtherCourtsList({
  courts,
  activeCourtId,
  onSelectCourt,
}: {
  courts: any[];
  activeCourtId: string;
  onSelectCourt: (court: any) => void;
}) {
  const displayCourts = courts;

  if (displayCourts.length === 0) {
    return (
      <p className="text-gray-500 italic">Không có sân nào tại cơ sở này.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {displayCourts.map((court) => {
        const isActive = court.courtId === activeCourtId;

        return (
          <div
            key={court.courtId}
            onClick={() => onSelectCourt(court)}
            className={`group flex gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
              isActive
                ? "border-orange-500 shadow-md ring-1 ring-orange-500 bg-orange-50/30"
                : "border-gray-100 hover:border-orange-400 hover:shadow-md"
            }`}
          >
            <div className="w-28 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
              <img
                src={
                  court.coverImage ||
                  "https://placehold.co/400x300?text=San+The+Thao"
                }
                alt={court.courtName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 text-white text-[10px] text-center font-bold py-0.5">
                  ĐANG CHỌN
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h4
                className={`font-bold transition-colors line-clamp-1 ${
                  isActive
                    ? "text-orange-600"
                    : "text-gray-800 group-hover:text-orange-500"
                }`}
              >
                {court.courtName}
              </h4>
              <span className="text-xs text-gray-500 bg-gray-100 w-fit px-2 py-1 rounded-md mt-1 mb-2">
                {court.categoryName || "Sân thể thao"}
              </span>
              <p className="text-[#3B82F6] font-semibold text-sm">
                {(court.minPrice || court.price || 0).toLocaleString()} đ{" "}
                <span className="text-xs text-gray-400 font-normal">/ giờ</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
