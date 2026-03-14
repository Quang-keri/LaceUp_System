import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Modal, Input } from "antd";
import roomsService from "../../../services/rooms/rooms";

export default function ManageSchedulePage() {
  const roomColors = {
    "301": "#3b82f6",
    "302": "#22c55e",
    "303": "#f59e0b",
  };

  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [eventDetail, setEventDetail] = useState(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await roomsService.getMyRooms();
        const roomsData = res.result || [];

        setRooms(roomsData);

        const resourceData = roomsData.map((room) => ({
          id: room.roomId,
          title: room.roomName,
        }));

        setResources(resourceData);

        const calendarEvents = [];

        roomsData.forEach((room) => {
          room.roomCopies?.forEach((rc) => {
            rc.slots?.forEach((slot) => {
              const bookingInfo = slot.booking || {};

              calendarEvents.push({
                id: slot.slotId,
                resourceId: room.roomId,
                start: slot.startTime,
                end: slot.endTime,
                title: bookingInfo.userName || "Đã đặt",
                backgroundColor: roomColors[room.roomId] || "#6366f1",

                extendedProps: {
                  roomName: `${room.roomName} (${rc.roomCode})`,
                  roomId: room.roomId,
                  phone: bookingInfo.userPhone,
                  customerName: bookingInfo.userName,
                  note: bookingInfo.note,
                },
              });
            });
          });
        });

        setEvents(calendarEvents);
      } catch (err) {
        console.error(err);
      }
    };

    loadRooms();
  }, []);

  const isConflict = (roomId, start, end) => {
    return events.some((e) => {
      if (e.resourceId !== roomId) return false;

      const es = new Date(e.start);
      const ee = new Date(e.end);

      return start < ee && end > es;
    });
  };

  const mergeSlot = (slots) => {
    const map = {};

    slots.forEach((s) => {
      const key = s.roomId;

      if (!map[key]) map[key] = [];

      map[key].push(s);
    });

    return Object.values(map).flat();
  };

  const handleSelect = (info) => {
    const roomId = info.resource?.id;

    if (!roomId) return;

    if (isConflict(roomId, info.start, info.end)) {
      alert("Khung giờ này đã được đặt");
      return;
    }

    const slot = {
      roomId,
      startTime: info.startStr,
      endTime: info.endStr,
    };

    setSelectedSlots((prev) => mergeSlot([...prev, slot]));
  };

  const previewEvents = selectedSlots.map((s, i) => ({
    id: "preview-" + i,
    resourceId: s.roomId,
    start: s.startTime,
    end: s.endTime,
    title: "Đã chọn",
    backgroundColor: "#60a5fa",
  }));

  const handleSubmitBooking = async () => {
    const payload = {
      userName: customerName,
      userPhone: phone,
      note: note,
      bookingType: "HOURLY",
      numberOfMonths: 0,
      slotRequests: selectedSlots.map((s) => ({
        roomId: s.roomId,
        quantity: 1,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };

    await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const newEvents = payload.slotRequests.map((s) => ({
      id: Date.now() + Math.random(),
      resourceId: s.roomId,
      start: s.startTime,
      end: s.endTime,
      title: payload.userName,
      backgroundColor: roomColors[s.roomId] || "#6366f1",

      extendedProps: {
        roomName: resources.find((r) => r.id === s.roomId)?.title,
        phone: payload.userPhone,
        customerName: payload.userName,
        note: payload.note,
      },
    }));

    setEvents((prev) => [...prev, ...newEvents]);

    setSelectedSlots([]);
    setCustomerName("");
    setPhone("");
    setNote("");
    setOpenModal(false);
  };

  const handleRemoveSlot = (index) => {
    setSelectedSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEventClick = (info) => {
    const event = info.event;

    setEventDetail({
      roomName: event.extendedProps.roomName,
      customerName: event.extendedProps.customerName,
      phone: event.extendedProps.phone,
      note: event.extendedProps.note,
      start: event.start,
      end: event.end,
    });

    setDetailModal(true);
  };

  return (
    <div className="p-6">
      <FullCalendar
        plugins={[
          resourceTimeGridPlugin,
          interactionPlugin,
          dayGridPlugin,
          timeGridPlugin,
        ]}
        initialView="resourceTimeGridDay"
        selectable
        selectMirror
        select={handleSelect}
        eventClick={handleEventClick}
        resources={resources}
        events={[...events, ...previewEvents]}
        height="auto"
        locale="vi"
        customButtons={{
          addBooking: {
            text: "Tạo lịch đặt",
            click: () => setOpenModal(true),
          },
        }}
        headerToolbar={{
          left: "prev,next today addBooking",
          center: "title",
          right: "dayGridMonth,timeGridWeek,resourceTimeGridDay",
        }}
        buttonText={{
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
        }}
      />

      <Modal
        title="Tạo lịch đặt phòng"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleSubmitBooking}
        okText="Tạo lịch"
        cancelText="Hủy"
        width={600}
      >
        <Input
          className="!mb-3"
          placeholder="Tên khách hàng"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <Input
          className="!mb-3"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input.TextArea
          className="!mb-3"
          placeholder="Ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>
            Các khung giờ đã chọn
          </h3>

          {selectedSlots.length === 0 && (
            <div style={{ color: "#888" }}>Chưa có khung giờ nào</div>
          )}

          {selectedSlots.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid #eee",
                fontSize: 13,
              }}
            >
              <div>
                <b>Phòng {s.roomId}</b>
                <div>
                  {s.startTime} → {s.endTime}
                </div>
              </div>

              <button
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                onClick={() => handleRemoveSlot(i)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="Chi tiết lịch đặt"
        open={detailModal}
        footer={null}
        onCancel={() => setDetailModal(false)}
      >
        {eventDetail && (
          <div>
            <p>
              <b>Phòng:</b> {eventDetail.roomName}
            </p>

            <p>
              <b>Khách hàng:</b> {eventDetail.customerName}
            </p>

            <p>
              <b>SĐT:</b> {eventDetail.phone}
            </p>

            <p>
              <b>Bắt đầu:</b> {eventDetail.start?.toLocaleString()}
            </p>

            <p>
              <b>Kết thúc:</b> {eventDetail.end?.toLocaleString()}
            </p>

            <p>
              <b>Ghi chú:</b> {eventDetail.note}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
