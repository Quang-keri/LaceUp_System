import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Space,
  Skeleton,
  message,
  Tabs,
  Select,
  Table,
  Tag,
} from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";

import CourtService from "../../../service/courtService";

import CourtCopyModal from "./CourtCopyModal";
import BookingDetailModal from "./BookingDetailModal";

import type {
  CourtResponse,
  CourtCopyResponse,
  SlotResponse,
} from "../../../types/court";

export default function CourtCopyPage() {
  const { courtId } = useParams();
  const navigate = useNavigate();

  const [court, setCourt] = useState<CourtResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [courtsInBuilding, setCourtsInBuilding] = useState<CourtResponse[]>([]);
  const [selectedCourtForCalendar, setSelectedCourtForCalendar] = useState<
    string | null
  >(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<CourtCopyResponse | null>(
    null,
  );

  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | undefined>();
  const [selectedCopy, setSelectedCopy] = useState<
    CourtCopyResponse | undefined
  >();
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

  useEffect(() => {
    if (!courtId) return;
    loadCourt();
  }, [courtId]);

  const loadCourt = async () => {
    try {
      setLoading(true);
      const res = await CourtService.getCourtById(courtId!);
      setCourt(res.result);
      // load courts in same rental area for select/calendar
      if (res.result?.rentalAreaId) {
        loadCourtsInBuilding(res.result.rentalAreaId);
      }
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không tải được thông tin sân",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCourtsInBuilding = async (rentalAreaId: string) => {
    try {
      const res = await CourtService.getCourtsByRentalArea(
        rentalAreaId,
        1,
        100,
      );
      const data = res.result?.data || [];
      setCourtsInBuilding(data);
      const found = data.find((c) => c.courtId === courtId);
      setSelectedCourtForCalendar(
        found ? found.courtId : data[0]?.courtId || null,
      );
    } catch (err) {
      // ignore
    }
  };

  const handleDeleteCopy = async (copyId: string) => {
    try {
      await CourtService.deleteCourtCopy(copyId);
      message.success("Xóa sân con thành công");
      loadCourt();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Xóa sân con thất bại");
    }
  };

  const handleViewBooking = (slot: SlotResponse, copy: CourtCopyResponse) => {
    setSelectedSlot(slot);
    setSelectedCopy(copy);
    setBookingDetailOpen(true);
  };

  if (loading || !court) return <Skeleton active />;

  const columns = [
    {
      title: "Mã sân con",
      dataIndex: "courtCode",
      key: "courtCode",
      width: 200,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Tổng slot",
      dataIndex: "totalSlots",
      key: "totalSlots",
      width: 100,
    },
    {
      title: "Đã đặt",
      dataIndex: "bookedSlots",
      key: "bookedSlots",
      width: 100,
    },
    {
      title: "Hành động",
      key: "action",
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingCopy(record.raw);
              setModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDeleteCopy(record.raw.courtCopyId)}
          >
            Xóa
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              navigate(
                `/owner/bookings/management?courtId=${record.raw.parentCourtId}`,
              );
            }}
          >
            Xem lịch
          </Button>
        </Space>
      ),
    },
  ];

  const dataSource = (court?.courtCopies || []).map((c) => ({
    key: c.courtCopyId,
    courtCode: c.courtCode,
    status: c.status,
    totalSlots: c.slots?.length || 0,
    bookedSlots: c.slots?.filter((s) => s.slotStatus === "BOOKED").length || 0,
    raw: c,
    parentCourtId: court?.courtId,
  }));

  const tabItems = [
    {
      key: "list",
      label: `Danh sách sân con (${court.courtCopies?.length || 0})`,
      children: (
        <Table
          columns={columns}
          dataSource={dataSource}
            expandable={{
              expandedRowRender: (record: any) => {
                const slots = record.raw.slots || [];
                return (
                  <Table
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: "Bắt đầu",
                        dataIndex: "startTime",
                        key: "startTime",
                        render: (t: string) =>
                          t ? new Date(t).toLocaleString() : "",
                      },
                      {
                        title: "Kết thúc",
                        dataIndex: "endTime",
                        key: "endTime",
                        render: (t: string) =>
                          t ? new Date(t).toLocaleString() : "",
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "slotStatus",
                        key: "slotStatus",
                        render: (s: string) => (
                          <Tag color={s === "BOOKED" ? "error" : "success"}>
                            {s === "BOOKED" ? "Đã đặt" : "Có sẵn"}
                          </Tag>
                        ),
                      },
                      {
                        title: "Người đặt",
                        dataIndex: ["bookingShortResponse", "userName"],
                        key: "userName",
                      },
                      {
                        title: "SĐT",
                        dataIndex: ["bookingShortResponse", "userPhone"],
                        key: "userPhone",
                      },
                      {
                        title: "Hành động",
                        key: "act",
                        render: (_: any, slot: any) => (
                          <Button
                            size="small"
                            onClick={() => handleViewBooking(slot, record.raw)}
                          >
                            Xem
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={slots.map((s: any) => ({ key: s.slotId, ...s }))}
                  />
                );
              },
            }}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <div>
              <div>Quản lý sân con</div>
              <div style={{ fontSize: 12 }}>{court.courtName}</div>
            </div>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCopy(null);
              setModalOpen(true);
            }}
          >
            Tạo sân con
          </Button>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      <CourtCopyModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCopy(null);
        }}
        copy={editingCopy}
        courtId={courtId!}
        onSuccess={loadCourt}
      />

      <BookingDetailModal
        open={bookingDetailOpen}
        onClose={() => setBookingDetailOpen(false)}
        slot={selectedSlot}
        courtCopy={selectedCopy}
      />
    </div>
  );
}
