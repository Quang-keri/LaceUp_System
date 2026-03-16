import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Modal, Input, Button, Card } from "antd";

import type { CourtCopyResponse, SlotResponse } from "../../../types/court";

interface Props {
  courtCopies?: CourtCopyResponse[];
}

export default function SlotCalendar({ courtCopies = [] }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [detailModal, setDetailModal] = useState(false);
  const [eventDetail, setEventDetail] = useState<any>(null);

  const resources = courtCopies.map((c) => ({
    id: c.courtCopyId,
    title: c.courtCode,
  }));

  const bookedEvents = courtCopies.flatMap((court) =>
    (court.slots || [])
      .filter((s) => s.slotStatus === "BOOKED")
      .map((s) => ({
        id: s.slotId,
        resourceId: court.courtCopyId,
        start: s.startTime,
        end: s.endTime,
        title: s.bookingShortResponse?.userName || "Đã đặt",

        extendedProps: {
          phone: s.bookingShortResponse?.userPhone,
          customerName: s.bookingShortResponse?.userName,
          note: "",
          court: court.courtCode,
        },
      })),
  );

  const isConflict = (courtId: string, start: Date, end: Date) => {
    return bookedEvents.some((e) => {
      if (e.resourceId !== courtId) return false;

      const es = new Date(e.start);
      const ee = new Date(e.end);

      return start < ee && end > es;
    });
  };

  const handleSelect = (info: any) => {
    const courtId = info.resource?.id;

    if (!courtId) return;

    if (isConflict(courtId, info.start, info.end)) {
      alert("Khung giờ đã được đặt");
      return;
    }

    const slot = {
      courtId,
      startTime: info.startStr,
      endTime: info.endStr,
    };

    setSelectedSlots((prev) => [...prev, slot]);
  };

  const previewEvents = selectedSlots.map((s, i) => ({
    id: "preview-" + i,
    resourceId: s.courtId,
    start: s.startTime,
    end: s.endTime,
    title: "Đã chọn",
    backgroundColor: "#60a5fa",
  }));

  const handleCreateBooking = () => {
    const newEvents = selectedSlots.map((s) => ({
      id: Date.now() + Math.random(),
      resourceId: s.courtId,
      start: s.startTime,
      end: s.endTime,
      title: customerName,

      extendedProps: {
        phone,
        customerName,
        note,
      },
    }));

    setEvents((prev) => [...prev, ...newEvents]);

    setSelectedSlots([]);
    setCustomerName("");
    setPhone("");
    setNote("");

    setOpenModal(false);
  };

  const handleEventClick = (info: any) => {
    const event = info.event;

    setEventDetail({
      customerName: event.extendedProps.customerName,
      phone: event.extendedProps.phone,
      note: event.extendedProps.note,
      start: event.start,
      end: event.end,
    });

    setDetailModal(true);
  };

  return (
    <Card>
      <FullCalendar
        plugins={[
          resourceTimeGridPlugin,
          interactionPlugin,
          dayGridPlugin,
          timeGridPlugin,
        ]}
        locale="vi"
        initialView="resourceTimeGridDay"
        resources={resources}
        events={[...bookedEvents, ...events, ...previewEvents]}
        selectable
        selectMirror
        select={handleSelect}
        eventClick={handleEventClick}
        slotDuration="00:30:00"
        height="auto"
        customButtons={{
          createBooking: {
            text: "Tạo lịch đặt",
            click: () => setOpenModal(true),
          },
        }}
        headerToolbar={{
          left: "prev,next today createBooking",
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
        title="Tạo lịch đặt sân"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleCreateBooking}
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

        <h4>Khung giờ đã chọn</h4>

        {selectedSlots.map((s, i) => (
          <div key={i}>
            {s.startTime} → {s.endTime}
          </div>
        ))}
      </Modal>

      <Modal
        title="Chi tiết lịch đặt"
        open={detailModal}
        footer={null}
        onCancel={() => setDetailModal(false)}
      >
        {eventDetail && (
          <>
            <p>
              <b>Khách:</b> {eventDetail.customerName}
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
          </>
        )}
      </Modal>
    </Card>
  );
}
