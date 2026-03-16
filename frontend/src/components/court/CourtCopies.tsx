export default function CourtCopies({ court, copies, addSlot }: any) {

  const createSlot = (copy: any) => {

    const start = prompt("Nhập giờ bắt đầu (YYYY-MM-DD HH:mm)");

    const end = prompt("Nhập giờ kết thúc (YYYY-MM-DD HH:mm)");

    if (!start || !end) return;

    addSlot({
      courtCopyId: copy.courtCopyId,
      courtId: court.courtId,
      quantity: 1,
      startTime: start,
      endTime: end
    });

  };

  return (
    <div>

      {copies.map((copy: any) => (

        <div
          key={copy.courtCopyId}
          className="flex justify-between border p-2 mb-2"
        >

          {copy.courtCode}

          <button
            onClick={() => createSlot(copy)}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Thuê
          </button>

        </div>

      ))}

    </div>
  );
}