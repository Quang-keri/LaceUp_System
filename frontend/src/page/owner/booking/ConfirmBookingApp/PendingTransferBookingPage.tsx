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
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import bookingService from "../../../../service/bookingService";
import rentalService from "../../../../service/rental/rentalService";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function PendingTransferBookingPage() {
  const [loading, setLoading] = useState(false);
  const [buildingLoading, setBuildingLoading] = useState(false);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>();

  const [data, setData] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);

  const fetchBuildings = async () => {
    try {
      setBuildingLoading(true);

      const res = await rentalService.getMyRentalAreas(1, 100);
      const list = res?.result?.data || [];

      setBuildings(list);

      if (list.length > 0) {
        const firstId = list[0].rentalAreaId;
        setSelectedBuildingId(firstId);
        await loadData(firstId);
      }
    } catch {
      message.error("Lỗi tải danh sách sân");
    } finally {
      setBuildingLoading(false);
    }
  };

  const loadData = async (rentalIdParam?: string) => {
    const rentalId = rentalIdParam || selectedBuildingId;

    if (!rentalId) {
      setData([]);
      return;
    }

    try {
      setLoading(true);

      const res = await bookingService.getPendingTransferBookings(
        rentalId,
        1,
        50,
      );

      const list = res?.result?.data || [];

      setData(list);
    } catch (e: any) {
      message.error(
        e.response?.data?.message || "Lỗi tải đơn chờ xác nhận chuyển khoản",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleBuildingChange = async (value: string) => {
    setSelectedBuildingId(value);
    await loadData(value);
  };

  const handleConfirm = async (intentId: string) => {
    Modal.confirm({
      title: "Xác nhận chuyển khoản?",
      content:
        "Sau khi xác nhận, hệ thống sẽ tạo booking thật và khóa lịch sân.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okButtonProps: {
        style: { background: "#1677ff" },
      },
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

  const filteredData = data.filter((item) => {
    const search = keyword.trim().toLowerCase();

    if (!search) return true;

    return (
      item.bookerName?.toLowerCase().includes(search) ||
      item.bookerPhone?.toLowerCase().includes(search) ||
      item.bookingIntentId?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "STT",
      width: 70,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã đơn",
      dataIndex: "bookingIntentId",
      width: 210,
      render: (id: string) => (
        <span style={{ fontWeight: 600 }}>{id ? id.substring(0, 8) : "-"}</span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "bookerName",
      width: 160,
    },
    {
      title: "Điện thoại",
      dataIndex: "bookerPhone",
      width: 140,
    },
    {
      title: "Khung giờ",
      width: 240,
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
      width: 150,
      render: (v: number) => (
        <b style={{ color: "#ea580c" }}>
          {Number(v || 0).toLocaleString("vi-VN")} đ
        </b>
      ),
    },
    {
      title: "Ảnh CK",
      dataIndex: "paymentProofUrl",
      width: 120,
      render: (url: string) =>
        url ? <Image src={url} width={70} height={70} /> : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 170,
      render: () => <Tag color="orange">Chờ owner xác nhận</Tag>,
    },
    {
      title: "Thao tác",
      width: 210,
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setActiveRecord(record);
              setDetailOpen(true);
            }}
          >
            Xem
          </Button>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleConfirm(record.bookingIntentId)}
          >
            Duyệt
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Row gutter={24} style={{ padding: 24 }}>
      <Col xs={24} md={6} lg={5}>
        <Card
          title="Bộ lọc & Thao tác"
          bordered
          style={{ borderRadius: 8 }}
          bodyStyle={{ padding: 16 }}
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

          <FilterLabel>Thời gian</FilterLabel>
          <RangePicker
            style={{ width: "100%", marginBottom: 18 }}
            placeholder={["Từ ngày", "Đến ngày"]}
            disabled
          />

          <FilterLabel>Trạng thái</FilterLabel>
          <Select
            value="PENDING_OWNER_CONFIRM"
            disabled
            style={{ width: "100%", marginBottom: 18 }}
            options={[
              {
                value: "PENDING_OWNER_CONFIRM",
                label: "Chờ xác nhận CK",
              },
            ]}
          />

          <FilterLabel>Tìm kiếm</FilterLabel>
          <Input.Group compact style={{ display: "flex", marginBottom: 18 }}>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tên khách, SĐT..."
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
            <Title level={4} style={{ margin: 0 }}>
              Duyệt chuyển khoản
            </Title>
          }
          bordered
          style={{ borderRadius: 8 }}
        >
          <Table
            rowKey="bookingIntentId"
            loading={loading}
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: <Empty description="No data" />,
            }}
            scroll={{ x: 1300 }}
          />
        </Card>
      </Col>

      <Modal
        title="Chi tiết đơn chờ xác nhận"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              setDetailOpen(false);
              handleConfirm(activeRecord?.bookingIntentId);
            }}
          >
            Xác nhận chuyển khoản
          </Button>,
        ]}
        width={760}
      >
        {activeRecord && (
          <div>
            <p>
              <b>Mã đơn:</b> {activeRecord.bookingIntentId}
            </p>
            <p>
              <b>Khách hàng:</b> {activeRecord.bookerName}
            </p>
            <p>
              <b>Điện thoại:</b> {activeRecord.bookerPhone}
            </p>
            <p>
              <b>Số tiền:</b>{" "}
              {Number(activeRecord.previewPrice || 0).toLocaleString("vi-VN")} đ
            </p>
            <p>
              <b>Ghi chú:</b> {activeRecord.note || "-"}
            </p>

            <div style={{ marginTop: 16 }}>
              <b>Danh sách slot:</b>
              <div style={{ marginTop: 8 }}>
                {(activeRecord.slots || []).map((slot: any, idx: number) => (
                  <Card
                    key={idx}
                    size="small"
                    style={{ marginBottom: 8, background: "#fafafa" }}
                  >
                    <b>{slot.courtCode}</b> • {formatDate(slot.startTime)}{" "}
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)} •{" "}
                    {Number(slot.price || 0).toLocaleString("vi-VN")} đ
                  </Card>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <b>Ảnh chuyển khoản:</b>
              <div style={{ marginTop: 8 }}>
                {activeRecord.paymentProofUrl ? (
                  <Image src={activeRecord.paymentProofUrl} width={260} />
                ) : (
                  <Tag color="red">Chưa có ảnh</Tag>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Row>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        // fontWeight: 500,
        marginBottom: 8,
        color: "#111827",
      }}
    >
      {children}
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  return date.toLocaleDateString("vi-VN");
}
