export default function OtherCourtsList({
  courts,
  activeCourtId,
  onSelectCourt,
}: {
  courts: any[];
  activeCourtId: string;
  onSelectCourt: (court: any) => void;
}) {
  const otherCourts = courts.filter((c) => c.courtId !== activeCourtId);

  if (otherCourts.length === 0) {
    return (
      <p className="text-gray-500 italic">
        Không có sân nào khác tại cơ sở này.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {otherCourts.map((court) => (
        <div
          key={court.courtId}
          onClick={() => onSelectCourt(court)}
          className="group flex gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-[#9156F1] hover:shadow-md transition-all"
        >
          <div className="w-28 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={
                court.coverImage ||
                "https://placehold.co/400x300?text=San+The+Thao"
              }
              alt={court.courtName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h4 className="font-bold text-gray-800 group-hover:text-[#9156F1] transition-colors line-clamp-1">
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
      ))}
    </div>
  );
}
