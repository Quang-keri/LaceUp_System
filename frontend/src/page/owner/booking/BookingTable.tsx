import { Table, Space, Button, Tag } from "antd";
import type { BookingResponse } from "../../../types/booking";
import dayjs from "dayjs";

// Đã bổ sung cả BOOKED và CONFIRMED để tránh lỗi miss data từ API
const statusColorMap: Record<string, string> = {
  BOOKED: "blue",
  CONFIRMED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

const statusLabelMap: Record<string, string> = {
  BOOKED: "Đã xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

const methodLabelMap: Record<string, string> = {
  CASH: "Tiền mặt",
  PAY_OS: "PAY OS",
  VN_PAY: "Chuyển khoản",
  BANKING: "Chuyển khoản",
};

interface Props {
  bookings: BookingResponse[];
  loading: boolean;
  pagination: any;
  onChange: (pageInfo: any) => void;
  onViewDetail: (booking: BookingResponse) => void;
  onEditSlot: (slot: any) => void;
}

export default function BookingTable({
  bookings,
  loading,
  pagination,
  onChange,
  onViewDetail,
  onEditSlot,
}: Props) {
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_: any, __: any, index: number) => {
        // Đảm bảo không bị crash nếu pagination chưa kịp load
        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Mã đơn",
      dataIndex: "bookingId",
      // Dùng id?.substring để tránh lỗi nếu id bị null/undefined
      render: (id: string) => (id ? id.substring(0, 8) + "..." : "---"),
    },
    {
      title: "Khách hàng",
      dataIndex: "userName",
      render: (name: string) => name || "Chưa cập nhật",
    },
    {
      title: "Điện thoại",
      dataIndex: "phoneNumber",
      render: (phone: string) => phone || "---",
    },
    {
      title: "Khung Giờ",
      render: (_: any, record: BookingResponse) => {
        // Ưu tiên render giờ từ mảng slots để luôn lấy data mới nhất và chi tiết nhất
        if (record.slots && record.slots.length > 0) {
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {record.slots.map((slot) => (
                <div key={slot.slotId}>
                  {dayjs(slot.startTime).format("DD/MM/YYYY HH:mm")} -{" "}
                  {dayjs(slot.endTime).format("HH:mm")}
                </div>
              ))}
            </div>
          );
        }

        // Fallback lại giờ của booking nếu không có slots
        return record.startTime && record.endTime
          ? `${dayjs(record.startTime).format("DD/MM/YYYY HH:mm")} - ${dayjs(record.endTime).format("HH:mm")}`
          : "Chưa rõ thời gian";
      },
    },
    {
      title: "Giá",
      dataIndex: "totalPrice",
      render: (price: number) =>
        price ? price.toLocaleString("vi-VN") + " VND" : "0 VND",
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentMethod",
      render: (method: string) => (
        <Tag>{methodLabelMap[method] || method || "Không rõ"}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {statusLabelMap[status] || status || "Không rõ"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, record: BookingResponse) => (
        <Space>
          <Button size="small" onClick={() => onViewDetail(record)}>
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => onEditSlot(record)}
          >
            Sửa Slot
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={bookings}
      loading={loading}
      rowKey={(record) => record.bookingId || Math.random().toString()} // Fallback rowKey
      pagination={pagination}
      onChange={onChange}
    />
  );
}
