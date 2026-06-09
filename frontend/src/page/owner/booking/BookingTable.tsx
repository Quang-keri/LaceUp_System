import { Table, Button, Tag, Dropdown } from "antd";
import type { BookingResponse } from "../../../types/booking";
import dayjs from "dayjs";
import {
  MoreOutlined,
  ExportOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";

const statusColorMap: Record<string, string> = {
  BOOKED: "blue",
  USING: "orange",
  COMPLETED: "green",
  CANCELLED: "red",
};

const statusLabelMap: Record<string, string> = {
  BOOKED: "Đã xác nhận",
  USING: "Đang sử dụng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

const methodLabelMap: Record<string, string> = {
  CASH: "Tiền mặt",
  PAY_OS: "PAY OS",
  VN_PAY: "VN Pay",
  BANKING: "Chuyển khoản",
};

interface Props {
  bookings: BookingResponse[];
  loading: boolean;
  pagination: any;
  onChange: (pageInfo: any) => void;
  onViewDetail: (booking: BookingResponse) => void;
  onEditSlot: (slot: any) => void;
  onUpdateStatus: (booking: BookingResponse) => void;
  onCollectPayment: (booking: BookingResponse) => void;
  onPrintInvoice: (booking: BookingResponse) => void;
  onAddService: (booking: BookingResponse) => void;
}

export default function BookingTable({
  bookings,
  loading,
  pagination,
  onChange,
  onViewDetail,
  onEditSlot,
  onUpdateStatus,
  onCollectPayment,
  onPrintInvoice,
}: Props) {
  const navigate = useNavigate();

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_: any, __: any, index: number) => {
        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Mã đơn & Loại",
      dataIndex: "bookingId",
      render: (id: string, record: BookingResponse) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>{id ? id.substring(0, 8) + "..." : "---"}</span>

          {record.bookingType === "MATCH" && (
            <Tag
              color="purple"
              style={{ cursor: "pointer", width: "max-content" }}
              icon={<ExportOutlined />}
              onClick={() => navigate("/owner/matches")}
            >
              Ghép trận
            </Tag>
          )}
          {record.bookingType === "SHARED" && (
            <Tag
              color="orange"
              style={{ width: "max-content" }}
              icon={<TeamOutlined />}
            >
              Trận vãng lai
            </Tag>
          )}
          {record.bookingType === "PRIVATE" && (
            <Tag
              color="default"
              style={{ width: "max-content" }}
              icon={<UserOutlined />}
            >
              Cá nhân
            </Tag>
          )}
        </div>
      ),
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
        return record.startTime && record.endTime
          ? `${dayjs(record.startTime).format("DD/MM/YYYY HH:mm")} - ${dayjs(
              record.endTime,
            ).format("HH:mm")}`
          : "Chưa rõ thời gian";
      },
    },
    {
      title: "Thanh toán",
      render: (_: any, record: BookingResponse) => {
        const total = record.totalPrice || 0;
        const deposit = record.depositAmount || 0;
        const remaining = record.remainingAmount ?? total - deposit;
        const paid = total - remaining;
        const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

        return (
          <div style={{ minWidth: 180 }}>
            <div>
              <b>{paid.toLocaleString("vi-VN")}đ</b> /{" "}
              {total.toLocaleString("vi-VN")}đ
            </div>
            <div
              style={{
                height: 6,
                background: "#f0f0f0",
                borderRadius: 4,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background:
                    percent === 100
                      ? "#52c41a"
                      : percent > 0
                      ? "#faad14"
                      : "#ff4d4f",
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {percent === 100 ? (
                <Tag color="green">Đã thanh toán đủ</Tag>
              ) : percent > 0 ? (
                <Tag color="orange">Đã cọc {percent}%</Tag>
              ) : (
                <Tag color="red">Chưa thanh toán</Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Phương thức",
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
      render: (_: any, record: BookingResponse) => {
        const total = record.totalPrice || 0;
        const deposit = record.depositAmount || 0;
        const remaining = record.remainingAmount ?? total - deposit;

        const items: MenuProps["items"] = [
          {
            key: "view",
            label: "Chi tiết",
            onClick: () => onViewDetail(record),
          },
          {
            key: "edit",
            label: "Sửa Slot",
            onClick: () => onEditSlot(record),
          },
          {
            key: "status",
            label: "Cập nhật trạng thái",
            onClick: () => onUpdateStatus(record),
          },
          {
            type: "divider",
          },
          {
            key: "payment",
            label: `Thanh toán nốt (${remaining.toLocaleString("vi-VN")}đ)`,
            danger: true,
            onClick: () => onCollectPayment(record),
          },
          {
            key: "invoice",
            label: "In hóa đơn (PDF)",
            onClick: () => onPrintInvoice(record),
          },
        ];

        if (record.bookingType === "MATCH") {
          items.splice(1, 0, {
            key: "go_to_match",
            label: "Xem trận đấu ghép",
            icon: <ExportOutlined />,
            onClick: () => navigate("/owner/matches"),
          });
        }

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={bookings}
      loading={loading}
      rowKey={(record) => record.bookingId || Math.random().toString()}
      pagination={pagination}
      onChange={onChange}
      size="small"
    />
  );
}
