// Trong BookingConfirmModal.tsx
import { Modal, Input } from "antd";

export default function BookingConfirmModal({
  open,
  onClose,
  cart = [], // Đây là mảng selectedSlots
  userInfo,
  setUserInfo,
  onConfirm,
}: any) {
  return (
    <Modal
      title={
        <h2 className="text-xl font-bold text-gray-800">Xác nhận đặt sân</h2>
      }
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Xác nhận đặt"
      cancelText="Hủy"
      okButtonProps={{ className: "bg-[#ea580c]" }}
      width={600}
    >
      <div className="py-4">
        <h3 className="font-semibold text-gray-700 mb-2">
          Danh sách sân đã chọn:
        </h3>
        <div className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-2">
          {cart.map((slot: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <div>
                <div className="font-semibold text-[#9156F1]">
                  {slot.courtName} - {slot.courtCode}
                </div>
                <div className="text-sm text-gray-500">{slot.date}</div>
              </div>
              <div className="font-medium text-gray-700">
                {slot.startTime} - {slot.endTime}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <h3 className="font-semibold text-gray-700">Thông tin liên hệ:</h3>
          <Input
            placeholder="Họ và tên"
            value={userInfo.userName}
            onChange={(e) =>
              setUserInfo({ ...userInfo, userName: e.target.value })
            }
          />
          <Input
            placeholder="Số điện thoại"
            value={userInfo.userPhone}
            onChange={(e) =>
              setUserInfo({ ...userInfo, userPhone: e.target.value })
            }
          />
          <Input.TextArea
            placeholder="Ghi chú thêm (không bắt buộc)"
            value={userInfo.note}
            onChange={(e) => setUserInfo({ ...userInfo, note: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
