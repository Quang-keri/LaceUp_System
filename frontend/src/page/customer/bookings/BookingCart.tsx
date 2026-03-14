export default function BookingCart({
  cart,
  increase,
  decrease,
  onOpenModal,
}: any) {
  return (
    <div className="border rounded-xl p-4 sticky top-6">
      <h3 className="font-semibold mb-4">Giỏ đặt sân</h3>

      {cart.length === 0 && (
        <p className="text-gray-500">Chưa có sân trong giỏ</p>
      )}

      {cart.map((item, index) => (
        <div key={index} className="border-b py-3">
          <p className="font-medium">{item.court.courtName}</p>

          <p className="text-sm text-gray-500">
            {item.date} {item.startTime}-{item.endTime}
          </p>

          <p className="text-blue-600">{item.court.price} VNĐ / giờ</p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => decrease(index)}
              className="px-2 border rounded"
            >
              -
            </button>

            <span>{item.quantity}</span>

            <button
              onClick={() => increase(index)}
              className="px-2 border rounded"
            >
              +
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onOpenModal}
        className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4"
      >
        Đặt sân
      </button>
    </div>
  );
}
