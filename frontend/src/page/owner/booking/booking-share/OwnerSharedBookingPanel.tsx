import { Alert, Button, InputNumber, Spin, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import bookingService from "../../../../service/bookingService";

interface OwnerSharedBookingPanelProps {
  selectedSlot: any;
  submitting?: boolean;

  onBook: (
    maxParticipants: number,
    minParticipants: number,
  ) => void | Promise<void>;

  onCancel: () => void;
}

const ROUND_UNIT = 1_000;

export default function OwnerSharedBookingPanel({
  selectedSlot,
  submitting = false,
  onBook,
  onCancel,
}: OwnerSharedBookingPanelProps) {
  const [maxParticipants, setMaxParticipants] = useState<number>(10);

  const [minParticipants, setMinParticipants] = useState<number>(4);

  const [basePrice, setBasePrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedSlot) {
      setBasePrice(0);
      return;
    }

    let isMounted = true;

    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);

        const payload = {
          slots: [
            {
              courtCopyId: selectedSlot.courtCopyId,
              startTime: `${selectedSlot.date}T${selectedSlot.startTime}:00`,
              endTime: `${selectedSlot.date}T${selectedSlot.endTime}:00`,
            },
          ],
        };

        const response = await bookingService.previewOwnerBookingPrice(payload);

        if (!isMounted) {
          return;
        }

        const price = Number(response?.result ?? 0);

        setBasePrice(Number.isFinite(price) ? price : 0);
      } catch {
        if (!isMounted) {
          return;
        }

        setBasePrice(0);

        message.error("Không thể tính giá gốc của sân. Vui lòng thử lại!");
      } finally {
        if (isMounted) {
          setLoadingPrice(false);
        }
      }
    };

    fetchPrice();

    return () => {
      isMounted = false;
    };
  }, [selectedSlot]);

  const handleMaxParticipantsChange = (value: number | null) => {
    const nextMax = Number(value ?? 2);

    setMaxParticipants(nextMax);

    if (minParticipants > nextMax) {
      setMinParticipants(nextMax);
    }
  };

  const handleMinParticipantsChange = (value: number | null) => {
    setMinParticipants(Number(value ?? 2));
  };

  const handleSubmit = () => {
    if (minParticipants < 2) {
      message.warning("Số người tối thiểu phải từ 2 người");
      return;
    }

    if (maxParticipants < 2) {
      message.warning("Số người tối đa phải từ 2 người");
      return;
    }

    if (minParticipants > maxParticipants) {
      message.warning("Số người tối thiểu không được lớn hơn số người tối đa");
      return;
    }

    onBook(maxParticipants, minParticipants);
  };

  const ticketPrice =
    maxParticipants > 0
      ? Math.ceil(basePrice / maxParticipants / ROUND_UNIT) * ROUND_UNIT
      : 0;

  const estimatedRevenue = maxParticipants * ticketPrice;

  const minimumRevenue = minParticipants * ticketPrice;

  const selectedDate = selectedSlot?.date
    ? dayjs(selectedSlot.date).format("DD/MM/YYYY")
    : "--/--/----";

  return (
    <Spin spinning={loadingPrice}>
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="m-0 text-sm font-semibold text-gray-900">
            Mở kèo gom khách lẻ
          </p>

          <p className="mb-0 mt-1 text-xs leading-5 text-gray-500">
            Giá vé được tính bằng giá sân chia đều cho số người tối đa và làm
            tròn lên 1.000đ.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="m-0 font-bold text-gray-800">
            {selectedSlot?.courtName || "Tên sân"}

            {selectedSlot?.courtCode && (
              <span className="ml-1 text-gray-600">
                - {selectedSlot.courtCode}
              </span>
            )}
          </p>

          <p className="mb-0 mt-1 text-sm text-gray-500">
            {selectedDate} • {selectedSlot?.startTime || "--:--"} -{" "}
            {selectedSlot?.endTime || "--:--"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Số người tối thiểu
            </span>

            <InputNumber
              min={2}
              max={maxParticipants}
              value={minParticipants}
              onChange={handleMinParticipantsChange}
              size="large"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Số người tối đa
            </span>

            <InputNumber
              min={2}
              max={50}
              value={maxParticipants}
              onChange={handleMaxParticipantsChange}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <Alert
          type="warning"
          showIcon
          message="Điều kiện tổ chức trận"
          description={
            <>
              Nếu đến thời điểm kiểm tra mà chưa đủ{" "}
              <b>{minParticipants} người</b>, trận sẽ bị hủy và các vé còn hiệu
              lực sẽ chuyển sang trạng thái chờ hoàn tiền.
            </>
          }
        />

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
            <span>Giá gốc sân:</span>

            <span className="font-medium text-gray-800">
              {basePrice.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
            <span>Số người tối thiểu:</span>

            <span className="font-medium text-gray-800">
              {minParticipants} người
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
            <span>Số người tối đa:</span>

            <span className="font-medium text-gray-800">
              {maxParticipants} người
            </span>
          </div>

          <div className="flex items-center justify-between border-y border-gray-200 py-3">
            <span className="font-semibold text-slate-700">Giá một vé</span>

            <span className="text-lg font-semibold text-blue-600">
              {ticketPrice.toLocaleString("vi-VN")} đ/vé
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-600">Thu khi đủ tối thiểu</span>

            <span className="font-medium text-slate-800">
              {minimumRevenue.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              Dự kiến thu nếu đầy
            </span>

            <span className="text-xl font-semibold text-blue-600">
              {estimatedRevenue.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-200 pt-4">
          <Button
            size="large"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1"
          >
            Hủy bỏ
          </Button>

          <Button
            type="primary"
            size="large"
            loading={submitting}
            disabled={
              loadingPrice ||
              basePrice <= 0 ||
              maxParticipants < 2 ||
              minParticipants < 2 ||
              minParticipants > maxParticipants
            }
            onClick={handleSubmit}
            className="flex-1 font-semibold"
            style={{
              backgroundColor: "#262626",
              borderColor: "#262626",
            }}
          >
            Đăng kèo lên ứng dụng
          </Button>
        </div>
      </div>
    </Spin>
  );
}
