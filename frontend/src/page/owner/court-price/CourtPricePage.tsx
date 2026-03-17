import { useEffect, useState } from "react";
import { Card, Button, Table, Space, message } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { Modal } from "antd";
import courtPriceService from "../../../service/courtPriceService";
import UpdateCourtPriceModal from "./UpdateCourtPriceModal";
import CreateCourtPriceModal from "./CreateCourtPriceModal";

export default function CourtPricePage() {
  const { courtId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

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
        `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Giá",
      dataIndex: "pricePerHour",
    },
    {
      title: "Loại",
      dataIndex: "priceType",
    },
    {
      title: "Ngày cụ thể",
      dataIndex: "specificDate",
      render: (v: string) => v || "-",
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
        />
      </Card>

      <CreateCourtPriceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        courtId={courtId}
        onSuccess={loadData}
      />

      <UpdateCourtPriceModal
        open={openUpdate}
        onClose={() => {
          setOpenUpdate(false);
          setEditing(null);
        }}
        data={editing}
        onSuccess={loadData}
      />
    </div>
  );
}
