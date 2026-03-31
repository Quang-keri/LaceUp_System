import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Badge,
  Tooltip,
  message,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import rentalService from "../../../service/rental/rentalService";
import RentalAreaFilter from "./RentalAreaFilter";
import RentalAreaRejectModal from "./RentalAreaRejectModal";
import RentalAreaDetailModal from "./RentalAreaDetailModal";

const { Title, Text } = Typography;

const RentalAreaManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [size] = useState(10);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const fetchRentalAreas = async (p: number = page) => {
    setLoading(true);
    try {
      const res = await rentalService.getAllRentalAreas(
        p,
        size,
        keyword,
        undefined,
        statusFilter,
      );
      const resultData = res?.result;
      const items = resultData?.data || [];

      setTotalElements(resultData?.totalElements || 0);

    const mapped = items.map((r: any) => {
  // Lấy danh sách sân từ courtResponses
  const rawCourts = r.courtResponses || r.courts || [];

  return {
    ...r,
    id: r.rentalAreaId,
    name: r.rentalAreaName,
    ownerName: r.contactName || r.owner?.email || "N/A",
    ownerPhone: r.contactPhone || r.owner?.phone || "N/A", // Ưu tiên số điện thoại liên hệ trực tiếp
    addressString: r.address
      ? `${r.address.street || ""}, ${r.address.ward || ""}, ${
          r.address.district || ""
        }${r.address.city ? `, ${r.address.city.cityName}` : ""}`
      : "Chưa cập nhật",
    courtCount: rawCourts.length,
    courts: rawCourts, // QUAN TRỌNG: Gán rawCourts vào đây để Modal đọc được
    legalInfo: {
      taxId: r.taxId || "N/A",
      license: r.license || "N/A",
      note: r.note || "Không có ghi chú",
      images: r.images || [],
    },
  };
});

      setData(mapped);
    } catch (err) {
      message.error("Lấy danh sách cơ sở thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalAreas(1);
  }, [statusFilter, keyword]);

  const handleApprove = async (id: string) => {
    try {
      await rentalService.approveRentalArea(id);
      message.success("Đã phê duyệt cơ sở thành công");
      fetchRentalAreas();
      setIsDetailModalOpen(false);
    } catch (err) {
      message.error("Phê duyệt thất bại");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTargetId) return;
    try {
      await rentalService.rejectRentalArea(
        rejectTargetId,
        rejectReason || undefined,
      );
      message.success("Đã từ chối cơ sở");
      setRejectModalVisible(false);
      setRejectTargetId(null);
      fetchRentalAreas();
      setIsDetailModalOpen(false);
    } catch (err) {
      message.error("Từ chối thất bại");
    }
  };

  const columns = [
    {
      title: "Tên cơ sở",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Text strong style={{ color: "#9156F1" }}>
          {text}
        </Text>
      ),
    },
    { title: "Chủ sở hữu", dataIndex: "ownerName", key: "ownerName" },
    {
      title: "Địa chỉ",
      dataIndex: "addressString", // Sử dụng addressString đã map
      key: "addressString",
      ellipsis: true,
    },
    {
      title: "Số sân",
      dataIndex: "courtCount",
      key: "courtCount",
      align: "center" as const,
      render: (count: number) => (
        <Badge count={count} showZero color="#9156F1" />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      render: (vStatus: string) => {
        const config: any = {
          VERIFIED: { color: "green", label: "Đã duyệt" },
          PENDING: { color: "gold", label: "Chờ duyệt" },
          REJECTED: { color: "red", label: "Từ chối" },
        };
        const item = config[vStatus] || { color: "default", label: "N/A" };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedArea(record); // Lúc này record đã chứa đầy đủ serviceItems, address, owner...
                setIsDetailModalOpen(true);
              }}
            />
          </Tooltip>
          {record.verificationStatus === "PENDING" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={() => {
                  setRejectTargetId(record.id);
                  setRejectModalVisible(true);
                }}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3}>Quản lý cơ sở & Phê duyệt</Title>
      </div>

      <RentalAreaFilter
        keyword={keyword}
        setKeyword={setKeyword}
        setStatusFilter={setStatusFilter}
        onSearch={() => fetchRentalAreas(1)}
      />

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
        pagination={{
          current: page,
          pageSize: size,
          total: totalElements,
          onChange: (p) => {
            setPage(p);
            fetchRentalAreas(p);
          },
        }}
      />

      {selectedArea && (
        <RentalAreaDetailModal
          open={isDetailModalOpen}
          selectedArea={selectedArea}
          onCancel={() => setIsDetailModalOpen(false)}
          onApprove={handleApprove}
        />
      )}

      <RentalAreaRejectModal
        open={rejectModalVisible}
        reason={rejectReason}
        setReason={setRejectReason}
        onCancel={() => setRejectModalVisible(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};

export default RentalAreaManagement;
