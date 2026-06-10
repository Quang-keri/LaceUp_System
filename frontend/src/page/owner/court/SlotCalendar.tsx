import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import viLocale from "@fullcalendar/core/locales/vi";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import { Button, Card, message, Modal, Spin } from "antd";

import { ReceiptContent } from "./ReceiptContent";
import { BookingModal } from "./BookingModal";
import type { CourtCopyResponse } from "../../../types/court";
import bookingService from "../../../service/bookingService";

interface SlotCalendarProps {
  courtCopies?: CourtCopyResponse[];
  loading?: boolean;
  onSlotClick?: (slot: any) => void;
  rentalAreas?: any[];
  courts?: any[];
  onFilterChange?: (courtId: string) => void;
}

export default function SlotCalendar({
  courtCopies = [],
  loading = false,
  onSlotClick,
  courts = [],
  onFilterChange,
}: SlotCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    contentRef: printRef,
    documentTitle: "Phieu_Dat_San",
  });

  const formatCurrency = (value?: number | null) =>
    new Intl.NumberFormat("vi-VN").format(Number(value || 0));

  const resources = courtCopies.map((courtCopy) => ({
    id: courtCopy.courtCopyId,
    title: courtCopy.courtCode,
  }));

  const bookedEvents = courtCopies.flatMap((courtCopy: any) =>
    (courtCopy.slots || []).map((slot: any) => {
      const isSharedOpen =
        slot.bookingShortResponse?.bookingType === "SHARED" &&
        slot.slotStatus !== "MATCH_FULL" &&
        slot.slotStatus !== "COMPLETED";

      return {
        id: slot.slotId,
        resourceId: courtCopy.courtCopyId,
        start: slot.startTime,
        end: slot.endTime,

        title: isSharedOpen
          ? "Kèo vãng lai đang mở"
          : slot.bookingShortResponse?.userName || "Đã đặt",

        backgroundColor: isSharedOpen ? "#525252" : "#737373",
        borderColor: isSharedOpen ? "#404040" : "#525252",
        textColor: "#ffffff",

        extendedProps: {
          isBooked: true,
          isSharedOpen,
          phone: slot.bookingShortResponse?.userPhone,
          note: slot.bookingShortResponse?.note,
          bookingId: slot.bookingShortResponse?.bookingId,
        },
      };
    }),
  );

  const removeSelectedSlot = (idToRemove: string) => {
    setSelectedSlots((previousSlots) =>
      previousSlots.filter((slot) => slot.id !== idToRemove),
    );
  };

  const buildSlotPayload = () =>
    selectedSlots.map((slot) => ({
      courtCopyId: slot.courtId,
      startTime: dayjs(slot.startTime).format("YYYY-MM-DDTHH:mm:ss"),
      endTime: dayjs(slot.endTime).format("YYYY-MM-DDTHH:mm:ss"),
    }));

  const fetchPreviewPrice = async () => {
    try {
      setPreviewLoading(true);

      const response = await bookingService.previewOwnerBookingPrice({
        slots: buildSlotPayload(),
      });

      const totalPrice = Number(response.result || 0);

      setFormState((previousState) => ({
        ...previousState,
        totalPrice,
        paidAmount:
          previousState.paymentType === "FULL"
            ? totalPrice
            : previousState.paidAmount,
      }));

      return true;
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không tính được tổng tiền",
      );

      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenBookingModal = async () => {
    if (selectedSlots.length === 0) {
      message.warning("Vui lòng quét chọn giờ trên lịch trước!");
      return;
    }

    const success = await fetchPreviewPrice();

    if (success) {
      setOpenModal(true);
    }
  };

  const handleOpenSharedModal = () => {
    if (selectedSlots.length === 0) {
      message.warning("Vui lòng quét chọn giờ trên lịch để tạo kèo vãng lai!");
      return;
    }

    const uniqueCourts = new Set(selectedSlots.map((slot) => slot.courtId));

    if (uniqueCourts.size > 1) {
      message.warning(
        "Kèo vãng lai chỉ được tạo trên một sân. Vui lòng bỏ chọn các sân khác.",
      );
      return;
    }

    const sortedSlots = [...selectedSlots].sort(
      (firstSlot, secondSlot) =>
        dayjs(firstSlot.startTime).valueOf() -
        dayjs(secondSlot.startTime).valueOf(),
    );

    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    const slotInfo = {
      courtCopyId: firstSlot.courtId,
      courtCode: firstSlot.courtCode,
      courtName: "Sân Thể Thao",
      date: dayjs(firstSlot.startTime).format("YYYY-MM-DD"),
      startTime: dayjs(firstSlot.startTime).format("HH:mm"),
      endTime: dayjs(lastSlot.endTime).format("HH:mm"),
    };

    onSlotClick?.(slotInfo);

    setSelectedSlots([]);
  };

  const isTimeOverlap = (
    firstStart: string | Date,
    firstEnd: string | Date,
    secondStart: string | Date,
    secondEnd: string | Date,
  ) => {
    return (
      dayjs(firstStart).isBefore(dayjs(secondEnd)) &&
      dayjs(firstEnd).isAfter(dayjs(secondStart))
    );
  };

  const handleCreateBooking = async () => {
    try {
      if (!formState.customerName || !formState.phone) {
        message.warning("Vui lòng nhập tên và số điện thoại khách hàng!");
        return;
      }

      if (selectedSlots.length === 0) {
        message.warning("Vui lòng chọn ít nhất một khung giờ!");
        return;
      }

      if (formState.paidAmount > formState.totalPrice) {
        message.warning("Số tiền khách trả không được lớn hơn tổng tiền!");
        return;
      }

      const payload = {
        customerName: formState.customerName,
        phone: formState.phone,
        note: formState.note,
        totalPrice: formState.totalPrice,
        paidAmount: Number(formState.paidAmount || 0),
        paymentMethod: formState.paymentMethod,
        slots: buildSlotPayload(),
      };

      const response = await bookingService.createOwnerBooking(payload);

      if (response.code !== 200 && response.code !== 201) {
        message.error(response.message || "Có lỗi xảy ra khi tạo lịch đặt.");
        return;
      }

      message.success("Tạo lịch đặt thành công!");

      const bookingCode =
        response.result?.bookingId?.substring(0, 8).toUpperCase() ||
        `DP${Math.floor(100000 + Math.random() * 900000)}`;

      setReceiptData({
        ...formState,
        bookingCode,
        createdDate: dayjs().format("DD/MM/YYYY HH:mm"),
        slots: [...selectedSlots],
      });

      const newEvents = selectedSlots.map((slot) => ({
        id: Math.random().toString(),
        resourceId: slot.courtId,
        start: slot.startTime,
        end: slot.endTime,
        title: formState.customerName,

        backgroundColor: "#525252",
        borderColor: "#404040",
        textColor: "#ffffff",

        extendedProps: {
          ...formState,
          court: slot.courtCode,
          isBooked: true,
          phone: formState.phone,
          note: formState.note,
        },
      }));

      setEvents((previousEvents) => [...previousEvents, ...newEvents]);

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
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo lịch đặt.",
      );
    }
  };

  return (
    <Card
      bordered
      className="rounded-xl"
      style={{
        boxShadow: "none",
        backgroundColor: "#ffffff",
      }}
    >
      <Spin spinning={loading || previewLoading}>
        <style>{`
          .fc {
            color: #262626;
          }

          .fc .fc-toolbar {
            gap: 12px;
          }

          .fc .fc-toolbar-title {
            color: #171717;
            font-size: 24px;
            font-weight: 600;
          }

          .fc .fc-button-primary {
            background-color: #ffffff !important;
            border-color: #d9d9d9 !important;
            color: #262626 !important;
            box-shadow: none !important;
            font-weight: 500 !important;
            text-transform: none !important;
          }

          .fc .fc-button-primary:hover {
            background-color: #f5f5f5 !important;
            border-color: #bfbfbf !important;
            color: #171717 !important;
          }

          .fc .fc-button-primary:focus {
            box-shadow: none !important;
          }

          .fc .fc-button-primary:not(:disabled).fc-button-active,
          .fc .fc-button-primary:not(:disabled):active {
            background-color: #e5e5e5 !important;
            border-color: #a3a3a3 !important;
            color: #171717 !important;
            box-shadow: none !important;
          }

          .fc .fc-button-primary:disabled {
            background-color: #f5f5f5 !important;
            border-color: #e5e5e5 !important;
            color: #a3a3a3 !important;
            opacity: 1 !important;
          }

          .fc .fc-createBooking-button,
          .fc .fc-createSharedBooking-button {
            background-color: #ffffff !important;
            border-color: #d9d9d9 !important;
            color: #262626 !important;
            font-weight: 600 !important;
          }

          .fc .fc-createBooking-button:hover,
          .fc .fc-createSharedBooking-button:hover {
            background-color: #f5f5f5 !important;
            border-color: #bfbfbf !important;
            color: #171717 !important;
          }

          .fc .fc-col-header-cell {
            background-color: #fafafa;
          }

          .fc .fc-col-header-cell-cushion {
            color: #262626;
            font-weight: 600;
          }

          .fc .fc-timegrid-slot-label-cushion {
            color: #525252;
          }

          .fc .fc-resource {
            color: #262626;
          }

          .fc-theme-standard td,
          .fc-theme-standard th,
          .fc-theme-standard .fc-scrollgrid {
            border-color: #e5e5e5;
          }

.fc .fc-timegrid-now-indicator-line,
.fc .laceup-now-indicator-line {
  left: 0 !important;
  right: 0 !important;
  width: auto !important;

  border-top: 2px solid #ff4d4f !important;
  border-right: 0 !important;
  border-bottom: 0 !important;
  border-left: 0 !important;

  z-index: 50 !important;
  opacity: 1 !important;
  pointer-events: none !important;
}

.fc .fc-timegrid-now-indicator-container {
  overflow: visible !important;
  z-index: 50 !important;
  pointer-events: none !important;
}

.fc .fc-timegrid-now-indicator-arrow,
.fc .laceup-now-indicator-axis {
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  border-left-color: #ff4d4f !important;

  z-index: 51 !important;
  opacity: 1 !important;
  pointer-events: none !important;
}

        `}</style>

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
          nowIndicatorSnap={false}
          nowIndicatorClassNames={(argument) =>
            argument.isAxis
              ? ["laceup-now-indicator-axis"]
              : ["laceup-now-indicator-line"]
          }
          allDaySlot={false}
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          resources={resources}
          events={[
            ...bookedEvents,
            ...events,

            ...selectedSlots.map((slot) => ({
              id: slot.id,
              start: slot.startTime,
              end: slot.endTime,
              resourceId: slot.courtId,
              title: "Đang chọn",

              backgroundColor: "#d4d4d4",
              borderColor: "#a3a3a3",
              textColor: "#171717",

              extendedProps: {
                isSelecting: true,
              },
            })),
          ]}
          selectable
          selectAllow={(selectInfo) => {
            const targetCourtId = selectInfo.resource?.id;

            if (!targetCourtId) {
              return courtCopies.length === 1;
            }

            const overlapsBookedSlot = bookedEvents.some((event) => {
              return (
                event.resourceId === targetCourtId &&
                isTimeOverlap(
                  selectInfo.start,
                  selectInfo.end,
                  event.start,
                  event.end,
                )
              );
            });

            if (overlapsBookedSlot) {
              return false;
            }

            const overlapsSelectedSlot = selectedSlots.some((slot) => {
              return (
                slot.courtId === targetCourtId &&
                isTimeOverlap(
                  selectInfo.start,
                  selectInfo.end,
                  slot.startTime,
                  slot.endTime,
                )
              );
            });

            return !overlapsSelectedSlot;
          }}
          select={(info) => {
            let targetCourtId = info.resource?.id;
            let targetCourtCode = info.resource?.title;

            if (!targetCourtId) {
              if (courtCopies.length === 1) {
                targetCourtId = courtCopies[0].courtCopyId;
                targetCourtCode = courtCopies[0].courtCode;
              } else {
                message.warning(
                  "Vui lòng chọn cụ thể một sân ở bộ lọc bên trên để quét lịch theo tuần!",
                );

                info.view.calendar.unselect();
                return;
              }
            }

            const startTime = dayjs(info.start).format("YYYY-MM-DDTHH:mm:ss");

            const endTime = dayjs(info.end).format("YYYY-MM-DDTHH:mm:ss");

            const isDuplicateOrOverlap = selectedSlots.some((slot) => {
              return (
                slot.courtId === targetCourtId &&
                isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)
              );
            });

            if (isDuplicateOrOverlap) {
              message.warning(
                "Khung giờ này đã được chọn hoặc bị trùng với khung giờ đang chọn.",
              );

              info.view.calendar.unselect();
              return;
            }

            const slot = {
              id: `${targetCourtId}-${startTime}-${endTime}`,

              courtId: targetCourtId,
              courtCode: targetCourtCode,

              startTime,
              endTime,

              startDisplay: dayjs(info.start).format("DD/MM/YYYY HH:mm"),

              endDisplay: dayjs(info.end).format("HH:mm"),
            };

            setSelectedSlots((previousSlots) => [...previousSlots, slot]);

            info.view.calendar.unselect();
          }}
          eventClick={(info) => {
            if (info.event.extendedProps.isBooked) {
              Modal.info({
                title: info.event.extendedProps.isSharedOpen
                  ? "Thông tin kèo vãng lai"
                  : "Thông tin lịch đã đặt",

                content: (
                  <div>
                    {info.event.extendedProps.isSharedOpen && (
                      <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 text-gray-700">
                        Kèo đang mở cho khách đăng ký trên ứng dụng.
                      </div>
                    )}

                    <p>
                      <strong>
                        {info.event.extendedProps.isSharedOpen
                          ? "Người tạo:"
                          : "Khách:"}
                      </strong>{" "}
                      {info.event.title}
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
              click: handleOpenBookingModal,
            },

            createSharedBooking: {
              text: "Tạo kèo vãng lai",
              click: handleOpenSharedModal,
            },
          }}
          buttonText={{
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
          }}
          headerToolbar={{
            left: "prev,next today createBooking createSharedBooking",
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
          setSelectedSlots((previousSlots) =>
            previousSlots.filter((_, slotIndex) => slotIndex !== index),
          );
        }}
      />

      <Modal
        title="Xem trước phiếu đặt"
        open={receiptModal}
        onCancel={() => setReceiptModal(false)}
        width={700}
        footer={[
          <Button key="print" onClick={handlePrint}>
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
