import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import viLocale from "@fullcalendar/core/locales/vi";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import { Card, Modal, Button, message, Spin } from "antd";

import { ReceiptContent } from "./ReceiptContent";
import { BookingModal } from "./BookingModal";
import type { CourtCopyResponse } from "../../../types/court";
import bookingService from "../../../service/bookingService";

export default function SlotCalendar({
  courtCopies = [],
  loading = false,
}: {
  courtCopies?: CourtCopyResponse[];
  loading?: boolean;
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);

  const [formState, setFormState] = useState({
    customerName: "",
    phone: "",
    note: "",
    totalPrice: 0,
    paidAmount: 0,
    paymentType: "UNPAID",
    paymentMethod: "BANK_TRANSFER",
  });

  const [openModal, setOpenModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Phieu_Dat_San",
  });

  const formatCurrency = (value?: number | null) =>
    new Intl.NumberFormat("vi-VN").format(Number(value || 0));

  const resources = courtCopies.map((c) => ({
    id: c.courtCopyId,
    title: c.courtCode,
  }));

  const bookedEvents = courtCopies.flatMap((courtCopy: any) =>
    (courtCopy.slots || []).map((slot: any) => ({
      id: slot.slotId,
      resourceId: courtCopy.courtCopyId,
      start: slot.startTime,
      end: slot.endTime,
      title: slot.bookingShortResponse?.userName || "Đã đặt",
      backgroundColor: "#3ca0f2",
      textColor: "#fff",
      extendedProps: {
        isBooked: true,
        phone: slot.bookingShortResponse?.userPhone,
        note: slot.bookingShortResponse?.note,
        bookingId: slot.bookingShortResponse?.bookingId,
      },
    })),
  );

  const removeSelectedSlot = (idToRemove: string) => {
    setSelectedSlots((prev) => prev.filter((s) => s.id !== idToRemove));
  };

  const handleCreateBooking = async () => {
    try {
      if (!formState.customerName || !formState.phone) {
        message.warning("Vui lòng nhập tên và số điện thoại khách hàng!");
        return;
      }

      const payload = {
        customerName: formState.customerName,
        phone: formState.phone,
        note: formState.note,
        totalPrice: Number(formState.totalPrice || 0),
        paidAmount: Number(formState.paidAmount || 0),
        paymentMethod: formState.paymentMethod,
        slots: selectedSlots.map((s) => ({
          courtCopyId: s.courtId,
          startTime: dayjs(s.startTime).format("YYYY-MM-DDTHH:mm:ss"),
          endTime: dayjs(s.endTime).format("YYYY-MM-DDTHH:mm:ss"),
        })),
      };

      const res = await bookingService.createOwnerBooking(payload);

      if (res.code !== 200 && res.code !== 201) {
        message.error(res.message || "Có lỗi xảy ra khi tạo lịch đặt.");
        return;
      }

      message.success("Tạo lịch đặt thành công!");

      const bookingCode =
        res.result?.bookingId?.substring(0, 8).toUpperCase() ||
        "DP" + Math.floor(100000 + Math.random() * 900000);

      setReceiptData({
        ...formState,
        bookingCode,
        createdDate: dayjs().format("DD/MM/YYYY HH:mm"),
        slots: [...selectedSlots],
      });

      const newEvents = selectedSlots.map((s) => ({
        id: Math.random().toString(),
        resourceId: s.courtId,
        start: s.startTime,
        end: s.endTime,
        title: formState.customerName,
        backgroundColor: "#10b981",
        borderColor: "#059669",
        textColor: "#fff",
        extendedProps: {
          ...formState,
          court: s.courtCode,
          isBooked: true,
          phone: formState.phone,
          note: formState.note,
        },
      }));

      setEvents((prev) => [...prev, ...newEvents]);
      setOpenModal(false);
      setReceiptModal(true);
      setSelectedSlots([]);

      setFormState({
        customerName: "",
        phone: "",
        note: "",
        totalPrice: 0,
        paidAmount: 0,
        paymentType: "UNPAID",
        paymentMethod: "BANK_TRANSFER",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi tạo lịch đặt.";
      message.error(errorMessage);
    }
  };

  return (
    <Card bordered={false} className="rounded-2xl shadow-sm">
      <Spin spinning={loading}>
        <FullCalendar
          plugins={[
            resourceTimeGridPlugin,
            interactionPlugin,
            dayGridPlugin,
            timeGridPlugin,
          ]}
          locales={[viLocale]}
          locale="vi"
          initialView="resourceTimeGridDay"
          height="auto"
          nowIndicator
          allDaySlot={false}
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          resources={resources}
          events={[
            ...bookedEvents,
            ...events,
            ...selectedSlots.map((s) => ({
              id: s.id,
              start: s.startTime,
              end: s.endTime,
              resourceId: s.courtId,
              title: "Đang chọn",
              backgroundColor: "#60a5fa",
              borderColor: "#2563eb",
              textColor: "#fff",
              extendedProps: { isSelecting: true },
            })),
          ]}
          selectable
          selectAllow={(selectInfo) => {
            return !bookedEvents.some((event) => {
              return (
                event.resourceId === selectInfo.resource?.id &&
                dayjs(selectInfo.start).isBefore(dayjs(event.end)) &&
                dayjs(selectInfo.end).isAfter(dayjs(event.start))
              );
            });
          }}
          select={(info) => {
            const slot = {
              id: Math.random().toString(36).substring(2, 9),
              courtId: info.resource?.id,
              courtCode: info.resource?.title,
              startTime: info.startStr,
              endTime: info.endStr,
              startDisplay: dayjs(info.start).format("DD/MM/YYYY HH:mm"),
              endDisplay: dayjs(info.end).format("HH:mm"),
            };

            setSelectedSlots((prev) => [...prev, slot]);
          }}
          eventClick={(info) => {
            if (info.event.extendedProps.isBooked) {
              Modal.info({
                title: "Thông tin lịch đã đặt",
                content: (
                  <div>
                    <p>
                      <strong>Khách:</strong> {info.event.title}
                    </p>
                    <p>
                      <strong>SĐT:</strong>{" "}
                      {info.event.extendedProps.phone || "-"}
                    </p>
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {dayjs(info.event.start).format("DD/MM/YYYY HH:mm")} -{" "}
                      {dayjs(info.event.end).format("HH:mm")}
                    </p>
                    <p>
                      <strong>Ghi chú:</strong>{" "}
                      {info.event.extendedProps.note || "-"}
                    </p>
                  </div>
                ),
              });
              return;
            }

            if (info.event.extendedProps.isSelecting) {
              Modal.confirm({
                title: "Hủy chọn khung giờ",
                content: "Bạn có muốn bỏ chọn khung giờ này không?",
                okText: "Đồng ý",
                cancelText: "Hủy",
                onOk: () => removeSelectedSlot(info.event.id),
              });
            }
          }}
          customButtons={{
            createBooking: {
              text: "Tạo lịch đặt",
              click: () => {
                if (selectedSlots.length === 0) {
                  message.warning("Vui lòng quét chọn giờ trên lịch trước!");
                  return;
                }

                setOpenModal(true);
              },
            },
          }}
          buttonText={{
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
          }}
          headerToolbar={{
            left: "prev,next today createBooking",
            center: "title",
            right: "resourceTimeGridDay,timeGridWeek,dayGridMonth",
          }}
        />
      </Spin>

      <BookingModal
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleCreateBooking}
        formState={formState}
        setFormState={setFormState}
        selectedSlots={selectedSlots}
        onRemoveSlot={(index: number) => {
          setSelectedSlots((prev) => prev.filter((_, i) => i !== index));
        }}
      />

      <Modal
        title="Xem trước phiếu đặt"
        open={receiptModal}
        onCancel={() => setReceiptModal(false)}
        width={700}
        footer={[
          <Button key="print" type="primary" onClick={handlePrint}>
            In PDF
          </Button>,
        ]}
      >
        {receiptData && (
          <ReceiptContent
            ref={printRef}
            receiptData={receiptData}
            formatCurrency={formatCurrency}
          />
        )}
      </Modal>
    </Card>
  );
}
