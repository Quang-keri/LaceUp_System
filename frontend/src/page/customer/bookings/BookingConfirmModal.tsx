import { Modal, Input } from "antd";
import dayjs from "dayjs"; // Nhớ import dayjs vào nhé

export default function BookingConfirmModal({
  open,
  onClose,
  cart,
  userInfo,
  setUserInfo,
  onConfirm,
}: any) {
  const timeToMinutes = (timeValue: any) => {
    if (!timeValue) return 0;

    // 1. Nếu dữ liệu đã là chuỗi chuẩn (VD: "08:30")
    if (typeof timeValue === "string") {
      const [hours, minutes] = timeValue.split(":").map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    }

    if (
      typeof timeValue === "object" &&
      typeof timeValue.format === "function"
    ) {
      const timeStr = timeValue.format("HH:mm");
      const [hours, minutes] = timeStr.split(":").map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    }

    if (timeValue instanceof Date) {
      return timeValue.getHours() * 60 + timeValue.getMinutes();
    }

    return 0;
  };

  const calculateItemPrice = (item: any) => {
    const fallbackPrice =
      item.court.pricePerHour || item.court.minPrice || item.court.price || 0;

    if (!item.court.priceRules || item.court.priceRules.length === 0) {
      const startObj = dayjs(`${item.date}T${item.startTime}`);
      const endObj = dayjs(`${item.date}T${item.endTime}`);
      const hours = endObj.diff(startObj, "minute") / 60;
      return hours * item.quantity * fallbackPrice;
    }

    const reqStartMin = timeToMinutes(item.startTime);
    const reqEndMin = timeToMinutes(item.endTime);

    const dayOfWeek = dayjs(item.date).day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const sortedRules = [...item.court.priceRules].sort(
      (a: any, b: any) => b.priority - a.priority,
    );

    let totalPriceForOneCourt = 0;

    for (let min = reqStartMin; min < reqEndMin; min++) {
      let appliedRule = null;

      for (const rule of sortedRules) {
        // Kiểm tra điều kiện Ngày
        if (rule.specificDate && rule.specificDate !== item.date) continue;
        if (!rule.specificDate) {
          if (rule.priceType === "WEEKEND" && !isWeekend) continue;
          if (rule.priceType === "NORMAL" && isWeekend) continue;
        }

        const ruleStartMin = timeToMinutes(rule.startTime);
        const ruleEndMin = timeToMinutes(rule.endTime);

        if (min >= ruleStartMin && min < ruleEndMin) {
          appliedRule = rule;
          break;
        }
      }

      const pricePerMin = appliedRule
        ? appliedRule.pricePerHour / 60
        : fallbackPrice / 60;

      totalPriceForOneCourt += pricePerMin;
    }

    return Math.round(totalPriceForOneCourt) * item.quantity;
  };

  // Tính tổng tiền toàn bộ giỏ hàng
  const total = cart.reduce(
    (sum: number, item: any) => sum + calculateItemPrice(item),
    0,
  );

  return (
    <Modal
      title={<span className="text-lg font-semibold">Xác nhận đặt sân</span>}
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Xác nhận và thanh toán"
      width={520}
    >
      {/* Thông tin người đặt */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3 text-gray-700">
          Thông tin người đặt
        </h3>

        <div className="space-y-3">
          <Input
            size="large"
            placeholder="Tên người đặt"
            value={userInfo.userName}
            onChange={(e) =>
              setUserInfo({
                ...userInfo,
                userName: e.target.value,
              })
            }
          />

          <Input
            size="large"
            placeholder="Số điện thoại"
            value={userInfo.userPhone}
            onChange={(e) =>
              setUserInfo({
                ...userInfo,
                userPhone: e.target.value,
              })
            }
          />

          <Input.TextArea
            rows={3}
            placeholder="Ghi chú thêm (nếu có)"
            value={userInfo.note}
            onChange={(e) =>
              setUserInfo({
                ...userInfo,
                note: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-4 mb-6 max-h-[260px] overflow-y-auto pr-2 mt-4">
        {cart.map((item: any, index: number) => {
          // Tính lại số giờ để hiển thị cho UI đẹp hơn
          const startObj = dayjs(`${item.date}T${item.startTime}`);
          const endObj = dayjs(`${item.date}T${item.endTime}`);
          const hours = endObj.diff(startObj, "minute") / 60;

          return (
            <div key={index} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800">
                  {item.court.courtName}
                </p>

                <span className="text-blue-600 font-medium">
                  {calculateItemPrice(item).toLocaleString()} VNĐ
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                {item.date} • {item.startTime} - {item.endTime}{" "}
                <span className="font-medium text-gray-700">({hours} giờ)</span>
              </p>

              <p className="text-sm text-gray-500">
                Số lượng sân: {item.quantity}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t mt-5 pt-4 flex justify-between items-center">
        <span className="text-gray-600 font-medium">Tổng chi phí dự kiến</span>

        <span className="text-2xl font-bold text-[#9156F1]">
          {total.toLocaleString()} VNĐ
        </span>
      </div>
    </Modal>
  );
}
