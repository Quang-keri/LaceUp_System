import { useEffect, useState } from "react";
import { Card, message } from "antd";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import RentalAreaFilter from "./RentalAreaFilter";
import BookingTable from "./BookingTable";
import BookingDetailModal from "./BookingDetailModal";
import BookingEditModal from "./BookingEditModal";

export default function BookingManagementPage() {
  // 1. States cho dữ liệu và lọc
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- LOGIC CALL API ---

  const fetchBuildings = async () => {
    try {
      const res = await rentalService.getMyRentalAreas(1, 100); // Lấy danh sách tòa nhà
      setBuildings(res.result.data);
      if (res.result.data.length > 0) {
        setSelectedBuildingId(res.result.data[0].rentalAreaId);
      }
    } catch {
      message.error("Lỗi tải danh sách tòa nhà");
    }
  };

  const fetchBookings = async (
    page = 1,
    size = 10,
    currentKeyword = keyword,
    status = filterStatus,
  ) => {
    if (!selectedBuildingId) return;
    setLoading(true);
    try {
      const res = await bookingService.getBookingsByRentalArea(
        selectedBuildingId,
        page,
        size,
        status,
        currentKeyword,
      );

      setBookings(res.result.data);
      setPagination({
        current: page,
        pageSize: size,
        total: res.result.totalElements,
      });
    } catch {
      message.error("Lỗi tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchBookings(1, pagination.pageSize, value, filterStatus);
  };

  const handleStatusChange = (status?: string) => {
    setFilterStatus(status);
    fetchBookings(1, pagination.pageSize, keyword, status);
  };

  const handleEditClick = (booking: any) => {
    setSelectedBooking(booking);
    setEditOpen(true);
  };

  const handleViewDetail = async (booking: any) => {
    if (!booking?.bookingId) return;
    try {
      setLoading(true);
      const res = await bookingService.getBookingById(booking.bookingId);
      setSelectedBooking(res.result);
      setDetailOpen(true);
    } catch (error) {
      message.error("Lỗi tải chi tiết booking");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingSubmit = async (payload: any) => {
    if (!selectedBooking) return;
    try {
      setLoading(true);
      await bookingService.updateBooking(selectedBooking.bookingId, payload);
      message.success("Cập nhật booking thành công!");
      setEditOpen(false);

      fetchBookings(pagination.current, pagination.pageSize);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Cập nhật thất bại";
      message.error(errorMsg);
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

  return (
    <div>
      <RentalAreaFilter
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        filterStatus={filterStatus}
        onBuildingChange={(id) => setSelectedBuildingId(id)}
        onStatusChange={handleStatusChange}
        onSearch={handleSearch}
      />

      <Card title="Quản lý danh sách Booking">
        <BookingTable
          bookings={bookings}
          loading={loading}
          pagination={pagination}
          onChange={(pageInfo) =>
            fetchBookings(pageInfo.current, pageInfo.pageSize)
          }
          onViewDetail={handleViewDetail}
          onUpdateStatus={handleEditClick}
          onConfirm={async (record) => {
            message.info(`Xác nhận đơn ${record.bookingId.substring(0, 8)}`);
          }}
          onCancel={async (record) => {
            message.warning(
              `Yêu cầu hủy đơn ${record.bookingId.substring(0, 8)}`,
            );
          }}
        />
      </Card>

      <BookingDetailModal
        open={detailOpen}
        booking={selectedBooking}
        onClose={() => setDetailOpen(false)}
      />

      <BookingEditModal
        open={editOpen}
        booking={selectedBooking}
        onCancel={() => setEditOpen(false)}
        onSubmit={handleUpdateBookingSubmit}
      />
    </div>
  );
}
