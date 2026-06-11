import { useEffect, useState } from "react";
import { Card, message, Modal, Col, Row, Button } from "antd";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";
import RentalAreaFilter from "./RentalAreaFilter";
import BookingTable from "./BookingTable";
import BookingDetailModal from "./BookingDetailModal";
import SlotEditorModal from "./SlotEditorModal";
import BookingStatusUpdateModal from "./BookingStatusUpdateModal";
import AddServiceModal from "./AddServiceModal";
import BookingDetailPage from "./BookingDetailPage";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";

const getBookingStartTimestamp = (booking: any) => {
  const slotTimestamps = (booking?.slots || [])
    .map((slot: any) => {
      const timestamp = new Date(slot?.startTime).getTime();
      return Number.isNaN(timestamp) ? null : timestamp;
    })
    .filter(
      (timestamp: number | null): timestamp is number => timestamp !== null,
    );

  if (slotTimestamps.length > 0) {
    return Math.min(...slotTimestamps);
  }

  const fallback = booking?.startTime || booking?.createdAt;
  const fallbackTimestamp = fallback ? new Date(fallback).getTime() : 0;

  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
};

export default function BookingManagementPage() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // States cho các bộ lọc
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [slotEditOpen, setSlotEditOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [bookingForStatusUpdate, setBookingForStatusUpdate] =
    useState<any>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedBookingIdForDetail, setSelectedBookingIdForDetail] = useState<
    string | null
  >(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchBuildings = async () => {
    try {
      const res = await rentalService.getMyRentalAreas(1, 100);
      const data = res.result.data;
      setBuildings(data);
      if (data.length > 0) {
        setSelectedBuildingId(data[0].rentalAreaId);
      }
    } catch {
      message.error("Lỗi tải danh sách sân");
    }
  };

  const fetchBookings = async (
    page = pagination.current,
    size = pagination.pageSize,
    searchKwd = keyword,
    status = filterStatus,
    type = filterType,
    range = dateRange,
  ) => {
    if (!selectedBuildingId) return;

    setLoading(true);

    try {
      const res = await bookingService.getBookingsByRentalArea(
        selectedBuildingId,
        page,
        size,
        status,
        type,
        searchKwd,
        range?.[0],
        range?.[1],
      );

      const bookingData = res?.result?.data ?? [];

      console.table(
        bookingData.map((booking: any) => ({
          bookingId: booking.bookingId,
          startTime: booking.startTime,
        })),
      );

      setBookings(bookingData);

      setPagination({
        current: page,
        pageSize: size,
        total: res?.result?.totalElements ?? 0,
      });
    } catch (error) {
      console.error("Lỗi tải booking:", error);

      message.error("Lỗi tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchBookings(
      pagination.current,
      pagination.pageSize,
      keyword,
      filterStatus,
      filterType,
      dateRange,
    );
    message.success("Đã làm mới dữ liệu");
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchBookings(1, pagination.pageSize);
    }
  }, [selectedBuildingId]);

  const handleRefreshAfterEdit = async () => {
    fetchBookings();
    if (selectedBooking?.bookingId) {
      try {
        const res = await bookingService.getBookingById(
          selectedBooking.bookingId,
        );
        setSelectedBooking(res.result);
      } catch (e) {
        console.error("Lỗi refresh booking detail", e);
      }
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
      fetchBookings();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = async (record: any) => {
    try {
      message.loading({ content: "Đang tạo hóa đơn...", key: "invoice" });
      const response: any = await bookingService.downloadInvoice(
        record.bookingId,
      );
      const fileData = response.data || response;
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
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "Tải hóa đơn thành công!", key: "invoice" });
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;

      message.error({
        content: backendMessage || "Lỗi tải hóa đơn",
        key: "invoice",
        duration: 5,
      });
    }
  };

  const handleCollectPayment = (record: any) => {
    const remaining =
      record.remainingAmount ?? record.totalPrice - (record.depositAmount || 0);
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
          fetchBookings();
        } catch (error: any) {
          const backendMessage =
            error.response?.data?.message || "Lỗi khi cập nhật thanh toán!";
          const cleanMessage = backendMessage
            .replace("Error when payment", "")
            .trim();
          message.error(cleanMessage || "Lỗi khi cập nhật thanh toán!");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleViewDetail = (booking: any) => {
    setSelectedBookingIdForDetail(booking.bookingId);
    setViewMode("detail");
  };

  const handleExportExcel = async () => {
    if (!selectedBuildingId) {
      message.warning("Vui lòng chọn cơ sở để xuất dữ liệu");
      return;
    }

    try {
      message.loading({ content: "Đang chuẩn bị file...", key: "export" });

      const params: any = {
        rentalId: selectedBuildingId,
        bookingStatus: filterStatus,
        bookingType: filterType,
        keyword: keyword,
      };

      if (dateRange) {
        params.from = dateRange[0];
        params.to = dateRange[1];
      }

      const response: any = await bookingService.exportBookingsExcel(params);

      const fileData = response.data || response;
      const blob = new Blob([fileData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Danh_sach_Booking_${new Date().getTime()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "Xuất file thành công!", key: "export" });
    } catch (error) {
      console.error(error);
      message.error({ content: "Lỗi khi xuất file Excel", key: "export" });
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {viewMode === "table" ? (
        <Row gutter={24}>
          <Col xs={24} sm={24} md={8} lg={6} xl={5}>
            <RentalAreaFilter
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              filterStatus={filterStatus}
              filterType={filterType}
              dateRange={dateRange}
              loading={loading}
              onBuildingChange={(id: string) => setSelectedBuildingId(id)}
              onDateChange={(range: [string, string] | null) => {
                setDateRange(range);
                fetchBookings(
                  1,
                  pagination.pageSize,
                  keyword,
                  filterStatus,
                  filterType,
                  range,
                );
              }}
              onTypeChange={(type?: string) => {
                setFilterType(type);
                fetchBookings(
                  1,
                  pagination.pageSize,
                  keyword,
                  filterStatus,
                  type,
                  dateRange,
                );
              }}
              onStatusChange={(status?: string) => {
                setFilterStatus(status);
                fetchBookings(
                  1,
                  pagination.pageSize,
                  keyword,
                  status,
                  filterType,
                  dateRange,
                );
              }}
              onSearch={(value: string) => {
                setKeyword(value);
                fetchBookings(
                  1,
                  pagination.pageSize,
                  value,
                  filterStatus,
                  filterType,
                  dateRange,
                );
              }}
              onRefresh={handleRefresh}
              onExport={handleExportExcel}
            />
          </Col>

          <Col xs={24} sm={24} md={16} lg={18} xl={19}>
            <Card
              title="Quản lý Đơn Đặt"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/owner/bookings/calendar")}
                  style={{
                    backgroundColor: "#0ca0eaff",
                    borderColor: "#380ceaff",
                  }}
                >
                  Tạo đơn đặt
                </Button>
              }
            >
              <BookingTable
                bookings={bookings}
                loading={loading}
                pagination={pagination}
                onChange={(pageInfo: any) =>
                  fetchBookings(
                    pageInfo.current,
                    pageInfo.pageSize,
                    keyword,
                    filterStatus,
                    filterType,
                    dateRange,
                  )
                }
                onViewDetail={handleViewDetail}
                onEditSlot={handleEditSlot}
                onUpdateStatus={handleUpdateStatus}
                onCollectPayment={handleCollectPayment}
                onPrintInvoice={handlePrintInvoice}
                onAddService={(b: any) => {
                  setSelectedBooking(b);
                  setServiceModalOpen(true);
                }}
              />
            </Card>
          </Col>

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

          <AddServiceModal
            open={serviceModalOpen}
            booking={selectedBooking}
            rentalAreaId={selectedBuildingId}
            onClose={() => setServiceModalOpen(false)}
            onSuccess={handleRefreshAfterEdit}
          />
        </Row>
      ) : (
        selectedBookingIdForDetail &&
        selectedBuildingId && (
          <BookingDetailPage
            bookingId={selectedBookingIdForDetail}
            rentalAreaId={selectedBuildingId}
            onBack={() => {
              setViewMode("table");
              fetchBookings();
            }}
          />
        )
      )}
    </div>
  );
}
