import { Table, Space, Button, Popconfirm, Tag } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { BookingResponse } from "../../../types/booking";

const statusColorMap: Record<string, string> = {
  CONFIRMED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

const statusLabelMap: Record<string, string> = {
  BOOKED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

interface Props {
  bookings: BookingResponse[];
  loading: boolean;
  pagination: any;
  onChange: (pageInfo: any) => void;
  onConfirm: (booking: BookingResponse) => void;
  onCancel: (booking: BookingResponse) => void;
  onViewDetail: (booking: BookingResponse) => void;
  onUpdateStatus: (booking: BookingResponse) => void;
}

export default function BookingTable({
  bookings,
  loading,
  pagination,
  onChange,
  onConfirm,
  onCancel,
  onViewDetail,
  onUpdateStatus,
}: Props) {
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 70,
      render: (_: any, __: any, index: number) => {
        const { current, pageSize } = pagination;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Mã đơn",
      dataIndex: "bookingId",
      render: (id: string) => id.substring(0, 8) + "...",
    },
    {
      title: "Khách hàng",
      dataIndex: "userName",
    },
    {
      title: "Điện thoại",
      dataIndex: "phoneNumber",
    },
    {
      title: "Giờ",
      render: (_: any, record: BookingResponse) =>
        `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Giá",
      dataIndex: "totalPrice",
      render: (price: number) => price?.toLocaleString("vi-VN") + " VND",
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      render: (status: string) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, record: BookingResponse) => (
        <Space>
          <Button size="small" onClick={() => onViewDetail(record)}>
            Chi tiết
          </Button>

          <Button size="small" onClick={() => onUpdateStatus(record)}>
            Chỉnh sửa
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
      rowKey="bookingId"
      pagination={pagination}
      onChange={onChange}
    />
  );
}
