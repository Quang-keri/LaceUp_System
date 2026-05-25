import { useEffect, useState } from "react";
import {
  DatePicker,
  Select,
  InputNumber,
  Input,
  Button,
  Form,
  message,
} from "antd";
import dayjs from "dayjs";
import bookingService from "../../../service/bookingService";

export default function CourtBookingPanel({
  court,
  onBook,
  selectedDate,
  selectedTime,
  selectedDuration,
}: {
  court: any;
  onBook: (data: any) => void;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
  selectedDuration?: number;
}) {
  const [form] = Form.useForm();
  const [isChecking, setIsChecking] = useState(false);

  const displayPrice = court?.minPrice || court?.price || 0;
  const maxCourts = court?.totalCourts || court?.courtCopies?.length || 1;

  useEffect(() => {
    let baseDate = selectedDate || dayjs();
    let initialTime = baseDate.clone().hour(17).minute(0).second(0);

    if (selectedTime) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      initialTime = baseDate.clone().hour(hour).minute(minute).second(0);
    }

    form.setFieldsValue({
      startTime: initialTime,
      duration: selectedDuration || 1,
      quantity: 1,
      categoryName: court?.categoryName || "Sân thể thao",
    });
  }, [selectedDate, selectedTime, selectedDuration, court, form]);

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

        if (isToday && selectedHour === now.hour()) {
          if (now.minute() >= 0) disabledMin.push(0);
          if (now.minute() >= 30) disabledMin.push(30);
        }

        return disabledMin;
      },
    };
  };

  const handleBook = async (values: any) => {
    const { startTime, duration, quantity } = values;

    if (!startTime) {
      message.warning("Vui lòng chọn ngày và giờ bắt đầu");
      return;
    }

    const endTime = startTime.add(duration, "hour");
    const formattedDate = startTime.format("YYYY-MM-DD");
    const startTimeStr = `${formattedDate}T${startTime.format("HH:mm")}:00`;
    const endTimeStr = `${formattedDate}T${endTime.format("HH:mm")}:00`;

    if (startTime.isBefore(dayjs())) {
      message.warning(
        "Không thể đặt sân trong quá khứ. Vui lòng chọn lại giờ!",
      );
      return;
    }
    if (startTime.isAfter(dayjs().add(14, "day"))) {
      message.warning("Chỉ được phép đặt trước tối đa 14 ngày");
      return;
    }

    setIsChecking(true);

    try {
      const payload = {
        courtId: court.courtId,
        quantity: quantity,
        startTime: startTimeStr,
        endTime: endTimeStr,
      };

      const res = await bookingService.checkAvailability(payload);
      const responseData = res.result || res.data;

      if (res.code === 200 && responseData?.available === true) {
        message.success(responseData?.message || "Sân khả dụng!");
        onBook({
          date: formattedDate,
          start: startTime.format("HH:mm"),
          end: endTime.format("HH:mm"),
          quantity: quantity,
        });
      } else {
        message.error(
          responseData?.message ||
            res.message ||
            "Rất tiếc! Sân không khả dụng trong khung giờ này.",
        );
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.result?.message ||
        "Lỗi khi kiểm tra lịch sân. Vui lòng thử lại!";
      message.error(errMsg);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* KHU VỰC CHUNG: Tên Sân */}
      <div className="mb-5 p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center gap-2">
        <p className="text-sm text-purple-900">
          Sân áp dụng: <strong>{court?.courtName}</strong>
        </p>
      </div>

      {/* KHU VỰC CHUNG: Giá tiền */}
      <div className="flex items-end gap-2 mb-6 border-b border-gray-100 pb-4">
        {displayPrice > 0 ? (
          <>
            <span className="text-gray-600 font-medium pb-1">Giá từ</span>
            <span className="text-4xl font-extrabold text-orange-500">
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-gray-500 font-medium pb-1">VNĐ / giờ</span>
          </>
        ) : (
          <span className="text-2xl font-extrabold text-[#9156F1] pb-1">
            Liên hệ để biết giá
          </span>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleBook}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">Giờ bắt đầu</span>
            }
            name="startTime"
            rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu!" }]}
          >
            <DatePicker
              showTime={{ format: "HH:mm", hideDisabledOptions: true }}
              format="HH:mm - DD/MM"
              className="w-full h-11"
              placeholder="Chọn giờ"
              showNow={false}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              disabledTime={disabledDateTime}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-gray-700">
                Thời lượng chơi
              </span>
            }
            name="duration"
            rules={[{ required: true }]}
          >
            <Select className="w-full h-11">
              <Select.Option value={1}>1 giờ</Select.Option>
              <Select.Option value={1.5}>1.5 giờ</Select.Option>
              <Select.Option value={2}>2 giờ</Select.Option>
              <Select.Option value={2.5}>2 giờ 30 phút</Select.Option>
              <Select.Option value={3}>3 giờ</Select.Option>
              <Select.Option value={3.5}>3 giờ 30 phút</Select.Option>
              <Select.Option value={4}>4 giờ</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <hr className="my-5 border-gray-100" />

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">
                Số lượng sân (1 - {maxCourts})
              </span>
            }
            name="quantity"
            rules={[{ required: true, message: "Nhập số lượng sân!" }]}
            className="mb-4"
          >
            <InputNumber
              min={1}
              max={maxCourts}
              className="w-full h-11 flex items-center rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold text-gray-700">Loại sân</span>}
            name="categoryName"
            className="mb-4"
          >
            <Input
              readOnly
              className="w-full h-11 rounded-lg bg-gray-50 text-gray-600 border-gray-200"
            />
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={isChecking}
          className="w-full h-[52px] text-base font-bold rounded-xl mt-2
            !bg-[#9156F1] !border-[#9156F1]
            hover:!bg-[#7e43d9] hover:!border-[#7e43d9]
            flex items-center justify-center gap-2 shadow-md"
        >
          {isChecking ? "Đang kiểm tra lịch trống..." : "Đặt sân ngay"}
        </Button>
      </Form>
    </div>
  );
}
