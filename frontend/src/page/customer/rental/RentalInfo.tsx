export default function RentalInfo({ rental }: any) {
  const fakeAmenities = [
    { amenityId: 1, amenityName: "Wifi miễn phí" },
    { amenityId: 2, amenityName: "Bãi giữ xe" },
    { amenityId: 3, amenityName: "Phòng thay đồ" },
    { amenityId: 4, amenityName: "Nhà vệ sinh" },
    { amenityId: 5, amenityName: "Nước uống" },
    { amenityId: 6, amenityName: "Ánh sáng tiêu chuẩn thi đấu" },
  ];

  const amenities = rental.amenities?.slice(0, 6) || fakeAmenities;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 space-y-5">
      {/* Tên sân */}
      <div>
        <h1 className="text-2xl font-bold">{rental.rentalAreaName}</h1>

        <p className="text-gray-500 mt-1">{rental.address}</p>

        <p className="text-sm text-gray-400 mt-1">{rental.city?.cityName}</p>
      </div>

      <hr />

      {/* Tiện ích */}
      <div>
        <h3 className="font-semibold mb-3">Tiện ích</h3>

        <div className="flex gap-6 flex-wrap text-gray-600">
          {amenities.map((a: any) => (
            <div key={a.amenityId} className="flex items-center gap-2">
              ⭐<span>{a.amenityName}</span>
            </div>
          ))}
        </div>
      </div>

      <hr />

      {/* Mô tả */}
      <div>
        <h3 className="font-semibold mb-2">Mô tả</h3>

        <p className="text-gray-600 leading-relaxed">
          Sân thể thao chất lượng cao, phù hợp cho luyện tập và thi đấu. Không
          gian rộng rãi, hệ thống ánh sáng đạt chuẩn.
        </p>
      </div>
    </div>
  );
}
