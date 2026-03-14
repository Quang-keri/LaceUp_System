import { Modal, Input } from "antd";

export default function BookingConfirmModal({
  open,
  onClose,
  cart,
  userInfo,
  setUserInfo,
  onConfirm,
}: any) {
  const total = cart.reduce(
    (sum: number, item: any) => sum + item.quantity * item.court.price,
    0,
  );

  return (
    <Modal
      title={<span className="text-lg font-semibold">Xác nhận đặt sân</span>}
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Xác nhận và  thanh toán"
      width={520}
    >
      {" "}
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
      <div className="space-y-4 mb-6 max-h-[260px] overflow-y-auto pr-2">
        {cart.map((item: any, index: number) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">
                {item.court.courtName}
              </p>

              <span className="text-blue-600 font-medium">
                {(item.court.price * item.quantity).toLocaleString()} VNĐ
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {item.date} • {item.startTime} - {item.endTime}
            </p>

            <p className="text-sm text-gray-500">
              Số lượng sân: {item.quantity}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t mt-5 pt-4 flex justify-between items-center">
        <span className="text-gray-600">Chi phí</span>

        <span className="text-xl font-bold text-red-500">
          {total.toLocaleString()} VNĐ
        </span>
      </div>
    </Modal>
  );
}
