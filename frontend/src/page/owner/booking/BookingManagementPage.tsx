import { useEffect, useState } from "react";
import { Card, message, Form } from "antd";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import RentalAreaFilter from "./RentalAreaFilter";
import BookingTable from "./BookingTable";
import BookingDetailModal from "./BookingDetailModal";
import BookingStatusModal from "./BookingStatusModal";

export default function BookingManagementPage() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [selectedBooking, setSelectedBooking] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [statusForm] = Form.useForm();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // fetch rental areas
  const fetchBuildings = async () => {
    try {
      const res = await rentalService.getMyRentalAreas(1, 10);
      setBuildings(res.result.data);

      if (res.result.data.length > 0) {
        setSelectedBuildingId(res.result.data[0].rentalAreaId);
      }
    } catch {
      message.error("Lỗi tải tòa nhà");
    }
  };

  const fetchBookings = async (page = 1, size = 10) => {
    if (!selectedBuildingId) return;

    setLoading(true);

    try {
      const res = await bookingService.getBookingsByRentalArea(
        selectedBuildingId,
        page,
        size,
        filterStatus,
      );

      setBookings(res.result.data);

      setPagination({
        current: page,
        pageSize: size,
        total: res.result.totalElements,
      });
    } catch {
      message.error("Lỗi tải booking");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchBookings(1, 10);
    }
  }, [selectedBuildingId, filterStatus]);

  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleUpdateStatus = (booking: any) => {
    setSelectedBooking(booking);

    statusForm.setFieldsValue({
      status: booking.bookingStatus,
    });

    setStatusOpen(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <RentalAreaFilter
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        filterStatus={filterStatus}
        onBuildingChange={(id) => setSelectedBuildingId(id)}
        onStatusChange={setFilterStatus}
      />

      <Card title="Danh sách booking">
        <BookingTable
          bookings={bookings}
          loading={loading}
          pagination={pagination}
          onChange={(page) => fetchBookings(page.current, page.pageSize)}
          onViewDetail={handleViewDetail}
          onUpdateStatus={handleUpdateStatus}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </Card>

      <BookingDetailModal
        open={detailOpen}
        booking={selectedBooking}
        onClose={() => setDetailOpen(false)}
      />

      <BookingStatusModal
        open={statusOpen}
        form={statusForm}
        onCancel={() => setStatusOpen(false)}
        onSubmit={() => {}}
      />
    </div>
  );
}
