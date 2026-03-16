export default function CourtList({ courts, onAddCourt }: any) {
  return (
    <div className="space-y-4">
      {courts.map((court: any) => (
        <div key={court.courtId} className="border rounded-xl p-4 flex gap-4">
          <img
            src={court.coverImage}
            className="w-40 h-28 object-cover rounded"
          />

          <div className="flex-1">
            <h3 className="font-semibold text-lg">{court.courtName}</h3>

            <p className="text-gray-500">{court.categoryName}</p>

            <p className="text-blue-600 font-semibold">
              {court.pricePerHour} VND / giờ
            </p>
          </div>

          <button
            onClick={() => onAddCourt(court)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Thêm
          </button>
        </div>
      ))}
    </div>
  );
}
