import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Card,
  Typography,
  message,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import bookingService from "../../../service/bookingService";
import { BookingStatus, type BookingResponse } from "../../../types/booking.ts";
import BookingDetailModal from "./BookingDetailModal";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const BookingManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BookingResponse[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedBooking, setSelectedBooking] =
    useState<BookingResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    size: 10,
    status: undefined as BookingStatus | undefined,
    keyword: "",
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Gọi API với các tham số từ state filters
      const response = await bookingService.getAllBookings(
        filters.page,
        filters.size,
        filters.status,
        filters.keyword,
        filters.from,
        filters.to,
      );

      if (response.code === 200) {
        // Lưu ý: response.result phải khớp với BookingListResponse
        setData(response.result.data);
        setTotal(response.result.totalElements);
      }
    } catch (error: any) {
      message.error(
        "Lỗi: " + (error.response?.data?.message || "Không thể tải dữ liệu"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const columns: ColumnsType<BookingResponse> = [
    {
      title: "Mã đơn",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (id: string) => <b>#{id ? id.slice(-6).toUpperCase() : "N/A"}</b>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          {/* Sửa: dùng userName thay vì customerName */}
          <div>{record.userName || "Khách lẻ"}</div>
          {/* Sửa: dùng phoneNumber thay vì customerPhone */}
          <small style={{ color: "#8c8c8c" }}>
            {record.phoneNumber || "N/A"}
          </small>
        </div>
      ),
    },
    {
      title: "Sân / Khu vực",
      key: "area",
      render: (_, record) => (
        <div>
          {/* Sửa: Truy cập vào object rentalArea */}
          <Tag color="blue">{record.rentalArea?.rentalAreaName || "N/A"}</Tag>
          {/* Sửa: Lấy courtCode từ slot đầu tiên nếu có */}
          <div>{record.slots?.[0]?.courtCode || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "Thời gian chơi",
      key: "time",
      render: (_, record) => (
        <div>
          <div>{dayjs(record.bookingDate).format("DD/MM/YYYY")}</div>
          <small>
            {record.startTime} - {record.endTime}
          </small>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      key: "bookingStatus",
      render: (status: BookingStatus) => {
        const statusConfig = {
          [BookingStatus.BOOKED]: { color: "blue", text: "Đã đặt" },
          [BookingStatus.COMPLETED]: { color: "green", text: "Hoàn thành" },
          [BookingStatus.CANCELLED]: { color: "red", text: "Đã hủy" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedBooking(record);
            setIsModalOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card style={{ margin: "20px" }}>
      <Title level={4}>Quản lý đặt sân</Title>

      <Space style={{ marginBottom: 20, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Tên khách, SĐT..."
          onSearch={(val) => setFilters({ ...filters, keyword: val, page: 1 })}
          style={{ width: 200 }}
          allowClear
        />

        <Select
          placeholder="Trạng thái"
          style={{ width: 140 }}
          allowClear
          onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
        >
          {Object.values(BookingStatus).map((status) => (
            <Select.Option key={status} value={status}>
              {status}
            </Select.Option>
          ))}
        </Select>

        <RangePicker
          placeholder={["Từ ngày", "Đến ngày"]}
          onChange={(dates) => {
            setFilters({
              ...filters,
              from: dates ? dates[0]?.startOf("day").toISOString() : undefined,
              to: dates ? dates[1]?.endOf("day").toISOString() : undefined,
              page: 1,
            });
          }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="bookingId"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.size,
          total: total,
          onChange: (page, size) => setFilters({ ...filters, page, size }),
        }}
      />
      <BookingDetailModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedBooking}
      />
    </Card>
  );
};

export default BookingManagement;
