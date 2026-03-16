export default function HostCard({ rental }: any) {
  const handleChatClick = () => {
    if (!rental.userId && !rental.ownerId) {
      console.error("Không tìm thấy ID chủ phòng");
      return;
    }

    const event = new CustomEvent("OPEN_CHAT_WITH_USER", {
      detail: {
        userId: rental.ownerId,
        userName: rental.ownerName || "Chủ phòng",
      },
    });

    window.dispatchEvent(event);
  };

  return (
    console.log(rental),
    (
      <div className="bg-white rounded-xl p-6 shadow-md rounded-2xl sticky top-6">
        <div className="flex flex-col items-center text-center">
          <img
            src="https://i.pravatar.cc/120"
            className="w-20 h-20 rounded-full object-cover"
          />

          <h3 className="font-semibold text-lg mt-3">{rental.contactName}</h3>

          <p className="text-gray-500 text-sm">Chủ phòng</p>
        </div>

        <hr className="my-5" />

        <div className="space-y-3 text-sm text-gray-600">
          <p> {rental.contactPhone}</p>
          <p> Phản hồi nhanh</p>
          <p> Chủ sân uy tín</p>
        </div>

        <button
          onClick={handleChatClick}
          className="
          w-full mt-6
          bg-blue-600
          hover:bg-blue-700
          text-white
          py-3
          rounded-lg
          font-medium
          transition
        "
        >
          Chat ngay
        </button>
      </div>
    )
  );
}
