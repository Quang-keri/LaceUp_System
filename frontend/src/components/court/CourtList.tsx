import { useState } from "react";
import { Modal } from "antd";

const PRICE_TYPE_LABEL: any = {
  NORMAL: "Giá thường",
  WEEKEND: "Cuối tuần",
  PEAK: "Giờ cao điểm",
  HOLIDAY: "Ngày lễ",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

export default function CourtList({ courts, onAddCourt, filter }: any) {
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);

  // group theo type + specificDate
  const groupByType = (rules: any[]) => {
    const map: any = {};

    rules.forEach((r) => {
      const key = r.specificDate ? `DATE_${r.specificDate}` : r.priceType;

      if (!map[key]) map[key] = [];
      map[key].push(r);
    });

    return map;
  };

  const renderPriceTable = (court: any) => {
    const grouped = groupByType(court.priceRules || []);

    if (!court.priceRules || court.priceRules.length === 0) {
      return (
        <p className="text-gray-500">
          Giá cố định: {court.price?.toLocaleString()} VNĐ / giờ
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {Object.keys(grouped).map((key) => {
          const rules = grouped[key];
          const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);

            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            return `${day}/${month}/${year}`;
          };
          let title = "";
          if (key.startsWith("DATE_")) {
            const rawDate = key.replace("DATE_", "");
            title = `Ngày đặc biệt: ${formatDate(rawDate)}`;
          } else {
            title = PRICE_TYPE_LABEL[key] || key;
          }

          return (
            <div key={key}>
              <p className="font-semibold text-gray-700 mb-1">
                --- {title} ---
              </p>

              {rules.map((r: any) => (
                <p key={r.courtPriceId} className="text-sm text-gray-600 ml-2">
                  {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)}:{" "}
                  <span className="text-blue-600">
                    {r.pricePerHour.toLocaleString()} VNĐ
                  </span>
                </p>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
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

              <p className="text-blue-600 font-semibold mt-1">
                Giá từ: {(court.minPrice || court.price)?.toLocaleString()} VNĐ
              </p>

              <button
                onClick={() => {
                  setSelectedCourt(court);
                  setOpenModal(true);
                }}
                className="text-sm text-blue-500 mt-1 underline"
              >
                Xem bảng giá
              </button>
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

      <Modal
        title={`Bảng giá - ${selectedCourt?.courtName || ""}`}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
      >
        {selectedCourt && renderPriceTable(selectedCourt)}
      </Modal>
    </>
  );
}
