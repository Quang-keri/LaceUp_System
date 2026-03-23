import { useState } from "react";
import { toast } from "react-toastify";
import matchService from "../../../service/match/matchService.ts";
import { DatePicker, InputNumber } from "antd";
import dayjs from "dayjs";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMatchModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateMatchModalProps) => {
  const [formData, setFormData] = useState({
    categoryId: "1",
    address: "",
    startTime: "",
    duration: 1,
    maxPlayers: 10,
    minPlayersToStart: 6,
    matchType: "NORMAL",
    winnerPercent: 0,
    minRank: 2000,
    maxRank: 4000,
  });

  const [loading, setLoading] = useState(false);

  // Hàm chặn chọn giờ phút quá khứ
  const disabledDateTime = (current: any) => {
    const now = dayjs();
    const isToday = current && current.isSame(now, "day");

    return {
      disabledHours: () => {
        if (!isToday) return [];
        return Array.from({ length: now.hour() }, (_, i) => i);
      },
      disabledMinutes: (selectedHour: number) => {
        const minuteOptions = [0, 30];
        const disabledMin = Array.from({ length: 60 }, (_, i) => i).filter(
          (m) => !minuteOptions.includes(m),
        );

        // Chặn tiếp những phút đã trôi qua trong giờ hiện tại
        if (isToday && selectedHour === now.hour()) {
          if (now.minute() >= 0) disabledMin.push(0);
          if (now.minute() >= 30) disabledMin.push(30);
        }

        return disabledMin;
      },
    };
  };

  const handleSubmit = async () => {
    if (!formData.startTime || !formData.address) {
      return toast.warning("Vui lòng điền đủ thời gian và khu vực!");
    }

    if (
      formData.matchType === "RANKED" &&
      formData.minRank > formData.maxRank
    ) {
      return toast.warning("Điểm tối thiểu không được lớn hơn điểm tối đa!");
    }

    setLoading(true);
    try {
      // Tự động tính toán endTime dựa trên startTime và duration
      const startObj = dayjs(formData.startTime);
      const endObj = startObj.add(formData.duration, "hour");

      const { duration, ...restData } = formData; // Tách bỏ trường duration khi gửi đi

      const payload = {
        ...restData,
        startTime: startObj.toISOString(),
        endTime: endObj.toISOString(),
        courtId: null,
        isRecurring: false,
      };

      const response = await matchService.createMatch(payload as any);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Đăng tin tìm đồng đội thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo trận");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
          🏸 Tìm Đồng Đội Giao Lưu
        </h2>

        <div className="space-y-5">
          {/* Chọn Môn & Khu vực */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Bạn muốn chơi môn gì?
              </label>
              <select
                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-semibold transition-colors"
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
              >
                <option value="1">Cầu lông</option>
                <option value="2">Bóng đá</option>
                <option value="3">Pickleball</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Khu vực dự kiến
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Quận 1, Quận 7 hoặc tên sân..."
                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-colors"
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          {/* --- CẬP NHẬT GIỜ BẮT ĐẦU & THỜI LƯỢNG --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Giờ bắt đầu
              </label>
              <DatePicker
                showTime={{
                  format: "HH:mm",
                  hideDisabledOptions: true,
                }}
                format="HH:mm - DD/MM"
                className="w-full border-2 border-gray-100 px-3 py-[10px] rounded-xl outline-none hover:border-blue-500 focus-within:border-blue-500 bg-gray-50 transition-colors text-base"
                placeholder="Chọn giờ"
                showNow={false}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                disabledTime={disabledDateTime}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    startTime: val ? val.toISOString() : "",
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Thời lượng chơi
              </label>
              <select
                className="w-full border-2 border-gray-100 px-3 py-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-colors font-medium text-gray-700"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseFloat(e.target.value),
                  })
                }
              >
                <option value={0.5}>30 phút</option>
                <option value={1}>1 giờ</option>
                <option value={1.5}>1 giờ 30 phút</option>
                <option value={2}>2 giờ</option>
              </select>
            </div>
          </div>

          {/* Số lượng */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Max người
              </label>
              <input
                type="number"
                min="2"
                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-colors"
                defaultValue={10}
                onChange={(e) => {
                  const maxVal = parseInt(e.target.value) || 2;
                  setFormData({
                    ...formData,
                    maxPlayers: maxVal,
                    minPlayersToStart: Math.ceil(maxVal / 2),
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Min chốt kèo
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-colors"
                value={formData.minPlayersToStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPlayersToStart: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          {/* --- LOẠI KÈO & CẤU HÌNH --- */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
              Thể thức thi đấu
            </label>

            <div className="flex w-full rounded-lg overflow-hidden border border-blue-500 mb-4">
              {["NORMAL", "BET", "RANKED"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, matchType: type })}
                  className={`flex-1 py-1.5 text-sm font-semibold transition-colors border-r last:border-r-0 border-blue-500 ${
                    formData.matchType === type
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {type === "NORMAL"
                    ? "😊 Giao lưu"
                    : type === "BET"
                    ? "💰 Chia Kèo"
                    : "🏆 Đánh Rank"}
                </button>
              ))}
            </div>

            {/* Cấu hình Đánh Kèo */}
            {formData.matchType === "BET" && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 animate-in fade-in">
                <label className="block text-xs font-bold text-yellow-700 mb-2">
                  % Tiền sân phe THẮNG phải trả
                </label>
                <div className="flex items-center gap-4">
                  {/* Ô nhập liệu dùng Antd InputNumber có sẵn nút lên/xuống xịn */}
                  <InputNumber
                    min={0}
                    max={50}
                    step={10}
                    value={formData.winnerPercent}
                    onChange={(val) =>
                      setFormData({ ...formData, winnerPercent: val || 0 })
                    }
                    formatter={(value) => `${value}%`}
                    parser={(value) =>
                      value ? Number(value.replace("%", "")) : 0
                    }
                    className="w-28 font-bold text-yellow-700 text-[18px] flex items-center"
                    size="large"
                  />

                  {/* Box hiển thị phe thua */}
                  <div className="flex-1 bg-yellow-100/80 py-2 px-3 rounded-lg border border-yellow-300 text-sm text-yellow-800 flex items-center gap-2 shadow-sm">
                    <span>👉</span>
                    <span>
                      <strong>Phe THUA</strong> sẽ trả:{" "}
                      <span className="text-red-500 font-bold text-base">
                        {100 - (formData.winnerPercent || 0)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Cấu hình Đánh Rank */}
            {formData.matchType === "RANKED" && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 animate-in fade-in grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1 uppercase">
                    Rank tối thiểu
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.minRank}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minRank: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-purple-100 p-2.5 rounded-xl outline-none focus:border-purple-500 text-purple-700 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1 uppercase">
                    Rank tối đa
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.maxRank}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRank: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-purple-100 p-2.5 rounded-xl outline-none focus:border-purple-500 text-purple-700 font-bold text-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end items-center gap-6">
          <button
            onClick={onClose}
            className="font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 disabled:bg-gray-300 transition-all"
          >
            {loading ? "Đang đăng tin..." : "Đăng kèo ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMatchModal;
