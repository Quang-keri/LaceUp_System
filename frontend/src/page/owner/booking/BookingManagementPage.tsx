import { useEffect, useState } from "react";
import { Card, message, Modal } from "antd"; // Đã thêm Modal
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import RentalAreaFilter from "./RentalAreaFilter";
import BookingTable from "./BookingTable";
import BookingDetailModal from "./BookingDetailModal";
import SlotEditorModal from "./SlotEditorModal";
import BookingStatusUpdateModal from "./BookingStatusUpdateModal";

export default function BookingManagementPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [slotEditOpen, setSlotEditOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [bookingForStatusUpdate, setBookingForStatusUpdate] =
    useState<any>(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchBuildings = async () => {
    try {
      const res = await rentalService.getMyRentalAreas(1, 100);
      setBuildings(res.result.data);
      if (res.result.data.length > 0) {
        setSelectedBuildingId(res.result.data[0].rentalAreaId);
      }
    } catch {
      message.error("Lỗi tải sân");
    }
  };

  const fetchBookings = async (page = 1, size = 10, status = filterStatus) => {
    if (!selectedBuildingId) return;
    setLoading(true);
    try {
      const res = await bookingService.getBookingsByRentalArea(
        selectedBuildingId,
        page,
        size,
        status,
      );
      setBookings(res.result.data);
      setPagination({
        current: page,
        pageSize: size,
        total: res.result.totalElements,
      });
    } catch {
      message.error("Lỗi tải booking");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = async (record: any) => {
    try {
      const res = await bookingService.getBookingById(record.bookingId);
      setSelectedBooking(res.result);
      setSlotEditOpen(true);
    } catch {
      message.error("Không load được thông tin đơn");
    }
  };

  const handleRefreshAfterEdit = async () => {
    fetchBookings(pagination.current, pagination.pageSize);
    if (selectedBooking?.bookingId) {
      try {
        const res = await bookingService.getBookingById(
          selectedBooking.bookingId,
        );
        setSelectedBooking(res.result);
      } catch (e) {
        console.error("Lỗi refresh booking detail");
      }
    }
  };

  const handleUpdateStatus = (booking: any) => {
    setBookingForStatusUpdate(booking);
    setStatusUpdateOpen(true);
  };

  const handleStatusUpdateSubmit = async (values: any) => {
    if (!bookingForStatusUpdate) return;
    setLoading(true);
    try {
      await bookingService.updateBooking(bookingForStatusUpdate.bookingId, {
        bookingStatus: values.bookingStatus,
        note: values.note,
      });
      message.success("Cập nhật trạng thái booking thành công");
      setStatusUpdateOpen(false);
      setBookingForStatusUpdate(null);
      fetchBookings(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error("Update status error:", error);
      message.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchBookings(1, pagination.pageSize);
    }
  }, [selectedBuildingId]);

  const handlePrintInvoice = async (record: any) => {
    try {
      message.loading({ content: "Đang tạo hóa đơn...", key: "invoice" });

      const response: any = await bookingService.downloadInvoice(
        record.bookingId,
      );

      const fileData = response.data || response;

      // Khai báo rõ định dạng application/pdf
      const blob = new Blob([fileData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `hoadon_${record.bookingId.substring(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "Tải hóa đơn thành công!", key: "invoice" });
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
      message.error({
        content: "Lỗi tải hóa đơn (Có thể hóa đơn chưa tồn tại)",
        key: "invoice",
      });
    }
  };

  const handleCollectPayment = (record: any) => {
    const remaining =
      record.remainingAmount ?? record.totalPrice - record.depositAmount;

    Modal.confirm({
      title: "Xác nhận thu tiền",
      content: `Xác nhận khách hàng đã thanh toán số tiền còn thiếu là: ${remaining.toLocaleString(
        "vi-VN",
      )}đ?`,
      okText: "Xác nhận đã thu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          await bookingService.collectRemainingPayment(record.bookingId);
          message.success("Đã cập nhật thanh toán thành công!");
          fetchBookings(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error("Lỗi khi cập nhật thanh toán!");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <RentalAreaFilter
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        filterStatus={filterStatus}
        onBuildingChange={(id: string) => setSelectedBuildingId(id)}
        onStatusChange={(status?: string) => {
          setFilterStatus(status);
          fetchBookings(1, pagination.pageSize, keyword, status);
        }}
        onSearch={(value: string) => {
          setKeyword(value);
          fetchBookings(1, pagination.pageSize, value, filterStatus);
        }}
      />

      <Card title="Quản lý Booking">
        <BookingTable
          bookings={bookings}
          loading={loading}
          pagination={pagination}
          onChange={(pageInfo: any) =>
            fetchBookings(pageInfo.current, pageInfo.pageSize)
          }
          onViewDetail={(b: any) => {
            setSelectedBooking(b);
            setDetailOpen(true);
          }}
          onEditSlot={handleEditSlot}
          onUpdateStatus={handleUpdateStatus}
          // ĐÃ THÊM 2 HÀM NÀY VÀO COMPONENT
          onCollectPayment={handleCollectPayment}
          onPrintInvoice={handlePrintInvoice}
        />
      </Card>

      <BookingDetailModal
        open={detailOpen}
        booking={selectedBooking}
        onClose={() => setDetailOpen(false)}
      />

      <SlotEditorModal
        open={slotEditOpen}
        booking={selectedBooking}
        onClose={() => setSlotEditOpen(false)}
        onSuccess={handleRefreshAfterEdit}
      />

      <BookingStatusUpdateModal
        open={statusUpdateOpen}
        loading={loading}
        booking={bookingForStatusUpdate}
        onCancel={() => {
          setStatusUpdateOpen(false);
          setBookingForStatusUpdate(null);
        }}
        onSubmit={handleStatusUpdateSubmit}
      />
    </div>
  );
}
