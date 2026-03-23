import { useEffect, useState } from "react";
import { Card, message } from "antd";
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

  // modal detail
  const [detailOpen, setDetailOpen] = useState(false);

  // 🔥 EDIT MODAL (Quản lý chung cả danh sách slot & sửa từng slot)
  const [slotEditOpen, setSlotEditOpen] = useState(false);

  // Status update modal
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [bookingForStatusUpdate, setBookingForStatusUpdate] =
    useState<any>(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ===== API =====
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

  // ===== ACTION =====
  const handleEditSlot = async (record: any) => {
    try {
      const res = await bookingService.getBookingById(record.bookingId);
      setSelectedBooking(res.result);
      setSlotEditOpen(true);
    } catch {
      message.error("Không load được thông tin đơn");
    }
  };

  // Hàm này dùng để refresh lại data sau khi sửa 1 slot thành công
  const handleRefreshAfterEdit = async () => {
    // Refresh bảng tổng
    fetchBookings(pagination.current, pagination.pageSize);
    // Refresh lại data của booking đang mở để update danh sách slot
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

  // ===== EFFECT =====
  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchBookings(1, pagination.pageSize);
    }
  }, [selectedBuildingId]);

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
