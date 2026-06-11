import { useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  message,
  Modal,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import type {
  BookingParticipantResponse,
  BookingResponse,
  TicketPaymentStatus,
} from "../../../types/booking";
import dayjs from "dayjs";
import {
  ExportOutlined,
  MoreOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import bookingService from "../../../service/bookingService";

const { Text } = Typography;

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

const ticketStatusLabelMap: Record<TicketPaymentStatus, string> = {
  PENDING: "Chờ duyệt",
  SUCCESS: "Đã xác nhận",
  BOOKED: "Đã đặt",
  COMPLETED: "Hoàn thành",
  FAILED: "Bị từ chối",
  CANCELLED: "Đã hủy",
  CANCELLED_NO_REFUND: "Hủy không hoàn",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUND_FAILED: "Hoàn tiền thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const ticketStatusColorMap: Record<TicketPaymentStatus, string> = {
  PENDING: "gold",
  SUCCESS: "green",
  BOOKED: "blue",
  COMPLETED: "cyan",
  FAILED: "red",
  CANCELLED: "default",
  CANCELLED_NO_REFUND: "volcano",
  REFUND_PENDING: "orange",
  REFUND_FAILED: "red",
  REFUNDED: "purple",
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

  const [participantModalOpen, setParticipantModalOpen] = useState(false);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participants, setParticipants] = useState<
    BookingParticipantResponse[]
  >([]);
  const [selectedSharedBooking, setSelectedSharedBooking] =
    useState<BookingResponse | null>(null);

  const handleOpenParticipants = async (record: BookingResponse) => {
    setSelectedSharedBooking(record);
    setParticipantModalOpen(true);
    setParticipantLoading(true);
    setParticipants([]);

    try {
      const response = await bookingService.getSharedBookingParticipants(
        record.bookingId,
      );
      setParticipants(response?.result || []);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          "Không tải được danh sách người tham gia",
      );
    } finally {
      setParticipantLoading(false);
    }
  };

  const getBookingStatusDisplay = (record: BookingResponse) => {
    if (
      record.bookingType === "SHARED" &&
      record.bookingStatus === "CANCELLED"
    ) {
      const note = (record.note || record.notes || "").toLowerCase();

      if (note.includes("không đủ")) {
        return {
          label: "Không đủ người",
          color: "volcano",
        };
      }

      if (record.endTime && dayjs(record.endTime).isBefore(dayjs())) {
        return {
          label: "Đã hết hạn",
          color: "default",
        };
      }

      return {
        label: "Đã hủy",
        color: "red",
      };
    }

    return {
      label:
        statusLabelMap[record.bookingStatus] ||
        record.bookingStatus ||
        "Không rõ",
      color: statusColorMap[record.bookingStatus] || "default",
    };
  };

  const participantColumns: TableColumnsType<BookingParticipantResponse> = [
    {
      title: "STT",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "Người tham gia",
      render: (_: unknown, participant: BookingParticipantResponse) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar>
            {(participant.userName || "N").trim().charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>
              {participant.userName || "Chưa cập nhật"}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {participant.userId
                ? `ID: ${participant.userId.substring(0, 8)}...`
                : ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "userPhone",
      render: (phone?: string) =>
        phone ? (
          <a href={`tel:${phone}`} style={{ whiteSpace: "nowrap" }}>
            {phone}
          </a>
        ) : (
          "---"
        ),
    },
    {
      title: "Số vé",
      dataIndex: "quantity",
      align: "center" as const,
      render: (quantity?: number) => quantity ?? 1,
    },
    {
      title: "Số tiền",
      dataIndex: "amountPaid",
      align: "right" as const,
      render: (amount?: number) =>
        `${Number(amount ?? 0).toLocaleString("vi-VN")}đ`,
    },
    {
      title: "Trạng thái",
      key: "bookingStatus",
      width: 120,
      render: (_: unknown, record: BookingResponse) => {
        const statusDisplay = getBookingStatusDisplay(record);

        return <Tag color={statusDisplay.color}>{statusDisplay.label}</Tag>;
      },
    },
  ];

  const columns: TableColumnsType<BookingResponse> = [
    {
      title: "STT",
      key: "stt",
      width: 55,
      render: (_: unknown, __: unknown, index: number) => {
        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Mã đơn & Loại",
      dataIndex: "bookingId",
      width: 135,
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
      width: 185,
      render: (_: unknown, record: BookingResponse) => {
        if (record.bookingType === "SHARED") {
          const activeQuantity = Number(
            record.activeTicketQuantity ?? record.currentParticipants ?? 0,
          );
          const maximum = Number(record.maxParticipants ?? 0);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontWeight: 600 }}>
                {activeQuantity > 0
                  ? `${activeQuantity}/${maximum} người tham gia`
                  : "Chưa có người tham gia"}
              </span>

              <Button
                type="link"
                size="small"
                icon={<TeamOutlined />}
                style={{ padding: 0, width: "max-content", height: "auto" }}
                onClick={() => handleOpenParticipants(record)}
              >
                Xem danh sách
              </Button>
            </div>
          );
        }

        return record.userName || "Chưa cập nhật";
      },
    },
    {
      title: "Điện thoại",
      width: 100,
      render: (_: unknown, record: BookingResponse) => {
        if (record.bookingType === "SHARED") {
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => handleOpenParticipants(record)}
            >
              Xem SĐT
            </Button>
          );
        }

        return record.phoneNumber || "---";
      },
    },
    {
      title: "Khung Giờ",
      width: 185,
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
      width: 190,
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
          <div style={{ width: 170, maxWidth: 170 }}>
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
                <Tag
                  color="green"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
                  Đã thu vượt {excessAmount.toLocaleString("vi-VN")}đ
                </Tag>
              ) : paid >= total && total > 0 ? (
                <Tag
                  color="green"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
                  {isShared ? "Đã thu đủ tiền vé" : "Đã thanh toán đủ"}
                </Tag>
              ) : paid > 0 ? (
                <Tag
                  color="orange"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
                  {isShared
                    ? `Đã thu vé (${rawPercent}%)`
                    : `Đã cọc ${rawPercent}%`}
                </Tag>
              ) : (
                <Tag
                  color="red"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
                  {isShared ? "Chưa bán được vé" : "Chưa thanh toán"}
                </Tag>
              )}

              {isShared && activeTicketQuantity > 0 && (
                <Tag
                  color="blue"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
                  Đang tham gia: {activeTicketQuantity} vé
                </Tag>
              )}

              {isShared && cancelledQuantity > 0 && (
                <Tag
                  color="volcano"
                  style={{
                    marginInlineEnd: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                  }}
                >
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
      width: 110,
      render: (method: string) => (
        <Tag>{methodLabelMap[method] || method || "Không rõ"}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      width: 110,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {statusLabelMap[status] || status || "Không rõ"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 70,
      fixed: "right",
      align: "center",
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
          ...(isShared
            ? [
                {
                  key: "participants",
                  label: "Xem người tham gia",
                  icon: <TeamOutlined />,
                  onClick: () => handleOpenParticipants(record),
                },
              ]
            : []),
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
          { type: "divider" as const },
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

  const totalTicketQuantity = participants.reduce(
    (total, participant) => total + Number(participant.quantity ?? 1),
    0,
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={bookings}
        loading={loading}
        rowKey={(record) => record.bookingId}
        pagination={pagination}
        onChange={onChange}
        size="small"
        tableLayout="fixed"
        scroll={{ x: 1140 }}
      />

      <Modal
        title={
          <div>
            <div>Danh sách người tham gia trận vãng lai</div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {selectedSharedBooking?.courtName ||
                selectedSharedBooking?.slots?.[0]?.courtName ||
                "Chưa xác định sân"}
              {selectedSharedBooking?.startTime
                ? ` • ${dayjs(selectedSharedBooking.startTime).format(
                    "DD/MM/YYYY HH:mm",
                  )}`
                : ""}
            </Text>
          </div>
        }
        open={participantModalOpen}
        footer={null}
        width={900}
        centered
        destroyOnClose
        onCancel={() => {
          setParticipantModalOpen(false);
          setSelectedSharedBooking(null);
          setParticipants([]);
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">
            Tổng người đăng ký: {totalTicketQuantity}/
            {selectedSharedBooking?.maxParticipants ?? 0}
          </Tag>
          <Tag color="green">Số tài khoản: {participants.length}</Tag>
        </div>

        <Table
          columns={participantColumns}
          dataSource={participants}
          rowKey={(participant) => participant.participantId}
          loading={participantLoading}
          pagination={false}
          size="small"
          locale={{
            emptyText: participantLoading
              ? "Đang tải..."
              : "Chưa có người tham gia",
          }}
          scroll={{ x: 700 }}
        />
      </Modal>
    </>
  );
}
