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
  VIET_QR: "VietQR",
  BANKING: "Chuyển khoản",
  BANK_TRANSFER: "Chuyển khoản",
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
      render: (_: unknown, __: unknown, index: number) => {
        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Mã đơn & Loại",
      dataIndex: "bookingId",
      render: (id: string, record: BookingResponse) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>{id ? `${id.substring(0, 8)}...` : "---"}</span>

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
      render: (_: unknown, record: BookingResponse) => {
        if (record.slots?.length > 0) {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
      render: (_: unknown, record: BookingResponse) => {
        const isShared = record.bookingType === "SHARED";

        const total = Number(record.totalPrice ?? 0);
        const deposit = Number(record.depositAmount ?? 0);
        const remaining = Number(
          record.remainingAmount ?? Math.max(0, total - deposit),
        );

        const paid = isShared
          ? Number(record.ticketCollectedAmount ?? 0)
          : Math.max(0, total - remaining);

        const cancelledQuantity = Number(record.cancelledNoRefundQuantity ?? 0);
        const cancelledAmount = Number(record.cancelledNoRefundAmount ?? 0);
        const activeTicketQuantity = Number(record.activeTicketQuantity ?? 0);

        const rawPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
        const progressPercent = Math.min(100, Math.max(0, rawPercent));

        const excessAmount = Math.max(0, paid - total);
        const missingAmount = Math.max(0, total - paid);

        return (
          <div style={{ minWidth: 220 }}>
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
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background:
                    progressPercent >= 100
                      ? "#52c41a"
                      : progressPercent > 0
                      ? "#faad14"
                      : "#ff4d4f",
                  borderRadius: 4,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                marginTop: 4,
              }}
            >
              {isShared && excessAmount > 0 ? (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>
                  Đã thu vượt {excessAmount.toLocaleString("vi-VN")}đ
                </Tag>
              ) : paid >= total && total > 0 ? (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>
                  {isShared ? "Đã thu đủ tiền vé" : "Đã thanh toán đủ"}
                </Tag>
              ) : paid > 0 ? (
                <Tag color="orange" style={{ marginInlineEnd: 0 }}>
                  {isShared
                    ? `Đã thu vé (${rawPercent}%)`
                    : `Đã cọc ${rawPercent}%`}
                </Tag>
              ) : (
                <Tag color="red" style={{ marginInlineEnd: 0 }}>
                  {isShared ? "Chưa bán được vé" : "Chưa thanh toán"}
                </Tag>
              )}

              {isShared && activeTicketQuantity > 0 && (
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  Đang tham gia: {activeTicketQuantity} vé
                </Tag>
              )}

              {isShared && cancelledQuantity > 0 && (
                <Tag color="volcano" style={{ marginInlineEnd: 0 }}>
                  {cancelledQuantity} vé hủy không hoàn:{" "}
                  {cancelledAmount.toLocaleString("vi-VN")}đ
                </Tag>
              )}

              {isShared && missingAmount > 0 && (
                <span style={{ color: "#888", fontSize: 12 }}>
                  Còn thiếu: {missingAmount.toLocaleString("vi-VN")}đ
                </span>
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
      render: (_: unknown, record: BookingResponse) => {
        const isShared = record.bookingType === "SHARED";
        const total = Number(record.totalPrice ?? 0);
        const deposit = Number(record.depositAmount ?? 0);

        const normalRemaining = Number(
          record.remainingAmount ?? Math.max(0, total - deposit),
        );

        const ticketCollected = Number(record.ticketCollectedAmount ?? 0);

        const remaining = isShared
          ? Math.max(0, total - ticketCollected)
          : Math.max(0, normalRemaining);

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
            label:
              remaining > 0
                ? `Thanh toán nốt (${remaining.toLocaleString("vi-VN")}đ)`
                : "Đã thu đủ",
            danger: remaining > 0,
            disabled: remaining <= 0,
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
      rowKey={(record) => record.bookingId}
      pagination={pagination}
      onChange={onChange}
      size="small"
    />
  );
}
