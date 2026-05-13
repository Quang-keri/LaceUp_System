import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Skeleton,
  message,
  Layout,
  Input,
  Radio,
  Table,
  Dropdown,
  Tabs,
  Popconfirm,
  Tag,
  Typography,
  Select,
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import rentalService from "../../../service/rental/rentalService";
import courtService from "../../../service/courtService";

import CreateCourtModal from "./CreateCourtModal";
import UpdateCourtModal from "./UpdateCourtModal";
import UpdateCourtPriceModal from "../court-price/UpdateCourtPriceModal";
import CourtCopyModal from "./CourtCopyModal";
import BookingDetailModal from "./BookingDetailModal";
import CourtDetailModal from "./CourtDetailModal";

import type {
  CourtResponse,
  CategoryResponse,
  CourtCopyResponse,
  SlotResponse,
} from "../../../types/court";
import type { RentalAreaResponse } from "../../../types/rental";

const { Sider, Content } = Layout;
const { Text } = Typography;
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};
export default function CourtManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBranchId = searchParams.get("branchId");

  // Data States
  const [branches, setBranches] = useState<RentalAreaResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    initialBranchId || undefined,
  );
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtResponse | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtResponse | null>(
    null,
  );

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<CourtCopyResponse | null>(
    null,
  );
  const [selectedParentCourtId, setSelectedParentCourtId] =
    useState<string>("");

  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | undefined>();
  const [selectedCopy, setSelectedCopy] = useState<
    CourtCopyResponse | undefined
  >();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCourtForDetail, setSelectedCourtForDetail] =
    useState<string>("");

  // 1. Tải danh sách chi nhánh khi vào trang
  useEffect(() => {
    loadBranches();
    loadCategories();
  }, []);

  // 2. Tải danh sách sân MỖI KHI đổi chi nhánh
  useEffect(() => {
    if (selectedBranchId) {
      loadCourts(selectedBranchId);
      setSearchParams({ branchId: selectedBranchId });
    } else {
      setCourts([]);
    }
  }, [selectedBranchId]);

  const loadBranches = async () => {
    try {
      // Giả sử gọi page 1, size 100 để lấy hết chi nhánh làm dropdown
      const res = await rentalService.getMyRentalAreas(1, 100);
      const data = res.result?.data || [];
      setBranches(data);

      // Nếu không có initialBranchId từ URL, tự động chọn chi nhánh đầu tiên
      if (data.length > 0 && !initialBranchId) {
        setSelectedBranchId(data[0].rentalAreaId);
      }
    } catch {
      message.error("Lỗi khi tải danh sách chi nhánh");
    }
  };

  const loadCourts = async (branchId: string) => {
    setLoading(true);
    try {
      const res = await courtService.getMyCourts(1, 100);
      const filtered = (res.result.data || []).filter(
        (court) => court.rentalAreaId === branchId,
      );
      setCourts(filtered);
    } catch {
      message.error("Lỗi khi tải danh sách sân");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await courtService.getCategories();
      setCategories(res.result);
    } catch {
      // message.error("Không tải được loại sân");
    }
  };

  const handleDeleteCourt = async (id: string) => {
    try {
      await courtService.deleteCourt(id);
      message.success("Xóa sân thành công");
      if (selectedBranchId) loadCourts(selectedBranchId);
    } catch {
      message.error("Xóa sân thất bại");
    }
  };

  const handleDeleteCopy = async (copyId: string) => {
    try {
      await courtService.deleteCourtCopy(copyId);
      message.success("Xóa sân con thành công");
      if (selectedBranchId) loadCourts(selectedBranchId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Xóa sân con thất bại");
    }
  };

  // Lọc sân
  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchSearch = court.courtName
        ?.toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const matchStatus =
        filterStatus === "ALL" ? true : court.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [courts, searchKeyword, filterStatus]);

  // Sinh danh sách sân con
  const allCourtCopies = useMemo(() => {
    return filteredCourts.flatMap((c) =>
      (c.courtCopies || []).map((copy) => ({
        ...copy,
        parentCourtName: c.courtName,
        parentCourtId: c.courtId,
      })),
    );
  }, [filteredCourts]);

  const menuItems: MenuProps["items"] = [
    {
      key: "create-court",
      label: "Tạo sân mới",
      icon: <PlusOutlined />,
      disabled: !selectedBranchId,
      onClick: () => {
        setEditingCourt(null);
        setModalOpen(true);
      },
    },
    // {
    //   key: "create-sub-court",
    //   label: "Tạo sân con",
    //   icon: <AppstoreAddOutlined />,
    //   disabled: courts.length === 0,
    //   onClick: () => {
    //     if (courts.length > 0) {
    //       setSelectedParentCourtId(courts[0].courtId);
    //       setEditingCopy(null);
    //       setCopyModalOpen(true);
    //     } else {
    //       message.warning("Vui lòng tạo Sân trước khi tạo Sân con!");
    //     }
    //   },
    // },
  ];

  const courtColumns = [
    {
      title: "Mã sân",
      dataIndex: "courtId",
      render: (id: string) => id?.substring(0, 8).toUpperCase(),
    },
    {
      title: "Tên sân",
      dataIndex: "courtName",
      render: (text: string, record: CourtResponse) => (
        <a
          onClick={() => navigate(`/owner/courts/${record.courtId}`)}
          style={{ fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },

    {
      title: "Loại sân",
      dataIndex: ["category", "categoryName"],
      key: "categoryName",
    },
    {
      title: "Giá theo giờ",
      dataIndex: "minPrice",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "SL sân con",
      key: "copiesCount",
      render: (_: any, record: CourtResponse) =>
        record.courtCopies?.length || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Text type={status === "ACTIVE" ? "success" : "danger"}>
          {status === "ACTIVE" ? "Đang kinh doanh" : "Ngừng kinh doanh"}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: CourtResponse) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCourt(record);
              setModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            type="default"
            onClick={() => {
              setSelectedCourtForDetail(record.courtId);
              setDetailModalOpen(true);
            }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<DollarOutlined />}
            onClick={() => navigate(`/owner/courts/${record.courtId}/prices`)}
          >
            Giá sân
          </Button>
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedParentCourtId(record.courtId);
              setEditingCopy(null);
              setCopyModalOpen(true);
            }}
          >
            Thêm sân con
          </Button>
          <Popconfirm
            title="Xóa sân?"
            onConfirm={() => handleDeleteCourt(record.courtId)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const copyColumns = [
    {
      title: "Mã sân con",
      dataIndex: "courtCode",
      key: "courtCode",
    },
    {
      title: "Thuộc sân",
      dataIndex: "parentCourtName",
      key: "parentCourtName",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Text type={status === "ACTIVE" ? "success" : "danger"}>
          {status === "ACTIVE" ? "Đang kinh doanh" : "Ngừng kinh doanh"}
        </Text>
      ),
    },
    {
      title: "Tổng slot",
      key: "totalSlots",
      render: (_: any, record: any) => record.slots?.length || 0,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedParentCourtId(record.parentCourtId);
              setEditingCopy(record);
              setCopyModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sân con?"
            onConfirm={() => handleDeleteCopy(record.courtCopyId)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
          <Button
            size="small"
            type="primary"
            onClick={() =>
              navigate(
                `/owner/bookings/management?courtId=${record.parentCourtId}`,
              )
            }
          >
            Xem lịch
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
          Quản lý Sân & Sân con
        </h2>
        <Space>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button
              type="primary"
              style={{
                backgroundColor: "#4caf50",
                borderColor: "#4caf50",
                height: 38,
                borderRadius: 4,
              }}
            >
              <PlusOutlined /> Thêm mới <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      <Layout style={{ backgroundColor: "transparent" }}>
        <Sider
          width={280}
          style={{ background: "transparent", marginRight: 20 }}
        >
          <Card
            size="small"
            className="mb-4"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Tìm kiếm
            </div>
            <Input
              placeholder="Tìm kiếm tên sân..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              style={{ padding: "8px 12px" }}
            />
          </Card>

          <Card
            size="small"
            className="mb-4"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Chọn Chi nhánh
            </div>
            {branches.length === 0 ? (
              <Skeleton.Input active block />
            ) : (
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder="Chọn chi nhánh"
                value={selectedBranchId}
                onChange={(value) => setSelectedBranchId(value)}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={branches.map((b) => ({
                  label: b.rentalAreaName,
                  value: b.rentalAreaId,
                }))}
              />
            )}
          </Card>

          <Card
            size="small"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Trạng thái
            </div>
            <Radio.Group
              onChange={(e) => setFilterStatus(e.target.value)}
              value={filterStatus}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Radio value="ALL">Tất cả</Radio>
              <Radio value="ACTIVE">Đang kinh doanh</Radio>
              <Radio value="INACTIVE">Ngừng kinh doanh</Radio>
            </Radio.Group>
          </Card>
        </Sider>

        <Content>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ borderRadius: 8, overflow: "hidden" }}
          >
            <Tabs
              type="card"
              items={[
                {
                  label: `Danh sách sân (${filteredCourts.length})`,
                  key: "1",
                  children: (
                    <Table
                      columns={courtColumns}
                      dataSource={filteredCourts}
                      rowKey="courtId"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                },
                {
                  label: `Danh sách sân con (${allCourtCopies.length})`,
                  key: "2",
                  children: (
                    <Table
                      columns={copyColumns}
                      dataSource={allCourtCopies}
                      rowKey="courtCopyId"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Content>
      </Layout>

      {selectedBranchId && (
        <CreateCourtModal
          open={modalOpen && !editingCourt}
          onClose={() => setModalOpen(false)}
          categories={categories}
          buildingId={selectedBranchId}
          onSuccess={() => loadCourts(selectedBranchId)}
        />
      )}

      {selectedBranchId && (
        <UpdateCourtModal
          open={modalOpen && !!editingCourt}
          onClose={() => {
            setModalOpen(false);
            setEditingCourt(null);
          }}
          categories={categories}
          court={editingCourt}
          onSuccess={() => loadCourts(selectedBranchId)}
        />
      )}

      {selectedBranchId && (
        <UpdateCourtPriceModal
          open={priceModalOpen}
          onClose={() => setPriceModalOpen(false)}
          court={selectedCourt}
          onSuccess={() => loadCourts(selectedBranchId)}
        />
      )}

      {/* --- MODALS CHO SÂN CON --- */}
      {selectedBranchId && (
        <CourtCopyModal
          open={copyModalOpen}
          onClose={() => {
            setCopyModalOpen(false);
            setEditingCopy(null);
          }}
          copy={editingCopy}
          courtId={selectedParentCourtId}
          onSuccess={() => loadCourts(selectedBranchId)}
        />
      )}

      <BookingDetailModal
        open={bookingDetailOpen}
        onClose={() => setBookingDetailOpen(false)}
        slot={selectedSlot}
        courtCopy={selectedCopy}
      />

      <CourtDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        courtId={selectedCourtForDetail}
      />
    </div>
  );
}
