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
  EditOutlined,
} from "@ant-design/icons";
import rentalService from "../../../service/rental/rentalService";
import RentalAreaFilter from "./RentalAreaFilter";
import RentalAreaRejectModal from "./RentalAreaRejectModal";
import RentalAreaDetailModal from "./RentalAreaDetailModal";
import AdminRentalAreaEditModal from "./AdminRentalAreaEditModal";

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRentalAreaId, setEditingRentalAreaId] = useState<string | null>(
    null,
  );

  const buildAddressString = (r: any) => {
    const street = r.address?.street || r.street || "";
    const ward = r.address?.ward || r.ward || "";
    const cityName =
      r.address?.cityName ||
      r.address?.city?.cityName ||
      r.city?.cityName ||
      "";

    return (
      [street, ward, cityName].filter(Boolean).join(", ") || "Chưa cập nhật"
    );
  };

  const mapRentalArea = (r: any) => {
    const rawCourts = r.courtResponses || r.courts || [];

    return {
      ...r,
      id: r.rentalAreaId,
      name: r.rentalAreaName,
      ownerName: r.contactName || r.owner?.fullName || r.owner?.email || "N/A",
      ownerPhone: r.contactPhone || r.owner?.phone || "N/A",
      addressString: buildAddressString(r),
      courtCount: rawCourts.length,
      courts: rawCourts,
      bankAccount:
        r.bankAccount ||
        r.bankAccountResponse ||
        r.owner?.bankAccount ||
        r.owner?.bankAccountResponse ||
        null,
    };
  };

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
      setData(items.map(mapRentalArea));
    } catch (err) {
      message.error("Lấy danh sách cơ sở thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      setLoading(true);

      const res = await rentalService.getRentalAreaById(id);
      const detail = res?.result;

      if (!detail) {
        message.error("Không tìm thấy chi tiết cơ sở");
        return;
      }

      const mappedDetail = mapRentalArea(detail);

      setSelectedArea(mappedDetail);
      setIsDetailModalOpen(true);

      if (!mappedDetail.bankAccount) {
        console.log("Không thấy bankAccount trong response detail:", detail);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải chi tiết cơ sở",
      );
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
      fetchRentalAreas(page);
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
      setRejectReason("");
      fetchRentalAreas(page);
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
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: "Chủ sở hữu",
      dataIndex: "ownerName",
      key: "ownerName",
    },
    {
      title: "Địa chỉ",
      dataIndex: "addressString",
      key: "addressString",
      ellipsis: true,
    },
    {
      title: "Số sân",
      dataIndex: "courtCount",
      key: "courtCount",
      align: "center" as const,
      render: (count: number) => (
        <Badge count={count} showZero color="#007acc" />
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
              onClick={() => handleViewDetail(record.id)}
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

          <Tooltip title="Sửa tòa nhà">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRentalAreaId(record.id);
                setIsEditModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
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
        onSearch={() => {
          setPage(1);
          fetchRentalAreas(1);
        }}
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

      <RentalAreaDetailModal
        open={isDetailModalOpen}
        selectedArea={selectedArea}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedArea(null);
        }}
        onApprove={handleApprove}
      />

      <RentalAreaRejectModal
        open={rejectModalVisible}
        reason={rejectReason}
        setReason={setRejectReason}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectTargetId(null);
          setRejectReason("");
        }}
        onConfirm={handleRejectConfirm}
      />

      <AdminRentalAreaEditModal
        open={isEditModalOpen}
        rentalAreaId={editingRentalAreaId}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRentalAreaId(null);
        }}
        onSuccess={() => fetchRentalAreas(page)}
      />
    </div>
  );
};

export default RentalAreaManagement;
