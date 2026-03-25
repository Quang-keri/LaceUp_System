import { useState } from "react";
import {
  DatePicker,
  TimePicker,
  InputNumber,
  Input,
  Button,
  message,
} from "antd"; // Thêm message từ antd
import dayjs from "dayjs";

import bookingService from "../../../service/bookingService";

export default function CourtBookingPanel({
  court,
  onBook,
}: {
  court: any;
  onBook: (data: any) => void;
}) {
  const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [start, setStart] = useState<dayjs.Dayjs | null>(
    dayjs().set("hour", 17).set("minute", 0),
  );
  const [end, setEnd] = useState<dayjs.Dayjs | null>(
    dayjs().set("hour", 19).set("minute", 0),
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [isChecking, setIsChecking] = useState(false);

  const displayPrice = court.minPrice || court.price || 0;
  const maxCourts = court.totalCourts || court.courtCopies?.length || 1;

  const handleBook = async () => {
    if (!date || !start || !end) {
      message.warning("Vui lòng chọn đầy đủ ngày và giờ"); // Đổi toast thành message
      return;
    }

    // Format dữ liệu gửi xuống Backend
    const formattedDate = date.format("YYYY-MM-DD");
    const startTimeStr = `${formattedDate}T${start.format("HH:mm")}:00`;
    const endTimeStr = `${formattedDate}T${end.format("HH:mm")}:00`;

    const startObj = dayjs(startTimeStr);
    const endObj = dayjs(endTimeStr);
    if (startObj.isBefore(dayjs())) {
      message.warning(
        "Không thể đặt sân trong quá khứ. Vui lòng chọn lại giờ bắt đầu!",
      );
      return; // Dừng luôn, không gọi API check nữa
    }
    // 1. Kiểm tra giờ kết thúc > giờ bắt đầu
    if (startObj.isAfter(endObj) || startObj.isSame(endObj)) {
      message.warning("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    // 2. Kiểm tra các điều kiện thời gian (Tối thiểu 1h, Tối đa 8h, Không quá 14 ngày)
    const durationMinutes = endObj.diff(startObj, "minute");
    if (durationMinutes < 60) {
      message.warning("Thời gian thuê tối thiểu là 1 tiếng");
      return;
    }
    if (durationMinutes > 480) {
      // 8 tiếng * 60 phút
      message.warning("Chỉ được thuê tối đa 8 tiếng cho một lần đặt");
      return;
    }
    if (startObj.isAfter(dayjs().add(14, "day"))) {
      message.warning("Chỉ được phép đặt trước tối đa 14 ngày");
      return;
    }

    setIsChecking(true);

    try {
      // 3. Gọi API thật check Availability
      const payload = {
        courtId: court.courtId,
        quantity: quantity,
        startTime: startTimeStr,
        endTime: endTimeStr,
      };

      const res = await bookingService.checkAvailability(payload);

      const responseData = res.result || res.data;

      // ĐÃ FIX BUGS: Đổi isAvailable thành available cho khớp với JSON Backend trả về
      if (res.code === 200 && responseData?.available === true) {
        // Hiện thông báo thành công xanh lá cho xịn
        message.success(responseData?.message || "Sân khả dụng!");

        // Hợp lệ -> Tiếp tục chuyển qua Modal Confirm
        onBook({
          date: formattedDate,
          start: start.format("HH:mm"),
          end: end.format("HH:mm"),
          quantity: quantity,
        });
      } else {
        // Backend báo lỗi logic (Đóng cửa, Kín sân...)
        message.error(
          responseData?.message ||
            res.message ||
            "Rất tiếc! Sân không khả dụng trong khung giờ này.",
        );
      }
    } catch (error: any) {
      // Backend bắt validation (@Valid) trả về lỗi HTTP 400
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.result?.message || // Thêm dòng này đề phòng lỗi gom vào object result
        "Lỗi khi kiểm tra lịch sân. Vui lòng thử lại!";
      message.error(errMsg);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {court.courtName}
      </h3>

      <div className="flex items-end gap-2 mb-6 border-b border-gray-100 pb-4">
        {displayPrice > 0 ? (
          <>
            Giá từ
            <span className="text-4xl font-extrabold text-[#e812d2]">
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-gray-500 font-medium pb-1">VNĐ / giờ</span>
          </>
        ) : (
          <span className="text-2xl font-extrabold text-[#3B82F6] pb-1">
            Liên hệ để biết giá
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ngày chơi
          </label>
          <DatePicker
            value={date}
            onChange={setDate}
            className="w-full h-11 rounded-lg"
            format="DD/MM/YYYY"
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Giờ bắt đầu
            </label>
            <TimePicker
              value={start}
              onChange={setStart}
              format="HH:mm"
              className="w-full h-11 rounded-lg"
              minuteStep={30}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Giờ kết thúc
            </label>
            <TimePicker
              value={end}
              onChange={setEnd}
              format="HH:mm"
              className="w-full h-11 rounded-lg"
              minuteStep={30}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số lượng sân cần đặt{" "}
            <span className="text-xs text-gray-400 font-normal">
              (Tối đa {maxCourts} sân)
            </span>
          </label>
          <InputNumber
            value={quantity}
            onChange={(v) => setQuantity(v || 1)}
            min={1}
            max={maxCourts}
            className="w-full h-11 flex items-center rounded-lg"
            prefix={<span className="text-gray-400 mr-2"></span>}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Loại sân
          </label>
          <Input
            value={court.categoryName || "Sân thể thao"}
            readOnly
            className="w-full h-11 rounded-lg bg-gray-50 text-gray-600 border-gray-200"
          />
        </div>

        <Button
          onClick={handleBook}
          loading={isChecking}
          className={`w-full h-[56px] 
    text-lg font-extrabold tracking-wide
    rounded-2xl 
    transition-all duration-300 
    shadow-lg shadow-[#9156F1]/30 
    border-none text-white
    ${
      isChecking
        ? "!bg-[#d8c3fb] hover:!bg-[#d8c3fb]"
        : "!bg-gradient-to-r from-[#9156F1] to-[#B57BFF] hover:from-[#7e43d9] hover:to-[#a86df5]"
    }`}
        >
          {isChecking ? "Đang kiểm tra lịch trống..." : "Đặt sân ngay"}
        </Button>
      </div>
    </div>
  );
}
