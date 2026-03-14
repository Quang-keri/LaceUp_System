import { Table, Space, Button, Popconfirm, Tag } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import type { BookingResponse } from "../../../types/booking";

const statusColorMap: Record<string, string> = {
  PENDING: "orange",
  CONFIRMED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

const statusLabelMap: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
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
        <Tag color={statusColorMap[status]}>
          {statusLabelMap[status]}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, record: BookingResponse) => (
        <Space>
          {record.bookingStatus === "PENDING" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => onConfirm(record)}
              >
                Xác nhận
              </Button>

              <Popconfirm
                title="Hủy đơn?"
                onConfirm={() => onCancel(record)}
              >
                <Button danger size="small" icon={<CloseOutlined />}>
                  Hủy
                </Button>
              </Popconfirm>
            </>
          )}

          <Button size="small" onClick={() => onViewDetail(record)}>
            Chi tiết
          </Button>

          <Button size="small" onClick={() => onUpdateStatus(record)}>
            Update
          </Button>

          <Popconfirm
            title="Xóa đơn?"
            onConfirm={() => onCancel(record)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
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