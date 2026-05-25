import { useEffect, useState } from "react";
import { Card, Button, Table, Space, message, Tag } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Modal } from "antd";
import courtPriceService from "../../../service/courtPriceService";
import UpdateCourtPriceModal from "./UpdateCourtPriceModal";
import CreateCourtPriceModal from "./CreateCourtPriceModal";

const DAY_TYPE_MAP: Record<string, { label: string; color: string }> = {
  WEEKDAY: { label: "T2 - T6", color: "blue" },
  WEEKEND: { label: "T7 - CN", color: "purple" },
  ALL: { label: "Tất cả", color: "default" },
};

const PRICE_TYPE_MAP: Record<string, { label: string; color: string }> = {
  NORMAL: { label: "Bình thường", color: "default" },
  HOLIDAY: { label: "Ngày lễ", color: "green" },
  EVENT: { label: "Sự kiện", color: "orange" },
  PEAK: { label: "Cao điểm", color: "red" },
  OTHER: { label: "Khác", color: "default" },
};

export default function CourtPricePage() {
  const { courtId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const location = useLocation();
  const openTime = location.state?.openTime || "00:00:00";
  const closeTime = location.state?.closeTime || "23:59:00";

  useEffect(() => {
    if (!courtId) return;
    loadData();
  }, [courtId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await courtPriceService.getByCourt(courtId!);
      setData(res.result || []);
    } catch {
      message.error("Không tải được giá sân");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditing(record);
    setOpenUpdate(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xóa giá sân",
      content: "Bạn có chắc muốn xóa giá này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      async onOk() {
        try {
          await courtPriceService.deleteCourtPrice(id);
          message.success("Xóa thành công");
          loadData();
        } catch {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const columns = [
    {
      title: "Giờ",
      render: (_: any, record: any) =>
        `${String(record.startTime).substring(0, 5)} - ${String(
          record.endTime,
        ).substring(0, 5)}`,
    },
    {
      title: "Giá / Giờ",
      dataIndex: "pricePerHour",
      render: (price: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Thứ",
      dataIndex: "dayType",
      render: (type: string) => {
        const config = DAY_TYPE_MAP[type];
        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : (
          <Tag>T2 - T6</Tag>
        );
      },
    },
    {
      title: "Phân loại",
      dataIndex: "priceType",
      render: (type: string) => {
        const config = PRICE_TYPE_MAP[type];
        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : (
          <Tag>{type}</Tag>
        );
      },
    },
    {
      title: "Ngày áp dụng",
      render: (_: any, record: any) => {
        if (record.startDate && record.endDate) {
          return `${record.startDate} đến ${record.endDate}`;
        }
        return record.specificDate || "-";
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
    },
    {
      title: "Hành động",
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.courtPriceId)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            Quản lý giá sân
          </Space>
        }
        extra={
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setOpenCreate(true)}
          >
            Thêm giá
          </Button>
        }
      >
        <Table
          rowKey="courtPriceId"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
        />
      </Card>

      <CreateCourtPriceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        courtId={courtId}
        onSuccess={loadData}
        openTime={openTime}
        closeTime={closeTime}
      />

      {openUpdate && (
        <UpdateCourtPriceModal
          open={openUpdate}
          onClose={() => {
            setOpenUpdate(false);
            setEditing(null);
          }}
          data={editing}
          onSuccess={loadData}
          openTime={openTime}
          closeTime={closeTime}
        />
      )}
    </div>
  );
}
