import { MapPin } from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import OtherCourtsList from "./OtherCourtsList";

export default function CourtInfoTab({
  activeCourt,
  data,
  onSelectCourt,
}: any) {
  if (!activeCourt) return null;

  return (
    <div className="animate-in fade-in duration-300 p-6">
      <div className="relative h-[280px] w-full bg-gray-100 rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100">
        <img
          src={
            activeCourt.coverImage ||
            "https://placehold.co/800x500?text=San+The+Thao"
          }
          alt={activeCourt.courtName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold text-[#ea580c] shadow">
          {activeCourt.categoryName || "Sân Thể Thao"}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-gray-800">
            {activeCourt.courtName}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-gray-500 mb-4 text-sm bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
          <MapPin size={16} className="text-[#9156F1]" />
          <span>{`${data.address.street}, ${data.address.ward}, ${data.address.city?.cityName}`}</span>
        </div>

        <p className="text-gray-600 leading-relaxed mb-6">
          {activeCourt.description ||
            "Mặt sân đạt chuẩn, hệ thống chiếu sáng chống chói, không gian thoáng đãng. Thích hợp cho tập luyện và thi đấu giao lưu."}
        </p>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Tiện ích sân</h3>
          {activeCourt.amenities && activeCourt.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {activeCourt.amenities.map((amenity: any) => (
                <div
                  key={amenity.amenityId || amenity.id}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-[#9156F1] rounded-full border border-purple-100 text-sm font-medium"
                >
                  <FaCheckCircle size={14} />
                  <span>{amenity.amenityName || amenity.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              Sân này chưa cập nhật tiện ích.
            </p>
          )}
        </div>

        <hr className="my-6 border-gray-100" />

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#ea580c] rounded-full"></span>
            Tất cả các sân tại cơ sở
          </h3>
          <OtherCourtsList
            courts={data.courts}
            activeCourtId={activeCourt.courtId}
            onSelectCourt={onSelectCourt}
          />
        </div>
      </div>
    </div>
  );
}
