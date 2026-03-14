import {toast} from "react-toastify"


export default function BookingSearchBar({ filter, setFilter }) {
const handleAddTime = () => {
  if (!filter.date || !filter.start || !filter.end) {
    toast.error("Vui lòng chọn đầy đủ ngày và thời gian");
    return;
  }

  if (filter.start >= filter.end) {
    toast.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu");
    return;
  }

 

  toast.success("Thêm khung giờ thành công! Hãy thêm phòng và đặt lịch.");
};

  return (
    <div className="mb-8 " >
      <div className="flex items-center gap-4 bg-white shadow-md rounded-2xl px-6 py-4">
        
       
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">
            Ngày
          </label>
          <input
            type="date"
            value={filter.date}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">
            Bắt đầu
          </label>
          <input
            type="time"
            value={filter.start}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                start: e.target.value,
              }))
            }
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

       
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">
            Kết thúc
          </label>
          <input
            type="time"
            value={filter.end}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                end: e.target.value,
              }))
            }
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        
        <button onClick={handleAddTime} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl h-[42px] mt-5 transition">
          Thêm khung giờ
        </button>

      </div>
    </div>
  );
}