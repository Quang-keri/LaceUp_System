import { toast } from "react-toastify";

interface FilterState {
  date: string;
  start: string;
  end: string;
}

interface BookingSearchBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function BookingSearchBar({ filter, setFilter }: BookingSearchBarProps) {
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
    <div className="mb-8">
      <div className="
        bg-white shadow-md rounded-2xl p-4
        flex flex-col gap-4
        sm:flex-row sm:items-end sm:gap-4
        flex-wrap
      ">

        <div className="flex flex-col w-full sm:w-auto">
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
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        <div className="flex flex-col w-full sm:w-auto">
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
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        <div className="flex flex-col w-full sm:w-auto">
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
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        <button
          onClick={handleAddTime}
          className="
            bg-blue-600 hover:bg-blue-700 text-white
            px-6 py-2 rounded-xl
            w-full sm:w-auto
            transition
          "
        >
          Thêm khung giờ
        </button>

      </div>
    </div>
  );
}