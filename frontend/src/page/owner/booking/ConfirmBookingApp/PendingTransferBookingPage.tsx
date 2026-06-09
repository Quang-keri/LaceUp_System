import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Segmented,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";

import bookingService from "../../../../service/bookingService";
import rentalService from "../../../../service/rental/rentalService";

const { RangePicker } = DatePicker;
const { Title } = Typography;

type TabType = "NORMAL" | "SHARED";

export default function PendingTransferBookingPage() {
  const [loading, setLoading] = useState(false);
  const [buildingLoading, setBuildingLoading] = useState(false);

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>();

  const [tabType, setTabType] = useState<TabType>("NORMAL");
  const [data, setData] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");

  const fetchBuildings = async () => {
    try {
      setBuildingLoading(true);
      const res = await rentalService.getMyRentalAreas(1, 100);
      const list = res?.result?.data || [];
      setBuildings(list);

      if (list.length > 0) {
        const firstId = list[0].rentalAreaId;
        setSelectedBuildingId(firstId);
        await loadData(firstId, tabType);
      }
    } catch {
      message.error("Lỗi tải danh sách sân");
    } finally {
      setBuildingLoading(false);
    }
  };

  const loadData = async (rentalIdParam?: string, currentTab?: TabType) => {
    const rentalId = rentalIdParam || selectedBuildingId;
    const tab = currentTab || tabType;

    if (!rentalId) {
      setData([]);
      return;
    }

    const from = dateRange?.[0]?.format("YYYY-MM-DD");
    const to = dateRange?.[1]?.format("YYYY-MM-DD");

    try {
      setLoading(true);
      let list = [];

      if (tab === "NORMAL") {
        const res = await bookingService.getPendingTransferBookings(
          rentalId,
          1,
          50,
        );
        list = res?.result?.data || [];
      } else {
        const res = await bookingService.getPendingSharedTickets(
          rentalId,
          1,
          50,
          from,
          to,
        );

        list = res?.result?.data || [];
      }

      setData(list);
    } catch (e: any) {
      message.error(e.response?.data?.message || "Lỗi tải đơn chờ xác nhận");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleBuildingChange = async (value: string) => {
    setSelectedBuildingId(value);
    await loadData(value, tabType);
  };

  const handleTabChange = async (value: TabType) => {
    setTabType(value);
    setKeyword("");
    await loadData(selectedBuildingId, value);
  };

  // --- XỬ LÝ ĐẶT SÂN THƯỜNG ---
  const handleConfirmNormal = async (intentId: string) => {
    Modal.confirm({
      title: "Xác nhận chuyển khoản?",
      content:
        "Sau khi xác nhận, hệ thống sẽ tạo booking thật và khóa lịch sân.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await bookingService.ownerConfirmBooking(intentId);
          message.success("Đã xác nhận chuyển khoản");
          await loadData();
        } catch (e: any) {
          message.error(e.response?.data?.message || "Xác nhận thất bại");
        }
      },
    });
  };

  const handleRejectNormal = async (intentId: string) => {
    Modal.confirm({
      title: "Từ chối chuyển khoản?",
      content:
        "Đơn này sẽ bị từ chối và không tạo booking thật. Bạn có chắc chắn không?",
      okText: "Từ chối",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await bookingService.ownerRejectBooking(intentId);
          message.success("Đã từ chối chuyển khoản");
          await loadData();
        } catch (e: any) {
          message.error(e.response?.data?.message || "Từ chối thất bại");
        }
      },
    });
  };

  // --- XỬ LÝ VÉ VÃNG LAI ---
  const handleConfirmShared = async (
    participantId: string,
    isApproved: boolean,
  ) => {
    const actionText = isApproved ? "Duyệt vé" : "Từ chối vé";
    Modal.confirm({
      title: `Xác nhận ${actionText}?`,
      content: isApproved
        ? "Khách sẽ được cộng vào danh sách tham gia của trận đấu."
        : "Vé này sẽ bị hủy và giải phóng chỗ trống cho người khác.",
      okText: isApproved ? "Duyệt" : "Từ chối",
      okButtonProps: { danger: !isApproved },
      onOk: async () => {
        try {
          await bookingService.confirmSharedTicket(participantId, isApproved);
          message.success(`Đã ${actionText} thành công`);
          await loadData();
        } catch (e: any) {
          message.error(e.response?.data?.message || "Thao tác thất bại");
        }
      },
    });
  };

  // --- RENDER GIAO DIỆN ---
  const filteredData = data.filter((item) => {
    const search = keyword.trim().toLowerCase();
    if (!search) return true;

    if (tabType === "NORMAL") {
      return (
        item.bookerName?.toLowerCase().includes(search) ||
        item.bookerPhone?.toLowerCase().includes(search) ||
        item.bookingIntentId?.toLowerCase().includes(search)
      );
    } else {
      return (
        item.userName?.toLowerCase().includes(search) ||
        item.userPhone?.toLowerCase().includes(search) ||
        item.participantId?.toLowerCase().includes(search)
      );
    }
  });

  const columnsNormal = [
    {
      title: "STT",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã đơn",
      dataIndex: "bookingIntentId",
      width: 120,
      render: (id: string) => (
        <span style={{ fontFamily: "monospace" }}>
          {id ? id.substring(0, 8) : "-"}
        </span>
      ),
    },
    { title: "Khách hàng", dataIndex: "bookerName", width: 160 },
    { title: "Điện thoại", dataIndex: "bookerPhone", width: 130 },
    {
      title: "Khung giờ",
      width: 220,
      render: (_: any, record: any) => {
        const slots = record.slots || [];
        if (!slots.length) return "-";
        return (
          <div>
            {slots.slice(0, 2).map((slot: any, idx: number) => (
              <div key={idx} style={{ fontSize: 13 }}>
                <b>{slot.courtCode}</b> {formatTime(slot.startTime)} -{" "}
                {formatTime(slot.endTime)}
              </div>
            ))}
            {slots.length > 2 && (
              <span style={{ color: "#666" }}>+{slots.length - 2} slot</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "previewPrice",
      width: 120,
      render: (v: number) => (
        <b style={{ color: "#ea580c" }}>
          {Number(v || 0).toLocaleString("vi-VN")} đ
        </b>
      ),
    },
    {
      title: "Ảnh",
      dataIndex: "paymentProofUrl",
      width: 90,
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "Trạng thái",
      width: 150,
      render: () => <Tag color="orange">Chờ duyệt Đơn</Tag>,
    },
    {
      title: "Thao tác",
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleConfirmNormal(record.bookingIntentId)}
          >
            Duyệt
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleRejectNormal(record.bookingIntentId)}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  const columnsShared = [
    {
      title: "STT",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã vé",
      dataIndex: "participantId",
      width: 120,
      render: (id: string) => (
        <span style={{ fontFamily: "monospace" }}>
          {id ? id.substring(0, 8) : "-"}
        </span>
      ),
    },
    { title: "Người chơi", dataIndex: "userName", width: 160 },
    { title: "Điện thoại", dataIndex: "userPhone", width: 130 },
    {
      title: "Thông tin trận",
      width: 220,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 13 }}>
          <b>{record.courtCode || "Sân"}</b>
          <br />
          {formatDate(record.startTime)} • {formatTime(record.startTime)} -{" "}
          {formatTime(record.endTime)}
        </div>
      ),
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: 80,
      render: (v: number) => <b>{v} vé</b>,
    },
    {
      title: "Đã CK",
      dataIndex: "amountPaid",
      width: 120,
      render: (v: number) => (
        <b style={{ color: "#ea580c" }}>
          {Number(v || 0).toLocaleString("vi-VN")} đ
        </b>
      ),
    },
    {
      title: "Ảnh",
      dataIndex: "paymentProofUrl",
      width: 90,
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "Trạng thái",
      width: 150,
      render: () => <Tag color="blue">Chờ duyệt Vé</Tag>,
    },
    {
      title: "Thao tác",
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleConfirmShared(record.participantId, true)}
          >
            Duyệt
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleConfirmShared(record.participantId, false)}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Row gutter={24} style={{ padding: 20 }}>
      <Col xs={24} md={6} lg={5}>
        <Card
          title="Bộ lọc & Thao tác"
          bordered
          style={{ borderRadius: 8 }}
          bodyStyle={{ padding: 10 }}
        >
          <FilterLabel>Cơ sở</FilterLabel>
          <Select
            loading={buildingLoading}
            value={selectedBuildingId}
            onChange={handleBuildingChange}
            style={{ width: "100%", marginBottom: 18 }}
            placeholder="Chọn cơ sở"
            options={buildings.map((item) => ({
              value: item.rentalAreaId,
              label: item.rentalAreaName,
            }))}
          />

          <FilterLabel>Trạng thái</FilterLabel>
          <Select
            value="PENDING"
            disabled
            style={{ width: "100%", marginBottom: 18 }}
            options={[{ value: "PENDING", label: "Chờ xác nhận CK" }]}
          />

          <FilterLabel>Ngày diễn ra</FilterLabel>

          <RangePicker
            value={dateRange}
            format="DD/MM/YYYY"
            style={{
              width: "100%",
              marginBottom: 18,
            }}
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={async (dates) => {
              const range = dates as [any, any] | null;

              setDateRange(range);

              const from = range?.[0]?.format("YYYY-MM-DD");
              const to = range?.[1]?.format("YYYY-MM-DD");

              if (!selectedBuildingId) return;

              try {
                setLoading(true);

                if (tabType === "SHARED") {
                  const res = await bookingService.getPendingSharedTickets(
                    selectedBuildingId,
                    1,
                    50,
                    from,
                    to,
                  );

                  setData(res?.result?.data || []);
                }
              } catch (e: any) {
                message.error(e.response?.data?.message || "Lỗi lọc theo ngày");
              } finally {
                setLoading(false);
              }
            }}
          />

          <FilterLabel>Tìm kiếm</FilterLabel>
          <Input.Group compact style={{ display: "flex", marginBottom: 18 }}>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tên, SĐT, Mã..."
              style={{ flex: 1 }}
            />
            <Button type="primary" icon={<SearchOutlined />} />
          </Input.Group>

          <Button
            block
            icon={<ReloadOutlined />}
            onClick={() => loadData()}
            style={{ marginBottom: 10 }}
          >
            Làm mới
          </Button>
        </Card>
      </Col>

      <Col xs={24} md={18} lg={19}>
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Duyệt chuyển khoản
              </Title>
              <Segmented
                options={[
                  {
                    label: "Đặt sân nguyên ca",
                    value: "NORMAL",
                    icon: <CalendarOutlined />,
                  },
                  {
                    label: "Vé vãng lai",
                    value: "SHARED",
                    icon: <UsergroupAddOutlined />,
                  },
                ]}
                value={tabType}
                onChange={(val) => handleTabChange(val as TabType)}
              />
            </div>
          }
          bordered
          style={{ borderRadius: 8 }}
        >
          <Table
            rowKey={tabType === "NORMAL" ? "bookingIntentId" : "participantId"}
            loading={loading}
            columns={tabType === "NORMAL" ? columnsNormal : columnsShared}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
              emptyText: <Empty description="Không có dữ liệu chờ duyệt" />,
            }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </Col>
    </Row>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8, color: "#111827", fontWeight: 500 }}>
      {children}
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}
