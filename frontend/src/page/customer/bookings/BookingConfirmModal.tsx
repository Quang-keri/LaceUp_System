import { Modal, Input } from "antd";
import dayjs from "dayjs";

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
    console.log("=== BẮT ĐẦU TÍNH GIÁ ===");
    console.log("1. Dữ liệu item đặt sân:", item);

    const fallbackPrice =
      item.court.pricePerHour || item.court.minPrice || item.court.price || 0;

    if (!item.court.priceRules || item.court.priceRules.length === 0) {
      console.log("=> Không có priceRules, dùng fallbackPrice:", fallbackPrice);
      const startObj = dayjs(`${item.date}T${item.startTime}`);
      const endObj = dayjs(`${item.date}T${item.endTime}`);
      const hours = endObj.diff(startObj, "minute") / 60;
      return hours * item.quantity * fallbackPrice;
    }

    const reqStartMin = timeToMinutes(item.startTime);
    const reqEndMin = timeToMinutes(item.endTime);

    const dayOfWeek = dayjs(item.date).day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    console.log(`2. Ngày khách đặt: ${item.date} | Là cuối tuần? ${isWeekend}`);
    console.log(`3. Khung giờ đặt (phút): ${reqStartMin} -> ${reqEndMin}`);

    // Sort priority: Ép kiểu Number để chắc chắn sort đúng (lớn nhất lên đầu)
    const sortedRules = [...item.court.priceRules].sort(
      (a: any, b: any) => (Number(b.priority) || 0) - (Number(a.priority) || 0)
    );
    console.log("4. Danh sách rules SAU KHI SORT Priority:", sortedRules.map(r => ({
      priority: r.priority, price: r.pricePerHour, dayType: r.dayType, startDate: r.startDate
    })));

    let totalPriceForOneCourt = 0;
    let loggedFirstMinute = false; // Cờ để không bị spam log 60 lần/tiếng

    for (let min = reqStartMin; min < reqEndMin; min++) {
      let appliedRule = null;

      for (const rule of sortedRules) {
        if (!loggedFirstMinute) {
           console.log(`\n--- Đang test Rule giá ${rule.pricePerHour}đ (Priority: ${rule.priority}) ---`);
        }

        // 1. Kiểm tra giờ
        const ruleStartMin = timeToMinutes(rule.startTime);
        const ruleEndMin = timeToMinutes(rule.endTime);
        if (min < ruleStartMin || min >= ruleEndMin) {
          if (!loggedFirstMinute) console.log("=> BỎ QUA: Khách đặt ngoài khung giờ của Rule này.");
          continue;
        }

        // 2. Kiểm tra Sự kiện
        if (rule.startDate && item.date < rule.startDate) {
           if (!loggedFirstMinute) console.log(`=> BỎ QUA: Ngày đặt (${item.date}) < startDate (${rule.startDate})`);
           continue;
        }
        if (rule.endDate && item.date > rule.endDate) {
           if (!loggedFirstMinute) console.log(`=> BỎ QUA: Ngày đặt (${item.date}) > endDate (${rule.endDate})`);
           continue;
        }

        // 3. Kiểm tra Ngày cụ thể
        if (rule.specificDate && rule.specificDate !== item.date) {
           if (!loggedFirstMinute) console.log("=> BỎ QUA: Không trùng specificDate.");
           continue;
        }

        // 4. Kiểm tra Thứ
        const dayType = rule.dayType || "ALL";
        if (dayType !== "ALL") {
          if (dayType === "WEEKDAY" && isWeekend) {
             if (!loggedFirstMinute) console.log("=> BỎ QUA: Rule T2-T6 nhưng khách đặt T7/CN.");
             continue;
          }
          if (dayType === "WEEKEND" && !isWeekend) {
             if (!loggedFirstMinute) console.log("=> BỎ QUA: Rule T7/CN nhưng khách đặt T2-T6.");
             continue;
          }
        }

        if (!loggedFirstMinute) {
           console.log("=> ✓ HỢP LỆ! CHỌN RULE NÀY!");
        }
        appliedRule = rule;
        break;
      }

      loggedFirstMinute = true; // Xong phút đầu thì tắt log để khỏi rác màn hình

      const pricePerMin = appliedRule
        ? appliedRule.pricePerHour / 60
        : fallbackPrice / 60;

      totalPriceForOneCourt += pricePerMin;
    }

    console.log(`\n=> TỔNG TIỀN 1 SÂN: ${totalPriceForOneCourt}`);
    console.log("=== KẾT THÚC ===\n");

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
      cancelText="Hủy"
      width={520}
    >
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
                  {calculateItemPrice(item).toLocaleString("vi-VN")} VNĐ
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                {dayjs(item.date).format("DD/MM/YYYY")} •{" "}
                {String(item.startTime).substring(0, 5)} -{" "}
                {String(item.endTime).substring(0, 5)}{" "}
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
          {total.toLocaleString("vi-VN")} VNĐ
        </span>
      </div>
    </Modal>
  );
}