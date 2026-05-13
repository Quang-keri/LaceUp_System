import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import { Card, Modal, Button, message } from "antd";

import { ReceiptContent } from "./ReceiptContent";
import { BookingModal } from "./BookingModal";
import type { CourtCopyResponse } from "../../../types/court";
import bookingService from "../../../service/bookingService";

export default function SlotCalendar({
  courtCopies = [],
}: {
  courtCopies?: CourtCopyResponse[];
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);

  // Trạng thái Form
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value);

  const resources = courtCopies.map((c) => ({
    id: c.courtCopyId,
    title: c.courtCode,
  }));

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
        totalPrice: formState.totalPrice,
        paidAmount: formState.paidAmount,
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
        return; // Dừng lại ngay lập tức, không chạy code bên dưới nữa
      }
      message.success("Tạo lịch đặt thành công!");
      const bookingCode =
        res.result?.bookingId?.substring(0, 8).toUpperCase() ||
        "DP" + Math.floor(100000 + Math.random() * 900000);

      setReceiptData({
        ...formState,
        paymentType: formState.paymentType,
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
        extendedProps: { ...formState, court: s.courtCode, isBooked: true },
      }));

      setEvents((prev) => [...prev, ...newEvents]);
      setOpenModal(false);
      setReceiptModal(true);

      // Reset
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

  const removeSelectedSlot = (idToRemove: string) => {
    setSelectedSlots((prev) => prev.filter((s) => s.id !== idToRemove));
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
        initialView="resourceTimeGridDay"
        resources={resources}
        events={[
          ...events,
          ...selectedSlots.map((s) => ({
            id: s.id,
            start: s.startTime,
            end: s.endTime,
            resourceId: s.courtId,
            title: "Đang chọn",
            backgroundColor: "#60a5fa",
            extendedProps: { isSelecting: true },
          })),
        ]}
        selectable
        select={(info) => {
          const slot = {
            id: Math.random().toString(36).substring(2, 9), // Tạo ID random
            courtId: info.resource?.id,
            courtCode: info.resource?.title,
            startTime: info.startStr,
            endTime: info.endStr,
            startDisplay: dayjs(info.start).format("DD/MM/YYYY HH:mm"),
            endDisplay: dayjs(info.end).format("HH:mm"),
          };
          setSelectedSlots((prev) => [...prev, slot]);
        }}
        // Sự kiện click thẳng vào event trên lịch để xóa
        eventClick={(info) => {
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
        headerToolbar={{
          left: "prev,next today createBooking",
          center: "title",
          right: "resourceTimeGridDay,timeGridWeek",
        }}
      />

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
